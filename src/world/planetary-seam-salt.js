// Genuine paired dissolved-salt transport between two independently owned
// planetary Worlds at the SAME completed biological day. Every source debit
// has a recipient credit. The outer geography reservoir is a separate,
// explicitly accounted boundary condition, not the other World's stock.
import {CFG} from '../sim/config.js';
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
    !finite(row.aToB)||!finite(row.bToA)||row.aToB+row.bToA<=0||
    row.tick<previousTick||row.tick===previousTick&&row.a+'|'+row.b<=previousPair)
   throw Error('Invalid paired planetary seam receipt.');
  previousTick=row.tick;previousPair=row.a+'|'+row.b;
 }
}
function regionOf(sim,session){
 const w=session?.snapshot?.world;
 if(!w?.environment||!(w.surfaceWater?.mask instanceof Uint8Array))return null;
 return{key:session.key,origin:w.regionOrigin,water:w.surfaceWater.mask,env:w.environment,session};
}
function ownedActive(sim){
 return{key:regionKey(sim.world.regionOrigin),origin:sim.world.regionOrigin,
 water:sim.world.water,env:sim.world.environment,session:null};
}
function validRegion(r,day){
 const e=r.env;
 return !!r.origin&&r.water?.length===128*128&&e?.schema===2&&
  e.salt instanceof Float64Array&&e.salt.length===128*128&&
  e.depth instanceof Float32Array&&e.depth.length===128*128&&
  e.boundary instanceof Uint8Array&&e.boundary.length===128*128&&
  e.day===day&&e.lastDay?.day===day&&e.daily?.at(-1)?.day===day;
}
function boundedFlux(source,target,i,j){
 const a=source.env,b=target.env;
 if(!source.water[i]||!target.water[j]||!a.boundary[i]||!b.boundary[j])return 0;
 const ai=a.salt[i]/a.depth[i],bj=b.salt[j]/b.depth[j];
 // Use old-day stocks for every decision. A source's maximum available salt
 // is enforced separately while staging transfers across all four seams.
 const difference=ai-bj;
 return Number.isFinite(difference)?difference*Math.min(a.depth[i],b.depth[j])*
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
 const capacity=to.env.depth[ti]*2-to.env.salt[ti]-(changes.get(to.key).get(ti)||0);
 const amount=Math.min(Math.abs(proposal),Math.max(0,available*.25),Math.max(0,capacity));
 if(amount<=0)return;
 changes.get(from.key).set(fi,debit-amount);
 changes.get(to.key).set(ti,(changes.get(to.key).get(ti)||0)+amount);
 if(proposal>0)pair.aToB+=amount;else pair.bToA+=amount;
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
 const receipts=new Map();
 for(let a=0;a<regions.length;a++)for(let b=a+1;b<regions.length;b++){
  const left=regions[a],right=regions[b],direction=adjacent(left.origin,right.origin);
  if(!direction)continue;
  for(const [i,j] of seams(left,right,direction)){
   const transfer=boundedFlux(left,right,i,j);
   if(transfer)stageTransfer(left,right,i,j,transfer,changes,receipts,day,sim.tickCount);
  }
 }
 const entries=[...receipts.values()].filter(r=>r.aToB+r.bToA>0);
 // Verify every staged quantity, closure and archived last-day receipt
 // BEFORE editing any independently owned World or snapshot.
 const sums=new Map();
 for(const r of regions){
  const amounts=changes.get(r.key),{incoming,outgoing}=summarize(entries,r);
  for(const [i,delta] of amounts){
   const final=r.env.salt[i]+delta;
   if(!Number.isFinite(final)||final<-1e-12||final>r.env.depth[i]*2+1e-10)
    throw Error('Invalid cross-region salt stock.');
  }
  const row=r.env.lastDay;
  if(!finite(row.before)||!finite(row.after)||!finite(row.input)||!finite(row.output)||
    !finite(r.env.totals.saltInput)||!finite(r.env.totals.saltOutput))
   throw Error('Invalid cross-region salt conservation origin.');
  sums.set(r.key,{incoming,outgoing});
 }
 const nextHistory=[...(travel.seamLedger?.history||[]),...entries]
  .slice(-PLANETARY_SEAM_SALT.historyLimit);
 const nextLedger={schema:1,lastTick:sim.tickCount,history:nextHistory};
 validatePlanetarySeamLedger(nextLedger);
 for(const r of regions){
  const {incoming,outgoing}=sums.get(r.key),e=r.env;
  for(const [i,delta] of changes.get(r.key))e.salt[i]+=delta;
  if(!incoming&&!outgoing)continue;
  e.totals.saltInput+=incoming;e.totals.saltOutput+=outgoing;
  e.totals.pairedInput=(e.totals.pairedInput||0)+incoming;
  e.totals.pairedOutput=(e.totals.pairedOutput||0)+outgoing;
  const row=e.lastDay;
  const update=record=>{
   record.input+=incoming;record.output+=outgoing;
   record.after+=incoming-outgoing;
   record.pairedInput=(record.pairedInput||0)+incoming;
   record.pairedOutput=(record.pairedOutput||0)+outgoing;
   record.closure=record.input-record.output-(record.after-record.before);
  };
  update(row);
  if(e.daily.at(-1)!==row)update(e.daily.at(-1));
  if(r.session?.environmentalLedger){
   r.session.environmentalLedger.saltInput+=incoming;
   r.session.environmentalLedger.saltOutput+=outgoing;
  }
 }
 travel.seamLedger=nextLedger;
 return entries;
}
