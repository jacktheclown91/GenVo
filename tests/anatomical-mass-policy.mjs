import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {ANATOMICAL_MASS,LEGACY_MASS,adultBodyMass,bodyMass,bodyMassFraction,basalResourceCosts} from '../src/organisms/body-mass.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {attachHeadPlan} from '../src/lineage/head-plan.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {growthCostForDay,advanceAgeDay,TISSUE_ENERGY_PER_MASS,GROWTH_EFFICIENCY} from '../src/ecology/juvenile-biology.js';
import {remainingPreyBiomass,consumePreyBiomass,regrowPreyBiomass} from '../src/ecology/prey-biomass.js';
import {paternalInheritance} from '../src/ecology/gestation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const simple={species:'genvo',massPolicy:ANATOMICAL_MASS,bodyPlan:founderPlan(),age:30,genes:{metabolism:1}};
assert.equal(adultBodyMass(simple),1.45);
assert.equal(adultBodyMass({...simple,bodyPlan:attachHeadPlan(simple.bodyPlan)}),adultBodyMass(simple));
const mutable=structuredClone(simple);assert.equal(adultBodyMass(mutable),1.45);mutable.bodyPlan.nodes.find(n=>n.socket==='limb.1').partId='spring-leg';assert.notEqual(adultBodyMass(mutable),1.45);mutable.bodyPlan.nodes.find(n=>n.socket==='limb.1').parent='missing';assert.throws(()=>adultBodyMass(mutable),/Unsupported/);
const sacPlan=makePlan([...simple.bodyPlan.nodes.map(({partId,parent,socket})=>({partId,parent,socket})),{partId:'storage-sac',parent:'root',socket:'flank.left'},{partId:'storage-sac',parent:'root',socket:'flank.right'}]);
const loaded={...simple,bodyPlan:sacPlan};close(adultBodyMass(loaded)-adultBodyMass(simple),.29);
for(const species of Object.keys(SPECIES))for(const player of [true,false]){const a={...simple,species,age:SPECIES[species].maturity,player};assert.equal(bodyMass(a),1.45);assert.deepEqual(basalResourceCosts(a),basalResourceCosts(simple));}
for(const plan of [simple.bodyPlan,sacPlan]){
 const a={...simple,bodyPlan:plan,age:10,energy:100,hydration:100},oldMass=bodyMass(a),cost=growthCostForDay(a);advanceAgeDay(a);assert.equal(a.age,11);close(100-a.energy,cost);close(cost,(bodyMass(a)-oldMass)*TISSUE_ENERGY_PER_MASS/GROWTH_EFFICIENCY);assert.equal(a.growthPaid,cost);
 const poor={...simple,bodyPlan:plan,age:10,energy:0},before=bodyMass(poor);advanceAgeDay(poor);assert.equal(poor.age,10);assert.equal(bodyMass(poor),before);assert.equal(poor.growthDelayDays,1);
}
assert.ok(growthCostForDay({...loaded,age:10})>growthCostForDay({...simple,age:10}));
const wounded={...loaded,energy:100};const eaten=consumePreyBiomass(wounded,.2);close(remainingPreyBiomass(wounded),bodyMass(wounded)-eaten);const old=wounded.energy,regrown=regrowPreyBiomass(wounded,10);close(old-wounded.energy,regrown*34);close(remainingPreyBiomass(wounded),bodyMass(wounded)-eaten+regrown);
const sim=new Simulation('ANATOMICAL-MASS-ROUNDTRIP',{bootstrap:false,player:false}),a=sim.spawnAnimal('genvo',40,40),b=sim.spawnAnimal('genvo',40,40);
assert.equal(sim.massRules,ANATOMICAL_MASS);assert.equal(a.massPolicy,ANATOMICAL_MASS);a.bodyPlan=sacPlan;a.age=30;b.age=30;
const frozen=paternalInheritance(a);a.bodyPlan=founderPlan();assert.equal(frozen.massPolicy,ANATOMICAL_MASS);close(adultBodyMass(frozen),1.74);
const child=sim.spawnAnimal('genvo',40,40,[frozen,paternalInheritance(b)]);assert.ok(child.bodyPlan);assert.equal(child.massPolicy,ANATOMICAL_MASS);assert.ok(bodyMass(child)>0);
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'mass-policy'}));
const current=snap(sim),restored=restoreSimulationSnapshot(structuredClone(current));assert.deepEqual(snap(restored),current);for(let i=0;i<8;i++){sim.update();restored.update()}assert.deepEqual(snap(restored),snap(sim));
for(const value of ['unknown',{},null]){const bad=structuredClone(current);bad.core.massRules=value;assert.throws(()=>restoreSimulationSnapshot(bad),/mass rules/);}
const badBody=structuredClone(current);badBody.animals[0].bodyPlan=null;assert.throws(()=>restoreSimulationSnapshot(badBody),/mass body/);
const mixed=structuredClone(current);delete mixed.animals[0].massPolicy;assert.throws(()=>restoreSimulationSnapshot(mixed),/differs from world/);
const legacy=new Simulation('LEGACY-MASS-EXACT',{bootstrap:false,player:false,massRules:LEGACY_MASS});delete legacy.massRules;
const oldActor=legacy.spawnAnimal('genvo',40,40);oldActor.age=10;oldActor.bodyPlan=sacPlan;assert.equal(oldActor.massPolicy,undefined);assert.equal(adultBodyMass(oldActor),SPECIES.genvo.mass);
const oldSnapshot=snap(legacy),oldRestore=restoreSimulationSnapshot(structuredClone(oldSnapshot));assert.equal(oldRestore.massRules,undefined);assert.deepEqual(snap(oldRestore),oldSnapshot);
for(let i=0;i<8;i++){legacy.update();oldRestore.update()}assert.deepEqual(snap(oldRestore),snap(legacy));
const legacyChild=oldRestore.spawnAnimal('genvo',40,40,[paternalInheritance(oldActor),paternalInheritance(oldActor)]);assert.equal(legacyChild.massPolicy,undefined);assert.equal(adultBodyMass(legacyChild),SPECIES.genvo.mass);
const deathSim=new Simulation('MASS-CARCASS',{bootstrap:false,player:false}),dead=deathSim.spawnAnimal('genvo',40,40);dead.age=30;dead.bodyPlan=sacPlan;consumePreyBiomass(dead,.2);const remainder=remainingPreyBiomass(dead),idx=deathSim.world.idx(40,40),before=deathSim.world.carrion[idx];deathSim.kill(dead,'test');assert.equal(deathSim.world.carrion[idx],Math.fround(before+remainder));assert.equal(deathSim.history.nutrientLegacy[idx],Math.fround(remainder*.16));deathSim.kill(dead,'test');assert.equal(deathSim.world.carrion[idx],Math.fround(before+remainder));
assert.throws(()=>adultBodyMass({...simple,massPolicy:'unknown'}),/Unknown mass/);assert.throws(()=>adultBodyMass({...simple,bodyPlan:null}),/Missing/);
console.log('Anatomical relative mass: head neutrality, sac load, label/control parity, paid/delayed growth, wound/regrowth/carrion budget, frozen parental policy/body, strict invalid saves and exact old/new continuation PASS');
