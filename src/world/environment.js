// Physical fields for new worlds. Normalized model units, not biome membership bonuses.
import {coordNoise} from '../core/rng.js';
import {recordPageSaltTransfer,finishPageSaltTransfers,validatePageSaltTransfers} from './page-salt-transfers.js';
import {WORLD_PAGE_SIZE} from './pages.js';
import {regionalRainfall} from './weather-fronts.js';
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function smooth(seed,x,y,size){const ax=Math.floor(x/size),ay=Math.floor(y/size),u0=x/size-ax,v0=y/size-ay,u=u0*u0*(3-2*u0),v=v0*v0*(3-2*v0);return (coordNoise(seed,ax,ay)*(1-u)+coordNoise(seed,ax+1,ay)*u)*(1-v)+(coordNoise(seed,ax,ay+1)*(1-u)+coordNoise(seed,ax+1,ay+1)*u)*v}
export function coastlineX(w,y){return w.n*(.84+.035*Math.sin(y/w.n*6.28+(w.seedHash%97)/97*6.28))}
export function initializeEnvironment(w){
 const temperatureOffset=new Float32Array(w.len),rainScale=new Float32Array(w.len),depth=new Float32Array(w.len),salt=new Float64Array(w.len),boundary=new Uint8Array(w.len);
 for(let y=0;y<w.n;y++){let ridge=0;for(let x=w.n-1;x>=0;x--){const i=y*w.n+x,e=w.terrain?.elevation[i]||0;ridge=Math.max(ridge,e);
  temperatureOffset[i]=.5*(y/(w.n-1)-.5)-.55*e+.04*(smooth(w.seedHash^0x636c696d,x,y,32)-.5);
  rainScale[i]=clamp((.35+1.5*smooth(w.seedHash^0x7261696e,x,y,30))*Math.exp(-2.5*Math.max(0,ridge-e)),.08,2);
  if(w.water[i]){const coast=coastlineX(w,y),offshore=Math.max(0,x-coast);depth[i]=offshore>0?clamp(.15+offshore/12,.15,2):.15+.15*smooth(w.seedHash^0x64657074,x,y,8);const concentration=offshore>0?1:Math.exp(-Math.max(0,coast-x)/3);salt[i]=depth[i]*concentration;if(x===w.n-1)boundary[i]=2;else if(x===0)boundary[i]=1;}
 }}
 w.environment={schema:1,temperatureOffset,rainScale,depth,salt,boundary,day:0,totals:{saltInput:0,saltOutput:0,rainWater:0,displacedWater:0},daily:[]};
 return w.environment;
}
export function validateEnvironment(w,e){
 if(e?.schema!==1&&e?.schema!==2&&e?.schema!==3)throw Error('Invalid environment schema.');
 if(e.schema>=2&&w.generator!=='planetary/1')throw Error('Planetary boundary version requires planetary geography.');
 for(const [key,Type,lo,hi] of [['temperatureOffset',Float32Array,-1,1],['rainScale',Float32Array,0,3],['depth',Float32Array,0,2],['salt',Float64Array,0,4],['boundary',Uint8Array,0,e.schema>=2?3:2]])if(!(e[key] instanceof Type)||e[key].length!==w.len||e[key].some(v=>!Number.isFinite(v)||v<lo||v>hi))throw Error('Invalid environment field '+key+'.');
 if(e.schema===3&&(!(e.volume instanceof Float64Array)||e.volume.length!==w.len||
    e.volume.some(v=>!Number.isFinite(v)||v<0||v>2)))
  throw Error('Invalid planetary water-volume field.');
 for(let i=0;i<w.len;i++){
  const water=e.schema===3?e.volume[i]:e.depth[i];
  if(w.water[i]?(e.depth[i]<=0||water<=0||e.salt[i]>water*2+1e-12):
     (e.depth[i]!==0||water!==0||e.salt[i]!==0||e.boundary[i]!==0))
   throw Error('Environment water topology mismatch.');
 }
 for(let i=0;i<w.len;i++)if(e.boundary[i]&&(
    e.schema===1?
      (e.boundary[i]===1&&i%w.n!==0||e.boundary[i]===2&&i%w.n!==w.n-1):
      (i%w.n!==0&&i%w.n!==w.n-1&&i>=w.n&&i<w.len-w.n)))
   throw Error('Invalid environment reservoir boundary.');
 if(e.schema>=2&&['boundaryInput','boundaryOutput'].some(k=>!Number.isFinite(e.totals?.[k])||e.totals[k]<0))
  throw Error('Invalid planetary boundary flux totals.');
 if(e.schema>=2&&['pairedInput','pairedOutput'].some(k=>e.totals?.[k]!==undefined&&
    (!Number.isFinite(e.totals[k])||e.totals[k]<0)))
  throw Error('Invalid paired planetary salt totals.');
 if(e.schema===3&&['pairedWaterInput','pairedWaterOutput'].some(k=>e.totals?.[k]!==undefined&&
    (!Number.isFinite(e.totals[k])||e.totals[k]<0)))
  throw Error('Invalid paired water totals.');
 if(!Number.isSafeInteger(e.day)||e.day<0||!e.totals||['saltInput','saltOutput','rainWater','displacedWater'].some(k=>!Number.isFinite(e.totals[k])||e.totals[k]<0)||!Array.isArray(e.daily)||e.daily.length>64)throw Error('Invalid environment history.');
 for(const row of [...e.daily,...(e.lastDay?[e.lastDay]:[])]){if(!Number.isSafeInteger(row.day)||row.day<0||row.day>e.day||['before','after','input','output'].some(k=>!Number.isFinite(row[k])||row[k]<0)||!Number.isFinite(row.closure))throw Error('Invalid salt budget receipt.');
  // Historical receipts have no page-level transfer audit; validate new ones strictly.
  if(e.schema>=2&&['boundaryInput','boundaryOutput'].some(k=>!Number.isFinite(row[k])||row[k]<0))
   throw Error('Invalid planetary boundary flux receipt.');
  if(e.schema>=2&&(row.boundaryInput>row.input+1e-8||row.boundaryOutput>row.output+1e-8))
   throw Error('Planetary boundary flux exceeds total salt receipts.');
  if(e.schema>=2&&['pairedInput','pairedOutput'].some(k=>row[k]!==undefined&&
      (!Number.isFinite(row[k])||row[k]<0)))
   throw Error('Invalid paired planetary salt receipt.');
  if(e.schema===3){
   if(['waterBefore','waterAfter','waterInput','waterOutput','waterClosure'].some(k=>!Number.isFinite(row[k]))||
     row.waterBefore<0||row.waterAfter<0||row.waterInput<0||row.waterOutput<0||
     Math.abs(row.waterClosure)>1e-6)
    throw Error('Invalid planetary water-volume receipt.');
  }
  if(row.pageTransfers!==undefined)validatePageSaltTransfers(w,row.pageTransfers);
 }
}
export function localTemperature(w,climate,i){return clamp(climate.temp+(w.environment?.temperatureOffset[i]||0),-.5,1.5)}
export function localRain(w,climate,i){return regionalRainfall(w,climate,i)}
export function salinityAt(w,i){const e=w.environment;const d=e?.schema===3?e.volume[i]:e?.depth[i];return d>0?e.salt[i]/d:0}
export function potableWater(w,i){return !!w.water[i]&&salinityAt(w,i)<=.05}
export function salineMargin(w,i){if(!w.environment)return false;const x=i%w.n,y=(i/w.n)|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<w.n&&ny<w.n&&w.water[ny*w.n+nx]&&!potableWater(w,ny*w.n+nx))return true}return false}
export function saltStorage(w){let total=0;for(const amount of w.environment?.salt||[])total+=amount;return total}
export function waterStorage(w){let total=0;for(const amount of w.environment?.volume||w.environment?.depth||[])total+=amount;return total}
// Fixed-depth water bodies exchange equal water volumes with neighboring cells. Salt is advected
// conservatively; freshwater rain displaces an equal volume, exporting its dissolved salt.
// Edge reservoirs restore freshwater (1) / seawater (2), with explicit salt input/output receipts.
export function advanceEnvironmentWater(w,climate,day){
 const e=w.environment;if(!e)return;const atmospheric={...climate,frontDay:day};const before=saltStorage(w),waterBefore=e.schema===3?waterStorage(w):0,next=new Float64Array(e.salt),n=w.n,t=e.totals,input0=t.saltInput,output0=t.saltOutput,pageLedger=new Map();
 let boundaryInput=0,boundaryOutput=0;
 const pair=(i,j)=>{if(!w.water[i]||!w.water[j])return;const c=salinityAt(w,i)-salinityAt(w,j),from=c>0?i:j,to=c>0?j:i,flow=Math.min(Math.abs(c)*Math.min(e.schema===3?e.volume[i]:e.depth[i],e.schema===3?e.volume[j]:e.depth[j])*.08,e.salt[from]*.25);next[from]-=flow;next[to]+=flow;if(flow>0&&((j===i+1&&(i%n)%WORLD_PAGE_SIZE===WORLD_PAGE_SIZE-1)||(j===i+n&&Math.floor(i/n)%WORLD_PAGE_SIZE===WORLD_PAGE_SIZE-1)))recordPageSaltTransfer(pageLedger,n,i,j,from===i?flow:-flow)};
 for(let i=0;i<w.len;i++){if(i%n<n-1)pair(i,i+1);if(i+n<w.len)pair(i,i+n)}
 for(let i=0;i<w.len;i++)if(w.water[i]){const rain=localRain(w,atmospheric,i)*.06,volume=e.schema===3?e.volume[i]:e.depth[i],lost=next[i]*(1-Math.exp(-rain/volume));next[i]-=lost;t.rainWater+=rain;t.displacedWater+=rain;t.saltOutput+=lost;const reservoir=e.boundary[i];if(reservoir){
   if(e.schema>=2){
    // Equal volumes exchange with a geography-declared external body,
    // rather than resetting salinity to a target on every calendar day.
    // The outside ocean/freshwater is a declared reservoir. Every finite
    // salt flux is credited to an external input or output receipt.
    const target=reservoir===2?1:reservoir===3?.5:0;
    const delta=(target-next[i]/volume)*volume*.08;
    const updated=clamp(next[i]+delta,0,volume*2);
    const transferred=updated-next[i];next[i]=updated;
    if(transferred>0){t.saltInput+=transferred;t.boundaryInput+=transferred;boundaryInput+=transferred;}
    else if(transferred<0){t.saltOutput-=transferred;t.boundaryOutput-=transferred;boundaryOutput-=transferred;}
   }else{
    const target=reservoir===2?volume:0,delta=target-next[i];
    if(delta>=0)t.saltInput+=delta;else t.saltOutput-=delta;
    next[i]=target;
   }
  }}
 e.salt.set(next);e.day=day;const after=saltStorage(w),input=t.saltInput-input0,output=t.saltOutput-output0,row={
 day,before,after,input,output,closure:input-output-(after-before),
 ...(e.schema>=2?{boundaryInput,boundaryOutput}:{}),
 ...(e.schema===3?{waterBefore,waterAfter:waterBefore,waterInput:0,waterOutput:0,waterClosure:0}:{}),
 pageTransfers:finishPageSaltTransfers(pageLedger)
};e.daily.push(row);if(e.daily.length>64)e.daily.shift();e.lastDay=row;w.buildHydrology?.();return row;
}
