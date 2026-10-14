import {availableCourtshipMoves,courtshipCost,COURTSHIP_PERFORMANCE,COURTSHIP_MOVES,currentCourtshipMove} from '../reproduction/courtship-performance.js';
import {PARTS} from '../lineage/part-registry.js';
import {CFG} from '../sim/config.js';
export function courtshipView(sim,targetId){
 const actor=sim.player(),target=sim.animals.find(a=>a.id===targetId&&a.alive),queue=sim.reproduction.ritualQueue;
 const allowed=actor?availableCourtshipMoves(actor):[],active=actor?.courtshipPerformance?.partnerId===targetId?actor.courtshipPerformance:null;
 return{actor,target,queue:[...queue],active,move:active?currentCourtshipMove(sim,actor):null,
  busy:!!active||!!(actor?.intent==='mate'&&actor.target?.id===targetId),
  cost:actor?courtshipCost(actor,queue.length?queue:null):0,
  beatsPerMove:COURTSHIP_PERFORMANCE.beats*CFG.lifeStride,step:active?Math.min(active.sequence.length-1,Math.floor(Math.max(0,sim.tickCount-active.startedAt)/(COURTSHIP_PERFORMANCE.beats*CFG.lifeStride))):-1,
  availability:sim.reproduction.courtshipAvailability({targetId}),
  moves:['approach',...COURTSHIP_MOVES.filter(id=>allowed.includes(id))].map(id=>({id,label:id[0].toUpperCase()+id.slice(1),source:actor?.bodyPlan?.nodes.find(n=>PARTS[n.partId]?.actionCapabilities.includes(id))?.partId||null}))};
}
