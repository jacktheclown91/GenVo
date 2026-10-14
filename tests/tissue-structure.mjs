import assert from 'node:assert/strict';
import {PARTS} from '../src/lineage/part-registry.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {attachHeadPlan,detachHeadPlan} from '../src/lineage/head-plan.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {bodyMass,TISSUE_SCHEMA,TISSUE_PARTS,tissueInventory,evaluateTissueStructure} from '../src/organisms/body-mass.js';
import {SPECIES} from '../src/organisms/species.js';
import {developmentFor} from '../src/family/family.js';

assert.deepEqual(Object.keys(TISSUE_PARTS).sort(),Object.keys(PARTS).sort());
// Artificial units only: these numbers do NOT propose biological calibration.
const calibration={schema:TISSUE_SCHEMA,units:{volume:'m3',density:'kg/m3'},materials:{test:{density:2}},parts:Object.fromEntries(Object.entries(TISSUE_PARTS).map(([id,p])=>[id,Object.fromEntries(p.components.map(c=>[c,{volume:1,material:'test'}]))]))};
const original=founderPlan(),explicit=attachHeadPlan(original),torso=detachHeadPlan(explicit).plan;
const before=JSON.stringify(original),inventory=tissueInventory(original);
assert.ok(inventory.ok);assert.equal(inventory.entries.filter(e=>e.partId==='head-base').length,1);
assert.equal(tissueInventory(explicit).entries.filter(e=>e.partId==='head-base').length,1);
assert.equal(tissueInventory(torso).entries.filter(e=>e.partId==='head-base').length,0);
assert.equal(evaluateTissueStructure(original).reason,'uncalibrated');
const base=evaluateTissueStructure(original,calibration);assert.ok(base.ok);
assert.equal(evaluateTissueStructure(explicit,calibration).mass,base.mass,'Mounting the same structural head does not duplicate its tissue');
assert.equal(evaluateTissueStructure(torso,calibration).mass,base.mass-8);
assert.equal(evaluateTissueStructure(original,calibration,{growth:.5}).mass,base.mass/8);
assert.equal(evaluateTissueStructure(original,calibration,{growth:.5}).volume,base.volume/8);
assert.equal(base.mass,base.volume*2);assert.equal(JSON.stringify(original),before,'Assessment preserves inherited graph');
const missing=structuredClone(calibration);delete missing.parts['head-base'].organ;
assert.equal(evaluateTissueStructure(original,missing).ok,false);
for(const change of [c=>c.parts['head-base'].organ.volume=Number.MAX_VALUE,c=>c.parts['head-base'].organ.volume=-1,c=>c.materials.test.density=NaN,c=>c.units.volume='pixels',c=>c.parts['head-base'].organ.material='missing']){
 const invalid=structuredClone(calibration);change(invalid);assert.equal(evaluateTissueStructure(original,invalid).reason,'invalid-calibration');
}
assert.equal(evaluateTissueStructure(original,calibration,{growth:0}).ok,false);
const invalid=structuredClone(original);invalid.nodes.push({...invalid.nodes[0]});assert.equal(tissueInventory(invalid).reason,'invalid-body');
// Each of the nine torso identities gets its own independently calibrated slots.
for(const def of Object.values(PARTS).filter(p=>p.tags.includes('root'))){const plan=makePlan([{partId:def.id,parent:null,socket:null}],{headMode:'torso'});const r=evaluateTissueStructure(plan,calibration);assert.ok(r.ok);assert.equal(r.rows.length,TISSUE_PARTS[def.id].components.length)}
for(const species of Object.keys(SPECIES))for(const age of [0,8,100]){const a={species,age,bodyPlan:explicit};assert.equal(bodyMass(a),SPECIES[species].mass*developmentFor(a).growth**3,'Unreviewed tissue coefficients never change gameplay mass')}
console.log('Tissue structure: 79-part coverage, net ownership, head modes, cubic development, invalid calibration rejection and unchanged gameplay mass PASS');
