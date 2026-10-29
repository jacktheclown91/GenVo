import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {organismStudy,readOrganismStudy} from '../src/render/organism-study.js';
import {bodyDimensionsOf} from '../src/organisms/body-mass.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {developmentalPreview} from '../tools/creature-lab/development-preview.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const sim=new Simulation('ORGANISM-STUDY',{player:true,dayClock:true,metabolism:true,bodySize:true}),a=sim.player(),snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'study'}))),before=snapshot();
const study=organismStudy(a,{seed:sim.seed,day:sim.day}),copy=readOrganismStudy(JSON.stringify(study));
assert.deepEqual(bodyDimensionsOf(copy.animal),bodyDimensionsOf(a));assert.deepEqual(phenotypeFor(copy.animal),phenotypeFor(a));assert.deepEqual(copy.animal.bodyPlan,a.bodyPlan);assert.deepEqual(copy.animal.bodySize,a.bodySize);assert.deepEqual(copy.source,{seed:sim.seed,day:sim.day});
copy.animal.bodySize.alleles[0]=Math.log(2);copy.animal.genes.body+=.01;assert.notDeepEqual(copy.animal.bodySize,a.bodySize,'imported studies own their data');
for(const age of [0,30,100]){const p=developmentalPreview(study.animal,age),d=bodyDimensionsOf(p.animal);assert.equal(d.currentScale,d.adultScale*p.development.growth,'inherited size and canonical growth combine once');assert.equal(p.animal.bodySize,study.animal.bodySize)}
const legacy={...a};delete legacy.bodySize;const old=organismStudy(legacy);assert.equal(old.animal.bodySize,undefined);assert.equal(bodyDimensionsOf(old.animal).adultScale,1);
for(const change of [s=>s.animal.bodySize.alleles=[9,9],s=>s.animal.age=-1,s=>delete s.animal.genes.motion,s=>s.animal.bodyPlan.nodes[0].partId='unknown',s=>s.animal.massPolicy='unknown']){const bad=structuredClone(study);change(bad);assert.throws(()=>readOrganismStudy(bad))}
assert.throws(()=>readOrganismStudy({format:'save'}));assert.throws(()=>organismStudy({...a,bodyPlan:null}));assert.equal(snapshot(),before,'all export, import and preview work leaves the full saved graph exact');
console.log('Organism study PASS: real inherited size, genotype, pigment, anatomy, canonical growth, legacy fallback, rejection paths, owned data and full snapshot parity.');
