import {CFG} from '../sim/config.js';
const CALM=new Set(['idle','player','rest','social','group','guard','follow','explore','feed','forage','herd-rest','herd-browse','den-rest']);
const surface=a=>a?.alive&&!a.airborne&&!a.perched&&!a.underground&&!a.climb&&!a.burrowWork&&!a.caveTransit&&!(a.diveDepth>.03)&&!a.torpor;
export function birthSettlementReading(sim,a){
 if(!surface(a)||a.bracing||a.attackAction||a.courtshipPerformance||!CALM.has(a.intent||'idle'))return null;
 const tick=sim?.tickCount;if(!Number.isInteger(tick))return null;
 for(const event of sim.family?.events||[]){if(event.type!=='birth'||!Number.isInteger(event.tick)||tick<event.tick||tick-event.tick>=CFG.simHz*2.2)continue;const parent=event.motherId===a.id,childRole=event.animalId===a.id;if(!parent&&!childRole)continue;
  const child=sim.animals?.find(c=>c.id===event.animalId);if(!child?.alive||child.birthTick!==event.tick||child.hatchedFromEggId!=null||!child.parentIds?.includes(event.motherId)||sim.animals.find(c=>c.id===a.id)!==a)continue;
  return{event,tick:event.tick,childId:child.id,role:parent?'parent':'newborn',duration:parent?1.8:2.2,age:(tick-event.tick)/CFG.simHz};
 }return null;
}
export class BirthSettlementPresentation{
 constructor(){this.worlds=new WeakMap()}
 sample(sim,a,time,{moving=false,blocked=false}={}){if(!sim?.world||!a)return null;let actors=this.worlds.get(sim.world);if(!actors){actors=new WeakMap();this.worlds.set(sim.world,actors)}let e=actors.get(a);if(moving||blocked){if(e?.active)e.interrupted=true;return null}const r=birthSettlementReading(sim,a);if(!r)return null;
  if(!e||e.event!==r.event){e={event:r.event,started:time,initialAge:r.age,active:false,interrupted:false};actors.set(a,e)}if(e.interrupted)return null;const elapsed=Math.max(r.age,e.initialAge+Math.max(0,time-e.started));if(!Number.isFinite(elapsed)||elapsed>=r.duration)return null;e.active=true;const progress=elapsed/r.duration,fade=1-progress,pulse=Math.sin(Math.PI*progress);
  return{role:r.role,progress,childId:r.childId,bodyDrop:r.role==='parent'?.85*pulse:.42*fade,stanceSpread:r.role==='parent'?.7*pulse:.55*fade,compress:r.role==='parent'?.14*pulse:.12*fade,headDrop:r.role==='parent'?.35*pulse:.38*fade,bodyLean:r.role==='parent'?-.3*pulse:0,headReach:r.role==='newborn'?.25*pulse:0,feelerForward:.78+.22*progress};
 }
}
export function applyBirthSettlement(behavior,pose){if(!pose)return behavior;for(const k of ['bodyDrop','stanceSpread','compress','headDrop','bodyLean','headReach'])behavior[k]=(behavior[k]||0)+pose[k];behavior.feelerForward=Math.min(behavior.feelerForward??1,pose.feelerForward);behavior.relaxed=true;return behavior}
