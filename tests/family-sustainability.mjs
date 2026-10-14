import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PLANTS} from '../src/sim/config.js';

const sim=new Simulation('FAMILY-SUSTAINABILITY-TEST',{player:true});
const p=sim.player();
const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
assert.ok(mate,'starter mate exists');

// Find a dry 3x3 territory-cell block so the test can control local forage cleanly.
const size=sim.territory.cellSize;let base=null;
for(let cy=2;cy<13&&!base;cy++)for(let cx=2;cx<13&&!base;cx++){
  let dry=true;for(let oy=-1;oy<=1&&dry;oy++)for(let ox=-1;ox<=1;ox++){
    const x=(cx+ox+.5)*size,y=(cy+oy+.5)*size;if(sim.world.water[sim.world.idx(x,y)]){dry=false;break}
  }
  if(dry)base={cx,cy};
}
assert.ok(base,'dry block found');

p.x=(base.cx+.5)*size;p.y=(base.cy+.5)*size;p.age=SPECIES.genvo.maturity+5;p.energy=110;p.hydration=105;
const family=[p];
for(let i=0;i<2;i++){
  const a=sim.spawnAnimal('genvo',p.x+1+i,p.y+1,[p,mate]);a.age=SPECIES.genvo.maturity+3;a.energy=105;a.hydration=103;a.health=100;sim.lineage.registerBirth(a,[p,mate]);family.push(a);
}
const cells=[[0,0],[1,0],[0,1]];
for(let i=0;i<cells.length;i++){
  const a=family[i%family.length],cx=base.cx+cells[i][0],cy=base.cy+cells[i][1],key=`${cx},${cy}`,state=sim.territory.ensure(a);
  state.cells.set(key,{key,cx,cy,x:(cx+.5)*size,y:(cy+.5)*size,visits:3,lastTick:sim.tickCount});state.home={x:p.x,y:p.y};state.radius=9;state.established=true;state.totalFamiliarity=6;
}

// Strip edible biomass from occupied ground while leaving a rich adjacent relief cell.
for(const [ox,oy] of cells){
  const cx=base.cx+ox,cy=base.cy+oy;
  for(let y=cy*size;y<(cy+1)*size;y++)for(let x=cx*size;x<(cx+1)*size;x++)for(const kind of Object.keys(PLANTS))sim.world.plants[kind][sim.world.idx(x,y)]=.01;
}
const rich={cx:base.cx-1,cy:base.cy,key:`${base.cx-1},${base.cy}`,x:(base.cx-.5)*size,y:(base.cy+.5)*size};
for(let y=rich.cy*size;y<(rich.cy+1)*size;y++)for(let x=rich.cx*size;x<(rich.cx+1)*size;x++){
  const i=sim.world.idx(x,y);if(sim.world.water[i])continue;sim.world.plants.bramble[i]=PLANTS.bramble.carry;sim.world.plants.sunmoss[i]=PLANTS.sunmoss.carry;
}

// Put overlapping grazers directly into the family footprint.
for(let i=0;i<4;i++){const a=sim.spawnAnimal(i%2?'rootling':'mosskip',p.x+.7+i*.35,p.y+.5);a.age=SPECIES[a.species].maturity+2;a.energy=80;a.hydration=80;}
sim.rebuildSpatial();sim.sustainability.invalidate();
const beforeRng=sim.rng.s;
const strained=sim.sustainability.snapshot({force:true});
assert.equal(sim.rng.s,beforeRng,'sustainability calculation consumes no simulation RNG');
assert.ok(['strained','depleted'].includes(strained.status.id),`depleted family ground is reported as pressure (${strained.status.id})`);
assert.ok(strained.competitors>=4,'overlapping grazing species count as competing feeders');
assert.ok(strained.food<.25,'depleted occupied cells report low forage');

// Shelter stores buffer the range readout without creating world biomass.
sim.shelter.shelters.length=0;sim.shelter.shelters.push({id:1,ownerId:p.id,x:p.x,y:p.y,integrity:100,weatherSeal:1,foodStore:28,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
sim.sustainability.invalidate();const buffered=sim.sustainability.snapshot({force:true});
assert.ok(buffered.reserve.ratio>strained.reserve.ratio,'real shelter food reserve improves the population buffer');
assert.ok(buffered.balance>strained.balance,'stored food raises sustainability balance without replacing world forage');

// Under pressure, Family Forage seeks richer/less-contested ground before normal local feeding.
sim.shelter.shelters[0].foodStore=0;sim.sustainability.invalidate();assert.equal(sim.familyDirectives.set('forage'),true);
const decision=sim.familyDirectives.decision(family[1]);
assert.equal(decision?.intent,'family-relief-forage','strained family forage routes an adult toward resource relief');
assert.equal(decision?.target?.resourceRelief,true,'relief movement is explicitly tagged as population pressure response');
assert.ok(Math.hypot(decision.target.x-rich.x,decision.target.y-rich.y)<size*1.6,'relief target favors the nearby rich frontier');

console.log('family sustainability + competition checks: PASS');
