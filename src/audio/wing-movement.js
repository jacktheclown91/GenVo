import {winged} from '../lineage/flight.js';
import {aerialCycle} from '../render/aerial-presentation.js';
import {acousticDimensions} from './movement-contact.js';
// Follow a power stroke in the existing painted cycle, never invent an aerial action.
export class WingMovementTracker{
 constructor(){this.clear()}
 clear(){this.world=null;this.listener=null;this.lastTime=null;this.states=new Map()}
 sample(sim,time){
  const p=sim?.player?.();if(!p||sim.paused||p.underground||(p.diveDepth||0)>.03||!Number.isFinite(time)){this.clear();return[]}
  if(this.world!==sim.world||this.listener!==p.id||this.lastTime!==null&&(time<this.lastTime||time-this.lastTime>1)){this.clear();this.world=sim.world;this.listener=p.id}
  if(this.lastTime!==null&&time-this.lastTime<.04)return[];this.lastTime=time;
  const near=[];
  for(const a of sim.animals||[]){if(!a.alive||!a.airborne||a.aerialMode||a.hidden||a.perched||a.underground||a.climb||a.caveTransit||a.burrowWork||!winged(a))continue;const distance=Math.hypot(a.x-p.x,a.y-p.y);if(distance<10)near.push({animal:a,distance})}
  near.sort((a,b)=>a.distance-b.distance);near.length=Math.min(6,near.length);const next=new Map(),beats=[];
  for(const {animal:a} of near){const stroke=Math.floor((aerialCycle(a.id,time)-1.6)/8),old=this.states.get(a.id);next.set(a.id,{stroke,anatomy:a.bodyPlan});if(old&&old.anatomy===a.bodyPlan&&stroke>old.stroke)beats.push({animal:a,acoustic:acousticDimensions(a)})}
  this.states=next;return beats.slice(0,2);
 }
}
