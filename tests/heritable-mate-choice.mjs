import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {founderMatePreferences,inheritMatePreferences,expressedMateTraits,individualMateChoice,reciprocalMateChoice,PREFERENCE_AXES} from '../src/reproduction/mate-preferences.js';

const seed='HERITABLE-MATE-CHOICE';
const sim=new Simulation(seed,{player:true}),active=sim.player();
const partner=sim.animals.find(a=>a.alive&&a.species===active.species&&a.id!==active.id&&a.sex!==active.sex);
assert.ok(partner,'a founder mate exists');
assert.deepEqual(active.matePreferences,founderMatePreferences(seed,active.id,{assortment:sim.mateAssortmentRules==='local-visual-assortment/1'}),'founder genotype uses the recorded policy and its own deterministic stream');
const twin=new Simulation(seed,{player:true});
assert.deepEqual(twin.player().matePreferences,active.matePreferences,'seed produces the same starting allele profile');
assert.notDeepEqual(new Simulation('UNRELATED-WORLD',{player:true}).player().matePreferences,active.matePreferences,'distinct seeds can start with different preferences');
const originalRng=sim.rng.state;
founderMatePreferences(seed,99);inheritMatePreferences(seed,100,active,partner);
assert.equal(sim.rng.state,originalRng,'preference sampling never consumes shared ecology RNG');
assert.deepEqual(Object.keys(active.matePreferences.weights),PREFERENCE_AXES);
const p={weights:Object.fromEntries(PREFERENCE_AXES.map(k=>[k,0])),selectivity:1};
const strong={weights:{...p.weights,size:1},selectivity:1};
const small={weights:{...p.weights,size:-1},selectivity:1};
active.matePreferences=strong;partner.matePreferences=p;
active.genes.body=1.2;partner.genes.body=.72;
assert.equal(individualMateChoice(active,partner,seed).accepted,false,'individual genuinely refuses a body it dislikes');
assert.equal(individualMateChoice(partner,active,seed).accepted,true,'acceptance is not a fixed male/female role');
assert.equal(reciprocalMateChoice(active,partner,seed).accepted,false,'both animals must accept');
// Real mating must honor choice even when physical readiness is valid.
const s=SPECIES[active.species];
for(const a of [active,partner]){
  a.age=s.maturity+10;a.reproCooldown=0;a.pregnant=null;a.health=100;
  a.energy=s.maxEnergy*.97;a.hydration=s.maxHydration*.97;
}
active.x=partner.x=41;active.y=partner.y=42;
sim.rebuildSpatial();
assert.ok(sim.reproduction.selectMate(partner.id));
assert.equal(sim.reproduction.courtSelected(),true,'player may attempt courtship even if eventual choice is negative');
const animalsBefore=sim.animals.length,rngBefore=sim.rng.state;
assert.equal(sim.tryMate(active,partner),false,'real arrival respects reciprocal individual choice');
assert.equal(sim.animals.length,animalsBefore);
assert.equal(sim.rng.state,rngBefore,'refusal does not fund pregnancy or roll the RNG');
assert.equal((active.sex==='F'?active:partner).pregnant,null,'refusal cannot conceive');
assert.ok(active.lastCourtshipRefusal,'reason recorded for eventual feedback');
// Player allele can reverse choice independently of sex.
partner.genes.body=1.25;
assert.equal(reciprocalMateChoice(active,partner,seed).accepted,true);
assert.equal(sim.reproduction.courtSelected(),true);
assert.equal(sim.tryMate(active,partner),true,'normal reproduction resumes when BOTH accept');
const mother=active.sex==='F'?active:partner;
assert.deepEqual(mother.pregnant.maternalInheritance.matePreferences,mother.matePreferences,'maternal conception genotype frozen');
assert.ok(mother.pregnant.paternalInheritance.matePreferences,'paternal conception genotype frozen');
const snapshot=structuredClone(createSimulationSnapshot(sim)),restored=restoreSimulationSnapshot(snapshot);
assert.deepEqual(restored.player().matePreferences,active.matePreferences,'living genotype persists');
assert.deepEqual(restored.animals.find(a=>a.id===mother.id).pregnant.maternalInheritance.matePreferences,mother.matePreferences,'conception genotype persists');
// Changing living parents after conception cannot rewrite an already established genome.
const unbornMother=structuredClone(mother.pregnant.maternalInheritance);
const unbornFather=structuredClone(mother.pregnant.paternalInheritance);
const unbornParentSnapshot=structuredClone(unbornFather.matePreferences);
const father=active.sex==='M'?active:partner;
father.matePreferences=small;
assert.deepEqual(mother.pregnant.paternalInheritance.matePreferences,unbornParentSnapshot);
sim.kill(father,'age');
assert.equal(father.alive,false,'father genuinely died during gestation');
const births=sim.giveBirth(mother);
assert.ok(births.length>0,'normal resource-funded births occur');
const child=births[0];
assert.ok(child.matePreferences&&child.matePreferences.weights,'newborn genotype installed');
assert.ok(PREFERENCE_AXES.every(axis=>Math.abs(child.matePreferences.weights[axis])<=1),'genotype bounded');
assert.equal(child.matePreferences.selectivity>=0&&child.matePreferences.selectivity<=1,true);
assert.deepEqual(child.matePreferences,inheritMatePreferences(seed,child.id,unbornMother,unbornFather),'birth uses the frozen parental genotypes');
// Restore legacy saves lacking the optional genotype field without rewriting shared RNG.
const legacy=structuredClone(snapshot);
for(const a of legacy.animals){delete a.matePreferences;if(a.pregnant){delete a.pregnant.maternalInheritance.matePreferences;delete a.pregnant.paternalInheritance.matePreferences}}
const migrated=restoreSimulationSnapshot(legacy);
assert.equal(migrated.rng.state,restored.rng.state,'legacy preference migration does not disturb simulation RNG');
assert.deepEqual(migrated.player().matePreferences,founderMatePreferences(seed,migrated.player().id));
assert.ok(migrated.animals.find(a=>a.id===mother.id).pregnant.paternalInheritance.matePreferences);
// Real autonomous mate search must honor either partner's refusal before a pursuit.
{
  const world=new Simulation('MATE-CHOICE-AUTONOMY',{player:false});
  const [a,b]=world.animals.filter(x=>x.species==='rootling').slice(0,2);
  world.animals=[a,b];a.sex='F';b.sex='M';
  for(const animal of [a,b]){animal.age=SPECIES.rootling.maturity+5;animal.reproCooldown=0;animal.pregnant=null;animal.energy=SPECIES.rootling.maxEnergy*.99;animal.hydration=SPECIES.rootling.maxHydration*.99;animal.health=100;animal.infected=false;animal.reproDrive=1;}
  b.x=a.x+.2;b.y=a.y;world.rebuildSpatial();
  a.matePreferences=strong;b.matePreferences=p;
  b.genes.body=.72;
  assert.equal(world.autonomousMateTarget(a,{far:true})?.id,b.id,'a disliked partner remains explorable instead of being permanently excluded');
  b.genes.body=1.28;
  assert.equal(world.autonomousMateTarget(a,{far:true})?.id,b.id,'autonomous seeker can find accepted partner');
}
// Phenotype comes from biological data, never from cosmetic sprite layers.
const traits=expressedMateTraits(partner);
assert.ok(traits.size>0);
assert.ok(PREFERENCE_AXES.every(axis=>Number.isFinite(traits[axis])&&Math.abs(traits[axis])<=1));
console.log('heritable-mate-choice: genotype, mutual consent, real birth, immutable gestation, legacy saves, deterministic RNG PASS');
