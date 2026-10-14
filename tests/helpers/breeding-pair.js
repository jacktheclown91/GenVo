// Conception fixtures must use a real supported habitat. This changes only
// fixture placement: no actors, food, reserves, RNG or ecological thresholds.
export function placeSupportedBreedingPair(sim,a,b){
  const original={ax:a.x,ay:a.y,bx:b.x,by:b.y};
  for(let y=3;y<sim.world.n-3;y+=4)for(let x=3;x<sim.world.n-3;x+=4){
    if(!sim.canOccupy(a,x,y)||!sim.canOccupy(b,x+.2,y))continue;
    a.x=x;a.y=y;b.x=x+.2;b.y=y;sim.rebuildSpatial();
    if(sim.canReach(a,b.x,b.y)&&sim.canReach(b,a.x,a.y)&&
      sim.carrying.breedingState(a).allowed&&sim.carrying.breedingState(b).allowed)return;
  }
  a.x=original.ax;a.y=original.ay;b.x=original.bx;b.y=original.by;sim.rebuildSpatial();
  throw Error('No existing habitat supports this conception fixture');
}
