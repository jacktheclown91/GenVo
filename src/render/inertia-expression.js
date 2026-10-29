import {inertiaEnabled,motionStateOf,REFERENCE_ACCELERATION} from '../organisms/motion.js';
import {locomotionStyle} from './locomotion-style.js';
const clamp=v=>Math.max(-1,Math.min(1,v)),fields=['lean','sway','twist','roll','tail','drop'];
const ACTIONS=new Set(['idle','rest','move','flee','forage','seek-water','prowl','hunt','stalk','escape']);
// Visual deformation from actual force and velocity. No inferred motion/steering,
// no invented acceleration, and no translation of an organism's world position.
export class InertiaExpression{
 constructor({maxStates=512}={}){this.maxStates=maxStates;this.states=new Map();this.world=null}
 sample(sim,a,time,{dir=a.dir||0,action='move',blocked=false}={}){
  if(this.world!==sim.world){this.states.clear();this.world=sim.world}
  if(!inertiaEnabled(sim)||!a.alive||blocked||a.torpor||a.airborne||a.perched||a.underground||a.climb||a.burrowWork||a.caveTransit||!ACTIONS.has(action)||!Number.isFinite(time)){this.states.delete(a.id);return null}
  let state=this.states.get(a.id);if(!a.motion&&!state)return null;
  const m=motionStateOf(a);if(m.acceleration<1e-9&&!state)return null;
  const angle=(dir-2)*Math.PI/4,fx=Math.cos(angle),fy=Math.sin(angle),perp={x:-fy,y:fx},style=locomotionStyle(a),flex=1+(style?.runner||0)*.2-(style?.sturdy||0)*.2;
  const fore=clamp((m.ax*fx+m.ay*fy)/REFERENCE_ACCELERATION),side=clamp((m.ax*perp.x+m.ay*perp.y)/REFERENCE_ACCELERATION);
  const target={lean:fore*.9*flex,sway:side*.6*flex,twist:-side*.45,roll:side*.3,tail:-side*.5,drop:m.braking?Math.min(.35,m.acceleration/REFERENCE_ACCELERATION*.25):0};
  if(!state||state.plan!==a.bodyPlan||time<state.time||time-state.time>1){if(this.states.size>=this.maxStates)this.states.delete(this.states.keys().next().value);state={plan:a.bodyPlan,time,values:{...target}};this.states.set(a.id,state)}
  if(!sim.paused){const blend=1-Math.exp(-Math.min(.1,Math.max(0,time-state.time))/.075);for(const field of fields)state.values[field]+=(target[field]-state.values[field])*blend;state.time=time}
  state.seen=time;this.states.delete(a.id);this.states.set(a.id,state);
  const values=Object.fromEntries(fields.map(k=>[k,a.player?state.values[k]:Math.round(state.values[k]*16)/16]));
  if(fields.every(k=>Math.abs(values[k])<.015)){this.states.delete(a.id);return null;}
  return{...values,cacheToken:fields.map(k=>Math.round(values[k]*16)).join(',')};
 }
 prune(time){for(const [id,s] of this.states)if(time-s.seen>2.5)this.states.delete(id)}
}
export function applyInertiaExpression(behavior,pose){
 if(!pose)return;behavior.bodyLean=(behavior.bodyLean||0)+pose.lean;behavior.bodySway=(behavior.bodySway||0)+pose.sway;behavior.torsoTwist=(behavior.torsoTwist||0)+pose.twist;behavior.dorsalRoll=(behavior.dorsalRoll||0)+pose.roll;behavior.tailSweep=(behavior.tailSweep||0)+pose.tail;behavior.bodyDrop=(behavior.bodyDrop||0)+pose.drop;
}
