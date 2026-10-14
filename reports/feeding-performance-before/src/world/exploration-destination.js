// Keep normal exploration on terrain reachable by the assembled body, without extra RNG.
export function explorationDestination(sim,a,requested){
  const valid=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&sim.canOccupy(a,p.x,p.y)&&sim.canReach(a,p.x,p.y);
  if(valid(requested))return requested;
  if(!Number.isFinite(requested?.x)||!Number.isFinite(requested?.y))return{x:a.x,y:a.y};
  const lo=1.001,hi=sim.world.n-2.001,span=hi-lo;
  const reflect=value=>{const phase=((value-lo)%(2*span)+2*span)%(2*span);return lo+(phase<=span?phase:2*span-phase)};
  const reflected={x:reflect(requested.x),y:reflect(requested.y)};
  if(valid(reflected))return reflected;
  const heading=Math.atan2(reflected.y-a.y,reflected.x-a.x),distance=Math.min(10,Math.hypot(reflected.x-a.x,reflected.y-a.y));
  for(const turn of [0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,3*Math.PI/4,-3*Math.PI/4,Math.PI])
    for(const scale of [1,.5,.25]){const angle=heading+turn,p={x:a.x+Math.cos(angle)*distance*scale,y:a.y+Math.sin(angle)*distance*scale};if(valid(p))return p}
  return{x:a.x,y:a.y};
}
