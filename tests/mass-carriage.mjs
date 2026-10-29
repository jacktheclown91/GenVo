import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {ANATOMICAL_MASS,bodyMass} from '../src/organisms/body-mass.js';
import {locomotionStyle,visualBuildWeight,locomotionOffsets,locomotionCacheToken} from '../src/render/locomotion-style.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const sim=new Simulation('MASS-CARRIAGE',{player:true,worldGenerator:'planetary/1'}),source=sim.player();
const maturity=SPECIES[source.species].maturity;
const sized=size=>({...source,age:maturity,massPolicy:ANATOMICAL_MASS,bodySize:{schema:1,alleles:[Math.log(size),Math.log(size)]}});
const bodies=[.5,1,1.5,2].map(sized),styles=bodies.map(locomotionStyle);
assert.ok(styles[1].heavy<styles[2].heavy&&styles[2].heavy<=styles[3].heavy,'same plan expresses actual inherited mass continuously');
for(const [i,a] of bodies.entries()){
  assert.equal(visualBuildWeight(a).mass,bodyMass(a));
  assert.equal(visualBuildWeight(a).source,ANATOMICAL_MASS);
  assert.equal(locomotionStyle(a),styles[i],'unchanged actual mass reuses the derived style');
  for(let phase=0;phase<8;phase+=.125){
    const pose=locomotionOffsets(styles[i],{phase,moving:true,baseBob:Math.sin(phase*Math.PI/4)});
    assert.ok(Object.values(pose).every(Number.isFinite));
    assert.equal(pose.sway,0,'mass never translates planted feet sideways');
  }
}
const growing=sized(2),adult=locomotionStyle(growing),adultToken=locomotionCacheToken(growing);
growing.age=0;
const newborn=locomotionStyle(growing);
assert.ok(newborn.heavy<adult.heavy,'in-place age change cannot retain adult weight');
assert.notEqual(locomotionCacheToken(growing),adultToken,'cached autonomous composition distinguishes juvenile mass');
growing.age=maturity;
assert.deepEqual(locomotionStyle(growing),adult);
const small=sized(1.49),near=sized(1.5);
assert.ok(Math.abs(locomotionStyle(small).heavy-locomotionStyle(near).heavy)<.03,'no discrete biological size classes');
const legacy={...source};delete legacy.massPolicy;delete legacy.bodySize;
const preceding=locomotionStyle(legacy);
legacy.age=0;legacy.bodySize=sized(2).bodySize;
assert.equal(locomotionStyle(legacy),preceding,'historical carriage remains exact');
assert.equal(locomotionCacheToken(legacy),'','historical sprite cache identity remains exact');
const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'mass-carriage'})));
const before=snapshot();
for(const a of sim.animals){locomotionStyle(a);visualBuildWeight(a);locomotionCacheToken(a)}
assert.equal(snapshot(),before,'canonical mass reads preserve the full saved graph and RNG');
console.log('Mass carriage PASS: actual inherited/current mass, four continuous sizes, juvenile cache refresh, stable style reuse, exact legacy path, no side translation and complete biological graph purity.');
