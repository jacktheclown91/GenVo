import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {YOUNG_CLIMATE,youngClimateExposure,validateYoungClimatePolicy} from '../src/ecology/young-climate.js';
import {motherWarmth,MAMMAL} from '../src/ecology/mammalian-care.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const young=(allele,age=0)=>({species:'genvo',age,genes:{climate:allele}});
const coldGood=youngClimateExposure(young(.7),.3,.2);
const coldBad=youngClimateExposure(young(1.4),.3,.2);
const hotGood=youngClimateExposure(young(1.4),.8,.2);
const hotBad=youngClimateExposure(young(.7),.8,.2);
assert.ok(coldGood.coldMultiplier<coldBad.coldMultiplier,
 'cold mismatched inherited juvenile spends more of its funded energy');
assert.ok(hotGood.extraWater<hotBad.extraWater,
 'warm adapted inheritance reduces funded dehydration at hot sites');
assert.ok(hotGood.heatMultiplier<hotBad.heatMultiplier);
assert.equal(youngClimateExposure(young(.7,SPECIES.genvo.maturity),.8,.2).extraWater,0,
 'special neonatal losses end when maturity is reached');
assert.equal(youngClimateExposure(young(.7,SPECIES.genvo.maturity),.3,.2).coldMultiplier,1);
assert.throws(()=>youngClimateExposure(young(Infinity),.2,.4),
 /Invalid physical young-climate inputs/);

// Maternal rescue requires actual inherited nursing and endothermic organs,
// and the parent pays the ordinary existing energy budget when it can help.
const parent={id:4,alive:true,species:'genvo',age:40,x:4,y:4,
 bodyPlan:{nodes:['fur-mantle','endothermic-core','mammary-gland','live-womb']
  .map(partId=>({partId}))},
 energy:SPECIES.genvo.maxEnergy*.8,hydration:SPECIES.genvo.maxHydration*.8};
const baby={id:5,alive:true,species:'genvo',age:0,x:4,y:4,
 lactationParentId:parent.id,genes:{climate:1.4}};
const temperature=.56;
assert.equal(motherWarmth(parent,baby,temperature),false,
 'historical fixed cold threshold cannot warm a mild-weather infant');
const energyBefore=parent.energy;
assert.equal(motherWarmth(parent,baby,temperature,{comfort:.77}),true);
assert.ok(Math.abs(energyBefore-parent.energy-MAMMAL.heatEnergyPerStep)<1e-10);
parent.energy=SPECIES.genvo.maxEnergy*MAMMAL.parentEnergyReserve;
assert.equal(motherWarmth(parent,baby,temperature,{comfort:.77}),false,
 'cold-adapted parenting does not create free heat when hungry');
baby.hatchedFromEggId=15;
parent.energy=SPECIES.genvo.maxEnergy;
assert.equal(motherWarmth(parent,baby,temperature,{comfort:.77}),false,
 'an egg hatchling is not turned into a nursing live-birth descendant');

// The real simulation must apply the same pressure to player and wild life
// phases, without changing old planetary save behavior.
const opts={player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:{x:0,y:2560}};
const sim=new Simulation('YOUNG-CLIMATE-REAL',opts);
assert.equal(sim.world.environment.youngClimatePolicy,YOUNG_CLIMATE.policy);
const p=sim.safeSpawn('genvo'),a=sim.spawnAnimal('genvo',p.x,p.y),
 b=sim.spawnAnimal('genvo',p.x,p.y);
for(const actor of [a,b]){
 actor.age=0;actor.energy=SPECIES.genvo.maxEnergy*.65;
 actor.hydration=SPECIES.genvo.maxHydration*.65;
 actor.health=100;
 actor.genes={...a.genes,metabolism:1};
 actor.bodyPlan=structuredClone(a.bodyPlan);
}
a.genes.climate=.7;b.genes.climate=1.4;
const cell=sim.world.idx(p.x,p.y);
sim.world.temperature[cell]=.8;sim.world.moisture[cell]=.2;
sim.climate={temp:.8,rain:.15};
const waterBeforeA=a.hydration,waterBeforeB=b.hydration;
sim.phaseMetabolism();
assert.ok(a.hydration<b.hydration,
 'same-aged same-species young with cool genotype lose extra hydration in heat');
assert.ok(waterBeforeA>a.hydration&&waterBeforeB>b.hydration);
const expected=hotBad.extraWater-hotGood.extraWater;
assert.ok(Math.abs((waterBeforeA-a.hydration)-(waterBeforeB-b.hydration)-expected)<.02,
 'real life phase charges the explicitly derived juvenile heat stress');

const old=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'climate-inheritance'}));
const current=restoreSimulationSnapshot(structuredClone(old));
assert.equal(current.world.environment.youngClimatePolicy,YOUNG_CLIMATE.policy);
const legacy=structuredClone(old);
delete legacy.world.environment.youngClimatePolicy;
const historical=restoreSimulationSnapshot(legacy);
assert.equal(historical.world.environment.youngClimatePolicy,undefined);
const priorWater=historical.animals.find(x=>x.id===a.id).hydration;
assert.ok(Number.isFinite(priorWater));
const invalid=structuredClone(old);
invalid.world.environment.youngClimatePolicy='unsupported-newborn/8';
assert.throws(()=>restoreSimulationSnapshot(invalid),
 /Invalid inherited young-climate policy/);
validateYoungClimatePolicy(sim.world,sim.world.environment);
console.log('Young climate: inherited juvenile cold/heat stress, finite hydration, paid maternal warmth, real life metabolism and historical opt-out PASS');
