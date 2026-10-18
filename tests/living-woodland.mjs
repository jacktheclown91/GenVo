import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {World} from '../src/world/world.js';
import {PLANTS} from '../src/sim/config.js';
import {FLORA_TISSUES,founderFloraGenome,validFloraGenome} from '../src/ecology/flora-genotype.js';
import {advancePlantInputs,validatePlantResources} from '../src/ecology/plant-resources.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {biomeAt} from '../src/world/biomes.js';

const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'e2-woodland'}));
assert.ok(PLANTS.woodspire.dispersal.seedLimited&&PLANTS.woodspire.carry>PLANTS.bramble.carry,
 'a slow woody producer participates in the existing limited growth and seed systems');
const world=new World('E2-WOODLAND',{generator:'coastal/1'}),w2=new World('E2-WOODLAND',{generator:'coastal/1'});
assert.deepEqual(world.plants.woodspire,w2.plants.woodspire,'woody founder geography is deterministic');
const trees=[...world.plants.woodspire].filter(x=>x>.02);
assert.ok(trees.length>10&&trees.length<world.len/4,'woody stands have finite sparse founding density');
assert.ok([...world.water].every((v,i)=>!v||world.plants.woodspire[i]===0),'no tree biomass is placed into water');
const g=founderFloraGenome('woodspire');
assert.ok(validFloraGenome(g,'woodspire')&&FLORA_TISSUES.woodspire.seed>0,'woody seed genomes belong to real inherited tissue');
assert.ok(PLANTS.woodspire.growth<PLANTS.bramble.growth,'woody organisms grow more slowly');
const sim=new Simulation('E2-WOODLAND',{player:false,worldGenerator:'coastal/1'});
const w=sim.world,d=sim.dispersal;
assert.ok(d.seedReserve.woodspire instanceof Float32Array&&d.coatReserve.woodspire instanceof Float32Array);
assert.ok(d.floraState.adults.woodspire instanceof Map);
validatePlantResources(w,w.plantResources);
const wooded=[...w.plants.woodspire].findIndex(x=>x>.15&&!w.water[w.plants.woodspire.indexOf(x)]);
// Choose an actual planted tile, not a synthetic class label.
let i=-1;for(let p=0;p<w.len;p++)if(w.plants.woodspire[p]>.15&&!w.water[p]&&w.plants.sunmoss[p]>.2){i=p;break}
assert.ok(i>=0,'forest and ground producers inhabit some of the same real cells');
const current=w.biomeAt(i%w.n+.5,Math.floor(i/w.n)+.5,{temp:.6,rain:.6,frontDay:1});
const originalTree=w.plants.woodspire[i],oldMoss=w.plants.sunmoss[i];
w.plants.woodspire[i]=.9;
assert.equal(biomeAt(w,i,{temp:.6,rain:.6,frontDay:1}).code,'woodland','physical tree density creates a readable woodland habitat');
w.plants.woodspire[i]=0;
assert.notEqual(biomeAt(w,i,{temp:.6,rain:.6,frontDay:1}).code,'woodland','removing actual trees removes the woodland classification');
w.plants.woodspire[i]=originalTree;
const base=snap(sim),sun=restoreSimulationSnapshot(structuredClone(base)),shade=restoreSimulationSnapshot(structuredClone(base));
sun.world.plants.woodspire[i]=0;
shade.world.plants.woodspire[i]=1;
sun.climate={temp:.65,rain:.28};shade.climate={temp:.65,rain:.28};
advancePlantInputs(sun);advancePlantInputs(shade);
assert.ok(shade.world.plantResources.energy.sunmoss[i]<sun.world.plantResources.energy.sunmoss[i],
 'standing woody canopy actually limits ground-plant solar reserves');
assert.ok(shade.world.plantResources.totals.photosynthesis<sun.world.plantResources.totals.photosynthesis,
 'intercepted sunlight is not invented as another free energy input');
assert.equal(w.plants.sunmoss[i],oldMoss,'competition observations do not mutate original world');
const biomeBefore=w.biomeAt(i%w.n+.5,Math.floor(i/w.n)+.5,sim.climate);
assert.equal(biomeBefore.code,biomeAt(w,i,w.biomeClimate(sim.climate)).code);
const save=snap(sim),copy=restoreSimulationSnapshot(structuredClone(save));
assert.deepEqual(snap(copy),save,'tree genotype and physical reserves round-trip through normal saves');
for(let t=0;t<96;t++){sim.update(null);copy.update(null);}
assert.deepEqual(snap(sim),snap(copy),'two real tree-and-animal worlds evolve identically after restore');
// An older save with no woody producer must NOT acquire invented trees or wood
// reserves during schema-compatible load.
const old=structuredClone(save);
delete old.world.plants.woodspire;delete old.world.seedBank.woodspire;
delete old.world.plantResources.energy.woodspire;delete old.world.plantResources.limits.woodspire;
for(const name of ['active','kindCodes','bankGenomes','producerOrigins','seedReserve','coatReserve'])
 if(old.controllers.dispersal[name])delete old.controllers.dispersal[name].woodspire;
for(const name of ['adults','seeds'])if(old.controllers.dispersal.floraState?.[name])
 delete old.controllers.dispersal.floraState[name].woodspire;
if(old.controllers.dispersal.floraState?.genomes)old.controllers.dispersal.floraState.genomes.delete(g.id);
const upgraded=restoreSimulationSnapshot(old);
assert.ok(upgraded.world.plants.woodspire.every(x=>x===0),'legacy save never gets retroactively generated tree biomass');
assert.ok(upgraded.world.seedBank.woodspire.every(x=>x===0),'legacy save never gets free tree seeds');
assert.ok(upgraded.world.plantResources.energy.woodspire.every(x=>x===0),'legacy save never gets free tree energy');
assert.ok(upgraded.dispersal.active.woodspire instanceof Set,'new species may join old-save dispersal registry');
assert.ok(validFloraGenome(upgraded.dispersal.genomeAt('woodspire',i),'woodspire'),'founder tree genotype available without seed fabrication');
console.log('E2 living woodland: finite slow canopy, actual shade competition, tree genomes, dynamic biome and legacy-safe exact resume PASS');
