import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PARTS} from '../../src/lineage/part-registry.js';
import {founderPlan,mutatePlan,BODY_VARIATION} from '../../src/lineage/body-inheritance.js';
import {validatePlan} from '../../src/lineage/body-plan.js';
import {ASYMMETRIC_SHARE,DEVELOPMENTAL_SYMMETRY} from '../../src/lineage/developmental-symmetry.js';
const base=founderPlan(),before=JSON.stringify(base),rows=[];
for(const asymmetric of [false,true]){
 let bound=null;mutatePlan({chance:()=>asymmetric,int:(min,max)=>{assert.equal(min,0);bound=max;return min}},base);
 if(bound===null)continue;assert.ok(bound<10000);
 for(let choice=0;choice<=bound;choice++){
  const calls=[],plan=mutatePlan({chance:()=>asymmetric,int:(min,max)=>{calls.push({min,max});assert.equal(max,bound);return choice}},base);assert.equal(calls.length,1);assert.deepEqual(validatePlan(plan).errors,[]);
  const from=new Map(base.nodes.map(n=>[n.id,n])),to=new Map(plan.nodes.map(n=>[n.id,n]));
  rows.push({branch:asymmetric?'asymmetric':'paired',choice,options:bound+1,changed:plan.id!==base.id,planId:plan.id,nodeCount:plan.nodes.length,addedSockets:plan.nodes.filter(n=>!from.has(n.id)).map(n=>({id:n.id,part:n.partId})),deletedSockets:base.nodes.filter(n=>!to.has(n.id)).map(n=>({id:n.id,part:n.partId})),replacements:plan.nodes.filter(n=>from.has(n.id)&&from.get(n.id).partId!==n.partId).map(n=>({id:n.id,from:from.get(n.id).partId,to:n.partId}))});
 }
}
assert.equal(JSON.stringify(base),before);
const inventory=Object.values(PARTS),matrix=JSON.parse(fs.readFileSync('docs/living-planet-architecture/part-gap-matrix.json','utf8'));
assert.deepEqual(matrix.rows.map(r=>r.id).sort(),inventory.map(p=>p.id).sort(),'the reviewed 79-part inventory must match current source');
const hypothetical=new Set(base.nodes.map(n=>n.partId));let changed=true;while(changed){changed=false;for(const p of inventory)if(!p.tags.includes('exclusive')&&!hypothetical.has(p.id)&&p.developmentalPrerequisites.every(q=>hypothetical.has(q))){hypothetical.add(p.id);changed=true}}
const files=['src/lineage/body-inheritance.js','src/lineage/evolution-draft.js','src/lineage/part-registry.js','src/lineage/developmental-symmetry.js'];
const report={schema:'genvo.developmental-operator-audit/1',scope:'Exhaustive enumeration of one mutation operator choice from the simple founder in each existing symmetry branch, with controlled choice indices. Not births, random occurrence rates, viable growth or a multi-step reachability proof. Metadata closure below is only a deliberately weaker comparison, ignoring placement, funding and physical viability.',sourceHashes:Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),policy:{bodyMutationChance:BODY_VARIATION.mutationChance,developmentalSymmetry:DEVELOPMENTAL_SYMMETRY.enabled,asymmetricShare:ASYMMETRIC_SHARE},founder:{id:base.id,nodes:base.nodes.length,parts:base.nodes.map(n=>n.partId)},summary:{catalogParts:inventory.length,enumeratedChoices:rows.length,changedChoices:rows.filter(r=>r.changed).length,deletedSocketChoices:rows.filter(r=>r.deletedSockets.length).length,minNodes:Math.min(...rows.map(r=>r.nodeCount)),maxNodes:Math.max(...rows.map(r=>r.nodeCount)),metadataClosureParts:hypothetical.size,exclusiveParts:inventory.filter(p=>p.tags.includes('exclusive')).map(p=>p.id)},rows,catalog:inventory.map(p=>({id:p.id,prerequisites:p.developmentalPrerequisites,exclusive:p.tags.includes('exclusive'),metadataClosure:hypothetical.has(p.id),appearsInFounderOrOneStep:base.nodes.some(n=>n.partId===p.id)||rows.some(r=>r.replacements.some(n=>n.to===p.id)||r.addedSockets.some(n=>n.part===p.id))}))};
const out='docs/living-planet-architecture/developmental-operator-audit.json';if(fs.existsSync(out))throw Error('Audit receipt exists; preserve before rerun');fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
