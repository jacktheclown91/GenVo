// Genuine paired dissolved-salt transport between two independently owned
// planetary Worlds at the SAME completed biological day. Every source debit
// has a recipient credit. The outer geography reservoir is a separate,
// explicitly accounted boundary condition, not the other World's stock.
import {CFG} from '../sim/config.js';
import {PLANETARY_BOUNDARY_WATER,validateBoundaryWaterPolicy} from './planetary-boundary-water.js';
import {regionKey} from './planet-regions.js';
import {REGIONAL_REPLAY,remoteBiologicalDebt} from './planetary-offscreen-biology.js';

export const PLANETARY_SEAM_SALT=Object.freeze({schema:1,dailyFraction:.08,historyLimit:64});
const valid=n=>Number.isSafeInteger(n)&&n>=0;
const finite=n=>Number.isFinite(n)&&n>=0;
const origin=w=>w?.regionOrigin;
const adjacent=(a,b)=>{
 const dx=b.x-a.x,dy=b.y-a.y,n=128;
 if(dx===n&&dy===0)return'east';
 if(dx===-n&&dy===0)return'west';
 if(dy===n&&dx===0)return'south';
 if(dy===-n&&dx===0)return'north';
 return null;
};
function seams(a,b,direction){
 const n=128,edges=[];
 for(let k=0;k<n;k++){
  let i,j;
  if(direction==='east'){i=k*n+n-1;j=k*n;}
  else if(direction==='west'){i=k*n;j=k*n+n-1;}
  else if(direction==='south'){i=(n-1)*n+k;j=k;}
  else{i=k;j=(n-1)*n+k;}
  edges.push([i,j]);
 }
 return edges;
}
export function validatePlanetarySeamLedger(state){
 if(state===undefined)return;
 if(state?.schema!==1||!valid(state.lastTick)||!Array.isArray(state.history)||
    state.history.length>PLANETARY_SEAM_SALT.historyLimit)
  throw Error('Invalid paired planetary seam ledger.');
 let previousTick=-1,previousPair='';
 for(const row of state.history){
  if(!valid(row.tick)||row.tick>state.lastTick||!valid(row.day)||row.day<1||
    typeof row.a!=='string'||typeof row.b!=='string'||row.a>=row.b||
    !finite(row.aToB)||!finite(row.bToA)||
    (row.waterAToB!==undefined&&!finite(row.waterAToB))||
    (row.waterBToA!==undefined&&!finite(row.waterBToA))||
    row.aToB+row.bToA+(row.waterAToB||0)+(row.waterBToA||0)<=0||
    row.tick<previousTick||row.tick===previousTick&&row.a+'|'+row.b<=previousPair)
   throw Error('Invalid paired planetary seam receipt.');
  previousTick=row.tick;previousPair=row.a+'|'+row.b;
 }
}
function regionOf(sim,session){
 const w=session?.snapshot?.world;
 if(!w?.environment||!(w.surfaceWater?.mask instanceof Uint8Array))return null;
 return{key:session.key,origin:w.regionOrigin,water:w.surfaceWater.mask,env:w.environment,terrain:w.terrain,session};
}
function ownedActive(sim){
 return{key:regionKey(sim.world.regionOrigin),origin:sim.world.regionOrigin,
 water:sim.world.water,env:sim.world.environment,terrain:sim.world.terrain,session:null};
}
// Assign one source of water for each known, wet inter-region edge. New
// policy/2 worlds exchange across their shared simulated border instead of
// ALSO replacing the same water with the immutable outside geography.
 // Existing policy/1 archives and regions not advancing biological ticks
// retain their historical independent geography boundary behavior.
export function syncPlanetaryBoundaryOwnership(sim){
 if(!sim?.world?.planet||!sim.planetaryTravel)return{pairedCells:0,regions:0};
 const regions=[ownedActive(sim),...(sim.planetaryTravel.sessions||[])
  .filter(session=>session.biologicalMode==='canonical-ticks/1')
  .map(session=>regionOf(sim,session)).filter(Boolean)];
 const claimed=new Map(),expected=PLANETARY_BOUNDARY_WATER.pairedPolicy;
 for(const r of regions)if(r.env?.boundaryWaterPolicy===expected){
  validateBoundaryWaterPolicy({generator:'planetary/1',n:128,len:128*128},r.env);
  claimed.set(r.key,new Uint8Array(128*128));
 }
 let cells=0;
 if(sim.regionalReplayPolicy===REGIONAL_REPLAY.synchronized){
  for(let a=0;a<regions.length;a++)for(let b=a+1;b<regions.length;b++){
   const left=regions[a],right=regions[b],dir=adjacent(left.origin,right.origin);
   if(!dir||!claimed.has(left.key)||!claimed.has(right.key))continue;
   const lhs=claimed.get(left.key),rhs=claimed.get(right.key);
   const bits=dir==='east'?[2,1]:dir==='west'?[1,2]:dir==='south'?[8,4]:[4,8];
   for(const [i,j] of seams(left,right,dir)){
    if(!left.water[i]||!right.water[j]||!left.env.boundary[i]||!right.env.boundary[j])continue;
    if(!lhs[i])cells++;
    if(!rhs[j])cells++;
    lhs[i]|=bits[0];rhs[j]|=bits[1];
   }
  }
 }
 // Prepared masks are published only once all authoritative regions have
 // passed validation. Session snapshots are copy-on-write so a completed
 // travel does not mutate a previous simulation's archived checkpoint.
 for(const r of regions){
  const mask=claimed.get(r.key);
  if(!mask)continue;
  const current=r.env.blockedBoundaries;
  if(current.length===mask.length&&current.every((v,i)=>v===mask[i]))continue;
  if(r.session){
   const snap=r.session.snapshot;
   r.session.snapshot={...snap,world:{...snap.world,
    environment:{...r.env,blockedBoundaries:mask}}};
  }else r.env.blockedBoundaries=mask;
 }
 return{pairedCells:cells,regions:claimed.size};
}

function validRegion(r,day){
 const e=r.env;
 return !!r.origin&&r.water?.length===128*128&&(e?.schema>=2&&e?.schema<=6)&&
  e.salt instanceof Float64Array&&e.salt.length===128*128&&
  (e.schema<3||(e.volume instanceof Float64Array&&e.volume.length===128*128))&&
  e.depth instanceof Float32Array&&e.depth.length===128*128&&
  e.boundary instanceof Uint8Array&&e.boundary.length===128*128&&
  e.day===day&&e.lastDay?.day===day&&e.daily?.at(-1)?.day===day;
}
function boundedFlux(source,target,i,j){
 const a=source.env,b=target.env;
 if(!source.water[i]||!target.water[j]||!a.boundary[i]||!b.boundary[j])return 0;
 const ai=a.salt[i]/(a.schema>=3?a.volume[i]:a.depth[i]),
  bj=b.salt[j]/(b.schema>=3?b.volume[j]:b.depth[j]);
 // Use old-day stocks for every decision. A source's maximum available salt
 // is enforced separately while staging transfers across all four seams.
 const difference=ai-bj;
 return Number.isFinite(difference)?difference*Math.min(a.schema>=3?a.volume[i]:a.depth[i],b.schema>=3?b.volume[j]:b.depth[j])*
  PLANETARY_SEAM_SALT.dailyFraction:0;
}
function stageTransfer(owner,other,index,opposite,proposal,changes,receipts,day,tick){
 const key=owner.key+'|'+other.key;
 let pair=receipts.get(key);
 if(!pair){
  pair={tick,day,a:owner.key,b:other.key,aToB:0,bToA:0};
  receipts.set(key,pair);
 }
 if(proposal===0)return;
 // Sequentially bounded mass transfer across corner contacts, with no
 // stock duplication when one cell touches two distinct regions.
 const from=proposal>0?owner:other,to=proposal>0?other:owner;
 const fi=proposal>0?index:opposite,ti=proposal>0?opposite:index;
 const debit=changes.get(from.key).get(fi)||0;
 const available=from.env.salt[fi]+debit;
 const capacity=(to.env.schema>=3?to.env.volume[ti]:to.env.depth[ti])*2-to.env.salt[ti]-(changes.get(to.key).get(ti)||0);
 const amount=Math.min(Math.abs(proposal),Math.max(0,available*.25),Math.max(0,capacity));
 if(amount<=0)return;
 changes.get(from.key).set(fi,debit-amount);
 changes.get(to.key).set(ti,(changes.get(to.key).get(ti)||0)+amount);
 if(proposal>0)pair.aToB+=amount;else pair.bToA+=amount;
}
// A second, advective flux moves real water, carrying its donor's dissolved
// salt along with it. This does not override the separate conservative salt
// diffusion. Only v3 physical Worlds own the new 64-bit volume inventories.
function stageWater(owner,other,i,j,saltChanges,waterChanges,pairs,day,tick){
 if(owner.env.schema<3||other.env.schema<3||!owner.terrain||!other.terrain)return;
 const ae=owner.env,be=other.env;
 const headA=owner.terrain.elevation[i]+ae.volume[i]+(waterChanges.get(owner.key).get(i)||0);
 const headB=other.terrain.elevation[j]+be.volume[j]+(waterChanges.get(other.key).get(j)||0);
 const proposed=(headA-headB)*.04;
 if(!Number.isFinite(proposed)||Math.abs(proposed)<1e-12)return;
 const from=proposed>0?owner:other,to=proposed>0?other:owner;
 const fi=proposed>0?i:j,ti=proposed>0?j:i;
 const fromDelta=waterChanges.get(from.key).get(fi)||0;
 const toDelta=waterChanges.get(to.key).get(ti)||0;
 const liveFrom=from.env.volume[fi]+fromDelta;
 const liveTo=to.env.volume[ti]+toDelta;
 // Permanent water topology remains wet: an exchange cannot dry a coast or
 // inundate a land tile. Topology edits have their own explicit receipt law.
 const minWet=.01;
 const amount=Math.min(Math.abs(proposed),liveFrom*.1,Math.max(0,liveFrom-minWet),
  Math.max(0,2-liveTo));
 if(amount<=1e-12)return;
 const fSalt=saltChanges.get(from.key).get(fi)||0;
 const tSalt=saltChanges.get(to.key).get(ti)||0;
 const liveSalt=from.env.salt[fi]+fSalt;
 const concentration=Math.max(0,liveSalt/liveFrom);
 const moveSalt=Math.min(amount*concentration,Math.max(0,liveSalt),
  Math.max(0,(liveTo+amount)*2-(to.env.salt[ti]+tSalt)));
 if(moveSalt<0||!Number.isFinite(moveSalt))throw Error('Invalid paired saline-water advection.');
 waterChanges.get(from.key).set(fi,fromDelta-amount);
 waterChanges.get(to.key).set(ti,toDelta+amount);
 saltChanges.get(from.key).set(fi,fSalt-moveSalt);
 saltChanges.get(to.key).set(ti,tSalt+moveSalt);
 const key=owner.key+'|'+other.key;
 let row=pairs.get(key);
 if(!row){row={tick,day,a:owner.key,b:other.key,aToB:0,bToA:0};pairs.set(key,row)}
 if(proposed>0){row.waterAToB=(row.waterAToB||0)+amount;row.aToB+=moveSalt;}
 else{row.waterBToA=(row.waterBToA||0)+amount;row.bToA+=moveSalt;}
}
function summarizeWater(receipts,region){
 let incoming=0,outgoing=0;
 for(const item of receipts){
  if(item.a===region.key){outgoing+=item.waterAToB||0;incoming+=item.waterBToA||0}
  else if(item.b===region.key){incoming+=item.waterAToB||0;outgoing+=item.waterBToA||0}
 }
 return{incoming,outgoing};
}
function summarize(receipts,region){
 let incoming=0,outgoing=0;
 for(const item of receipts){
  if(item.a===region.key){outgoing+=item.aToB;incoming+=item.bToA;}
  else if(item.b===region.key){incoming+=item.aToB;outgoing+=item.bToA;}
 }
 return{incoming,outgoing};
}
// Called immediately before the active clock begins another tick, after all
// synchronous canonical region jobs have finished. Transactional staging
// ensures malformed archives cannot cause a one-sided stock publication.
export function reconcilePlanetarySaltSeams(sim){
 if(!sim?.world?.planet||sim.regionalReplayPolicy!==REGIONAL_REPLAY.synchronized||
    sim.tickCount<=0||sim.tickCount%CFG.dayTicks!==0||
    !sim.planetaryTravel?.sessions?.length)return[];
 const travel=sim.planetaryTravel,day=sim.day-1;
 validatePlanetarySeamLedger(travel.seamLedger);
 if(travel.seamLedger?.lastTick===sim.tickCount)return[];
 if(travel.seamLedger&&travel.seamLedger.lastTick>sim.tickCount)
  throw Error('Planetary seam ledger is ahead of the biological clock.');
 const regions=[ownedActive(sim)];
 for(const session of travel.sessions){
  if(session.biologicalMode!=='canonical-ticks/1'||remoteBiologicalDebt(sim,session)!==0)return[];
  const region=regionOf(sim,session);if(!region)return[];
  regions.push(region);
 }
 if(regions.some(r=>!validRegion(r,day)))return[];
 regions.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
 const changes=new Map(regions.map(r=>[r.key,new Map()]));
 const waterChanges=new Map(regions.map(r=>[r.key,new Map()]));
 const receipts=new Map();
 for(let a=0;a<regions.length;a++)for(let b=a+1;b<regions.length;b++){
  const left=regions[a],right=regions[b],direction=adjacent(left.origin,right.origin);
  if(!direction)continue;
  const bits=direction==='east'?[2,1]:direction==='west'?[1,2]:direction==='south'?[8,4]:[4,8];
  for(const [i,j] of seams(left,right,direction)){
   if(left.env.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.pairedPolicy&&
      right.env.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.pairedPolicy&&
      left.water[i]&&right.water[j]&&left.env.boundary[i]&&right.env.boundary[j]&&
      (!(left.env.blockedBoundaries[i]&bits[0])||!(right.env.blockedBoundaries[j]&bits[1])))
    throw Error('Unsynchronized planetary seam water ownership.');
   const transfer=boundedFlux(left,right,i,j);
   if(transfer)stageTransfer(left,right,i,j,transfer,changes,receipts,day,sim.tickCount);
   if(left.water[i]&&right.water[j]&&left.env.boundary[i]&&right.env.boundary[j])
    stageWater(left,right,i,j,changes,waterChanges,receipts,day,sim.tickCount);
  }
 }
 const entries=[...receipts.values()].filter(r=>r.aToB+r.bToA+(r.waterAToB||0)+(r.waterBToA||0)>0);
 // Verify every staged quantity, closure and archived last-day receipt
 // BEFORE editing any independently owned World or snapshot.
 const sums=new Map();
 for(const r of regions){
  const amounts=changes.get(r.key),{incoming,outgoing}=summarize(entries,r),
   water=summarizeWater(entries,r);
  for(const [i,delta] of amounts){
   const final=r.env.salt[i]+delta;
   const dynamic=r.env.schema>=3?r.env.volume[i]+(waterChanges.get(r.key).get(i)||0):r.env.depth[i];
   if(!Number.isFinite(final)||final<-1e-12||final>dynamic*2+1e-10)
    throw Error('Invalid cross-region salt stock.');
  }
  for(const [i,delta] of waterChanges.get(r.key)){
   const final=r.env.volume?.[i]+delta;
   if(!Number.isFinite(final)||final<=0||final>2+1e-10)
    throw Error('Invalid cross-region water stock.');
  }
  const row=r.env.lastDay;
  if(!finite(row.before)||!finite(row.after)||!finite(row.input)||!finite(row.output)||
    !finite(r.env.totals.saltInput)||!finite(r.env.totals.saltOutput))
   throw Error('Invalid cross-region salt conservation origin.');
  sums.set(r.key,{incoming,outgoing,water});
 }
 const nextHistory=[...(travel.seamLedger?.history||[]),...entries]
  .slice(-PLANETARY_SEAM_SALT.historyLimit);
 const nextLedger={schema:1,lastTick:sim.tickCount,history:nextHistory};
 validatePlanetarySeamLedger(nextLedger);
 for(const r of regions){
  const {incoming,outgoing,water}=sums.get(r.key),e=r.env;
  for(const [i,delta] of changes.get(r.key))e.salt[i]+=delta;
  for(const [i,delta] of waterChanges.get(r.key))e.volume[i]+=delta;
  if(!incoming&&!outgoing&&!water.incoming&&!water.outgoing)continue;
  e.totals.saltInput+=incoming;e.totals.saltOutput+=outgoing;
  e.totals.pairedInput=(e.totals.pairedInput||0)+incoming;
  e.totals.pairedOutput=(e.totals.pairedOutput||0)+outgoing;
  if(e.schema>=3){
   e.totals.pairedWaterInput=(e.totals.pairedWaterInput||0)+water.incoming;
   e.totals.pairedWaterOutput=(e.totals.pairedWaterOutput||0)+water.outgoing;
  }
  const row=e.lastDay;
  const update=record=>{
   record.input+=incoming;record.output+=outgoing;
   record.after+=incoming-outgoing;
   record.pairedInput=(record.pairedInput||0)+incoming;
   record.pairedOutput=(record.pairedOutput||0)+outgoing;
   record.closure=record.input-record.output-(record.after-record.before);
   if(e.schema>=3){
    record.waterInput+=water.incoming;record.waterOutput+=water.outgoing;
    record.waterAfter+=water.incoming-water.outgoing;
    record.waterClosure=record.waterInput-record.waterOutput-(record.waterAfter-record.waterBefore);
   }
  };
  update(row);
  if(e.daily.at(-1)!==row)update(e.daily.at(-1));
  if(r.session?.environmentalLedger){
   r.session.environmentalLedger.saltInput+=incoming;
   r.session.environmentalLedger.saltOutput+=outgoing;
  }
  // The active World uses derived hydrological connectivity for drinkability
  // and shore behavior. Archived Worlds rebuild that view on restoration.
  if(!r.session)sim.world.buildHydrology?.();
 }
 travel.seamLedger=nextLedger;
 return entries;
}
