// Soil-water cycle (roadmap stage W). The previous rule changed moisture each day by
// rain*0.06 - (0.025 + 0.035*temp): evaporation did not depend on how much water the soil held, so the daily
// change was negative in every season for almost every rain draw and land moisture could only fall to its floor.
// This model is a daily bucket per land cell over a shallow groundwater layer. Nothing adds water except the same
// precipitation as before and the permanent rivers and lakes of the map; dryness comes from evaporation, drainage
// and plant uptake. Units are the existing 0..1 moisture index. ?soilWater=0 restores the previous rule.
//   infiltration = rain*0.06, reduced towards saturation (the remainder runs off the map)
//   evaporation  = potential(temp) * min(1, moisture / fieldCapacity)        (depends on available water)
//   percolation  = drain * (moisture - fieldCapacity) above field capacity    (soil to groundwater)
//   capillary    = rise * (groundwater - moisture) where the water table is higher (groundwater to soil)
//   groundwater  : lateral flow between neighbours, fixed at 1 under open water, slow deep drainage
//   plant uptake : producers fund growth from this soil water (src/ecology/plant-resources.js)
// fieldCapacity comes from the generated terrain wetness (fine, organic low-lying soils retain more water).
import {localRain,localTemperature} from '../world/environment.js';
import {coldSurfaceExchange,validateSnowpack} from '../world/snowpack.js';
import {exchangeTerrainGroundwater} from '../world/topography.js';
import {recordPageGroundwater,finishPageGroundwater,validatePageGroundwater} from '../world/page-groundwater-transfers.js';
export const SOIL_WATER={enabled:true,rainScale:.06,potentialBase:.025,potentialTemp:.035,capacityBase:.3,capacityWet:.4,drain:.15,rise:.08,lateral:.5,deepDrain:.004,wiltingPoint:.03};
const clamp01=v=>v<0?0:v>1?1:v;
export function initializeSoilWater(w){
  const fieldCapacity=new Float32Array(w.len),groundwater=new Float32Array(w.len);
  for(let i=0;i<w.len;i++){fieldCapacity[i]=SOIL_WATER.capacityBase+SOIL_WATER.capacityWet*clamp01(w.moisture[i]);groundwater[i]=w.water[i]?1:clamp01(w.moisture[i])}
  w.soilWater={schema:1,fieldCapacity,groundwater,snowpack:new Float64Array(w.len),scratch:new Float32Array(w.len),totals:{rain:0,snowfall:0,snowmelt:0,infiltration:0,runoff:0,evaporation:0,percolation:0,capillary:0,lateral:0,deepDrainage:0,uptake:0,overflow:0},day:0};
  return w.soilWater;
}
export function validateSoilWater(w,s){
  if(s?.schema!==1)throw Error('Invalid soil water schema.');
  for(const k of ['fieldCapacity','groundwater'])if(!(s[k] instanceof Float32Array)||s[k].length!==w.len||s[k].some(v=>!Number.isFinite(v)||v<0||v>1))throw Error('Invalid soil water store '+k+'.');
  if(s.snowpack!==undefined)validateSnowpack(w,s.snowpack);
  if(s.pageGroundwaterTransfers!==undefined)validatePageGroundwater(w,s.pageGroundwaterTransfers);
  for(const row of [...(s.daily||[]),...(s.lastDay?[s.lastDay]:[])])if(row.pageGroundwaterTransfers!==undefined)validatePageGroundwater(w,row.pageGroundwaterTransfers);
}
// Plant-available water in plant-resource units (capacity 2 per unit moisture), above the wilting point.
export function plantAvailableWater(w,i,capacity){return Math.max(0,w.moisture[i]-SOIL_WATER.wiltingPoint)*capacity}
// Called after producers have withdrawn from the plant-available store: the withdrawal leaves the soil.
export function withdrawPlantUptake(w,i,capacity,remaining){const s=w.soilWater,next=SOIL_WATER.wiltingPoint+remaining/capacity,used=Math.max(0,w.moisture[i]-next);if(used>0){w.moisture[i]-=used;if(s)s.totals.uptake+=used}return used}
export function advanceSoilWater(w,climate,day){
  const P=SOIL_WATER,s=w.soilWater||initializeSoilWater(w),fc=s.fieldCapacity,g=s.groundwater,next=s.scratch,n=w.n,t=s.totals,atmospheric=w.environment?{...climate,frontDay:day}:climate;
  const rain=Math.max(0,climate.rain)*P.rainScale,potential=P.potentialBase+P.potentialTemp*Math.max(0,climate.temp);
  // Groundwater lateral flow from the previous state: each pair of land neighbours exchanges the same amount in
  // opposite directions, open water is a fixed head of 1 and map edges are closed. t.lateral is the net inflow
  // from open water.
  if(w.terrain){const pageLedger=new Map();t.lateral+=exchangeTerrainGroundwater(w,g,next,P.lateral,(i,j,water)=>recordPageGroundwater(pageLedger,n,i,j,water));s.pageGroundwaterTransfers=finishPageGroundwater(pageLedger);}
  else{delete s.pageGroundwaterTransfers;
  for(let i=0;i<w.len;i++){if(w.water[i]){next[i]=1;continue}const x=i%n,y=(i/n)|0,gi=g[i];let d=0;
    if(x>0)d+=g[i-1]-gi;if(x<n-1)d+=g[i+1]-gi;if(y>0)d+=g[i-n]-gi;if(y<n-1)d+=g[i+n]-gi;
    const flow=P.lateral*.25*d;next[i]=gi+flow;t.lateral+=flow}}
  for(let i=0;i<w.len;i++){if(w.water[i]){g[i]=1;w.moisture[i]=1;continue}
    let m=w.moisture[i],gw=next[i];const cap=fc[i],cellRain=w.environment?localRain(w,atmospheric,i)*P.rainScale:rain,cellTemp=w.environment?localTemperature(w,atmospheric,i):w.temperature[i],cellPotential=w.environment?P.potentialBase+P.potentialTemp*Math.max(0,cellTemp):potential;
    // Snowfall remains stored water, not immediate soil infiltration. Thaw
    // enters the SAME infiltration/runoff authority as rainfall and cannot
    // generate liquid volume without a preceding precipitation receipt.
    const snow=coldSurfaceExchange(w,i,cellRain,cellTemp),liquid=snow.rain;
    const infiltration=liquid*Math.min(1,Math.max(0,(1-m)/(1-cap)));m+=infiltration;
    const evaporation=Math.min(m,cellPotential*Math.min(1,m/cap));m-=evaporation;
    const percolation=P.drain*Math.max(0,m-cap);m-=percolation;gw+=percolation;
    const capillary=P.rise*Math.max(0,gw-m);m+=capillary;gw-=capillary;
    const deep=P.deepDrain*gw;gw-=deep;
    // A full water table rejects further recharge (it leaves as surface runoff).
    const overflow=Math.max(0,m-1)+Math.max(0,gw-1);w.moisture[i]=clamp01(m);g[i]=clamp01(gw);t.overflow+=overflow;
    t.rain+=cellRain;t.snowfall=(t.snowfall||0)+snow.snowfall;t.snowmelt=(t.snowmelt||0)+snow.melt;t.infiltration+=infiltration;t.runoff+=liquid-infiltration;t.evaporation+=evaporation;t.percolation+=percolation;t.capillary+=capillary;t.deepDrainage+=deep}
  s.day=day;return s;
}
// Land water storage: soil moisture plus groundwater over every land cell (open water is a fixed boundary).
export function soilWaterStorage(w){const g=w.soilWater?.groundwater;let s=0;for(let i=0;i<w.len;i++)if(!w.water[i])s+=w.moisture[i]+(g?g[i]:0)+(w.soilWater?.snowpack?.[i]||0);return s}
const FLOWS=['rain','snowfall','snowmelt','infiltration','runoff','evaporation','percolation','capillary','lateral','deepDrainage','uptake','overflow'];
// One daily step: yesterday's producer withdrawals leave the soil, then the day's water processes run. Each day's
// world totals are kept in s.lastDay and the bounded s.daily history:
//   inputs  = rain + inflow from open water (lateral);  outputs = runoff + evaporation + deep drainage + plant uptake
//   + overflow;  closure = inputs - outputs - storage change, which is zero up to float rounding.
export function advanceSoilDay(w,climate,day){
  const r=w.plantResources,cap=2;// PLANT_RESOURCE_UNITS.waterCapacity
  const s=w.soilWater||initializeSoilWater(w);s.snowpack||=new Float64Array(w.len);s.totals.snowfall??=0;s.totals.snowmelt??=0;
  const before=soilWaterStorage(w),t0=Object.fromEntries(FLOWS.map(k=>[k,s.totals[k]]));
  if(r?.soilWaterLinked){for(let i=0;i<w.len;i++)if(!w.water[i])withdrawPlantUptake(w,i,cap,r.water[i]);r.soilWaterLinked=false}
  advanceSoilWater(w,climate,day);
  const after=soilWaterStorage(w),f=Object.fromEntries(FLOWS.map(k=>[k,s.totals[k]-t0[k]])),inputs=f.rain+f.lateral,outputs=f.runoff+f.evaporation+f.deepDrainage+f.uptake+f.overflow;
  let land=0,moisture=0;for(let i=0;i<w.len;i++)if(!w.water[i]){land++;moisture+=w.moisture[i]}
  s.lastDay={day,climateRain:climate.rain,climateTemp:climate.temp,...f,inputs,outputs,storageBefore:before,storageAfter:after,storageChange:after-before,closure:inputs-outputs-(after-before),meanMoisture:land?moisture/land:0,...(s.pageGroundwaterTransfers?{pageGroundwaterTransfers:s.pageGroundwaterTransfers}:{})};
  (s.daily||(s.daily=[])).push(s.lastDay);if(s.daily.length>64)s.daily.shift();
  return s;
}
