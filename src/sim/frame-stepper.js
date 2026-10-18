// Runtime pacing only. Every admitted control step and ecology tick runs in order.
// A single step is atomic: the budget cannot interrupt an expensive simulation tick.
export class FrameStepper{
  constructor({controlHz,simHz,budgetMs=12,clock=()=>performance.now()}={}){
    this.controlHz=controlHz;this.ratio=Math.max(1,Math.round(controlHz/simHz));
    this.stepSeconds=1/controlHz;this.budgetMs=budgetMs;this.clock=clock;this.reset();
  }
  reset(){this.pendingSeconds=0;this.substep=0;this.last={steps:0,pendingSeconds:0,budgetLimited:false,workMs:0}}
  advance(seconds,speed,controlStep,ecologyStep,{paused=false}={}){
    if(!Number.isFinite(seconds)||seconds<0||!Number.isFinite(speed)||speed<=0)throw new Error('Invalid frame time');
    const start=this.clock();let steps=0;
    if(!paused){
      this.pendingSeconds+=seconds*speed;
      while(this.pendingSeconds>=this.stepSeconds){
        if(steps&&this.clock()-start>=this.budgetMs)break;
        controlStep(this.controlHz);this.substep++;
        if(this.substep>=this.ratio){ecologyStep();this.substep=0}
        this.pendingSeconds-=this.stepSeconds;steps++;
      }
    }
    return this.last={steps,pendingSeconds:this.pendingSeconds,
      budgetLimited:!paused&&this.pendingSeconds>=this.stepSeconds,workMs:this.clock()-start};
  }
  get presentationAhead(){return Math.min(this.pendingSeconds,this.stepSeconds)}
}
