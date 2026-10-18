import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {groundDiet,plantPreference,canHunt,preyPreference,ecologicalCapabilities,mouthOf} from '../src/ecology/functional-diet.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {inheritBody} from '../src/lineage/body-inheritance.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Same ancestry, different mounted mouth = different actual survival rules.
const sim=new Simulation('GENVO8-FUNCTIONAL-ECOLOGY',{player:false});
const carrier=sim.animals.find(a=>a.species==='podshell'&&a.alive);
const sifter=sim.animals.find(a=>a.species==='rillsifter'&&a.alive);
const stalker=sim.animals.find(a=>a.species==='needlejaw'&&a.alive);
const changedMouth=(a,to)=>makePlan(a.bodyPlan.nodes.map(n=>({partId:n.parent==='root'&&n.socket==='mouth'?to:n.partId,parent:n.parent,socket:n.socket})));
assert.ok(carrier&&sifter&&stalker);
const seedBefore=plantPreference(carrier,'thistlepod');
assert.ok(seedBefore>1&&canHunt(stalker)&&!canHunt(carrier));
assert.ok(preyPreference(stalker,carrier)>0);
const original=carrier.bodyPlan;
carrier.bodyPlan=changedMouth(carrier,'gape-mouth');
assert.equal(carrier.species,'podshell','ancestry label unchanged');
assert.equal(mouthOf(carrier),'gape-mouth');
assert.equal(plantPreference(carrier,'thistlepod'),0,'loss of beak removes seed capability');
assert.equal(groundDiet(carrier).thistlepod,undefined);
assert.ok(canHunt(carrier),'inherited jaw grants hunting despite grazer ancestry');
assert.ok(preyPreference(carrier,sifter)>0,'predation has no named-species gate');
assert.ok(sim.isPredatorTo(carrier,sifter));
// The fixture places the prey beside the predator on reachable land (it used to rely on spawn luck).
sifter.x=carrier.x+.6;sifter.y=carrier.y;sim.rebuildSpatial();assert.ok(sim.canReach(carrier,sifter.x,sifter.y));
// Hunt success is capped below certainty (90%); a few genuine attempts show the bite reaches the damage logic.
{let landed=false;for(let k=0;k<10&&!landed;k++)landed=sim.tryKill(carrier,sifter,{chanceBonus:1})||sifter.health<100;assert.ok(landed,'bite reaches shared damage logic')}
sim.playerEnabled=true;
const behavior=sim.wildlifeRhythm.decision(carrier,{energy:1,hydration:1});
// A land seed carrier that inherits a hunting jaw takes up hunter behaviour. It cannot swim, so it
// prowls (shoreline routines are for hunters that can swim, creator decision 2026-10-15).
assert.match(behavior?.intent||'',/^(scent-watch|shadow-patrol|stalker-rest)$/,'ambient behavior responds to changed jaws');
carrier.bodyPlan=original;
assert.equal(canHunt(carrier),false,'hunting ceases when jaw is removed');
assert.ok(plantPreference(carrier,'thistlepod')>1,'restoring beak restores seed feeding');
assert.equal(sim.isPredatorTo(carrier,sifter),false);

// A former predator can become a non-hunter through an inherited mouth change.
const originalStalker=stalker.bodyPlan;
stalker.bodyPlan=changedMouth(stalker,'grazing-mouth');
assert.equal(canHunt(stalker),false);
assert.ok(plantPreference(stalker,'sunmoss')>0);
assert.equal(preyPreference(stalker,carrier),0);
stalker.bodyPlan=originalStalker;

// Test real offspring with matching parents. The new body goes through the
// existing recombination/persistence pipeline and retains its ecological role.
const parents=sim.animals.filter(a=>a.species==='podshell'&&a.alive).slice(0,2);
for(const parent of parents)parent.bodyPlan=changedMouth(parent,'gape-mouth');
sim.bodyVariationChance=0;
const child=sim.spawnAnimal('podshell',carrier.x,carrier.y,parents);
assert.ok(inheritBody(sim,child,...parents),'birth inherits a concrete body');
assert.equal(mouthOf(child),'gape-mouth');
assert.ok(canHunt(child)&&plantPreference(child,'thistlepod')===0,'offspring hunts by phenotype');
const stored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
const saved=stored.animals.find(a=>a.id===child.id);
assert.ok(saved&&canHunt(saved),'save/load preserves newly acquired niche');
assert.equal(mouthOf(saved),'gape-mouth');
assert.equal(saved.species,'podshell','legacy save ancestry preserved');
assert.equal(ecologicalCapabilities(saved).hunter,true);
for(let i=0;i<12;i++)stored.update(null);
assert.ok(stored.animals.some(a=>a.alive&&a.id===child.id),'run continues with inherited niche');
console.log('functional ecology v1.63: PASS · diet, kill, idle rhythm, trait loss, heritability, save/load, runtime');
