import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES,GENE_KEYS,phenotypeFor} from '../src/organisms/species.js';
import {traitMidpoint,geneticContrast} from '../src/reproduction/reproduction.js';

function preparePair(sim){
  const active=sim.player();
  assert.ok(active);
  let mate=sim.animals.find(a=>a.alive&&a.species===active.species&&a.sex!==active.sex&&a.id!==active.id);
  if(!mate){mate=sim.spawnAnimal(active.species,active.x+.5,active.y+.5);mate.sex=active.sex==='F'?'M':'F'}
  active.age=SPECIES.genvo.maturity+2;mate.age=SPECIES.genvo.maturity+2;
  active.reproCooldown=0;mate.reproCooldown=0;active.pregnant=null;mate.pregnant=null;
  active.energy=SPECIES.genvo.maxEnergy*.95;mate.energy=SPECIES.genvo.maxEnergy*.95;
  active.health=mate.health=100;active.x=40;active.y=40;mate.x=41;mate.y=40;
  sim.rebuildSpatial();
  return {active,mate};
}

{
  const sim=new Simulation('GENVO8-MATE-SENSE',{player:true});
  const {active,mate}=preparePair(sim);
  const candidates=sim.reproduction.eligibleMates({radius:8});
  assert.ok(candidates.some(a=>a.id===mate.id),'ready opposite-sex mate is sensed');
  assert.ok(sim.reproduction.selectMate(mate.id));
  assert.equal(sim.reproduction.courtSelected(),true);
  assert.equal(sim.reproduction.courtTargetId,mate.id);
  sim.phaseDecision({up:false,down:false,left:false,right:false,sprint:false});
  assert.equal(active.intent,'mate');
  assert.equal(active.target.id,mate.id);
}

{
  const sim=new Simulation('GENVO8-MATE-KIN',{player:true});
  const {active,mate}=preparePair(sim);
  const child=sim.spawnAnimal('genvo',active.x+.2,active.y,[active,mate]);
  child.age=SPECIES.genvo.maturity+1;child.sex=active.sex==='F'?'M':'F';child.reproCooldown=0;child.energy=SPECIES.genvo.maxEnergy*.95;child.health=100;
  sim.rebuildSpatial();
  assert.equal(sim.canMatePair(active,child),false,'parent/child pair is rejected');
  assert.ok(!sim.reproduction.eligibleMates({radius:8}).some(a=>a.id===child.id));
}

{
  const sim=new Simulation('GENVO8-MATE-ACT',{player:true});
  const {active,mate}=preparePair(sim);
  assert.ok(sim.reproduction.selectMate(mate.id));
  assert.equal(sim.reproduction.courtSelected(),true);
  active.x=mate.x-.2;active.y=mate.y;
  assert.equal(sim.tryMate(active,mate),true,'deliberate courtship can produce a normal mating event');
  const female=active.sex==='F'?active:mate;
  assert.equal(female.pregnant.fatherId,(active.sex==='M'?active:mate).id);
  assert.equal(sim.reproduction.courtTargetId,null);
}

{
  const animal={genes:{body:1.10,motion:.92,metabolism:1.08,digestion:1.07,senses:1.12,climate:.94,immunity:1.09,temperament:.97}};
  const ph=phenotypeFor(animal);
  assert.ok(ph.bodyScale>1);
  assert.ok(ph.sensoryScale>1);
  assert.equal(ph.stripe,true);
  assert.equal(ph.spot,true);
  const other={genes:Object.fromEntries(GENE_KEYS.map(k=>[k,1]))};
  const mid=traitMidpoint(animal,other);
  assert.ok(mid.body>1&&mid.body<animal.genes.body);
  assert.ok(geneticContrast(animal,other)>0);
}

console.log('reproduction + phenotype checks: PASS');
