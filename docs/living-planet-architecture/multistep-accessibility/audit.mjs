import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {founderPlan,mutatePlan} from '../../../src/lineage/body-inheritance.js';
import {PARTS,partDef} from '../../../src/lineage/part-registry.js';
import {serializePlan,validatePlan} from '../../../src/lineage/body-plan.js';
import {BIRTH_RULES} from '../../../src/lineage/birth-rules.js';
const output='docs/living-planet-architecture/multistep-accessibility/results.json';
if(fs.existsSync(output))throw Error('Preserve prior audit receipt; choose a new output before another experiment');
const limits={expandedPerGoal:64,maxDepth:10,frontier:2048},cache=new Map();let totalChoices=0;
const key=p=>serializePlan(p),root=founderPlan(),initial=key(root);
function expand(plan){const identity=key(plan);if(cache.has(identity))return cache.get(identity);const before=key(plan),edges=[];
 for(const asymmetric of [false,true]){let maximum=null;mutatePlan({chance:()=>asymmetric,int:(min,max)=>{assert.equal(min,0);maximum=max;return 0}},plan);if(maximum===null)continue;
  for(let choice=0;choice<=maximum;choice++){let event;const next=mutatePlan({chance:()=>asymmetric,int:(min,max)=>{assert.equal(min,0);assert.equal(max,maximum);return choice}},plan,{onMutation:e=>event=e});totalChoices++;assert.ok(validatePlan(next).ok);if(key(next)===before)continue;assert.ok(event.accepted);edges.push({plan:next,step:{asymmetric,choice,options:maximum+1,event}})}
 }
 assert.equal(key(plan),before);cache.set(identity,edges);return edges;
}
function distance(plan,target){const present=new Set(plan.nodes.map(n=>n.partId));function d(id,seen=new Set()){if(present.has(id))return 0;if(seen.has(id))return 1000;const def=PARTS[id];if(!def||def.tags.includes('exclusive'))return 1000;return 1+Math.max(0,...def.developmentalPrerequisites.map(q=>d(q,new Set([...seen,id]))))}return d(target)}
const legCount=p=>p.nodes.filter(n=>partDef(n.partId).tags.includes('leg')).length;
const capacity=p=>partDef(p.nodes.find(n=>!n.parent).partId).providedSockets.filter(s=>s.type==='limb').length;
function search(goal){const satisfied=goal.kind==='part'?p=>p.nodes.some(n=>n.partId===goal.id):p=>legCount(p)>=12;
 const heuristic=goal.kind==='part'?p=>distance(p,goal.id):p=>Math.max(0,12-legCount(p))+(capacity(p)<12?3+distance(p,'long-torso'):0);
 const frontier=[{plan:root,path:[],score:heuristic(root)}],seen=new Set([initial]);let expanded=0,pruned=0,reachedDepthLimit=false,witness=null;
 while(frontier.length&&expanded<limits.expandedPerGoal){frontier.sort((a,b)=>a.score-b.score||a.path.length-b.path.length||key(a.plan).localeCompare(key(b.plan)));const node=frontier.shift();if(satisfied(node.plan)){witness=node;break}if(node.path.length>=limits.maxDepth){reachedDepthLimit=true;continue}expanded++;
  for(const edge of expand(node.plan)){const identity=key(edge.plan);if(seen.has(identity))continue;seen.add(identity);const path=[...node.path,{...edge.step,body:edge.plan}],entry={plan:edge.plan,path,score:heuristic(edge.plan)};
   if(satisfied(edge.plan)){witness=entry;break}frontier.push(entry);
  }
  if(witness)break;
  if(frontier.length>limits.frontier){frontier.sort((a,b)=>a.score-b.score||a.path.length-b.path.length||key(a.plan).localeCompare(key(b.plan)));pruned+=frontier.length-limits.frontier;frontier.length=limits.frontier}
 }
 if(witness){let replay=root;for(const step of witness.path){let event;replay=mutatePlan({chance:()=>step.asymmetric,int:(min,max)=>{assert.equal(max+1,step.options);return step.choice}},replay,{onMutation:e=>event=e});assert.deepEqual(event,step.event);assert.equal(key(replay),key(step.body));assert.ok(validatePlan(replay).ok)}assert.ok(satisfied(replay));}
 return{...goal,status:witness?'legal-operator-witness':'not-found-within-bounds',expanded,visited:seen.size,frontierRemaining:frontier.length,pruned,reachedDepthLimit,path:witness?.path||null,finalPartCounts:witness?Object.fromEntries([...new Set(witness.plan.nodes.map(n=>n.partId))].map(id=>[id,witness.plan.nodes.filter(n=>n.partId===id).length])):null};
}
const rows=[];
for(const part of Object.values(PARTS)){const row=part.tags.includes('exclusive')?{kind:'part',id:part.id,status:'excluded-by-existing-mutation-policy',path:null}:search({kind:'part',id:part.id});rows.push(row);console.log(JSON.stringify({goal:part.id,status:row.status,steps:row.path?.length,expanded:row.expanded,cached:cache.size}));}
rows.push(search({kind:'limb-count',id:'twelve-legs'}));assert.equal(key(root),initial);
const files=['src/lineage/body-inheritance.js','src/lineage/body-plan.js','src/lineage/optional-loss.js','src/lineage/evolution-draft.js','src/lineage/part-registry.js','src/lineage/developmental-symmetry.js','src/lineage/birth-rules.js'];
const report={schema:'genvo.multistep-accessibility/1',scope:'Deterministic targeted controlled operator-index search from the unmodified simple founder. Each witness replays the actual mutatePlan authority, including current draft viability and /2 optional loss. Search goals guide this diagnostic only; ordinary mutations are unchanged. Not sampled births, inheritance frequencies, recombination proof, funded development, survival, reproduction or functional-physics acceptance.',policy:BIRTH_RULES,limits,search:'Best-first prerequisite-distance heuristic; full serialized-body deduplication; both mutation symmetry branches enumerated at every expanded state. Depth, expansion and frontier bounds are explicit. Failure to find a witness never establishes impossibility. Witnesses are not certified shortest paths.',sourceHashes:Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),founder:root,summary:{catalogParts:Object.keys(PARTS).length,partWitnesses:rows.filter(r=>r.kind==='part'&&r.status==='legal-operator-witness').length,partSearchUnresolved:rows.filter(r=>r.kind==='part'&&r.status==='not-found-within-bounds').map(r=>r.id),policyExcluded:rows.filter(r=>r.status==='excluded-by-existing-mutation-policy').map(r=>r.id),twelveLegs:rows.at(-1).status,cachedExpandedBodies:cache.size,enumeratedChoices:totalChoices},rows};
fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
