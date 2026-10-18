import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {founderPlan,inheritBody,mutatePlan} from '../../../src/lineage/body-inheritance.js';
import {serializePlan,validatePlan} from '../../../src/lineage/body-plan.js';
import {createDraft,place} from '../../../src/lineage/evolution-draft.js';
import {partEffectFactors} from '../../../src/lineage/part-abilities.js';
const root='docs/living-planet-architecture/multistep-accessibility',audit=JSON.parse(fs.readFileSync(root+'/results.json'));
const output=root+'/pipeline-check.json';if(fs.existsSync(output))throw Error('Preserve prior pipeline receipt');
const rows=[];
for(const row of audit.rows.filter(r=>r.path)){let plan=founderPlan();const steps=[];
 for(const step of row.path){const original=serializePlan(plan),parents=[{id:'diagnostic-mother',species:'genvo',bodyPlan:plan},{id:'diagnostic-father',species:'genvo',bodyPlan:plan}],parentBefore=structuredClone(parents),child={id:'diagnostic-child',species:'genvo',adaptations:[]},draws=[];
  assert.ok(inheritBody({rng:{chance:p=>{draws.push(p);return draws.length===1?true:step.asymmetric},int:(min,max)=>{assert.equal(min,0);assert.equal(max+1,step.options);return step.choice}}},child,...parents));
  assert.deepEqual(draws,[.25,.05]);assert.deepEqual(parents,parentBefore);assert.equal(serializePlan(plan),original);assert.equal(serializePlan(child.bodyPlan),serializePlan(step.body));assert.ok(validatePlan(child.bodyPlan).ok);assert.equal(child.bodyVariation.guidedOverride,undefined);plan=child.bodyPlan;steps.push({bodyId:plan.id,operator:child.bodyVariation.operator,branch:child.bodyVariation.branch,choice:child.bodyVariation.choice,adaptations:child.adaptations});
 }
 rows.push({goal:row.id,steps,finalBodyId:plan.id,factors:partEffectFactors({species:'genvo',bodyPlan:plan})});
}
const draft=createDraft({base:founderPlan(),ancestry:[],budget:Infinity});assert.ok(place(draft,'head-base','root','head').ok);assert.ok(validatePlan(draft.plan).ok);
const body=draft.plan,before=serializePlan(body),choices=[];
for(const asymmetric of [false,true]){let max;mutatePlan({chance:()=>asymmetric,int:(_,maximum)=>{max=maximum;return 0}},body);for(let choice=0;choice<=max;choice++){let event;const next=mutatePlan({chance:()=>asymmetric,int:()=>choice},body,{onMutation:e=>event=e});const originalFace=body.nodes.filter(n=>n.parent==='root/head'),nextFace=next.nodes.filter(n=>n.parent==='root/head');choices.push({asymmetric,choice,event,facialChange:JSON.stringify(originalFace)!==JSON.stringify(nextFace)})}}
assert.equal(serializePlan(body),before);const faceChanges=choices.filter(c=>c.facialChange&&c.event.operator!=='delete');
const report={schema:'genvo.accessibility-pipeline-check/1',scope:'Controlled diagnostic calls to actual inheritBody using two identical synthetic parent body records, clean child adaptations and explicit mutation-index/chance outcomes. Confirms legal body paths survive this pipeline configuration; not real conception, complete inherited genomes, births, ecological viability, or natural frequencies. Factors are existing abstract coefficient projections, not observed behavior or calibrated physics.',inputSha256:createHash('sha256').update(fs.readFileSync(root+'/results.json')).digest('hex'),sourceHashes:Object.fromEntries(['src/lineage/body-inheritance.js','src/lineage/part-abilities.js'].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),pathGoals:rows.length,totalPipelineSteps:rows.reduce((n,r)=>n+r.steps.length,0),rows,headedFace:{scope:'Separate valid editor-produced headed founder. Full current operator enumeration diagnoses existing facial change reachability; no mounted head endpoint is injected into an actual organism.',body,enumeratedChoices:choices.length,acceptedNonDeletionFacialChanges:faceChanges.length,choices}};
fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify({pathGoals:report.pathGoals,pipelineSteps:report.totalPipelineSteps,headedChoices:choices.length,acceptedNonDeletionFacialChanges:faceChanges.length,twelveLegs:rows.find(r=>r.goal==='twelve-legs')}));
