import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {PLANTS} from '../src/sim/config.js';

const sim=new Simulation('DISPERSAL-TEST',{player:false});
const w=sim.world;
const carrier=sim.animals.find(a=>a.species==='mosskip');
assert(carrier,'mosskip carrier exists');

// Pick a dry, non-water destination and isolate it from existing bramble propagules.
let dest=null;
for(let y=10;y<w.n-10&&!dest;y++)for(let x=10;x<w.n-10;x++){
  const i=w.idx(x,y);if(!w.water[i]&&w.moisture[i]>.25&&w.moisture[i]<.58){dest={x:x+.5,y:y+.5,i};break}
}
assert(dest,'suitable destination exists');
for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
  const i=w.idx(dest.x+ox,dest.y+oy);w.bramble[i]=0;w.seedBank.bramble[i]=0;
}

// Zero biomass does not magically regrow when no seed is present.
sim.climate={temp:.58,rain:.4};
sim.phaseVegetation();
assert.equal(w.bramble[dest.i],0,'seed-limited bramble remains locally extinct without propagules');

// Eating fruit creates a viable carried seed load; moving the carrier transports it.
let source;for(let i=0;i<w.len&&!source;i++)if(w.bramble[i]>.2&&sim.canOccupy(carrier,i%w.n+.5,Math.floor(i/w.n)+.5))source=i;assert.ok(Number.isInteger(source));carrier.x=source%w.n+.5;carrier.y=Math.floor(source/w.n)+.5;const harvest=sim.dispersal.harvestMeal(carrier,'bramble',source,.18,'crop');assert.ok(harvest?.viableSeeds>0,'seed cargo is funded by actual crop consumption');
assert(carrier.seedCargo?.bramble?.load>0,'fruit consumption creates seed cargo');
carrier.x=dest.x;carrier.y=dest.y;
for(let d=0;d<4&&carrier.seedCargo?.bramble;d++)sim.dispersal.advanceDay();
assert((w.seedBank.bramble[dest.i]||0)>0,'gut passage deposits seeds at the later animal location');

// Suitable deposited seeds can establish a new local population.
w.moisture[dest.i]=PLANTS.bramble.waterNeed;w.fertility[dest.i]=.85;
const established=sim.dispersal.germinate('bramble',dest.i,w.moisture[dest.i],w.fertility[dest.i],.58);
assert(established>0,'deposited bramble seed germinates in suitable habitat');
w.bramble[dest.i]=established;
assert(w.bramble[dest.i]>0,'new bramble population established after dispersal');

// Mature seed plants release short-range propagules without global respawn.
let center=null;
for(let y=12;y<w.n-12&&!center;y++)for(let x=12;x<w.n-12;x++){const i=w.idx(x,y);if(!w.water[i]){center={x,y,i};break}}
for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)w.seedBank.thistlepod[w.idx(center.x+ox,center.y+oy)]=0;
w.thistlepod[center.i]=PLANTS.thistlepod.carry;
for(let d=0;d<12;d++){sim.dispersal.releaseLocal('thistlepod',center.i,w.thistlepod[center.i]);sim.day++}
let localSeed=0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)if(ox||oy)localSeed+=w.seedBank.thistlepod[w.idx(center.x+ox,center.y+oy)];
assert(localSeed>0,'mature thistlepod creates a short-range propagule');

// Death deposits any remaining carried seeds instead of deleting them from the system.
sim.dispersal.noteGrowth('thistlepod',center.i,0,w.thistlepod[center.i]);sim.dispersal.harvestMeal(carrier,'thistlepod',center.i,.16,'crop');carrier.x=center.x+.5;carrier.y=center.y+.5;
const before=w.seedBank.thistlepod[center.i];sim.dispersal.onDeath(carrier);
assert(w.seedBank.thistlepod[center.i]>before,'death deposits carried seed cargo into the local seed bank');

assert(sim.dispersal.stats.deposited>0&&sim.dispersal.stats.germinated>0,'dispersal statistics record real transport and establishment');
console.log('dispersal checks: PASS');
