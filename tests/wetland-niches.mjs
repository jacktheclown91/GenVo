import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {DIVING,waterColumn} from '../src/lineage/diving.js';
import {SPECIES} from '../src/organisms/species.js';
import {PARTS,registryProblems} from '../src/lineage/part-registry.js';
import {PART_SPRITES,hasComponent} from '../src/render/part-sprites.js';
import {isWaterDweller} from '../src/lineage/aquatic.js';
import {freshwaterPreference,harvestFreshwater} from '../src/ecology/freshwater-food.js';
import {wildStartPlan,wildBranch} from '../src/organisms/wild-bodies.js';
import {partEffectFactors} from '../src/lineage/part-abilities.js';
import {inheritBody} from '../src/lineage/body-inheritance.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

assert.deepEqual(registryProblems(),[]);
for(const id of ['silt-fin','reed-sieve-mouth'])assert.ok(PARTS[id]&&PART_SPRITES[id]&&hasComponent(id));
for(const k of ['rillsifter','mirelick'])assert.ok(wildStartPlan(k));
const sim=new Simulation('GENVO8-WETLAND-SLICE-2026',{player:false});
const r=sim.animals.filter(a=>a.species==='rillsifter'),m=sim.animals.filter(a=>a.species==='mirelick');
assert.equal(r.length,18);assert.equal(m.length,20);
assert.ok(r.every(a=>a.bodyPlan&&isWaterDweller(a)&&sim.world.water[sim.world.idx(a.x,a.y)]),'all aquatic founders have viable water spawn');
assert.ok(m.every(a=>a.bodyPlan&&!isWaterDweller(a)&&!sim.world.water[sim.world.idx(a.x,a.y)]),'land scavengers spawn ashore');
assert.equal(wildBranch(r[0]).label,'Rillsifter');assert.equal(wildBranch(m[0]).label,'Mirelick');
assert.ok(freshwaterPreference(r[0],'larvae')>freshwaterPreference(r[0],'duckweed'));
const fx=partEffectFactors(r[0]);assert.ok(Math.abs(fx.swimSpeed-1)<1e-8,'founders normalized to baseline');
const b=sim.world.idx(r[0].x,r[0].y),fields=sim.world.freshwaterFood;fields.larvae[b]=.4;
r[0].energy=SPECIES.rillsifter.maxEnergy*.45;
// Underwater food is eaten at depth (depth-respiration/1): the sieve feeds
// submerged in its own generated water column, then surfaces.
const column=waterColumn(sim.world,r[0].x,r[0].y);assert.ok(column>DIVING.minDepth,'the founder lives in diveable water');const surfaced=r[0].diveDepth;r[0].diveDepth=column-DIVING.clearance;
const before=fields.larvae[b];const meal=harvestFreshwater(sim,r[0],12,{kind:'larvae',x:r[0].x,y:r[0].y});if(surfaced===undefined)delete r[0].diveDepth;else r[0].diveDepth=surfaced;
assert.ok(meal&&meal.energyGain>0&&fields.larvae[b]<before,'sieve transfers finite underwater larvae biomass');
// Route all additional wildlife through the standard inheritance authority and persistence.
const original=new Set(r[0].bodyPlan.nodes.map(n=>n.partId));
const child=sim.spawnAnimal('rillsifter',r[0].x,r[0].y,[r[0],r[1]]);
assert.ok(inheritBody(sim,child,r[0],r[1]));
assert.ok(child.bodyPlan&&child.parentIds.length===2);
assert.ok(child.bodyPlan.nodes.some(n=>original.has(n.partId)));
const saved=createSimulationSnapshot(sim),restored=restoreSimulationSnapshot(structuredClone(saved));
const revived=restored.animals.find(a=>a.id===child.id);
assert.equal(revived.species,'rillsifter');assert.deepEqual(revived.bodyPlan,child.bodyPlan);
assert.ok(restored.animals.some(a=>a.species==='mirelick'));
// Ensure autonomous decision & metabolism runs without assuming one of the three original wildlife types.
for(let i=0;i<20;i++)sim.update(null);
assert.ok(sim.animals.some(a=>a.alive&&a.species==='rillsifter'));
assert.ok(sim.animals.some(a=>a.alive&&a.species==='mirelick'));
console.log('wetland niche vertical slice: PASS; population, finite feeding, heredity, persistence, decisions');
