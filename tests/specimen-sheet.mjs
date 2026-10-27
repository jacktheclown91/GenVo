import assert from 'node:assert/strict';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {Simulation} from '../src/sim/simulation.js';
import {specimenModel,specimenSheetHTML} from '../assets/ui/specimen-sheet.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
// Model fixture only: generated animals are explicitly recorded, not presented as a natural playthrough.
const sim=new Simulation('SPECIMEN-MODEL-V1',{player:true}),a=sim.player(),wild=sim.animals.find(v=>v.species!=='genvo');assert.ok(wild);sim.discovery.noteCreatureAppearance(wild);sim.discovery.noteCreatureAppearance(a);const observation=sim.discovery.observedBodies.find(v=>v.id===wild.id),before=JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'specimen-model'}))),retained=JSON.stringify(observation);
const current=specimenModel({known:true,current:true,name:'Current',animal:a},sim),recorded=specimenModel({known:true,name:'Record <unsafe>',animal:observation},sim);
assert.equal(current.mounted.reduce((n,p)=>n+p.count,0),a.bodyPlan.nodes.length);assert.equal(recorded.mounted.reduce((n,p)=>n+p.count,0),observation.bodyPlan.nodes.length);assert.deepEqual(recorded.verbs,[],'recorded anatomy cannot claim current action availability');assert.equal(recorded.observedDay,observation.day);assert.equal(recorded.actorId,observation.id);
assert.equal(specimenModel({known:false,animal:observation},sim),null);assert.equal(specimenModel({known:true,animal:{...observation,bodyPlan:{schema:'unknown',nodes:[]}}},sim),null);assert.equal(specimenModel({known:true,animal:{...observation,genes:null}},sim),null);
const require=createRequire(import.meta.url),sourceURL=new URL('../src/ui/field-guide.js',import.meta.url),guideSource=fs.readFileSync(sourceURL,'utf8'),presentationSource=guideSource.includes("from '../../assets/ui/specimen-sheet.js'")?guideSource:require('../tools/specimen-presentation-candidate.cjs').candidateGuide(guideSource),transformed=presentationSource.replace(/from\s*(['"])([^'"]+)\1/g,(all,q,spec)=>'from '+q+new URL(spec,sourceURL).href+q),{FieldGuide}=await import('data:text/javascript;base64,'+Buffer.from(transformed).toString('base64'));
const entries=FieldGuide.prototype.creatures.call({getSim:()=>sim},sim.discovery),sameBody=entries.filter(e=>e.id===a.bodyPlan.id);assert.equal(sameBody.length,2,'live body and retained example must both remain accessible when anatomy matches');assert.equal(new Set(entries.map(e=>e.key)).size,entries.length);assert.ok(sameBody.some(e=>e.key==='current:'+a.bodyPlan.id&&e.current));assert.ok(sameBody.some(e=>e.key==='observed:'+a.bodyPlan.id&&!e.current));assert.deepEqual(specimenModel(sameBody.find(e=>!e.current),sim).verbs,[]);
// Controlled retained-anatomy fixture: potential differences never claim the
// observed animal's current ability, intent, location or reproductive outcome.
const swimPlan=makePlan(founderPlan().nodes.map(n=>({...n,partId:n.partId==='walking-leg'?'webbed-leg':n.partId})));
assert.ok(validatePlan(swimPlan).ok);
const swimRecord={...observation,species:a.species,bodyPlan:swimPlan,genes:{...a.genes},adaptations:[],anatomy:{}};
const compared=specimenModel({known:true,name:'Retained swimmer',animal:swimRecord},sim);
assert.ok(compared.differences.some(text=>text.includes('swimming anatomy')));
assert.deepEqual(compared.verbs,[],'Observed anatomical potential is not current action availability');
assert.deepEqual(current.differences,[],'The live specimen is not compared against itself');
const sameEyes={...a,genes:{...a.genes,senses:a.genes.senses*.5}};
assert.ok(!specimenModel({known:true,name:'Equal eye anatomy',animal:sameEyes},sim).differences.some(text=>/eyes|eye anatomy/.test(text)),'A sighting cannot reveal hidden sensory sensitivity from identical eyes');
assert.equal(specimenModel({known:false,animal:swimRecord},sim),null,'Comparison never reveals an unknown body');
const comparisonHTML=specimenSheetHTML({known:true,name:'Retained swimmer',animal:swimRecord},sim);
assert.match(comparisonHTML,/Compared with your body/);
assert.match(comparisonHTML,/retained observation/);
const html=specimenSheetHTML({known:true,name:'Record <unsafe>',animal:observation},sim);assert.ok(html.includes('Record &lt;unsafe&gt;'));assert.ok(!html.includes('Record <unsafe>'));assert.ok(html.includes('Current health, intent and location are not recorded here.'));assert.equal(JSON.stringify(observation),retained);assert.equal(JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'specimen-model'}))),before,'specimen presentation must not change any canonical snapshot field');console.log('Specimen model PASS: retained anatomy, no invented current state, escaping, no fallback and exact canonical graph parity.');
