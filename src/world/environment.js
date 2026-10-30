// Physical fields for new worlds. Normalized model units, not biome membership bonuses.
import {coordNoise} from '../core/rng.js';
import {SURFACE_ICE,liquidVolume,validateSurfaceIce} from './surface-ice.js';
import {CLIMATE_WATER,bankSpill,edgeOutflow,poolEvaporation,riverDischarge,temperaturePotential} from './climate-water.js';
import {recordPageSaltTransfer,finishPageSaltTransfers,validatePageSaltTransfers} from './page-salt-transfers.js';
import {WORLD_PAGE_SIZE} from './pages.js';
import {regionalRainfall} from './weather-fronts.js';
import {PLANETARY_INTERNAL_WATER,advanceInternalPlanetaryWater} from './planetary-internal-water.js';
import {PLANETARY_RUNOFF,totalPlanetarySurfaceWater} from './planetary-runoff.js';
import {PLANETARY_BOUNDARY_WATER,validateBoundaryWaterPolicy,boundaryWaterExchange,boundaryOpenness,validateBoundaryWaterReceipt} from './planetary-boundary-water.js';
import {validateSeamRunoffPolicy} from './planetary-seam-runoff.js';
import {PLANETARY_SEAM_GROUNDWATER} from './planetary-seam-groundwater.js';
import {GROUNDWATER_SPRINGS} from './groundwater-springs.js';
import {validateMineralRunoffPolicy} from './planetary-mineral-runoff.js';
import {validateTerrainSedimentPolicy} from './terrain-sediment.js';
import {validateWetbedPolicy} from './planetary-wetbed-sediment.js';
import {validateChannelTopologyPolicy} from './planetary-channel-topology.js';
import {COAT_MOISTURE} from '../lineage/coat-moisture.js';
import {SEASONAL_COAT} from '../lineage/seasonal-coat.js';
import {validateEmbryoClimatePolicy} from '../reproduction/embryo-climate.js';
import {validateYoungClimatePolicy} from '../ecology/young-climate.js';
import {validateFlightWindPolicy} from '../lineage/flight-wind.js';
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
 validateSurfaceIce(w,e);
 if(e?.schema!==1&&e?.schema!==2&&e?.schema!==3&&e?.schema!==4&&e?.schema!==5&&e?.schema!==6)throw Error('Invalid environment schema.');
 if(e.schema>=2&&w.generator!=='planetary/1')throw Error('Planetary boundary version requires planetary geography.');
 validateBoundaryWaterPolicy(w,e);
 validateFlightWindPolicy(w,e);
 if(e.groundwaterSeamEligibility!==undefined&&(e.groundwaterSeamEligibility!==PLANETARY_SEAM_GROUNDWATER.policy||w.generator!=='planetary/1'||e.schema!==6))throw Error('Invalid planetary groundwater-seam eligibility.');
 if(e.springEligibility!==undefined&&(e.springEligibility!==GROUNDWATER_SPRINGS.policy||w.generator!=='planetary/1'||e.schema!==6))throw Error('Invalid funded groundwater-spring eligibility.');
 validateSeamRunoffPolicy(w,e);
 validateMineralRunoffPolicy(w,e);
 validateTerrainSedimentPolicy(w,e);
 validateEmbryoClimatePolicy(w,e);
 validateYoungClimatePolicy(w,e);
 validateWetbedPolicy(w,e);
 validateChannelTopologyPolicy(w,e);
 if(e.coatMoisturePolicy!==undefined&&(e.coatMoisturePolicy!==COAT_MOISTURE.policy||w.generator!=='planetary/1'||e.schema!==6))throw Error('Invalid planetary coat-moisture policy.');
 if(e.seasonalCoatPolicy!==undefined&&(e.seasonalCoatPolicy!==SEASONAL_COAT.policy||e.coatMoisturePolicy!==COAT_MOISTURE.policy||w.generator!=='planetary/1'||e.schema!==6))throw Error('Invalid planetary seasonal-coat policy.');
 for(const [key,Type,lo,hi] of [['temperatureOffset',Float32Array,-1,1],['rainScale',Float32Array,0,3],['depth',Float32Array,0,2],['salt',Float64Array,0,4],['boundary',Uint8Array,0,e.schema>=2?3:2]])if(!(e[key] instanceof Type)||e[key].length!==w.len||e[key].some(v=>!Number.isFinite(v)||v<lo||v>hi))throw Error('Invalid environment field '+key+'.');
 if(e.schema>=5&&(!(e.overland instanceof Float64Array)||e.overland.length!==w.len||
    e.overland.some((v,i)=>!Number.isFinite(v)||v<0||w.water[i]&&v!==0)))
  throw Error('Invalid planetary overland runoff field.');
 if(e.schema>=3&&(!(e.volume instanceof Float64Array)||e.volume.length!==w.len||
    e.volume.some(v=>!Number.isFinite(v)||v<0||v>2)))
  throw Error('Invalid planetary water-volume field.');
 for(let i=0;i<w.len;i++){
  const water=e.schema>=3?e.volume[i]:e.depth[i];
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
 if(e.schema>=4&&['internalWaterMoved','internalSaltMoved'].some(k=>e.totals?.[k]!==undefined&&
    (!Number.isFinite(e.totals[k])||e.totals[k]<0)))
  throw Error('Invalid planetary internal-flow totals.');
 if(e.schema>=3&&['pairedWaterInput','pairedWaterOutput'].some(k=>e.totals?.[k]!==undefined&&
    (!Number.isFinite(e.totals[k])||e.totals[k]<0)))
  throw Error('Invalid paired water totals.');
 if(e.schema>=5&&['surfaceRainInput','surfaceRainOutput','surfaceEvaporation','riverDischarge','dischargeSalt','pondedRunOn','bankSpill','deepFloodSpread','edgeRunoffOutput','soilRunoffReceived','runoffDelivered','overlandMoved'].some(k=>e.totals?.[k]!==undefined&&
    (!Number.isFinite(e.totals[k])||e.totals[k]<0)))
  throw Error('Invalid planetary surface-runoff totals.');
 if(!Number.isSafeInteger(e.day)||e.day<0||!e.totals||['saltInput','saltOutput','rainWater','displacedWater'].some(k=>!Number.isFinite(e.totals[k])||e.totals[k]<0)||!Array.isArray(e.daily)||e.daily.length>64)throw Error('Invalid environment history.');
 for(const row of [...e.daily,...(e.lastDay?[e.lastDay]:[])]){if(!Number.isSafeInteger(row.day)||row.day<0||row.day>e.day||['before','after','input','output'].some(k=>!Number.isFinite(row[k])||row[k]<0)||!Number.isFinite(row.closure)||Math.abs(row.closure)>1e-6||Math.abs(row.input-row.output-(row.after-row.before)-row.closure)>1e-6)throw Error('Invalid salt budget receipt.');
  // Historical receipts have no page-level transfer audit; validate new ones strictly.
  if(e.schema>=2&&['boundaryInput','boundaryOutput'].some(k=>!Number.isFinite(row[k])||row[k]<0))
   throw Error('Invalid planetary boundary flux receipt.');
  if(e.schema>=2&&(row.boundaryInput>row.input+1e-8||row.boundaryOutput>row.output+1e-8))
   throw Error('Planetary boundary flux exceeds total salt receipts.');
  if(e.schema>=2&&['pairedInput','pairedOutput'].some(k=>row[k]!==undefined&&
      (!Number.isFinite(row[k])||row[k]<0)))
   throw Error('Invalid paired planetary salt receipt.');
  if(e.schema>=3){
   if(e.schema>=5&&['surfaceRainInput','surfaceRainOutput','surfaceEvaporation','riverDischarge','dischargeSalt','pondedRunOn','bankSpill','deepFloodSpread','edgeRunoffOutput','soilRunoffReceived','runoffDelivered','overlandMoved','overlandEdges'].some(k=>k in row&&
      (!Number.isFinite(row[k])||row[k]<0)))
    throw Error('Invalid planetary rainfall or overland receipt.');
   if(e.schema>=4&&['internalWaterMoved','internalSaltMoved','internalWetEdges'].some(k=>k in row&&
      (!Number.isFinite(row[k])||row[k]<0)))
    throw Error('Invalid planetary internal-flow receipt.');
   if(['waterBefore','waterAfter','waterInput','waterOutput','waterClosure'].some(k=>!Number.isFinite(row[k]))||
     row.waterBefore<0||row.waterAfter<0||row.waterInput<0||row.waterOutput<0||
     (Math.abs(row.waterClosure)>1e-6||
      Math.abs(row.waterInput-row.waterOutput-(row.waterAfter-row.waterBefore)-row.waterClosure)>1e-6))
    throw Error('Invalid planetary water-volume receipt.');
  }
  if(e.seamRunoffPolicy!==undefined&&(
   ['seamRunoffInput','seamRunoffOutput'].some(k=>row[k]!==undefined&&(!Number.isFinite(row[k])||row[k]<0))||
   (row.seamRunoffInput||0)>row.waterInput+1e-8||
   (row.seamRunoffOutput||0)>row.waterOutput+1e-8))
   throw Error('Invalid planetary seam-runoff receipt.');
  validateBoundaryWaterReceipt(e,row);
  if(row.pageTransfers!==undefined)validatePageSaltTransfers(w,row.pageTransfers);
 }
}
export function localTemperature(w,climate,i){return clamp(climate.temp+(w.environment?.temperatureOffset[i]||0),-.5,1.5)}
export function localRain(w,climate,i){return regionalRainfall(w,climate,i)}
export function salinityAt(w,i){const e=w.environment;const d=e?liquidVolume(e,i,e.schema>=3?e.volume[i]:e.depth[i]):0;return d>0?e.salt[i]/d:0}
export function potableWater(w,i){return !!w.water[i]&&salinityAt(w,i)<=.05}
export function salineMargin(w,i){if(!w.environment)return false;const x=i%w.n,y=(i/w.n)|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<w.n&&ny<w.n&&w.water[ny*w.n+nx]&&!potableWater(w,ny*w.n+nx))return true}return false}
export function saltStorage(w){let total=0;for(const amount of w.environment?.salt||[])total+=amount;return total}
export function waterStorage(w){let total=0;for(const amount of w.environment?.volume||w.environment?.depth||[])total+=amount;return total}
// Fixed-depth water bodies exchange equal water volumes with neighboring cells. Salt is advected
// conservatively; freshwater rain displaces an equal volume, exporting its dissolved salt.
// Edge reservoirs restore freshwater (1) / seawater (2), with explicit salt input/output receipts.
// climate-water/3: each connected body of open water (orthogonal neighbours, as
// in the internal flow) that reaches a border side open to external water drains
// a quarter of its net liquid water above the generated levels per day, scaled by
// its most open outlet; dissolved salt leaves in proportion.
// Runoff-made cells (floodOrigin 1) have no generated level: they drain to the
// internal flow's minimum wet film, so dried pools can recede. Bodies with no
// open outlet (closed basins, or sides owned by paired regions, whose seams move
// water themselves) keep their water.
const levelOf=(e,i)=>e.floodOrigin?.[i]===1?PLANETARY_INTERNAL_WATER.minWet:e.depth[i];
// climate-water/5: a fresh runoff pool standing above a dry neighbour's ground
// pours half of its largest overtopping per day onto its lower banks, shared by
// how far each is overtopped, as ponded (overland) water. Every pool spills from
// the same day-start surface, so the order of cells does not matter. Generated
// water (level with its banks in incised channels) and salty water stay.
function spillOverBanks(w,salt){
 const e=w.environment,n=w.n,ground=w.terrain.elevation,moves=[];let spilled=0;
 for(let i=0;i<w.len;i++){
  if(!w.water[i]||e.floodOrigin[i]!==1||salt[i]!==0)continue;
  const liquid=liquidVolume(e,i,e.volume[i]),spare=liquid-PLANETARY_INTERNAL_WATER.minWet;if(!(spare>0))continue;
  const head=ground[i]+liquid,x=i%n,banks=[];let top=0,sum=0;
  for(const j of [x>0?i-1:-1,x<n-1?i+1:-1,i-n,i+n]){if(j<0||j>=w.len||w.water[j])continue;const drop=head-ground[j];if(drop>0){banks.push(j,drop);sum+=drop;if(drop>top)top=drop}}
  if(!sum)continue;const out=Math.min(spare,top)*CLIMATE_WATER.spillFraction;
  for(let k=0;k<banks.length;k+=2)moves.push(i,banks[k],out*banks[k+1]/sum);
 }
 for(let k=0;k<moves.length;k+=3){const amount=moves[k+2];e.volume[moves[k]]-=amount;e.overland[moves[k+1]]+=amount;spilled+=amount}
 return spilled;
}
// climate-water/6: ponded water on a border land cell with no downhill neighbour
// inside the region moves on at the daily downhill share across an unpaired side
// whose planetary geography beyond is open water or lower ground, leaving the region.
const EDGE_SIDES=[[1,-1,0],[2,1,0],[4,0,-1],[8,0,1]];
function runoffLeavesBorders(w){
 const e=w.environment,n=w.n,planet=w.planet,ground=w.terrain?.elevation,paired=e.pairedSides||0;
 if(typeof planet?.sample!=='function'||!ground)return 0;
 const origin=w.regionOrigin||{x:0,y:0};let out=0;
 for(let i=0;i<w.len;i++){
  const x=i%n,y=(i/n)|0;if(x>0&&x<n-1&&y>0&&y<n-1){i+=n-3;continue}
  if(w.water[i]||!(e.overland[i]>0)||w.terrain.downstream[i]!==-1)continue;
  const sides=EDGE_SIDES.filter(([bit,dx,dy])=>!(paired&bit)&&(dx<0?x===0:dx>0?x===n-1:dy<0?y===0:y===n-1));
  if(!sides.some(([,dx,dy])=>{const s=planet.sample(origin.x+x+dx+.5,origin.y+y+dy+.5);return s.water||s.elevation<ground[i]}))continue;
  const amount=e.overland[i]*PLANETARY_RUNOFF.moveFraction;e.overland[i]-=amount;out+=amount;
 }
 return out;
}
function dischargeRivers(w,salt){
 const e=w.environment,n=w.n,seen=new Uint8Array(w.len),stack=[],body=[];let water=0,saltOut=0;
 for(let s=0;s<w.len;s++){
  if(!w.water[s]||seen[s])continue;
  body.length=0;stack.push(s);seen[s]=1;let outlet=0;
  while(stack.length){const i=stack.pop();body.push(i);const open=e.boundary[i]?boundaryOpenness(e,i,w):null;if(open&&open.fraction>outlet)outlet=open.fraction;
   const x=i%n;for(const j of [x>0?i-1:-1,x<n-1?i+1:-1,i-n,i+n])if(j>=0&&j<w.len&&w.water[j]&&!seen[j]){seen[j]=1;stack.push(j)}}
  if(!outlet)continue;
  // The body's net surplus sets the day's outflow, taken from the cells holding
  // surplus in proportion, so discharge never draws a body below its generated water.
  let net=0,positive=0;for(const i of body){const surplus=liquidVolume(e,i,e.volume[i])-levelOf(e,i);net+=surplus;if(surplus>0)positive+=surplus}
  if(!(net>0&&positive>0))continue;const share=net*CLIMATE_WATER.dischargeFraction*outlet/positive;
  for(const i of body){
   const liquid=liquidVolume(e,i,e.volume[i]),out=(liquid-levelOf(e,i))*share;
   if(!(out>0))continue;
   const leaving=Math.min(salt[i],salt[i]*out/liquid);
   e.volume[i]-=out;salt[i]-=leaving;water+=out;saltOut+=leaving;
  }
 }
 return{water,salt:saltOut};
}
export function advanceEnvironmentWater(w,climate,day){
 const e=w.environment;if(!e)return;validateSurfaceIce(w,e);const atmospheric={...climate,frontDay:day};const before=saltStorage(w),waterBefore=e.schema>=5?totalPlanetarySurfaceWater(w):e.schema>=3?waterStorage(w):0,next=new Float64Array(e.salt),n=w.n,t=e.totals,input0=t.saltInput,output0=t.saltOutput,pageLedger=new Map();
 let surfaceEvaporation=0,dischargeWater=0,dischargeSalt=0;const evaporatePools=e.schema>=5&&poolEvaporation(climate)&&!!e.floodOrigin;
 const discharge=e.schema>=5&&riverDischarge(climate)&&(e.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.policy||e.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.pairedPolicy);
 let boundaryInput=0,boundaryOutput=0,surfaceRainInput=0,surfaceRainOutput=0,boundaryWaterInput=0,boundaryWaterOutput=0,boundarySaltInput=0,boundarySaltOutput=0;
 const pair=(i,j)=>{if(!w.water[i]||!w.water[j])return;const c=salinityAt(w,i)-salinityAt(w,j),from=c>0?i:j,to=c>0?j:i,flow=Math.min(Math.abs(c)*Math.min(liquidVolume(e,i,e.schema>=3?e.volume[i]:e.depth[i]),liquidVolume(e,j,e.schema>=3?e.volume[j]:e.depth[j]))*.08,e.salt[from]*.25);const actual=e.icePolicy===SURFACE_ICE.policy?Math.min(flow,Math.max(0,next[from]),Math.max(0,liquidVolume(e,to)*2-next[to])):flow;next[from]-=actual;next[to]+=actual;if(actual>0&&((j===i+1&&(i%n)%WORLD_PAGE_SIZE===WORLD_PAGE_SIZE-1)||(j===i+n&&Math.floor(i/n)%WORLD_PAGE_SIZE===WORLD_PAGE_SIZE-1)))recordPageSaltTransfer(pageLedger,n,i,j,from===i?actual:-actual)};
 for(let i=0;i<w.len;i++){if(i%n<n-1)pair(i,i+1);if(i+n<w.len)pair(i,i+n)}
 for(let i=0;i<w.len;i++)if(w.water[i]){const rain=localRain(w,atmospheric,i)*.06,volume=e.schema>=3?e.volume[i]:e.depth[i];
 // V5 rain becomes physical freshwater. Full cells expel only their
 // unretained rain volume, carrying dissolved salt into a recorded export.
 // Historical schemas still use their original fixed-volume displacement.
 const accepted=e.schema>=5?Math.min(rain,Math.max(0,2-volume)):0;
 const displaced=e.schema>=5?rain-accepted:rain;
 if(e.schema>=5){
  e.volume[i]+=accepted;surfaceRainInput+=rain;surfaceRainOutput+=displaced;
  // climate-water/2: a rainfall-runoff pool evaporates its liquid water to the air
  // at the temperature-driven potential, down to the minimum wet film open water
  // keeps until recession; salt stays and concentrates.
  if(evaporatePools&&e.floodOrigin[i]===1){const evaporated=Math.min(Math.max(0,liquidVolume(e,i,e.volume[i])-PLANETARY_INTERNAL_WATER.minWet),temperaturePotential(localTemperature(w,atmospheric,i)));if(evaporated>0){e.volume[i]-=evaporated;surfaceEvaporation+=evaporated}}
 }
 const lost=next[i]*(1-Math.exp(-displaced/liquidVolume(e,i,volume)));
 next[i]-=lost;t.rainWater+=rain;t.displacedWater+=displaced;t.saltOutput+=lost;const reservoir=e.boundary[i];if(reservoir){
   if((e.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.policy||e.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.pairedPolicy)){
    // Equal external water replacement carries actual dissolved salt.
    // The local water volume remains unchanged; both sides of the exchange
    // appear in today's salt and water receipts.
    const exchange=boundaryWaterExchange(e,i,next[i],e.volume[i],w);
    if(exchange){
    next[i]=exchange.saltAfter;
    boundaryWaterInput+=exchange.waterInput;
    boundaryWaterOutput+=exchange.waterOutput;
    boundarySaltInput+=exchange.saltInput;
    boundarySaltOutput+=exchange.saltOutput;
    boundaryInput+=exchange.saltInput;
    boundaryOutput+=exchange.saltOutput;
    t.saltInput+=exchange.saltInput;
    t.saltOutput+=exchange.saltOutput;
    t.boundaryInput+=exchange.saltInput;
    t.boundaryOutput+=exchange.saltOutput;
    }
   }else if(e.schema>=2){
    // Equal volumes exchange with a geography-declared external body,
    // rather than resetting salinity to a target on every calendar day.
    // The outside ocean/freshwater is a declared reservoir. Every finite
    // salt flux is credited to an external input or output receipt.
    const target=reservoir===2?1:reservoir===3?.5:0;
    const liquid=liquidVolume(e,i,volume),delta=(target-next[i]/liquid)*liquid*.08;
    const updated=clamp(next[i]+delta,0,liquid*2);
    const transferred=updated-next[i];next[i]=updated;
    if(transferred>0){t.saltInput+=transferred;t.boundaryInput+=transferred;boundaryInput+=transferred;}
    else if(transferred<0){t.saltOutput-=transferred;t.boundaryOutput-=transferred;boundaryOutput-=transferred;}
   }else{
    const target=reservoir===2?volume:0,delta=target-next[i];
    if(delta>=0)t.saltInput+=delta;else t.saltOutput-=delta;
    next[i]=target;
   }
  }}
 const internal=advanceInternalPlanetaryWater(w,next,{incised:discharge});
 if(discharge){const out=dischargeRivers(w,next);dischargeWater=out.water;dischargeSalt=out.salt;t.saltOutput+=out.salt}
 // Spilled water stays in the region's surface water (pools to ponded land water).
 const spilled=e.schema>=5&&bankSpill(climate)&&e.floodOrigin?spillOverBanks(w,next):0;
 const edgeWater=e.schema>=5&&edgeOutflow(climate)&&e.overland?runoffLeavesBorders(w):0;
 if((e.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.policy||e.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.pairedPolicy)){
  t.boundaryWaterInput+=boundaryWaterInput;
  t.boundaryWaterOutput+=boundaryWaterOutput;
  t.boundarySaltInput+=boundarySaltInput;
  t.boundarySaltOutput+=boundarySaltOutput;
 }
 if(e.schema>=5){
  t.surfaceRainInput=(t.surfaceRainInput||0)+surfaceRainInput;
  t.surfaceRainOutput=(t.surfaceRainOutput||0)+surfaceRainOutput;
  if(surfaceEvaporation)t.surfaceEvaporation=(t.surfaceEvaporation||0)+surfaceEvaporation;
  if(dischargeWater){t.riverDischarge=(t.riverDischarge||0)+dischargeWater;t.dischargeSalt=(t.dischargeSalt||0)+dischargeSalt}
  if(spilled)t.bankSpill=(t.bankSpill||0)+spilled;
  if(edgeWater)t.edgeRunoffOutput=(t.edgeRunoffOutput||0)+edgeWater;
 }
 e.salt.set(next);e.day=day;const after=saltStorage(w),waterAfter=e.schema>=5?totalPlanetarySurfaceWater(w):waterBefore,input=t.saltInput-input0,output=t.saltOutput-output0,row={
 day,before,after,input,output,closure:input-output-(after-before),
 ...((e.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.policy||e.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.pairedPolicy)?{
   boundaryWaterInput,boundaryWaterOutput,boundarySaltInput,boundarySaltOutput
 }:{}),
 ...(e.schema>=2?{boundaryInput,boundaryOutput}:{}),
 ...(e.schema>=3?(e.schema>=5?{
  ...internal,waterBefore,waterAfter,
  waterInput:surfaceRainInput+boundaryWaterInput,waterOutput:surfaceRainOutput+boundaryWaterOutput+surfaceEvaporation+dischargeWater+edgeWater,
  waterClosure:surfaceRainInput+boundaryWaterInput-surfaceRainOutput-boundaryWaterOutput-surfaceEvaporation-dischargeWater-edgeWater-(waterAfter-waterBefore),
  surfaceRainInput,surfaceRainOutput,...(surfaceEvaporation?{surfaceEvaporation}:{}),...(dischargeWater?{riverDischarge:dischargeWater,dischargeSalt}:{}),...(spilled?{bankSpill:spilled}:{}),...(edgeWater?{edgeRunoffOutput:edgeWater}:{})
 }:internal||{waterBefore,waterAfter:waterBefore,waterInput:0,waterOutput:0,waterClosure:0}):{}),
 pageTransfers:finishPageSaltTransfers(pageLedger)
};e.daily.push(row);if(e.daily.length>64)e.daily.shift();e.lastDay=row;w.buildHydrology?.();return row;
}
