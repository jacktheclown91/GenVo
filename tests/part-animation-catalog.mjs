import assert from 'node:assert/strict';
import {PART_ANIMATIONS,animationForPart,expressionForNode} from '../src/render/part-animation-catalog.js';
import {partDef} from '../src/lineage/part-registry.js';
import {compileExpressionRig,coordinateExpression} from '../src/render/expression-coordinator.js';
for(const [id,definition] of Object.entries(PART_ANIMATIONS)){
 assert.ok(partDef(id),'animation belongs to a registered anatomical part');
 assert.equal(definition.partId,id);
 assert.throws(()=>{definition.channels.extent.min=-10},TypeError,'shared joint definitions are immutable');
 assert.throws(()=>{definition.responses[0].actions.push('unsupported')},TypeError);
 const rig=compileExpressionRig([expressionForNode({id:'instance-left',partId:id}),expressionForNode({id:'instance-right',partId:id})],1);
 const result=coordinateExpression({tick:1,dt:.1,parts:rig.parts,action:'idle',signals:{pain:{intensity:1,tick:1,source:'recorded injury'}},previous:{'instance-left':{extent:.4},'instance-right':{extent:.9}}});
 assert.ok(result.pose['instance-left'].extent<result.pose['instance-right'].extent);
 assert.ok(Object.values(result.pose).every(p=>p.extent>=definition.channels.extent.min&&p.extent<=definition.channels.extent.max));
}
assert.equal(animationForPart('walking-leg'),null,'unimplemented animations are explicitly unsupported');
assert.equal(expressionForNode({id:'leg',partId:'walking-leg'}),null);
console.log('registered immutable part-owned responses compile into independent bounded node rigs PASS');
