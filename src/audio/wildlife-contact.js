import {movementContact} from './movement-contact.js';
// Ephemeral listening history only: no biological footsteps or movement authority.
export class WildlifeContactTracker{
 constructor(){this.clear()}
 clear(){this.world=null;this.listener=null;this.clock=0;this.states=new Map()}
 sample(sim,dt){
  const p=sim?.player?.();if(!p||sim.paused||(p.diveDepth||0)>.03){this.clear();return[]}
  if(this.world!==sim.world||this.listener!==p.id){this.clear();this.world=sim.world;this.listener=p.id}
  this.clock+=Math.max(0,Math.min(.25,dt||0));if(this.clock<.12)return[];this.clock=0;
  const nearby=[];
  for(const a of sim.animals||[]){if(!a.alive||a.id===p.id||a.torpor||a.hidden||a.airborne||a.perched||a.climb||a.burrowWork||a.caveTransit||(a.diveDepth||0)>.03||!!a.underground!==!!p.underground)continue;const distance=Math.hypot(a.x-p.x,a.y-p.y);if(distance<8)nearby.push({a,distance})}
  nearby.sort((a,b)=>a.distance-b.distance);nearby.length=Math.min(12,nearby.length);
  const next=new Map(),ready=[];
  for(const {a,distance} of nearby){const old=this.states.get(a.id),state={x:a.x,y:a.y,travel:old?.travel||0};next.set(a.id,state);if(!old)continue;const travelled=Math.hypot(a.x-old.x,a.y-old.y);if(!Number.isFinite(travelled)||travelled>2){state.travel=0;continue}if(travelled<1e-6)continue;
   const contact=movementContact(sim.world,a),sprint=a.intent==='flee',spacing=(sprint?.65:.5)*contact.spacing;state.travel+=travelled;if(state.travel>=spacing){state.travel%=spacing;ready.push({animal:a,contact,sprint,distance})}
  }
  this.states=next;
  // Drop excess simultaneous contacts instead of queuing a herd's stale steps.
  return ready.slice(0,1);
 }
}
