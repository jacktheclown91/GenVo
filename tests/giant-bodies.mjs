// body-size/2 (morphology S7, Scenario F): inherited size may reach 3x in new games.
// Giants pay through the existing physics: Kleiber food (11.8x absolute at 3x),
// surface water (9x), structural stress at tissue yield for a founder anatomy, mass
// limits on burrows, logs and canopy, flight loading; contact reach grows with the
// body. body-size/1 worlds keep their 2x bound and base reach exactly.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {BODY_SIZE,GIANT_SIZE,adultSizeScale,validateBodySize,toAbsolute} from '../src/organisms/body-size.js';
import {adultBodyMass} from '../src/organisms/body-mass.js';
import {SUBSURFACE} from '../src/world/subsurface.js';
import {fitsLog} from '../src/ecology/refuges.js';
import {flightLoading,FLIGHT} from '../src/lineage/flight.js';
import {planSupport,structuralLimits,STRUCTURAL_SUPPORT} from '../src/organisms/structural-support.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const close=(x,y,label,tol=1e-9)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${label}: ${x} vs ${y}`);
const sized=(a,s)=>{a.bodySize={schema:1,alleles:[Math.log(s),Math.log(s)]};return a};
const opts={player:true,dayClock:true,metabolism:true};
const giant=new Simulation('GIANTS',{...opts,bodySize:GIANT_SIZE.policy}),old=new Simulation('GIANTS',{...opts,bodySize:true});
assert.equal(giant.bodySizeRules,GIANT_SIZE.policy);assert.equal(old.bodySizeRules,BODY_SIZE.policy);
assert.throws(()=>new Simulation('GIANTS-BAD',{...opts,bodySize:'body-size/9'}),/Unknown body size policy/);

// 1. Inheritance reaches 3x only under /2; /1 keeps its 2x bound; saves validate per policy.
{
 for(const [sim,max] of [[giant,3],[old,2]]){const sp=sim.player().species,[m,f]=sim.animals.filter(a=>a.species===sp).slice(0,2).map(a=>sized({...a},3.4));
  const kids=Array.from({length:30},()=>sim.spawnAnimal(sp,40,40,[m,f]));assert.ok(kids.every(k=>adultSizeScale(k)<=max+1e-9)&&kids.some(k=>adultSizeScale(k)>max*.97),`bound ${max}`);
  sim.animals=sim.animals.filter(a=>!kids.includes(a))}
 const big={schema:1,alleles:[Math.log(2.5),Math.log(2.5)]};validateBodySize(big,GIANT_SIZE.policy);assert.throws(()=>validateBodySize(big,BODY_SIZE.policy));
 const a=giant.animals.find(x=>!x.player);a.bodySize=big;const snap=structuredClone(createSimulationSnapshot(giant,{savedAt:'fixed',reason:'giants'}));
 assert.equal(restoreSimulationSnapshot(structuredClone(snap)).bodySizeRules,GIANT_SIZE.policy);
 const asOld=structuredClone(snap);asOld.core.bodySizeRules=BODY_SIZE.policy;assert.throws(()=>restoreSimulationSnapshot(asOld),/body size/i,'a 2.5x body is invalid in a /1 world');
}
// 2. Physical world: a 3x founder anatomy is shut out of burrows, log interiors and flight by mass;
// a single tree no longer carries it.
{
 const a=sized({...giant.animals.find(x=>!x.player&&x.bodyPlan),bodyPlan:founderPlan()},3),ref=sized({...a},1);
 close(adultBodyMass(a),adultBodyMass(ref)*27,'mass x27');
 assert.ok(adultBodyMass(ref)<=SUBSURFACE.maxLoad&&adultBodyMass(a)>SUBSURFACE.maxLoad,'burrow passages exclude it');
 assert.ok(fitsLog(ref)&&!fitsLog(a),'log interiors exclude it');
 assert.ok(flightLoading(a)>FLIGHT.maxAdultMass,'wings could not lift it');
 assert.ok(adultBodyMass(a)>1.65,'more than one tree can carry');
 // Structure: the founder anatomy at 3x sits at tissue yield (no sprint); sturdier legs relieve it.
 const rules={structuralSupportRules:STRUCTURAL_SUPPORT.policy};close(structuralLimits(rules,a).stress,3,'stress 3');close(structuralLimits(rules,a).sprint,0,'no sprint at yield');
 const sturdy=sized({...a,bodyPlan:makePlan(founderPlan().nodes.map(n=>({partId:/^root\/limb\.\d+$/.test(n.id)?'sturdy-leg':n.partId,parent:n.parent,socket:n.socket})))},3);
 assert.ok(structuralLimits(rules,sturdy).sprint>0,'sturdy legs restore some sprint at 3x');
}
// 3. Contact reach grows with body size under /2 only; a reference pair keeps the base exactly.
{
 const [p,q]=giant.animals.filter(a=>!a.player).slice(0,2),mature=x=>Object.assign(x,{age:SPECIES[x.species].maturity+1});mature(p);mature(q);
 sized(p,1);sized(q,1);assert.equal(giant.reachBetween(p,q,.85),.85);
 sized(p,3);close(giant.reachBetween(p,q,.85),.85*2,'giant and reference');sized(q,3);close(giant.reachBetween(p,q,.85),.85*3,'two giants');
 sized(q,.6);close(giant.reachBetween(p,q,.85),.85*1.8,'giant and small');sized(p,.6);assert.equal(giant.reachBetween(p,q,.85),.85,'small bodies keep the base reach');
 const [r,s]=old.animals.filter(a=>!a.player).slice(0,2);sized(r,2);sized(s,2);assert.equal(old.reachBetween(r,s,.85),.85,'/1 worlds keep base reach');
}
// 4. Scenario F ecology on the real metabolism step: a 3x body needs 3^(9/4) = 11.8x the absolute food
// and 3^2 = 9x the absolute water of its reference relative, so it lasts longer on its reserves but
// empties a shared supply far faster and is not spared starvation or thirst.
{
 const sim=new Simulation('GIANTS-ECOLOGY',{...opts,bodySize:GIANT_SIZE.policy});sim.phaseClimate();
 const a=sim.animals.find(x=>!x.player&&x.alive);sim.animals=[a];Object.assign(a,{age:SPECIES[a.species].maturity+2,health:100,intent:'idle',target:null});
 const step=s=>{sized(a,s);a.energy=SPECIES[a.species].maxEnergy*.8;a.hydration=SPECIES[a.species].maxHydration*.8;const e=a.energy,h=a.hydration;sim.phaseMetabolism();return{food:toAbsolute(a,e-a.energy),water:toAbsolute(a,h-a.hydration),foodShare:e-a.energy,waterShare:h-a.hydration}};
 const one=step(1),three=step(3);
 close(three.food/one.food,3**2.25,'absolute food x11.8',1e-6);close(three.water/one.water,9,'absolute water x9',1e-6);
 assert.ok(three.foodShare<one.foodShare&&three.foodShare>0,'longer on its own reserves, yet still draining');
 assert.ok(three.waterShare<one.waterShare&&three.waterShare>0,'water reserves drain too');
}
console.log('Giant bodies (body-size/2) PASS: 3x bound under /2 only, per-policy saves, burrows/logs/flight/single trees exclude a 3x founder by mass, structural yield at 3x eased by sturdy legs, contact reach grows with body size, real metabolism: 11.8x absolute food and 9x water while lasting longer on reserves');
