import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';
import {SPECIES} from '../src/organisms/species.js';
import {PARTS,registryProblems} from '../src/lineage/part-registry.js';
import {PART_SPRITES,hasComponent} from '../src/render/part-sprites.js';
import {wildStartPlan,wildTraits} from '../src/organisms/wild-bodies.js';
import {swimsByBody,isWaterDweller} from '../src/lineage/aquatic.js';
import {partFoodFactor,partEffectFactors} from '../src/lineage/part-abilities.js';
import {freshwaterPreference} from '../src/ecology/freshwater-food.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {inheritBody} from '../src/lineage/body-inheritance.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

assert.deepEqual(registryProblems(),[]);
for(const id of ['kernel-beak','thorn-carapace'])assert.ok(PARTS[id]&&PART_SPRITES[id]&&hasComponent(id),`${id}: registered & drawn`);
for(const id of ['podshell','bankjaw'])assert.ok(SPECIES[id]&&wildStartPlan(id),`${id}: canonical species and body plan`);
const founded=new Simulation('GENVO8-SEED-SHORE-2026',{player:false});
{const pods=founded.animals.filter(a=>a.species==='podshell'),banks=founded.animals.filter(a=>a.species==='bankjaw');
// Resource-informed founding (Phase 3H/3I): 8 bankjaws are configured, but only as many are founded as the renewable food their bodies can reach supports; a species that cannot support a pair is founded absent.
assert.equal(pods.length,18);assert.equal(founded.foundingReport.bankjaw.configured,8);assert.equal(banks.length,founded.foundingReport.bankjaw.supportable);assert.ok(banks.length<8&&banks.length!==1,'bankjaw founders limited by renewable reachable food: absent or at least a pair (Phase 3I)');}
// The anatomy, predation, heredity and persistence checks below need bankjaw bodies: same world, founded as configured.
RESOURCE_FOUNDING.enabled=false;const sim=new Simulation('GENVO8-SEED-SHORE-2026',{player:false});RESOURCE_FOUNDING.enabled=true;
const pods=sim.animals.filter(a=>a.species==='podshell'),banks=sim.animals.filter(a=>a.species==='bankjaw');
assert.ok(pods.every(a=>!sim.world.water[sim.world.idx(a.x,a.y)]&&!swimsByBody(a)));
assert.ok(banks.every(a=>a.bodyPlan&&swimsByBody(a)&&!isWaterDweller(a)&&!sim.world.water[sim.world.idx(a.x,a.y)]),'amphibious land founders');
assert.ok(freshwaterPreference(banks[0],'fry')>0,'gape mouth can take finite freshwater fry');
assert.ok(SPECIES.bankjaw.hunter&&SPECIES.bankjaw.diets.rillsifter>0,'shared predation authority recognizes shoreline prey');
// A deterministic single-bite fixture tests the real shared predation mechanics,
// without asserting that natural worlds guarantee particular kills.
const rill=sim.animals.find(a=>a.alive&&a.species==='rillsifter');
const hunter=banks[0];hunter.x=rill.x;hunter.y=rill.y;sim.rebuildSpatial();
assert.ok(sim.canOccupy(hunter,rill.x,rill.y)&&sim.canReach(hunter,rill.x,rill.y),'bankjaw can enter rillsifter water');
const initialPreyHealth=rill.health,originalChance=sim.rng.chance;sim.rng.chance=()=>true;
const bit=sim.tryKill(hunter,rill,{chanceBonus:1});sim.rng.chance=originalChance;
assert.ok(bit&&(!rill.alive||rill.health<initialPreyHealth),'amphibious hunter can wound aquatic prey through shared mechanics');
assert.ok(wildTraits(pods[0]).spines>0,'thorn armor presents innate contact deterrent');
assert.ok(partEffectFactors(pods[0]).damageTaken<1&&partEffectFactors(pods[0]).repel>0,'birth-carapace is protective rather than merely normalized away');
const shieldless=makePlan(pods[0].bodyPlan.nodes.filter(n=>n.partId!=='thorn-carapace').map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})));
const unarmored={...pods[0],bodyPlan:shieldless};
assert.ok(partEffectFactors(unarmored).damageTaken>partEffectFactors(pods[0]).damageTaken,'losing armor increases predation damage');
assert.ok(wildTraits(unarmored).spines<wildTraits(pods[0]).spines,'losing thorns removes contact deterrence');
assert.ok(partFoodFactor(pods[0],{kind:'thistlepod'})>1.5,'kernel beak yields seed-pod energy');
const beakless={...pods[0],bodyPlan:makePlan(pods[0].bodyPlan.nodes.map(n=>({partId:n.partId==='kernel-beak'?'grazing-mouth':n.partId,parent:n.parent,socket:n.socket})))};
assert.ok(partFoodFactor(beakless,{kind:'thistlepod'})<partFoodFactor(pods[0],{kind:'thistlepod'}),'losing seed-cracking anatomy sacrifices benefit');
// Transfer real finite pod biomass to the gut and on to a geographically separate seed bank.
const pod=pods[0],w=sim.world,i=w.idx(pod.x,pod.y);const priorCrop=w.plants.thistlepod[i];w.plants.thistlepod[i]=.52;sim.dispersal.noteGrowth('thistlepod',i,priorCrop,.52);pod.energy=SPECIES.podshell.maxEnergy*.35;
const foodBefore=w.plants.thistlepod[i];pod.intent='feed';pod.target={x:pod.x,y:pod.y,kind:'thistlepod'};sim.resolveInteraction(pod);
assert.ok(w.plants.thistlepod[i]<foodBefore&&pod.lastPlantMeal?.destroyedSeeds>0,'kernel anatomy consumes and destroys propagules from finite crop');assert.equal(pod.seedCargo?.thistlepod?.load||0,0,'cracking does not also preserve viable seeds');pod.bodyPlan=beakless.bodyPlan;pod.intent='feed';pod.target={x:pod.x,y:pod.y,kind:'thistlepod'};sim.resolveInteraction(pod);assert.ok(pod.seedCargo?.thistlepod?.load>0,'the same animal with non-cracking anatomy can transport intact propagules');
const origin={x:pod.x,y:pod.y};let destination=null;
for(let ring=2;ring<13&&!destination;ring++)for(const [dx,dy] of [[ring,0],[-ring,0],[0,ring],[0,-ring]]){
  const x=origin.x+dx,y=origin.y+dy;
  if(w.isPlayable(x,y)&&!w.water[w.idx(x,y)]){destination={x,y};break}
}
assert.ok(destination,'seed-carrying route ends on dry ground');pod.x=destination.x;pod.y=destination.y;
const atDest=w.idx(pod.x,pod.y),bankBefore=w.seedBank.thistlepod[atDest];
for(let day=0;day<3;day++)sim.dispersal.advanceDay();
assert.ok(w.seedBank.thistlepod[atDest]>bankBefore,'transit ends with seed deposit away from eaten plant');
const infant=sim.spawnAnimal('podshell',pod.x,pod.y,[pods[0],pods[1]]);
assert.ok(inheritBody(sim,infant,pods[0],pods[1]));
const bankInfant=sim.spawnAnimal('bankjaw',banks[0].x,banks[0].y,[banks[0],banks[1]]);
assert.ok(inheritBody(sim,bankInfant,banks[0],banks[1]));
const snap=createSimulationSnapshot(sim),rebuilt=restoreSimulationSnapshot(structuredClone(snap));
for(const newborn of [infant,bankInfant]){
 const restored=rebuilt.animals.find(a=>a.id===newborn.id);
 assert.equal(restored.species,newborn.species);assert.deepEqual(restored.bodyPlan,newborn.bodyPlan);
}
assert.ok(rebuilt.world.seedBank.thistlepod[atDest]>bankBefore,'seed bank survives save/load');
for(let step=0;step<24;step++)sim.update(null);
assert.ok(sim.animals.some(a=>a.alive&&a.species==='podshell'));
assert.ok(sim.animals.some(a=>a.alive&&a.species==='bankjaw'));
console.log('seed-shore niche vertical slice: PASS; seed cargo, armor, freshwater predation, body loss, heredity, persistence, gameplay tick');
