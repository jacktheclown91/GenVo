import {inertiaEnabled,motionStateOf,accelerationLimit} from '../organisms/motion.js';
import {liquidContact} from '../lineage/ice-locomotion.js';
const clamp=v=>Math.max(-1,Math.min(1,v));

// Differential rowing follows committed angular/lateral acceleration, not a
// desired heading or a made-up swimming force. This history owns only artwork.
export class SwimMotionPresentation{
 constructor({maxStates=256}={}){this.maxStates=maxStates;this.states=new Map();this.world=null}
 sample(sim,a,time,{action='idle',moving=false,blocked=false}={}){
  if(this.world!==sim.world){this.states.clear();this.world=sim.world}
  if(!inertiaEnabled(sim)||!a?.alive||!a.bodyPlan||!a.motion||!moving||action!=='swim'||blocked||a.torpor||a.climb||a.burrowWork||a.caveTransit||!Number.isFinite(time)||!liquidContact(sim.world,a)){this.states.delete(a?.id);return null}
  const motion=motionStateOf(a);if(motion.speed<1e-6){this.states.delete(a.id);return null}
  const limit=accelerationLimit(a,{swimming:true});
  // turnRate * speed is the committed centripetal acceleration. Scaling by the
  // body's own shared swimming limit respects inherited size without a second
  // size or hydrodynamics model in the renderer.
  const target={steer:clamp(motion.turnRate*motion.speed/limit),
   brake:Math.max(0,clamp(-(motion.ax*motion.vx+motion.ay*motion.vy)/(motion.speed*limit)))};
  let state=this.states.get(a.id);
  if(!state&&Math.abs(target.steer)<.015&&target.brake<.015)return null;
  if(!state||state.plan!==a.bodyPlan||sim.tickCount<state.tick||time<state.time||time-state.time>1){
   if(this.states.size>=this.maxStates)this.states.delete(this.states.keys().next().value);
   state={plan:a.bodyPlan,tick:sim.tickCount,time,steer:target.steer,brake:target.brake};this.states.set(a.id,state);
  }
  if(!sim.paused){const blend=1-Math.exp(-Math.min(.1,Math.max(0,time-state.time))/.075);for(const k of ['steer','brake'])state[k]+=(target[k]-state[k])*blend;state.time=time;state.tick=sim.tickCount}
  state.seen=time;this.states.delete(a.id);this.states.set(a.id,state);
  const steer=a.player?state.steer:Math.round(state.steer*16)/16,brake=a.player?state.brake:Math.round(state.brake*16)/16;
  if(Math.abs(steer)<.015&&brake<.015){this.states.delete(a.id);return null}
  return{steer,brake,cacheToken:Math.round(steer*16)+','+Math.round(brake*16)};
 }
 prune(time){for(const [id,state] of this.states)if(time-state.seen>2.5)this.states.delete(id)}
}
export function applySwimMotion(behavior,pose){
 if(!pose)return;
 behavior.swimSteer=pose.steer;behavior.swimBrake=pose.brake;
 behavior.torsoTwist=(behavior.torsoTwist||0)+pose.steer*.45;
 behavior.dorsalRoll=(behavior.dorsalRoll||0)+pose.steer*.18;
 behavior.tailSweep=(behavior.tailSweep||0)-pose.steer*.65;
 behavior.bodyLean=(behavior.bodyLean||0)-pose.brake*.35;
}
