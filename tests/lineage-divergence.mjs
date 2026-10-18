import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES,phenotypeFor} from '../src/organisms/species.js';
import {setForm,setProto,formReading,protoReading,migrateLegacyReadings} from '../src/lineage/readings.js';
// A copy of an animal with no form or proto-trait on its body (for before/after phenotype checks).
const withoutReadings=a=>{const c={...a,anatomy:{...(a.anatomy||{})}};setForm(c,null);setProto(c,null);return c};

function mateFor(sim,parent){
  return sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id)||sim.spawnAnimal('genvo',parent.x+1,parent.y);
}
function childOf(sim,a,b){
  const child=sim.spawnAnimal('genvo',a.x+.5,a.y,[a,b]);
  sim.lineage.registerBirth(child,[a,b]);
  return child;
}

// Existing inherited Forager form retains appearance/mechanics; learned behavior cannot create it.
{
  const sim=new Simulation('GENVO8-DIVERGE-FORAGER',{player:true}),p=sim.player(),mate=mateFor(sim,p);
  sim.tendency.scores={forager:7.5,colony:.8};sim.tendency.evaluate();
  assert.equal(sim.divergence.onBirth({generation:2},[p,mate]),null,'learned behavior does not create an inherited form');
  setForm(p,{kind:'forager',strength:.6,sourceGeneration:1});
  const child=childOf(sim,p,mate),form=sim.divergence.formFor(child);
  assert.equal(form?.kind,'forager');
  assert.equal(form.strength,.6,'existing parental form strength is inherited unchanged');
  const plain=phenotypeFor(withoutReadings(child)),changed=phenotypeFor(child);
  assert.ok(changed.bodyWidthScale<plain.bodyWidthScale,'Forager form narrows the mantle');
  assert.ok(changed.limbScale>plain.limbScale,'Forager form lengthens limbs');
  assert.ok(changed.sensoryScale>plain.sensoryScale,'Forager form enlarges sensory presentation');
  assert.ok(sim.divergence.movementMultiplier(child)>1.03,'Forager form changes travel speed');
  assert.ok(sim.divergence.forageRangeMultiplier(child)>1.12,'Forager form changes food search reach');

  // The inherited behavior remains meaningful even if family culture later becomes undecided.
  sim.tendency.scores={forager:0,colony:0};sim.tendency.lastSnapshot=null;sim.tendency.evaluate();
  child.age=SPECIES.genvo.maturity+5;child.energy=SPECIES.genvo.maxEnergy*.78;child.hydration=SPECIES.genvo.maxHydration*.9;child.health=100;child.player=false;
  const decision=sim.tendency.autonomousDecision(child);
  assert.ok(decision&&['tendency-forage','tendency-roam'].includes(decision.intent),'inherited Forager form preserves autonomous wide-ranging behavior');

  // Repeating learned behavior does not strengthen the inherited G3 determinant.
  sim.tendency.scores={forager:8.2,colony:.7};sim.tendency.lastSnapshot=null;sim.tendency.evaluate();
  const outsider=mateFor(sim,child),grandchild=childOf(sim,child,outsider),deep=sim.divergence.formFor(grandchild);
  assert.equal(deep?.kind,'forager');
  assert.equal(deep.strength,form.strength,'continued family behavior cannot strengthen inherited anatomy');
}

// Existing inherited Colony form retains a different body and concrete shelter effects.
{
  const sim=new Simulation('GENVO8-DIVERGE-COLONY',{player:true}),p=sim.player(),mate=mateFor(sim,p);
  sim.tendency.scores={forager:.6,colony:7.8};sim.tendency.evaluate();
  setForm(p,{kind:'colony',strength:.6,sourceGeneration:1});
  const child=childOf(sim,p,mate),form=sim.divergence.formFor(child);
  assert.equal(form?.kind,'colony');
  const plain=phenotypeFor(withoutReadings(child)),changed=phenotypeFor(child);
  assert.ok(changed.bodyWidthScale>plain.bodyWidthScale,'Colony form broadens the mantle');
  assert.ok(changed.limbScale<plain.limbScale,'Colony form shortens the ranging silhouette');
  assert.ok(sim.divergence.cacheMultiplier(child)>1.10,'Colony form improves shelter food storage');

  child.age=SPECIES.genvo.maturity+3;child.x=45.5;child.y=45.5;
  const shelter={id:900,ownerId:p.id,x:45.5,y:45.5,integrity:100,weatherSeal:.8,foodStore:0,capacity:50,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:0};
  sim.shelter.shelters=[shelter];
  const withForm=sim.shelter.protectionFactor(child);
  const saved=formReading(child);setForm(child,null);const plainProtection=sim.shelter.protectionFactor(child);setForm(child,saved);
  assert.ok(withForm<plainProtection,'Colony form materially improves shelter protection');

  for(let y=43;y<=48;y++)for(let x=43;x<=48;x++){const i=sim.world.idx(x,y);for(const arr of Object.values(sim.world.plants))arr[i]=0;sim.world.carrion[i]=0}
  const i=sim.world.idx(45,45);sim.world.plants.bramble[i]=.9;
  const boosted=sim.shelter.cacheNearbyFood(child);assert.ok(boosted.ok);
  shelter.foodStore=0;sim.world.plants.bramble[i]=.9;setForm(child,null);
  const baseline=sim.shelter.cacheNearbyFood(child);assert.ok(baseline.ok);setForm(child,saved);
  assert.ok(boosted.stored>baseline.stored*1.10,'Colony form increases actual shelter deposit yield');
}

console.log('visible lineage divergence checks: PASS');
