import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {ANATOMICAL_MASS,LEGACY_MASS,adultBodyMass,basalResourceCosts} from '../src/organisms/body-mass.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {previewBody,measure} from '../src/ui/creature-editor.js';
import {bodyCostReading} from '../src/ui/body-cost-reading.js';
import {growthCostForDay,advanceAgeDay,GROWTH_RESERVE_FLOOR} from '../src/ecology/juvenile-biology.js';
import {SPECIES} from '../src/organisms/species.js';
import {buildJournalEntry} from '../src/ui/journal.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const plan=founderPlan(),loaded=makePlan([...plan.nodes.map(({partId,parent,socket})=>({partId,parent,socket})),{partId:'storage-sac',parent:'root',socket:'flank.left'},{partId:'storage-sac',parent:'root',socket:'flank.right'}]);
for(const policy of [ANATOMICAL_MASS,LEGACY_MASS]){
 const s=new Simulation('BODY-COST-READING',{bootstrap:false,player:false,massRules:policy}),p=s.spawnAnimal('genvo',40,40);p.age=10;s.lineage.establishFounder(p);
 const before=structuredClone(p),rng=s.rng.state,base=previewBody(p,plan),next=previewBody(p,loaded),old=measure(base),now=measure(next);
 assert.equal(next.massPolicy,p.massPolicy);assert.equal(now.mass,adultBodyMass(next));
 if(policy===ANATOMICAL_MASS){close(now.mass/old.mass,1.2);close(now.metabolism/old.metabolism,1.2144);close(now.water/old.water,.864);}
 else{assert.equal(now.mass,old.mass);close(now.metabolism/old.metabolism,1.012);close(now.water/old.water,.72);}
 assert.deepEqual(p,before);assert.equal(s.rng.state,rng);
 const actual=s.spawnAnimal('genvo',40,40);Object.assign(actual,next,{id:actual.id,age:SPECIES.genvo.maturity,energy:100,hydration:95,health:100});s.animals=[actual];s.phaseClimate();
 const water=actual.hydration,energy=actual.energy,basal=basalResourceCosts(actual),temp=s.world.temperature[s.world.idx(40,40)],thermal=Math.abs(temp-.55*actual.genes.climate)*.12;
 // Current fixture has no proto-trait/shelter or player challenge multipliers.
 s.phaseMetabolism();close(energy-actual.energy,basal.energy*now.metabolism/(policy===ANATOMICAL_MASS?now.mass/1.45:1)*(1+thermal)/actual.genes.metabolism);close(water-actual.hydration,basal.water*now.water/(policy===ANATOMICAL_MASS?now.mass/1.45:1)*(1+s.climate.temp*.3));
 for(const offset of [-1e-6,0,1e-6]){const a={...p,energy:SPECIES.genvo.maxEnergy*GROWTH_RESERVE_FLOOR+growthCostForDay(p)+offset},age=a.age,reading=bodyCostReading(a);advanceAgeDay(a);assert.equal(a.age===age+1,reading.canPay);assert.match(reading.text,/relative units/);if(!reading.canPay)assert.match(reading.text,/Growth waits/);}
 assert.deepEqual(p,before);assert.equal(bodyCostReading({...p,alive:false}),null);
 s.animals=[p];assert.equal(buildJournalEntry(s,p.id).bodyCost.text,bodyCostReading(p).text);
}
console.log('Body cost readability: previews agree with actual mass/basal spending; old/new policies, paid-growth affordability edges, real journal authority, pure reads and unavailable dead records PASS');
