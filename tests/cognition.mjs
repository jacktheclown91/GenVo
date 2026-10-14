import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function prep(sim){
  const p=sim.player();
  p.x=52;p.y=52;p.age=SPECIES.genvo.maturity+4;p.energy=SPECIES.genvo.maxEnergy*.9;p.hydration=SPECIES.genvo.maxHydration*.9;
  sim.rebuildSpatial();
  return p;
}

{
  const sim=new Simulation('GENVO8-MEMORY-WATER',{player:true}),p=prep(sim);
  const i=sim.world.idx(54,52);sim.world.water[i]=0;sim.world.moisture[i]=1;
  sim.cognition.observe();
  const memory=sim.cognition.state(p).water;
  assert.ok(memory,'lineage creature remembers sensed water');
  assert.ok(sim.cognition.waterTarget(p)?.memory,'remembered water can become a navigation target');
  assert.ok(sim.cognition.snapshot(p).history.some(e=>e.type==='water-found'),'first water discovery becomes life history');
}

{
  const sim=new Simulation('GENVO8-MEMORY-FOOD',{player:true}),p=prep(sim);
  const i=sim.world.idx(53,52);sim.world.plants.bramble[i]=.82;
  sim.cognition.observe();
  const food=sim.cognition.state(p).food;
  assert.ok(food,'food memory exists');
  assert.ok(food.kind in SPECIES.genvo.diets,'remembered food is edible by the individual');
  const target=sim.cognition.foodTarget(p);assert.equal(target.kind,food.kind);
}

{
  const sim=new Simulation('GENVO8-MEMORY-THREAT',{player:true}),p=prep(sim);
  const predator=sim.spawnAnimal('needlejaw',53,52);predator.age=SPECIES.needlejaw.maturity+5;
  sim.rebuildSpatial();sim.cognition.observe();
  const threat=sim.cognition.rememberedThreat(p);
  assert.equal(threat?.id,predator.id,'predator encounter is remembered');
  assert.ok(sim.cognition.snapshot(p).history.some(e=>e.type==='threat:needlejaw'));
}

{
  const sim=new Simulation('GENVO8-SOCIAL-ID',{player:true}),p=prep(sim);
  const mate=sim.spawnAnimal('genvo',52.5,52);mate.sex=p.sex==='F'?'M':'F';mate.age=SPECIES.genvo.maturity+2;
  const child=sim.spawnAnimal('genvo',52.7,52,[p,mate]);sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);
  const sibling=sim.spawnAnimal('genvo',53,52,[p,mate]);sim.lineage.registerBirth(sibling,[p,mate]);sim.family.registerBirth(sibling,p,mate);
  assert.equal(sim.cognition.relation(child,p),'parent');
  assert.equal(sim.cognition.relation(p,child),'child');
  assert.equal(sim.cognition.relation(child,sibling),'sibling');
  sim.rebuildSpatial();sim.cognition.observe();
  assert.ok(sim.cognition.snapshot(p).relations.some(r=>r.relation==='child'),'active individual recognizes nearby child');
}

{
  const sim=new Simulation('GENVO8-TEMPERAMENT',{player:true}),p=prep(sim);
  p.genes.temperament=.9;const cautious=sim.cognition.temperament(p);const cautiousFlight=sim.cognition.flightRadius(p,5),cautiousExplore=sim.cognition.exploreDistance(p,6);
  p.genes.temperament=1.1;const bold=sim.cognition.temperament(p);const boldFlight=sim.cognition.flightRadius(p,5),boldExplore=sim.cognition.exploreDistance(p,6);
  assert.ok(cautiousFlight>boldFlight,'cautious temperament flees at greater range');
  assert.ok(boldExplore>cautiousExplore,'bold temperament explores farther');
  assert.ok(bold.sociality>cautious.sociality,'temperament influences social spacing');
}

{
  const sim=new Simulation('GENVO8-HISTORY',{player:true}),p=prep(sim);
  const mate=sim.spawnAnimal('genvo',p.x+.2,p.y);mate.sex=p.sex==='F'?'M':'F';mate.age=SPECIES.genvo.maturity+2;mate.energy=SPECIES.genvo.maxEnergy*.95;mate.health=100;mate.reproCooldown=0;p.reproCooldown=0;
  sim.cognition.onMate(p,mate);sim.cognition.onMate(p,mate);
  assert.equal(sim.cognition.snapshot(p).history.filter(e=>e.type==='first-mate').length,1,'first-life events are not duplicated');
}

console.log('cognition + social memory checks: PASS');
