// Read-only evidence from an actual autonomous checkpoint; no simulation calls.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deserialize} from 'node:v8';
import {createHash} from 'node:crypto';
import {PARTS} from '../src/lineage/part-registry.js';
import {validatePlan} from '../src/lineage/body-plan.js';
const [input,out]=process.argv.slice(2);assert.ok(input&&out&&!fs.existsSync(out));
const bytes=fs.readFileSync(input),saved=deserialize(Buffer.from(bytes));
const regions=[{key:'active',snapshot:saved},...(saved.core.planetaryTravel?.sessions||[])];
const animals=new Map();for(const r of regions)for(const a of r.snapshot.animals){assert.ok(!animals.has(a.id),'planetary IDs remain unique');animals.set(a.id,{a,region:r.key})}
const rows=[],excluded={noRetainedMatchingParents:0,noNovelPart:0};let recordedBirths=0,acceptedMutationRecords=0;
const capabilities=plan=>new Set(plan.nodes.flatMap(n=>PARTS[n.partId]?.actionCapabilities||[]));
for(const {a,region} of animals.values()){
 if(a.parentIds?.length!==2)continue;recordedBirths++;
 const v=a.bodyVariation;if(!v?.attempted||!v.accepted||v.operator==='delete'||v.guidedOverride||v.finalBody!==a.bodyPlan?.id)continue;acceptedMutationRecords++;
 const provenance=a.bodyInheritance?.parents;if(provenance?.length!==2){excluded.noRetainedMatchingParents++;continue}
 const parents=provenance.map(p=>animals.get(p.id)?.a);
 if(parents.some((p,i)=>!p||p.bodyPlan?.id!==provenance[i].bodyId)||!provenance.every(p=>a.parentIds.includes(p.id))){excluded.noRetainedMatchingParents++;continue}
 const parentParts=new Set(parents.flatMap(p=>p.bodyPlan.nodes.map(n=>n.partId))),newParts=[...new Set(a.bodyPlan.nodes.map(n=>n.partId))].filter(p=>!parentParts.has(p));
 if(!newParts.length){excluded.noNovelPart++;continue}
 const previous=new Set(parents.flatMap(p=>[...capabilities(p.bodyPlan)])),newCapabilities=[...capabilities(a.bodyPlan)].filter(c=>!previous.has(c));
 assert.ok(validatePlan(a.bodyPlan).ok);
 rows.push({id:a.id,region,species:a.species,parentIds:a.parentIds,generation:a.generation,birthDay:a.birthDay,birthTick:a.birthTick,alive:a.alive,age:a.age,newParts,newRegisteredCapabilities:newCapabilities,mutation:v,bodyInheritance:a.bodyInheritance,bodyPlan:a.bodyPlan,parents:parents.map(p=>({id:p.id,bodyPlan:p.bodyPlan,genes:p.genes,reproductiveGenome:p.reproductiveGenome})),genes:a.genes,reproductiveGenome:a.reproductiveGenome});
}
const report={scope:'Read-only actual autonomous checkpoint observations. Naturally recorded offspring with accepted non-guided mutation, complete retained parental bodies matching birth provenance, and parts absent from both parents. Registered action labels are not observed functional performance, viable adulthood or descendant reproduction. Founding populations already contain established organism types.',input,inputBytes:bytes.length,inputSha256:createHash('sha256').update(bytes).digest('hex'),activeTick:saved.core.tickCount,regions:regions.length,retainedAnimals:animals.size,retainedParentedAnimals:recordedBirths,acceptedMutationRecords,excluded,verifiedNovelPartBirths:rows.length,withNovelRegisteredCapability:rows.filter(r=>r.newRegisteredCapabilities.length).length,rows};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,rows:rows.map(r=>({id:r.id,parentIds:r.parentIds,generation:r.generation,birthDay:r.birthDay,newParts:r.newParts,newRegisteredCapabilities:r.newRegisteredCapabilities}))},null,2));
