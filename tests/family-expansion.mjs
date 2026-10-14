import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('FAMILY-EXPANSION-TEST',{player:true});
const p=sim.player();
const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
assert.ok(mate,'starter mate exists');

const adults=[];
for(let i=0;i<2;i++){
  const a=sim.spawnAnimal('genvo',p.x+2+i,p.y+1,[p,mate]);
  a.age=SPECIES.genvo.maturity+4;a.energy=SPECIES.genvo.maxEnergy*.9;a.hydration=SPECIES.genvo.maxHydration*.9;
  sim.lineage.registerBirth(a,[p,mate]);adults.push(a);
}

// Build six sustained familiar cells across three adults. The aggregation is
// shared family presence, not ownership, and consumes no simulation RNG.
const family=[p,...adults];
const beforeState=sim.rng.s;
for(let i=0;i<6;i++){
  const a=family[i%family.length],state=sim.territory.ensure(a),cx=5+i,cy=5+(i%2),key=`${cx},${cy}`;
  state.cells.set(key,{key,cx,cy,x:(cx+.5)*sim.territory.cellSize,y:(cy+.5)*sim.territory.cellSize,visits:2.4,lastTick:sim.tickCount});
}
sim.rebuildSpatial();
const snap=sim.expansion.snapshot();
assert.equal(sim.rng.s,beforeState,'family reach calculation consumes no simulation RNG');
assert.equal(snap.adults,3,'active adult plus two grown descendants count toward family reach');
assert.ok(snap.cells.length>=6,'shared familiar footprint aggregates across living lineage adults');
assert.equal(snap.tier.id,'expanding','three adults across six cells reaches the expanding tier');
assert.equal(snap.scoutUnlocked,true,'Scout unlocks from sustained family growth');
assert.ok(snap.frontier.length>0,'shared range exposes dry frontier cells');

assert.equal(sim.familyDirectives.set('scout'),true,'unlocked Scout can be selected');
const decision=sim.familyDirectives.decision(adults[0]);
assert.equal(decision.intent,'family-scout');
assert.equal(decision.target.frontier,true,'Scout directs an autonomous adult toward frontier ground');

// Survival authority still overrides leadership.
adults[0].hydration=SPECIES.genvo.maxHydration*.2;
assert.equal(sim.familyDirectives.decision(adults[0]),null,'serious survival need overrides Scout direction');

// The capability is sustained by a living population, not permanently granted.
adults[1].alive=false;
assert.equal(sim.expansion.scoutUnlocked(),false,'losing the adult population can close the Scout capability');
assert.equal(sim.familyDirectives.set('auto'),true);
assert.equal(sim.familyDirectives.set('scout'),false,'locked Scout cannot be reselected after the family contracts');
console.log('family reach + Scout unlock checks: PASS');
