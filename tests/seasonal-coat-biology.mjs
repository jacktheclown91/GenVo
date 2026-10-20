import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {createDraft,whyNot} from '../src/lineage/evolution-draft.js';
import {COAT_MOISTURE,advanceCoatMoisture} from '../src/lineage/coat-moisture.js';
import {SEASONAL_COAT,advanceSeasonalCoat,seasonalCoatProfile,validateSeasonalCoat} from '../src/lineage/seasonal-coat.js';
import {thermalCoverFactor} from '../src/lineage/terrain-cover-physiology.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {validateEnvironment} from '../src/world/environment.js';

const founder=founderPlan();
const plan=(kind='fur-mantle',wax=false)=>makePlan([
 ...founder.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),
 {partId:kind,parent:'root',socket:'dorsal'},
 ...(wax?[{partId:'wax-plates',parent:'root',socket:'flank.left'}]:[])
]);
const animal=(kind='fur-mantle',wax=false)=>({
 alive:true,bodyPlan:plan(kind,wax),energy:70,genes:{climate:1}
});
// Evolved waterproofing is actual mounted wax cuticle, not a free species tag.
assert.equal(PARTS['wax-plates'].developmentalPrerequisites[0],'armor-plate');
assert.match(whyNot(createDraft({base:founder,ancestry:[],budget:8}),
 'wax-plates','root','flank.left'),/Requires/i);
assert.ok(validatePlan(plan('fur-mantle',true),{ancestry:['filament-tuft','armor-plate']}).ok);
assert.equal(seasonalCoatProfile(animal()).waterResistance,0);
assert.ok(seasonalCoatProfile(animal('fur-mantle',true)).waterResistance>0);
assert.equal(seasonalCoatProfile(animal('feather-mantle',true)).waterResistance,
 seasonalCoatProfile(animal('fur-mantle',true)).waterResistance);
assert.equal(seasonalCoatProfile(animal(null,true)).waterResistance,0,
 'wax plates without a mounted coat cannot waterproof fictitious fur');

const winter=animal(),beforeEnergy=winter.energy;
for(let step=0;step<50;step++)advanceSeasonalCoat(winter,{
 temperature:.08,seasonTemperature:.15,comfort:.55,maximumEnergy:100});
const thick=winter.coatDensity,winterCost=beforeEnergy-winter.energy;
assert.ok(thick>=.95&&winterCost>1,'winter mantle growth spends actual energy');
const coldFactor=thermalCoverFactor(winter,.1,.55,{density:thick});
let shedEnergy=0;
for(let step=0;step<50;step++)shedEnergy+=advanceSeasonalCoat(winter,{
 temperature:.91,seasonTemperature:.85,comfort:.55,maximumEnergy:100}).energyCost;
assert.ok(winter.coatDensity<.32,'warming causes actual coat reduction');
assert.equal(shedEnergy,0,'molting does not produce energy');
assert.equal(winter.energy,beforeEnergy-winterCost,'shed material cannot refund consumed food');
assert.ok(thermalCoverFactor(winter,.1,.55,{density:winter.coatDensity})>coldFactor,
 'summer coat protects less against cold weather');
assert.ok(thermalCoverFactor(winter,.9,.55,{density:winter.coatDensity})<
 thermalCoverFactor(winter,.9,.55,{density:thick}),
 'a lighter coat reduces heat burden in hot habitats');

const hungry=animal();hungry.energy=15;
advanceSeasonalCoat(hungry,{temperature:.06,seasonTemperature:.15,comfort:.55,maximumEnergy:100});
assert.equal(hungry.coatDensity,SEASONAL_COAT.defaultDensity,
 'starving creatures cannot manufacture free winter coats');
assert.equal(hungry.energy,15);
const noCoat=animal();noCoat.bodyPlan=founder;
const bare=advanceSeasonalCoat(noCoat,{temperature:.03,comfort:.55,maximumEnergy:100});
assert.equal(bare.energyCost,0);
assert.equal(bare.density,0,'no genetics means no fur can grow');

const rain={rain:1,temperature:.20,moisture:.9},plain=animal(),
 wax=animal('fur-mantle',true),plume=animal('feather-mantle',true);
for(let step=0;step<7;step++){
 advanceCoatMoisture(plain,rain);
 advanceCoatMoisture(wax,{...rain,waterResistance:seasonalCoatProfile(wax).waterResistance});
 advanceCoatMoisture(plume,{...rain,waterResistance:seasonalCoatProfile(plume).waterResistance});
}
assert.ok(wax.coatWetness<plain.coatWetness,'hydrophobic wax reduces rain wetting');
assert.ok(plume.coatWetness<wax.coatWetness,'feather structure retains its natural advantage');
const immersion={rain:0,temperature:.4,moisture:.8,immersed:true};
advanceCoatMoisture(wax,{...immersion,waterResistance:seasonalCoatProfile(wax).waterResistance});
assert.ok(wax.coatWetness>0,'waterproof coverings are not immune to submersion');
const odd={...winter,coatDensity:Infinity};
assert.throws(()=>validateSeasonalCoat(odd),/Invalid saved seasonal-coat density/);

// New-world ecology and save authority are opt-in and deterministic.
// Earlier saves missing the seasonal rule never acquire modern density rules.
const seed='GENVO8-TEST-A',origin={x:0,y:2560};
const world=new World(seed,{generator:'planetary/1',planetOrigin:origin});
assert.equal(world.environment.seasonalCoatPolicy,SEASONAL_COAT.policy);
validateEnvironment(world,world.environment);
const sim=new Simulation(seed,{player:true,bootstrap:true,
 worldGenerator:'planetary/1',planetOrigin:origin});
const subject=sim.animals.find(a=>a.alive&&a.species==='genvo');
assert.ok(subject);
subject.bodyPlan=plan('fur-mantle',true);
subject.energy=70;subject.coatDensity=.63;
sim.climate={temp:.12,rain:1};
const cell=sim.world.idx(subject.x,subject.y);
sim.world.temperature[cell]=.1;sim.world.moisture[cell]=.9;
sim.phaseMetabolism();
assert.ok(subject.coatDensity>.63,'the real shared metabolism funds winter coat growth');
assert.ok(subject.coatWetness>0,'wax-resistant coats still absorb precipitation');
const afterGrowth=subject.coatDensity;
const save=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'winter-coat'}));
const resumed=restoreSimulationSnapshot(structuredClone(save));
assert.equal(resumed.animals.find(a=>a.id===subject.id).coatDensity,afterGrowth);
assert.equal(resumed.world.environment.seasonalCoatPolicy,SEASONAL_COAT.policy);
const corrupted=structuredClone(save);
corrupted.animals.find(a=>a.id===subject.id).coatDensity=1.25;
assert.throws(()=>restoreSimulationSnapshot(corrupted),/Invalid saved seasonal-coat density/);
const unknown=structuredClone(save);
unknown.world.environment.seasonalCoatPolicy='unknown-coat-season/5';
assert.throws(()=>restoreSimulationSnapshot(unknown),/Invalid planetary seasonal-coat policy/);
const older=structuredClone(save);
delete older.world.environment.seasonalCoatPolicy;
for(const a of older.animals)delete a.coatDensity;
const legacy=restoreSimulationSnapshot(older);
assert.equal(legacy.world.environment.seasonalCoatPolicy,undefined);
assert.equal(legacy.animals.find(a=>a.id===subject.id).coatDensity,undefined);
console.log('Seasonal coats: funded winter growth, summer molting, inherited wax waterproofing, no free reserves, active ecology and historical saves PASS');
