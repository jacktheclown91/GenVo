import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {wildStartPlan} from '../src/organisms/wild-bodies.js';
import {SPECIES} from '../src/organisms/species.js';
import {conceptionMode} from '../src/reproduction/reproductive-anatomy.js';
import {EMBRYO_CLIMATE,embryoThermalPreference,embryoClimateReading,
 advanceEmbryoClimate,validateEmbryoClimate,validateEmbryoClimatePolicy
} from '../src/reproduction/embryo-climate.js';

// No hardcoded species reward: a frozen inherited climate value affects
// condition under physical temperature, while finite water funds incubation.
function egg(allele,hydration=2){
 return {x:.5,y:.5,condition:1,incubationDays:9,hydration,energy:10,
  maternalInheritance:{genes:{climate:allele}},
  paternalInheritance:{genes:{climate:allele}}};
}
const temp=new Float32Array([.35]),moisture=new Float32Array([.7]);
const world={generator:'planetary/1',len:1,water:new Uint8Array(1),
 temperature:temp,moisture,idx:()=>0,
 environment:{schema:6,embryoClimatePolicy:EMBRYO_CLIMATE.policy}};
validateEmbryoClimatePolicy(world,world.environment);
assert.equal(embryoThermalPreference(egg(.75)),.55*.75);
assert.equal(embryoThermalPreference(egg(1.4)),.55*1.4);
function trial(allele,temperature,{nest=null,water=2}={}){
 temp[0]=temperature;
 const e=egg(allele,water),before=e.hydration;
 for(let step=0;step<9&&e.condition>0;step++){
  const read=advanceEmbryoClimate(world,e,nest);
  e.condition-=read.conditionLoss;
 }
 return{egg:e,spent:before-e.hydration};
}
const coldSuitable=trial(.75,.35);
const coldMismatch=trial(1.4,.35);
const hotSuitable=trial(1.4,.8);
const hotMismatch=trial(.75,.8);
assert.ok(coldSuitable.egg.condition>.9&&coldMismatch.egg.condition<=0,
 'cool ancestry should be advantageous under cold incubation, not by species label');
assert.ok(hotSuitable.egg.condition>.9&&hotMismatch.egg.condition<coldSuitable.egg.condition,
 'warm ancestry should win back viability in warm habitat');
assert.ok(coldSuitable.spent>0&&hotSuitable.spent>0,
 'all embryos use their existing funded water reserve');
assert.ok(coldSuitable.egg.climateWaterSpent>0);
assert.equal(coldSuitable.egg.climateDays,9);
const dry=trial(.75,.35,{water:.06});
assert.ok(dry.egg.condition<coldSuitable.egg.condition,
 'unfunded eggs cannot survive by ideal thermal genes alone');
assert.equal(dry.egg.hydration,0);
const exposed=trial(.75,.65,{water:.6});
const protectedNest=trial(.75,.65,{water:.6,nest:{integrity:1}});
assert.ok(protectedNest.spent<exposed.spent,
 'constructed material and physically maintained nest condition slow egg-water loss');
world.water[0]=1;temp[0]=.55;
const flooded=egg(1);
const flood=advanceEmbryoClimate(world,flooded);
assert.equal(flood.conditionLoss,1,'nests and adaptation cannot override flooded land');
assert.equal(flooded.hydration,2,'flood loss is not an invented evaporation transaction');
world.water[0]=0;

// Dual-capable reproductive anatomy uses local inherited incubation fitness.
// Existing energy/hydration reproductive gates remain, and the adult is not
// awarded free embryos or forced into either route.
const pairPlan={nodes:[{partId:'egg-chamber'},{partId:'live-womb'}]};
const parent={bodyPlan:pairPlan,x:.5,y:.5,species:'genvo',genes:{climate:.75},
 energy:SPECIES.genvo.maxEnergy,hydration:SPECIES.genvo.maxHydration};
temp[0]=.35;moisture[0]=.7;
assert.equal(conceptionMode(parent,world),'egg');
assert.equal(conceptionMode({...parent,genes:{climate:1.4}},world),'live');
const olderWorld={...world,environment:{schema:6}};
assert.equal(conceptionMode({...parent,genes:{climate:1.4}},olderWorld),'egg',
 'unmarked worlds retain their historic fixed-temperature strategy');

// A real planetary simulation follows this rule, persists an egg's spent
// hydration and rejects tampered save fields.
const seed='GENVO8-TEST-A',origin={x:0,y:2560};
const live=new Simulation(seed,{player:false,bootstrap:false,
 worldGenerator:'planetary/1',planetOrigin:origin});
assert.equal(live.world.environment.embryoClimatePolicy,EMBRYO_CLIMATE.policy);
const spot=live.safeSpawn('genvo');
const i=live.world.idx(spot.x,spot.y);
assert.equal(live.world.water[i],0);
live.world.temperature[i]=.35;live.world.moisture[i]=.7;
const real={...egg(.75,.8),x:spot.x,y:spot.y,id:17,motherId:7,
 fatherId:8,species:'genvo',condition:1,incubationDays:20};
// Planetary worlds use anatomical mass: inheritance carries a real body.
for(const side of ['maternalInheritance','paternalInheritance'])Object.assign(real[side],{species:'mosskip',massPolicy:live.massRules,bodyPlan:wildStartPlan('mosskip')});
live.eggs=[real];live.nextEggId=18;
live.advanceEggs();
assert.equal(live.eggs.length,1);
assert.equal(real.climateDays,1);
assert.ok(real.hydration<.8&&real.climateWaterSpent>0);
const saved=structuredClone(createSimulationSnapshot(live,
 {savedAt:'fixed',reason:'embryo-selection'}));
const replay=restoreSimulationSnapshot(structuredClone(saved));
assert.equal(replay.eggs.length,1);
assert.equal(replay.eggs[0].hydration,real.hydration);
assert.equal(replay.eggs[0].climateDays,1);
assert.equal(replay.world.environment.embryoClimatePolicy,EMBRYO_CLIMATE.policy);
const corrupt=structuredClone(saved);
corrupt.core.eggs[0].climateDays=-3;
assert.throws(()=>restoreSimulationSnapshot(corrupt),
 /Invalid saved embryo climate days/);
const untrusted=structuredClone(saved);
untrusted.world.environment.embryoClimatePolicy='guaranteed-hatch/9';
assert.throws(()=>restoreSimulationSnapshot(untrusted),
 /Invalid inherited embryo-climate policy/);
const old=structuredClone(saved);
delete old.world.environment.embryoClimatePolicy;
delete old.world.environment.youngClimatePolicy; // later policy built on embryo climate
delete old.core.eggs[0].climateDays;
delete old.core.eggs[0].climateWaterSpent;
const historic=restoreSimulationSnapshot(old);
const oldWater=historic.eggs[0].hydration;
historic.advanceEggs();
assert.equal(historic.eggs[0].hydration,oldWater,
 'historic saved worlds retain their prior no-evaporation incubation');
assert.equal(historic.eggs[0].climateDays,undefined);
console.log('Inherited embryo climate: opposing habitats select opposite alleles, physical hydration, egg/live strategy, real save/restore and historic opt-out PASS');
