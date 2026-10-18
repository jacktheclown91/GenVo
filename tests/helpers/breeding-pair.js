// Conception fixtures must use a real supported habitat. This changes only
// fixture placement: no actors, food, reserves, RNG or ecological thresholds.
// If no habitat supports the species yet (e.g. aquatic forage before algae has grown at world
// start), the staged pair is held OUT of the world while its habitat develops by ordinary updates,
// one day at a time for up to developDays, then placed. The pair's staged condition is unchanged;
// nothing is added to the world. Fixtures that already find habitat at day 0 are unaffected.
function tryPlace(sim,a,b){
  for(let y=3;y<sim.world.n-3;y+=4)for(let x=3;x<sim.world.n-3;x+=4){
    if(!sim.canOccupy(a,x,y)||!sim.canOccupy(b,x+.2,y))continue;
    a.x=x;a.y=y;b.x=x+.2;b.y=y;sim.rebuildSpatial();
    if(sim.canReach(a,b.x,b.y)&&sim.canReach(b,a.x,a.y)&&
      sim.carrying.breedingState(a).allowed&&sim.carrying.breedingState(b).allowed)return true;
  }
  return false;
}
export function placeSupportedBreedingPair(sim,a,b,{developDays=60}={}){
  const original={ax:a.x,ay:a.y,bx:b.x,by:b.y};
  if(tryPlace(sim,a,b))return{developedDays:0};
  a.x=original.ax;a.y=original.ay;b.x=original.bx;b.y=original.by;
  const held=[a,b],index=held.map(x=>sim.animals.indexOf(x));sim.animals=sim.animals.filter(x=>!held.includes(x));sim.rebuildSpatial();
  for(let day=1;day<=developDays;day++){
    const d0=sim.day;while(sim.day===d0)sim.update(null);
    sim.animals.push(...held);
    if(tryPlace(sim,a,b))return{developedDays:day};
    sim.animals=sim.animals.filter(x=>!held.includes(x));a.x=original.ax;a.y=original.ay;b.x=original.bx;b.y=original.by;
  }
  sim.animals.push(...held);a.x=original.ax;a.y=original.ay;b.x=original.bx;b.y=original.by;sim.rebuildSpatial();
  throw Error('No existing habitat supports this conception fixture');
}
