import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {GIANT_SIZE,BODY_SIZE} from '../src/organisms/body-size.js';
import {organismStudy,readOrganismStudy} from '../src/render/organism-study.js';
import {bodyDimensionsOf} from '../src/organisms/body-mass.js';
import {developmentalPreview} from '../tools/creature-lab/development-preview.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const sim=new Simulation('GIANT-STUDY',{player:true,dayClock:true,metabolism:true,bodySize:GIANT_SIZE.policy});
const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'fixed'})));
const before=snapshot(),source={seed:sim.seed,day:sim.day,bodySizeRules:GIANT_SIZE.policy};
for(const size of [.5,1,1.5,2,3]){
  const a=structuredClone(sim.player());a.bodySize={schema:1,alleles:[Math.log(size),Math.log(size)]};
  const study=organismStudy(a,source),copy=readOrganismStudy(JSON.stringify(study));
  assert.equal(copy.source.bodySizeRules,GIANT_SIZE.policy);
  assert.deepEqual(copy.animal.bodySize,a.bodySize);
  assert.deepEqual(bodyDimensionsOf(copy.animal),bodyDimensionsOf(a));
  for(const age of [0,30,100]){
    const preview=developmentalPreview(copy.animal,age),dimensions=bodyDimensionsOf(preview.animal);
    assert.ok(Math.abs(dimensions.adultScale-size)<1e-12);
    assert.equal(dimensions.currentScale,dimensions.adultScale*preview.development.growth);
  }
  if(size>2){
    const old=structuredClone(study);delete old.source.bodySizeRules;
    assert.throws(()=>readOrganismStudy(old),/Invalid inherited body size/);
    old.source.bodySizeRules=BODY_SIZE.policy;
    assert.throws(()=>readOrganismStudy(old),/Invalid inherited body size/);
  }
}
const old=organismStudy(sim.player());assert.equal(old.source.bodySizeRules,undefined);
assert.deepEqual(readOrganismStudy(JSON.stringify(old)),old);
for(const policy of ['unknown',null,1])assert.throws(()=>organismStudy(sim.player(),{bodySizeRules:policy}),/size policy/);
const corrupt=organismStudy(sim.player(),source);corrupt.animal.bodySize.alleles=[Math.log(3.1),Math.log(3.1)];
assert.throws(()=>readOrganismStudy(corrupt),/Invalid inherited body size/);
assert.equal(snapshot(),before,'All study/preview work leaves the canonical world exact');
console.log('Giant study PASS: versioned 0.5 to 3x import/export, growth, legacy2x bounds, invalid-policy rejection and full graph purity.');
