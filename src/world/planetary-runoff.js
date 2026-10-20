import {PLANETARY_MINERAL_RUNOFF,stageRunoffMinerals} from './planetary-mineral-runoff.js';
import {TERRAIN_SEDIMENT,stageTerrainSediment,validateSedimentDeltas} from './terrain-sediment.js';
import {deriveDrainage} from './topography.js';
import {PLANETARY_WETBED,stageWetbedSediment} from './planetary-wetbed-sediment.js';
import {PLANETARY_CHANNEL_TOPOLOGY,planChannelRecession} from './planetary-channel-topology.js';
// Version-5 planetary surface-water authority. Soil runoff and rejected
// groundwater overflow become conserved overland water, routed along the
// actual steepest-downhill drainage graph. Water that cannot reach an existing
// channel remains in its dry-land basin; this pass does NOT create new lakes.
export const PLANETARY_RUNOFF=Object.freeze({schema:1,moveFraction:.65,
 shallowChannelThreshold:.25,closedBasinThreshold:.65,maxNewWetCellsPerDay:8});
function floodFromRunoff(w,day){
 const e=w.environment;
 if(e?.schema!==6)return null;
 const n=w.n,changes=[];
 for(let i=n;i<w.len-n&&changes.length<PLANETARY_RUNOFF.maxNewWetCellsPerDay;i++){
  if(w.water[i])continue;
  // Inundating a snowy land cell would leave an independent finite snow
  // reservoir beneath open water. The existing thaw cycle owns that stock:
  // keep the cell dry until the snow naturally melts into liquid runoff.
  if(w.soilWater?.snowpack?.[i]>1e-8)continue;
  const x=i%n;
  // A new border cell would need a paired external geography authority.
  if(x===0||x===n-1)continue;
  const amount=e.overland[i],downstream=w.terrain.downstream[i];
  if(amount<PLANETARY_RUNOFF.shallowChannelThreshold||amount>2)continue;
  const connected=!!(w.water[i-1]||w.water[i+1]||w.water[i-n]||w.water[i+n]);
  const basin=downstream===-1&&amount>=PLANETARY_RUNOFF.closedBasinThreshold;
  if(!connected&&!basin)continue;
  // A new waterway is funded solely by the water already held in this cell,
  // not a generator reset, external import, or extra rainfall credit.
  changes.push({i,water:1,depth:amount,salinity:0,source:'overland'});
 }
 if(!changes.length)return null;
 const receipt=w.setSurfaceWater(changes,{reason:'rainfall-runoff-inundation'});
 const row=w.environment.lastDay,t=w.environment.totals;
 row.newWetCells=changes.length;row.inundatedWater=receipt.internalWater;
 t.newWetCells=(t.newWetCells||0)+changes.length;
 t.inundatedWater=(t.inundatedWater||0)+receipt.internalWater;
 return receipt;
}
const sum=a=>{let n=0;for(const v of a)n+=v;return n;};
export function totalPlanetarySurfaceWater(w){
 const e=w.environment;
 return sum(e?.volume||[])+sum(e?.overland||[]);
}
export function routePlanetaryRunoff(w,runoff,day){
 const e=w.environment;
 if(e?.schema<5)return null;
 if(!(runoff instanceof Float64Array)||runoff.length!==w.len||
   !(e.overland instanceof Float64Array)||e.overland.length!==w.len||
   !(e.volume instanceof Float64Array)||e.volume.length!==w.len||
   !(w.terrain?.downstream instanceof Int32Array)||
   !e.lastDay||e.lastDay.day!==day)
  throw Error('Invalid planetary soil runoff handoff.');
 const before=totalPlanetarySurfaceWater(w),overland=e.overland.slice(),
  volume=e.volume.slice(),downstream=w.terrain.downstream;
 let captured=0,delivered=0,moved=0,edges=0;
 for(let i=0;i<w.len;i++){
  const amount=runoff[i];
  if(!Number.isFinite(amount)||amount<0||w.water[i]&&amount)
   throw Error('Invalid planetary land runoff source.');
  if(amount){overland[i]+=amount;captured+=amount;}
 }
 // One bounded downhill hop per day from a frozen, post-rain source state.
 // Routing uses the existing terrain drainage graph, never a teleport to
 // the nearest lake or a fabricated region-boundary outflow.
 const original=overland.slice();
 const mineralEnabled=e.mineralRunoffPolicy===PLANETARY_MINERAL_RUNOFF.policy;
 const minerals=w.plantResources?.minerals;
 if(mineralEnabled&&(!(minerals instanceof Float64Array)||minerals.length!==w.len))
  throw Error('Runoff mineral transport requires canonical plant minerals.');
 const mineralDelta=new Map(),owner={key:'local',env:e,minerals},mineralChanges=new Map([['local',mineralDelta]]);
 let mineralsMoved=0;
 const eroding=e.terrainSedimentPolicy===TERRAIN_SEDIMENT.policy;
 const terrainDelta=new Map(),terrainChanges=new Map([['local',terrainDelta]]);
 const terrainOwner={key:'local',env:e,water:w.water,terrain:w.terrain};
 let sedimentMoved=0;
 const wetEdges=[];
 const wetPolicy=e.wetbedSedimentPolicy===PLANETARY_WETBED.policy;
 let wetbedMoved=0;
 for(let i=0;i<w.len;i++){
  if(w.water[i]||original[i]<=0)continue;
  const j=downstream[i];
  if(j<0)continue;
  if(j>=w.len||w.terrain.elevation[j]>=w.terrain.elevation[i])
   throw Error('Invalid downhill runoff route.');
  let amount=original[i]*PLANETARY_RUNOFF.moveFraction;
  if(w.water[j])amount=Math.min(amount,Math.max(0,2-volume[j]));
  if(amount<=0)continue;
  if(mineralEnabled)mineralsMoved+=stageRunoffMinerals(owner,owner,i,j,amount,original[i],mineralChanges);
  if(eroding)sedimentMoved+=stageTerrainSediment(terrainOwner,terrainOwner,i,j,amount,terrainChanges);
  overland[i]-=amount;
  if(w.water[j]){volume[j]+=amount;delivered+=amount;if(wetPolicy)wetEdges.push([i,j,amount]);}
  else overland[j]+=amount;
  moved+=amount;edges++;
 }
 let pendingSalt=null;
 if(wetPolicy&&wetEdges.length){
  const wetSalt=e.salt.slice(),wdelta=new Map(),sdelta=new Map();
  const owner={...terrainOwner,env:{...e,volume,salt:wetSalt}};
  const wmaps=new Map([['local',wdelta]]),smaps=new Map([['local',sdelta]]);
  for(const [i,j,water] of wetEdges){
   const receipt=stageWetbedSediment(owner,owner,i,j,water,terrainChanges,wmaps,smaps);
   if(receipt)wetbedMoved+=receipt.sediment;
  }
  let wc=0,sc=0;
  for(const [i,d] of wdelta){volume[i]+=d;wc+=d;}
  for(const [i,d] of sdelta){wetSalt[i]+=d;sc+=d;}
  if(Math.abs(wc)>1e-9||Math.abs(sc)>1e-9)
   throw Error('Wetbed water and salt displacement not conserved.');
  if(wetbedMoved){
   for(let i=0;i<w.len;i++)if(w.water[i]&&
    (!Number.isFinite(wetSalt[i])||wetSalt[i]<0||wetSalt[i]>volume[i]*2+1e-9))
     throw Error('Invalid deposited wetbed salinity.');
   pendingSalt=wetSalt;
  }
 }
 for(let i=0;i<w.len;i++){
  if(!Number.isFinite(overland[i])||overland[i]<-1e-12||
    !Number.isFinite(volume[i])||volume[i]<0||volume[i]>2+1e-10||
    (w.water[i]&&overland[i]!==0)||( !w.water[i]&&volume[i]!==0))
   throw Error('Invalid planetary runoff surface inventory.');
 }
 const after=sum(overland)+sum(volume),closure=captured-(after-before);
 if(Math.abs(closure)>1e-6)
  throw Error('Planetary runoff water closure failed.');
 if(eroding)validateSedimentDeltas([terrainOwner],terrainChanges);
 // The mineral transport is independent of water's physical ledger.
 // It changes the finite existing plant growth mineral stocks, not fertility
 // ratings or resource generation. Publish only after the full water closure.
 if(mineralEnabled){
  let deltaTotal=0;
  for(const [i,delta] of mineralDelta){
   const after=minerals[i]+delta;
   if(!Number.isFinite(after)||after<-1e-9)throw Error('Invalid runoff-mineral final stock.');
   deltaTotal+=delta;
  }
  if(Math.abs(deltaTotal)>1e-8)throw Error('Runoff mineral conservation failed.');
 }
 // Validate the combined rain + soil handoff BEFORE touching live stores.
 // A malformed receipt must never publish only one side of the transfer.
 const row=e.lastDay;
 const combinedInput=row.waterInput+captured;
 const combinedClosure=combinedInput-row.waterOutput-(after-row.waterBefore);
 if(!Number.isFinite(combinedClosure)||Math.abs(combinedClosure)>1e-6)
  throw Error('Invalid planetary combined rainfall/runoff closure.');
 e.overland.set(overland);e.volume.set(volume);
 if(pendingSalt)e.salt.set(pendingSalt);
 if(mineralEnabled)for(const [i,delta] of mineralDelta)minerals[i]+=delta;
 if(eroding)for(const [i,delta] of terrainDelta)w.terrain.elevation[i]=Math.fround(w.terrain.elevation[i]+delta);
 e.totals.soilRunoffReceived=(e.totals.soilRunoffReceived||0)+captured;
 e.totals.runoffDelivered=(e.totals.runoffDelivered||0)+delivered;
 e.totals.overlandMoved=(e.totals.overlandMoved||0)+moved;
 row.waterInput=combinedInput;
 row.waterAfter=after;
 row.waterClosure=combinedClosure;
 row.soilRunoffReceived=captured;
 row.runoffDelivered=delivered;
 row.overlandMoved=moved;
 row.overlandEdges=edges;
 if(mineralEnabled){row.runoffMineralsMoved=mineralsMoved;
  e.totals.runoffMineralsMoved=(e.totals.runoffMineralsMoved||0)+mineralsMoved;
  w.plantResources.totals.runoffMineralsMoved=(w.plantResources.totals.runoffMineralsMoved||0)+mineralsMoved;}
 if(wetPolicy){
  row.wetbedSedimentMoved=wetbedMoved;
  row.wetbedWaterDisplaced=wetbedMoved;
  e.totals.wetbedSedimentMoved=(e.totals.wetbedSedimentMoved||0)+wetbedMoved;
  e.totals.wetbedWaterDisplaced=(e.totals.wetbedWaterDisplaced||0)+wetbedMoved;
 }
 if(eroding){
  row.sedimentMoved=sedimentMoved+wetbedMoved;
  e.totals.sedimentMoved=(e.totals.sedimentMoved||0)+sedimentMoved+wetbedMoved;
 }
 // Returning water from a shallow former flood to overland is an internal
 // physical transfer. A topology receipt records which exact cells receded.
 let recession=null;
 if(e.channelTopologyPolicy===PLANETARY_CHANNEL_TOPOLOGY.policy){
  const edits=planChannelRecession(w,day);
  if(edits.length){
   recession=w.setSurfaceWater(edits,{reason:'funded-seasonal-channel-recession'});
   const actual=w.environment,last=actual.lastDay;
   last.recededWater=(last.recededWater||0)+recession.recededWater;
   last.recededCells=(last.recededCells||0)+edits.length;
   actual.totals.recededWater=(actual.totals.recededWater||0)+recession.recededWater;
   actual.totals.recededCells=(actual.totals.recededCells||0)+edits.length;
  }
 }
 const inundation=floodFromRunoff(w,day);
 // The next day's runoff must use the new real elevation, not the previous
 // land's cached drainage graph. No new water topology is inferred here.
 if(eroding&&terrainDelta.size)deriveDrainage(w);
 return{received:captured,delivered,moved,edges,
  stored:sum(w.environment.overland),closure,inundation,recession};
}
