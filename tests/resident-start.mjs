import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {residentStartCandidates,selectResidentStart} from '../src/persistence/resident-start.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {TutorialController} from '../src/ui/tutorial.js';

const sim=new Simulation('RESIDENT-START'),original=sim.player(),
 selected=sim.animals.find(a=>a.alive&&!a.lineage&&a.species==='mosskip'),
 partner=sim.animals.find(a=>a.alive&&a.species==='mosskip'&&a.id!==selected.id);
const child=sim.spawnAnimal(selected.species,selected.x,selected.y,[selected,partner]);
sim.lineage.registerBirth(child,[selected,partner]);
const source=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'resident-source'})),
 fork=restoreSimulationSnapshot(structuredClone(source)),rng=fork.rng.state,
 stocks=structuredClone({world:source.world,stats:source.core.stats}),count=fork.animals.length;
const biological=a=>({id:a.id,species:a.species,x:a.x,y:a.y,genes:a.genes,bodyPlan:a.bodyPlan,anatomy:a.anatomy,
 age:a.age,energy:a.energy,hydration:a.hydration,health:a.health,generation:a.generation,parentIds:a.parentIds,pregnant:a.pregnant,pigmentGenome:a.pigmentGenome,reproductiveGenome:a.reproductiveGenome});
const before=fork.animals.map(a=>structuredClone(biological(a)));
assert.ok(residentStartCandidates(fork).some(a=>a.id===selected.id),'wild inherited bodies are real candidates');
assert.throws(()=>selectResidentStart(fork,-1),/no longer a living/);
selectResidentStart(fork,selected.id);
assert.equal(fork.playerId,selected.id);
assert.equal(fork.lineage.activeId,selected.id);
assert.equal(fork.animals.filter(a=>a.player).length,1);
assert.equal(fork.animals.length,count);
assert.equal(fork.rng.state,rng);
assert.deepEqual(fork.animals.map(biological),before,'selection changes control, not organism biology, funding or ancestry');
assert.equal(fork.animals.find(a=>a.id===original.id).lineage,false,'the previous playable family cannot become the new species by labeling');
assert.equal(fork.animals.find(a=>a.id===child.id).lineage,true,'existing biological descendants stay in the selected line');
assert.ok(fork.lineage.records.has(original.id),'previous genealogy remains historical evidence');
assert.deepEqual(fork.lineage.records.get(child.id).parentIds,child.parentIds);
assert.equal(fork.lineage.records.get(child.id).bornDay,child.birthDay,'adoption never substitutes the current day for birth history');
assert.equal(sim.playerId,original.id,'source simulation stays unchanged');
assert.deepEqual(source,createSimulationSnapshot(sim,{savedAt:'fixed',reason:'resident-source'}));
const snap=structuredClone(createSimulationSnapshot(fork,{savedAt:'fixed',reason:'resident-fork'})),restored=restoreSimulationSnapshot(structuredClone(snap));
assert.deepEqual(snap.world,stocks.world,'no resource or terrain stock is regenerated');
assert.deepEqual(snap.core.stats,stocks.stats,'adoption is not a simulated birth, death or achievement');
assert.equal(restored.playerId,selected.id);
assert.deepEqual(restored.creatureStart,fork.creatureStart);
assert.deepEqual(restored.player().bodyPlan,fork.player().bodyPlan);
assert.equal(restored.creatureStart.kind,'existing-resident');
// Existing juveniles remain juveniles; their guidance must not pretend they
// are ready to reproduce just because a human chose to control them.
const guide=Object.create(TutorialController.prototype);guide.sim=restored;guide.renderer={};
for(const name of ['renderPredatorAlert','renderStalkerDenWarning','renderTerritoryShift','renderSuccession','renderGenerationChallenge','renderIllness','renderFamilyIllness','renderExposure','renderFamilyWeather','renderStormAftermath','renderInjury','renderKnownWater','renderForagePatch'])guide[name]=()=>false;
let guidance;guide.render=(title,body)=>{guidance={title,body}};
guide.renderDynamicGoal(restored.animals.find(a=>a.id===child.id));
assert.equal(guidance.title,'Grow into your body');
const newborn=restored.spawnAnimal(selected.species,selected.x,selected.y,[restored.player(),restored.animals.find(a=>a.id===partner.id)]);
restored.lineage.registerBirth(newborn,[restored.player(),partner]);
assert.equal(newborn.lineage,true,'future births follow the newly selected lineage');
const earned=restored.evolutionBudget.total;
restored.evolutionBudget.noteBirth(newborn);
assert.ok(restored.evolutionBudget.total>earned,'birth rewards follow actual playable lineage membership, not the founding species label');
const unrelated=restored.spawnAnimal(original.species,original.x,original.y,[original,original]);
restored.lineage.registerBirth(unrelated,[original,original]);
assert.equal(unrelated.lineage,false,'old conception snapshot flags cannot reattach unrelated offspring');
const bad=structuredClone(snap);bad.core.creatureStart.kind='fabricated-evolution';
assert.throws(()=>restoreSimulationSnapshot(bad),/resident start provenance/);
// A controlled border placement exercises real travel/archives, not a new
// organism or substituted world. The selected resident remains the owner.
const planet=new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1'}),resident=planet.animals.find(a=>a.alive&&a.species==='mosskip');
selectResidentStart(planet,resident.id);
let frontier=null;
for(let y=10.5;y<118.5;y++){resident.x=125.2;resident.y=y;const status=planetaryTravelAvailability(planet);if(status.enabled){frontier=status;break}}
assert.ok(frontier,'actual geography exposes a traversable frontier');
const travel=crossPlanetaryBorder(planet);
assert.ok(travel.ok,travel.message);
assert.equal(travel.simulation.playerId,resident.id);
assert.deepEqual(travel.simulation.creatureStart,planet.creatureStart,'resident origin follows the real traveler');
assert.ok(travel.simulation.planetaryTravel.sessions.every(s=>s.snapshot.core.creatureStart?.actorId===resident.id));
const traveled=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(travel.simulation,{savedAt:'fixed',reason:'resident-travel'})));
assert.equal(traveled.playerId,resident.id);
assert.equal(traveled.creatureStart.actorId,resident.id);
// Re-forking a visited multi-region world must retire archived old control
// flags as well as active ones; regional biological ownership stays intact.
const replacement=residentStartCandidates(traveled).find(a=>a.id!==resident.id);
assert.ok(replacement);
selectResidentStart(traveled,replacement.id);
assert.ok(traveled.planetaryTravel.sessions.every(s=>s.snapshot.core.creatureStart.actorId===replacement.id));
assert.ok(traveled.planetaryTravel.sessions.every(s=>s.snapshot.animals.every(a=>!a.player)));
assert.equal(restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(traveled,{savedAt:'fixed',reason:'resident-reselection'}))).playerId,replacement.id);
console.log('Resident starts: real wild body selection, exact biology/stocks/RNG, retained ancestry, independent fork, future births and provenance refusal PASS');
