// D3 real faunal lifecycle work: every living actor is visited once in its
// existing canonical Simulation.animals order, attributed to one World page.
// Page placement is a scheduling receipt, NOT independent animal storage.
// Preserve actor order because mortality RNG, incubation, and live births depend
// on it. Newborns created during the pass wait for the following lifecycle step.
import {WORLD_PAGE_SIZE} from '../world/pages.js';
import {noteFaunaPageOwner} from './page-fauna-owners.js';
export const PAGE_FAUNA_WORK_SCHEMA=1;
const integer=n=>Number.isSafeInteger(n)&&n>=0;
function gridFor(w){
 if(!integer(w?.n)||!w.n||!integer(w.len)||w.len!==w.n*w.n)throw Error('Invalid fauna page geometry.');
 return Math.ceil(w.n/WORLD_PAGE_SIZE);
}
export function beginPageFaunaTick(sim){
 const grid=gridFor(sim.world),tick=sim.tickCount,prior=sim.pageFaunaWork;
 if(!integer(tick))throw Error('Invalid lifecycle tick.');
 if(prior!==undefined)validatePageFaunaWork(prior,sim.world);
 if(prior?.pendingTick!==null&&prior?.pendingTick!==undefined)throw Error('Incomplete fauna lifecycle: restore a pre-step checkpoint.');
 if(prior?.lastTick===tick)return false;
 if(prior&&prior.lastTick>tick)throw Error('Fauna lifecycle moved backwards.');
 sim.pageFaunaWork={schema:PAGE_FAUNA_WORK_SCHEMA,lastTick:prior?.lastTick??-1,
  pendingTick:tick,counts:prior?.counts||new Uint32Array(grid*grid),
  outside:prior?.outside??0,processed:prior?.processed??0};
 return true;
}
export function visitLivingFaunaByPage(sim,visitor){
 if(typeof visitor!=='function')throw Error('Fauna lifecycle requires a visitor.');
 const w=sim.world,n=w.n,grid=gridFor(w),counts=new Uint32Array(grid*grid),seen=new Set();
 let outside=0,processed=0;
 // The snapshot is the original live iteration boundary: hatching occurs before
 // it, and a birth inside a callback must not be processed again this tick.
 for(const animal of [...sim.animals]){
  if(!animal.alive)continue;
  const id=animal.id;
  if(!integer(id)||id===0||seen.has(id))throw Error('Duplicate or invalid living fauna identity.');
  seen.add(id);
  // Life processing is a real actor-authority boundary. Capture movements from
  // specialized hunters, scripted relocations and other non-player movers here
  // without a second full-population pass or a duplicate organism.
  const owner=noteFaunaPageOwner(sim,animal);
  const x=animal.x,y=animal.y;
  if(owner!==null){
   // A policy-owned exact boundary belongs to the last source page.
   const index=Math.min(grid-1,Math.floor(animal.y/WORLD_PAGE_SIZE))*grid+Math.min(grid-1,Math.floor(animal.x/WORLD_PAGE_SIZE));
   counts[index]++;
  }else outside++;
  processed++;
  visitor(animal);
 }
 return{counts,outside,processed};
}
export function completePageFaunaTick(sim,visit){
 const w=sim.world,prior=sim.pageFaunaWork,grid=gridFor(w);
 if(prior?.schema!==PAGE_FAUNA_WORK_SCHEMA||prior.pendingTick!==sim.tickCount||
    !(visit?.counts instanceof Uint32Array)||visit.counts.length!==grid*grid||
    !integer(visit.outside)||!integer(visit.processed))throw Error('Invalid fauna lifecycle completion.');
 const count=visit.counts.reduce((total,v)=>total+v,visit.outside);
 if(count!==visit.processed||!Number.isSafeInteger(count))throw Error('Fauna lifecycle did not account for every actor.');
 sim.pageFaunaWork={schema:PAGE_FAUNA_WORK_SCHEMA,lastTick:sim.tickCount,
  pendingTick:null,counts:visit.counts,outside:visit.outside,processed:visit.processed};
 return sim.pageFaunaWork;
}
export function validatePageFaunaWork(work,w){
 if(work===undefined)return;
 const grid=gridFor(w);
 if(work?.schema!==PAGE_FAUNA_WORK_SCHEMA||!Number.isSafeInteger(work.lastTick)||work.lastTick< -1||
    work.pendingTick!==null||!(work.counts instanceof Uint32Array)||work.counts.length!==grid*grid||
    !integer(work.outside)||!integer(work.processed))
  throw Error('Invalid saved fauna page work.');
 let total=work.outside;
 for(const count of work.counts)total+=count;
 if(!Number.isSafeInteger(total)||total!==work.processed)throw Error('Fauna lifecycle page counts do not reconcile.');
}
