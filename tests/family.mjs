import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES,phenotypeFor} from '../src/organisms/species.js';
import {developmentFor} from '../src/family/family.js';

function prepareParents(sim){
  const active=sim.player();
  let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==active.id&&a.sex!==active.sex);
  if(!mate){mate=sim.spawnAnimal('genvo',active.x+.4,active.y);mate.sex=active.sex==='F'?'M':'F'}
  active.age=SPECIES.genvo.maturity+2;mate.age=SPECIES.genvo.maturity+2;
  active.energy=mate.energy=SPECIES.genvo.maxEnergy*.95;
  active.health=mate.health=100;
  active.reproCooldown=mate.reproCooldown=0;
  active.x=50;active.y=50;mate.x=50.4;mate.y=50;
  const mother=active.sex==='F'?active:mate;
  const father=active.sex==='M'?active:mate;
  return {active,mother,father};
}

{
  const sim=new Simulation('GENVO8-FAMILY-BIRTH',{player:true});
  const {mother,father}=prepareParents(sim);
  mother.pregnant={fatherId:father.id,days:1,totalDays:SPECIES.genvo.gestation,startedDay:sim.day,startedYear:sim.year};
  const before=sim.stats.births;
  const children=sim.giveBirth(mother);
  assert.ok(children.length>=1,'birth creates offspring');
  assert.equal(sim.stats.births,before+children.length);
  for(const child of children){
    assert.equal(child.caregiverId,mother.id,'mother becomes initial caregiver');
    assert.equal(child.lineage,true,'founder-connected offspring joins lineage');
    assert.equal(developmentFor(child).stage,'newborn');
    assert.equal(sim.family.isDependent(child),true);
  }
  const event=sim.family.recentEvent();
  assert.equal(event.type,'birth');
  assert.ok(children.some(c=>c.id===event.animalId));
}

{
  const sim=new Simulation('GENVO8-FAMILY-CARE',{player:true});
  const {mother,father}=prepareParents(sim);
  mother.pregnant={fatherId:father.id,days:1,totalDays:SPECIES.genvo.gestation};
  const [child]=sim.giveBirth(mother);
  child.x=mother.x+.3;child.y=mother.y;child.energy=20;mother.energy=SPECIES.genvo.maxEnergy*.95;
  const childBefore=child.energy,parentBefore=mother.energy;
  sim.family.phaseCare();
  assert.ok(child.energy>childBefore,'dependent child receives care energy nearby');
  assert.ok(mother.energy<parentBefore,'care costs caregiver energy');
  child.x=mother.x+5;child.y=mother.y;
  const follow=sim.family.followTarget(child);
  assert.equal(follow?.id,mother.id,'separated dependent child follows caregiver');
  child.energy=SPECIES.genvo.maxEnergy*.9;child.hydration=SPECIES.genvo.maxHydration*.9;sim.rebuildSpatial();
  sim.phaseDecision(null);
  assert.equal(child.intent,'follow','dependent child decision prioritizes regrouping with caregiver');
  child.age=SPECIES.genvo.maturity*.7;
  assert.equal(sim.family.isDependent(child),false,'older juvenile no longer depends on caregiver');
}

{
  const sim=new Simulation('GENVO8-FAMILY-GUARD',{player:true});
  const {mother,father}=prepareParents(sim);
  mother.pregnant={fatherId:father.id,days:1,totalDays:SPECIES.genvo.gestation};
  const [child]=sim.giveBirth(mother);
  const guardian=mother.player?father:mother;
  child.x=55;child.y=55;guardian.x=54.5;guardian.y=55;
  const predator=sim.spawnAnimal('needlejaw',56,55);predator.energy=SPECIES.needlejaw.maxEnergy*.4;
  sim.rebuildSpatial();
  const guard=sim.family.guardTarget(guardian);
  assert.equal(guard?.child.id,child.id,'non-player parent detects predator pressure on dependent child');
  assert.equal(guard?.threat.id,predator.id);
  guardian.x=49;guardian.y=55;child.x=55;child.y=55;predator.x=56;predator.y=55;guardian.energy=SPECIES.genvo.maxEnergy*.9;guardian.hydration=SPECIES.genvo.maxHydration*.9;sim.rebuildSpatial();
  sim.phaseDecision(null);
  assert.equal(guardian.intent,'guard','parent decision can interrupt wandering to regroup around threatened child');
}

{
  const a={species:'genvo',age:0,genes:{body:1.1,motion:1,metabolism:1,digestion:1.08,senses:1.1,climate:1,immunity:1.08,temperament:1}};
  const newborn=developmentFor(a),base=phenotypeFor(a);
  assert.equal(newborn.stage,'newborn');assert.ok(newborn.growth<.7);
  a.age=SPECIES.genvo.maturity*.7;
  const adolescent=developmentFor(a);
  assert.equal(adolescent.stage,'adolescent');assert.ok(adolescent.growth>newborn.growth);
  a.age=SPECIES.genvo.maturity+1;
  assert.equal(developmentFor(a).stage,'adult');
  assert.ok(base.stripe&&base.spot,'inherited markings remain genotype-derived for later expression');
}

{
  const sim=new Simulation('GENVO8-FAMILY-PREG',{player:true});
  const {mother,father}=prepareParents(sim);
  mother.pregnant={fatherId:father.id,days:8,totalDays:16};
  const p=sim.family.pregnancyProgress(mother);
  assert.equal(p.remaining,8);assert.equal(p.total,16);assert.equal(p.progress,.5);
}

console.log('family + development checks: PASS');
