// Keep an ordinary flee destination when its whole short segment is traversable.
// Otherwise search nearby headings; no animal creation, immunity or RNG draws.
export function escapeDestination(sim,a,requested,observed=[]){
  const dx=requested?.x-a.x,dy=requested?.y-a.y,distance=Math.hypot(dx,dy);
  if(!Number.isFinite(distance)||distance<.001)return requested;
  const traversable=(x,y)=>{
    if(!sim.canReach(a,x,y)||!sim.canOccupy(a,x,y))return false;
    const steps=Math.ceil(Math.hypot(x-a.x,y-a.y)*4);
    for(let k=1;k<=steps;k++)if(!sim.canOccupy(a,a.x+(x-a.x)*k/steps,a.y+(y-a.y)*k/steps))return false;
    return true;
  };
  const originalTraversable=traversable(requested.x,requested.y),multiple=observed.length>1;
  if(originalTraversable&&!multiple)return requested;
  const goalClearance=(x,y)=>Math.min(...observed.filter(b=>sim.canReach(b,x,y)).map(b=>Math.hypot(x-b.x,y-b.y)));
  // A real water/island refuge remains useful when none of the sensed hunters
  // can enter it. This does not grant either participant new traversal ability.
  if(originalTraversable&&multiple&&goalClearance(requested.x,requested.y)===Infinity)return requested;
  const pathClearance=(x,y)=>{
    const sx=x-a.x,sy=y-a.y,length2=sx*sx+sy*sy;
    return Math.min(...observed.map(b=>{
      const t=length2?Math.max(0,Math.min(1,((b.x-a.x)*sx+(b.y-a.y)*sy)/length2)):0;
      return Math.hypot(a.x+sx*t-b.x,a.y+sy*t-b.y);
    }));
  };
  const base=Math.atan2(dy,dx),danger=requested.threat||{x:a.x-dx/distance,y:a.y-dy/distance};
  let best=originalTraversable?requested:null,score=multiple&&best?goalClearance(best.x,best.y):-Infinity,clearance=multiple&&best?pathClearance(best.x,best.y):-Infinity;
  for(const scale of [1,.5,.25])for(const turn of [0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6,7,-7,8]){
    const angle=base+turn*Math.PI/8,r=distance*scale,x=a.x+Math.cos(angle)*r,y=a.y+Math.sin(angle)*r;
    if(!traversable(x,y))continue;
    const value=multiple?goalClearance(x,y):Math.hypot(x-danger.x,y-danger.y),path=multiple?pathClearance(x,y):0;
    if(multiple?(path>clearance+1e-9||Math.abs(path-clearance)<=1e-9&&value>score+1e-9):value>score+1e-9){score=value;clearance=path;best={...requested,x,y}}
  }
  // A genuinely enclosed animal can remain trapped and be caught.
  return best||{...requested,x:a.x,y:a.y,blocked:true};
}
