// Presentation-only motion bridge. The ecology remains authoritative at 8 Hz;
// live player control can provide smaller 64 Hz authoritative position updates.
// This tracker eases toward whichever authoritative pose changed most recently
// without mutating animal state or consuming simulation RNG.

export class VisualMotionTracker{
  constructor({simHz=8}={}){this.stepMs=1000/Math.max(1,simHz);this.states=new Map()}
  sample(animal,tick,now=performance.now(),{hz=null,snap=false,response='smooth',gaitPerTile=4}={}){
    const nextStepMs=1000/Math.max(1,hz||1000/this.stepMs),nextResponse=response==='linear'?'linear':'smooth';let s=this.states.get(animal.id);
    if(!s){s={tick,x0:animal.x,y0:animal.y,x1:animal.x,y1:animal.y,f0:animal.anim||0,f1:animal.anim||0,start:now,phaseStart:now,phaseStepMs:nextStepMs,lastSeen:tick,stepMs:nextStepMs,response:nextResponse,gait:animal.anim||0,lastOutX:animal.x,lastOutY:animal.y,lastMoveAt:-Infinity,headingX:0,headingY:0};this.states.set(animal.id,s)}
    const positionChanged=Math.abs(s.x1-animal.x)>1e-9||Math.abs(s.y1-animal.y)>1e-9;
    const phaseChanged=Math.abs(s.f1-(animal.anim||0))>1e-9;
    const cur=resolve(s,now,s.stepMs,s.response);
    // A biology tick or an action-frame update is not a new movement target.
    // Keep planted travel continuous while the independent articulation clock advances.
    if(positionChanged){
      s.x0=snap?animal.x:cur.x;s.y0=snap?animal.y:cur.y;
      s.x1=animal.x;s.y1=animal.y;s.start=now;s.stepMs=nextStepMs;
    }
    if(phaseChanged){
      s.f0=snap?(animal.anim||0):cur.phase;s.f1=animal.anim||0;
      s.phaseStart=now;s.phaseStepMs=nextStepMs;
    }
    s.tick=tick;
    s.lastSeen=tick;
    s.response=nextResponse;const out=resolve(s,now,s.stepMs,s.response),segmentDistance=Math.hypot(s.x1-s.x0,s.y1-s.y0);
    const travelX=out.x-s.lastOutX,travelY=out.y-s.lastOutY,travel=Math.hypot(travelX,travelY);
    if(travel>1e-6){const rate=Math.max(.5,Number(gaitPerTile)||4);s.gait=wrap(s.gait+travel*rate,8);s.lastMoveAt=now;s.headingX=travelX/travel;s.headingY=travelY/travel}
    s.lastOutX=out.x;s.lastOutY=out.y;
    out.segmentDistance=segmentDistance;out.moving=segmentDistance>.001&&out.progress<.9995;out.recentlyMoving=now-s.lastMoveAt<=Math.max(70,Math.min(150,s.stepMs*.9));out.gaitPhase=s.gait;out.moveX=s.x1-s.x0;out.moveY=s.y1-s.y0;out.headingX=s.headingX;out.headingY=s.headingY;return out;
  }
  prune(tick,maxAge=32){for(const [id,s] of this.states)if(tick-s.lastSeen>maxAge)this.states.delete(id)}
  clear(){this.states.clear()}
}

export function smoothStep01(t){t=Math.max(0,Math.min(1,Number.isFinite(t)?t:0));return t*t*(3-2*t)}
export function lerpWrapped(a,b,t,period=8){
  a=wrap(a,period);b=wrap(b,period);let d=b-a;
  if(d>period/2)d-=period;else if(d<-period/2)d+=period;
  return wrap(a+d*t,period);
}
function resolve(s,now,stepMs,response='smooth'){
  const progress=Math.max(0,Math.min(1,(now-s.start)/stepMs));
  const phaseProgress=Math.max(0,Math.min(1,(now-s.phaseStart)/s.phaseStepMs));
  const t=response==='linear'?progress:smoothStep01(progress);
  const phaseT=response==='linear'?phaseProgress:smoothStep01(phaseProgress);
  return{x:s.x0+(s.x1-s.x0)*t,y:s.y0+(s.y1-s.y0)*t,phase:lerpWrapped(s.f0,s.f1,phaseT,8),progress:t};
}
function wrap(v,p){return((Number(v)%p)+p)%p}
