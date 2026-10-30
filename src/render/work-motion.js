// Display-only interpolation of observed climb/work progress. Never extrapolate
// beyond the controller's latest value, write to actors, or create work events.
import {CLIMBING} from '../lineage/climbing.js';
export const CLIMB_PIXEL_HEIGHT=7/CLIMBING.height;
export class WorkMotionPresentation{
  constructor({maxStates=512}={}){this.states=new Map();this.world=null;this.maxStates=maxStates;}
  sample(sim,a,time=0){
    if(this.world!==sim.world){this.states.clear();this.world=sim.world;}
    const kind=a.climb?'climb':a.burrowWork?'dig':a.perched&&!a.airborne?'perch':null;
    if(!kind||a.alive===false||a.airborne||a.caveTransit){this.states.delete(a.id);return null;}
    const job=a.climb||a.burrowWork,value=kind==='climb'?job.height:kind==='dig'?job.elapsed:CLIMBING.height;
    if(!Number.isFinite(value)){this.states.delete(a.id);return null;}
    let state=this.states.get(a.id);
    const signature=kind==='dig'?job.i+'|'+job.entry:kind;
    if(!state||state.signature!==signature||state.anatomy!==a.bodyPlan?.id||time<state.seen||time-state.seen>1||(kind==='dig'&&value<state.to)){
      if(this.states.size>=this.maxStates)this.states.delete(this.states.keys().next().value);
      state={signature,anatomy:a.bodyPlan?.id,from:value,to:value,start:time,seen:time};this.states.set(a.id,state);
    }
    const resolve=()=>state.from+(state.to-state.from)*Math.max(0,Math.min(1,(time-state.start)/.08));
    const current=resolve();
    if(value!==state.to){state.from=current;state.to=value;state.start=time;}
    state.seen=time;this.states.delete(a.id);this.states.set(a.id,state);
    const displayed=resolve();
    return kind==='dig'?{kind,elapsed:displayed}:{kind,height:displayed,holding:kind==='perch',descending:kind==='climb'&&job.target<job.height};
  }
  prune(time){for(const [id,state] of this.states)if(time-state.seen>2.5)this.states.delete(id);}
}
export function applyWorkMotion(behavior,work){
  if(!work)return;
  if(work.kind==='dig'){
    behavior.excavationElapsed=work.elapsed;
    const pull=Math.max(0,Math.sin(work.elapsed*1.6*Math.PI*2));
    behavior.bodyLean+=pull*.3;behavior.bodyDrop+=pull*.16;behavior.headDrop+=pull*.18;
  }else{
    behavior.climbHeight=work.height;behavior.climbHold=work.holding;
    behavior.bodyLean+=work.descending?-.08:.16;behavior.groundEmphasis=0;
  }
}
