import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {thermalCoverFactor} from '../src/lineage/terrain-cover-physiology.js';
import {COAT_MOISTURE,coatType,coatMoistureStatus,advanceCoatMoisture,validateCoatMoisture} from '../src/lineage/coat-moisture.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {validateEnvironment} from '../src/world/environment.js';

const base=founderPlan();
function animal(part){
 const placements=base.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
 if(part)placements.push({partId:part,parent:'root',socket:'dorsal'});
 return{bodyPlan:makePlan(placements)};
}
const plain=animal(),fur=animal('fur-mantle'),feathers=animal('feather-mantle'),
 filament=animal('filament-tuft'),wings=animal('flight-wing');
assert.equal(coatType(plain),null);
assert.equal(coatType(fur),'fur-mantle');
assert.equal(coatType(feathers),'feather-mantle');
assert.equal(coatType(wings),'flight-wing');
for(const a of [plain,fur,feathers,filament,wings])assert.equal(advanceCoatMoisture(a,{rain:0,temperature:.6,moisture:.1}),0);
assert.equal(coatMoistureStatus(plain).label,'no insulating coat');
const rain={rain:1,temperature:.23,moisture:.9,immersed:false};
for(let i=0;i<7;i++){
 advanceCoatMoisture(fur,rain);
 advanceCoatMoisture(feathers,rain);
}
assert.ok(fur.coatWetness>feathers.coatWetness,'dense fur absorbs rain faster than feather vanes');
assert.ok(fur.coatWetness>.25);
assert.ok(thermalCoverFactor(fur,.1,.55,{wetness:fur.coatWetness})>.48);
assert.ok(thermalCoverFactor(feathers,.1,.55,{wetness:feathers.coatWetness})<
 thermalCoverFactor(fur,.1,.55,{wetness:fur.coatWetness}),
 'feathers retain better cold insulation while damp');
// Actual immersion wets even without rain, but dry air does not cause
// saturated material to become dry instantaneously.
const swim=animal('fur-mantle'),plume=animal('feather-mantle');
for(let i=0;i<3;i++){
 advanceCoatMoisture(swim,{rain:0,temperature:.5,moisture:.5,immersed:true});
 advanceCoatMoisture(plume,{rain:0,temperature:.5,moisture:.5,immersed:true});
}
assert.ok(swim.coatWetness>.7&&plume.coatWetness>.5);
const wetAtExit=swim.coatWetness;
const humid=advanceCoatMoisture(swim,{rain:0,temperature:.1,moisture:.9});
assert.ok(humid>0&&humid<wetAtExit,'wet coat persists after leaving the water');
const dryCoat=structuredClone(swim),sunCoat=structuredClone(swim);
advanceCoatMoisture(dryCoat,{rain:0,temperature:.1,moisture:.9});
advanceCoatMoisture(sunCoat,{rain:0,temperature:.95,moisture:.1});
assert.ok(sunCoat.coatWetness<dryCoat.coatWetness,'warm dry air dries fur sooner');
assert.ok(thermalCoverFactor(swim,.12,.55,{wetness:swim.coatWetness})>
 thermalCoverFactor(animal('fur-mantle'),.12,.55,{wetness:0}),
 'retained immersion water costs real survival energy after swimming');
assert.ok(thermalCoverFactor(swim,.9,.55,{wetness:swim.coatWetness})<
 thermalCoverFactor(swim,.9,.55,{wetness:0}),
 'wet coat dissipates heat but dry insulation remains costly');
for(let i=0;i<80;i++)advanceCoatMoisture(swim,{rain:0,temperature:.95,moisture:0});
assert.ok(swim.coatWetness<.01,'cold-weather saturation is not permanent');
assert.ok(thermalCoverFactor(wings,.1,.55)<1,'flight-wing still provides feather-derived cold cover');
assert.ok(thermalCoverFactor(wings,.9,.55)>1,'bigger flight-wing has heat burden');
// Legacy systems retain their original instantaneous wet and dry arithmetic.
assert.equal(thermalCoverFactor(fur,.1,.55),.48);
assert.equal(thermalCoverFactor(fur,.1,.55,{wet:true}),.48+.52*.45);
assert.equal(thermalCoverFactor(fur,.9,.55,{wet:true}),1.24);
assert.equal(thermalCoverFactor(feathers,.1,.55,{wet:true}),.55+.45*.18);
const invalid=animal('fur-mantle');
invalid.coatWetness=Infinity;
assert.throws(()=>validateCoatMoisture(invalid),/Invalid saved coat moisture/);
invalid.coatWetness=-.1;
assert.throws(()=>advanceCoatMoisture(invalid,rain),/Invalid saved coat moisture/);

// World-policy opt-in is a saved physical rule, not an automatic migration of
// historical planetary snapshots. The actor's wetness is copied exactly.
const seed='GENVO8-TEST-A',origin={x:0,y:2560};
const world=new World(seed,{generator:'planetary/1',planetOrigin:origin});
assert.equal(world.environment.coatMoisturePolicy,COAT_MOISTURE.policy);
validateEnvironment(world,world.environment);
const sim=new Simulation(seed,{player:true,bootstrap:true,worldGenerator:'planetary/1',planetOrigin:origin});
const subject=sim.animals.find(a=>a.alive&&a.species==='genvo');
assert.ok(subject,'an active GenVo creature is needed');
subject.bodyPlan=structuredClone(fur.bodyPlan);
subject.coatWetness=.68;
const snapshot=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'coat-moisture'}));
const replay=restoreSimulationSnapshot(structuredClone(snapshot));
assert.equal(replay.animals.find(a=>a.id===subject.id).coatWetness,.68);
assert.equal(replay.world.environment.coatMoisturePolicy,COAT_MOISTURE.policy);
const bad=structuredClone(snapshot);
bad.animals.find(a=>a.id===subject.id).coatWetness=2;
assert.throws(()=>restoreSimulationSnapshot(bad),/Invalid saved coat moisture/);
const unknown=structuredClone(snapshot);
unknown.world.environment.coatMoisturePolicy='unsupported-coat/99';
assert.throws(()=>restoreSimulationSnapshot(unknown),/Invalid planetary coat-moisture policy/);
const old=structuredClone(snapshot);
delete old.world.environment.coatMoisturePolicy;
for(const a of old.animals)delete a.coatWetness;
const historic=restoreSimulationSnapshot(old);
assert.equal(historic.world.environment.coatMoisturePolicy,undefined);
assert.equal(historic.animals.find(a=>a.id===subject.id).coatWetness,undefined);
console.log('Persistent coats: mounted fur/feathers, immersion, rain, drying, saved physiology and history PASS');
