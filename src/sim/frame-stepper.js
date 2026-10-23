// Runtime pacing only. Every admitted control step and ecology tick runs in order.
// A control step is atomic. An ecology tick may be resumable (day-boundary
// slicing): ecologyStep(deadline) returns false when the tick paused at the
// frame deadline, and resume(deadline) continues it first on following frames.
// Nothing else steps while it is pending, so control steps and ticks keep the
// exact unsliced order; frame time still accumulates and is caught up after.
export class FrameStepper{
  constructor({controlHz,simHz,budgetMs=12,sliceMs=24,clock=()=>performance.now()}={}){
    this.controlHz=controlHz;this.ratio=Math.max(1,Math.round(controlHz/simHz));
    this.stepSeconds=1/controlHz;this.budgetMs=budgetMs;this.sliceMs=sliceMs;this.clock=clock;this.reset();
  }
  reset(){this.pendingSeconds=0;this.substep=0;this.tickPending=false;this.last={steps:0,pendingSeconds:0,budgetLimited:false,tickPending:false,workMs:0}}
  advance(seconds,speed,controlStep,ecologyStep,{paused=false,beforeStep=()=>true,resume=null}={}){
    if(!Number.isFinite(seconds)||seconds<0||!Number.isFinite(speed)||speed<=0)throw new Error('Invalid frame time');
    const start=this.clock();let steps=0,regionalWork=false;
    if(!paused)this.pendingSeconds+=seconds*speed;
    // A started tick always completes before anything else, even while paused.
    if(this.tickPending)this.tickPending=resume?resume(start+this.sliceMs)===false:false;
    if(!paused&&!this.tickPending){
      while(this.pendingSeconds>=this.stepSeconds){
        if(steps&&this.clock()-start>=this.budgetMs)break;
        if(!beforeStep()){regionalWork=true;break;}
        controlStep(this.controlHz);this.substep++;
        let complete=true;
        if(this.substep>=this.ratio){complete=ecologyStep(start+Math.max(this.sliceMs,this.clock()-start+1))!==false;this.substep=0}
        this.pendingSeconds-=this.stepSeconds;steps++;
        if(!complete){this.tickPending=true;break}
      }
    }
    return this.last={steps,pendingSeconds:this.pendingSeconds,regionalWork,tickPending:this.tickPending,
      budgetLimited:!paused&&!this.tickPending&&this.pendingSeconds>=this.stepSeconds,workMs:this.clock()-start};
  }
  get presentationAhead(){return Math.min(this.pendingSeconds,this.stepSeconds)}
}
