import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {reviewSwimming,auditSwimmingPopulation} from '../src/lineage/swimming-review.js';
import {canSwim} from '../src/lineage/lifestyle.js';
const rows=[];
for(const count of [0,1,2,4]){let i=0;const bodyPlan=makePlan(founderPlan().nodes.map(n=>({...n,partId:n.socket?.startsWith('limb.')&&i++<count?'webbed-leg':n.partId})));const a={id:count,alive:true,bodyPlan,adaptations:['webbed-limbs'],x:1,y:1};const before=JSON.stringify(a);const r=reviewSwimming(a,{water:[1],idx(){return 0}});assert.equal(r.proposedEligible,count>=2);assert.equal(r.currentEligible,canSwim(a));assert.equal(r.strandingRisk,count<2);assert.equal(JSON.stringify(a),before);rows.push(r)}
assert.equal(reviewSwimming({adaptations:['webbed-limbs']}).legacyFallback,true);
assert.equal(reviewSwimming({adaptations:[]}).proposedEligible,false);
assert.equal(reviewSwimming({alive:false,adaptations:['webbed-limbs']}).proposedEligible,false);
const bad={bodyPlan:{schema:'unknown',nodes:[]},adaptations:['webbed-limbs']};assert.equal(reviewSwimming(bad).validBody,false);assert.equal(reviewSwimming(bad).legacyFallback,false);
const natural=[];for(const seed of ['TISSUE-REVIEW-A','TISSUE-REVIEW-B','TISSUE-REVIEW-C']){const sim=new Simulation(seed,{player:false});sim.update(null);const before=JSON.stringify(sim.animals);natural.push({seed,...auditSwimmingPopulation(sim.animals,sim.world)});assert.equal(JSON.stringify(sim.animals),before)}
fs.writeFileSync('docs/swimming-migration-audit.json',JSON.stringify({status:'PASS',scope:'Controlled anatomical cases plus three initial worlds; not user browser save inventory or long-run ecological evidence',fixtures:rows,natural},null,2));
console.log('Read-only swimming review: mounted/partial/legacy/invalid/dead cases and three natural founding populations PASS');
