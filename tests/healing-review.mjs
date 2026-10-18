import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {HEALING_REVIEW,healingStep} from '../src/ecology/healing-review.js';
import {adaptationEffects} from '../src/lineage/evolution.js';

// Healing physiology (integrated Phase 3I): one rule for wild and player animals; repair needs time,
// nourishment and energy, and depends on activity, infection and development.
assert.equal(HEALING_REVIEW.enabled,true);
const sim=new Simulation('HEALING-PHYSIOLOGY',{player:true});sim.endOpeningGrace?.('test');sim.phaseClimate();
const p=sim.player(),w=sim.animals.find(a=>a.alive&&!a.player&&!a.lineage&&a.species==='genvo'&&a.age>=SPECIES.genvo.maturity);assert.ok(p&&w);
Object.assign(w,{genes:structuredClone(p.genes),bodyPlan:structuredClone(p.bodyPlan),adaptations:structuredClone(p.adaptations||[]),age:p.age});
const S=SPECIES.genvo,stage=(a,o={})=>Object.assign(a,{health:40,energy:S.maxEnergy*.9,hydration:S.maxHydration*.9,infected:false,predationConsumedMass:0},o);
const step=(a,mode)=>{const e=a.energy,h=a.health;healingStep(sim,a,adaptationEffects(a),mode);return{gain:a.health-h,cost:e-a.energy}};
for(const mode of ['rest','active','strained','cover-rest']){stage(p);stage(w);const a=step(p,mode),b=step(w,mode);assert.deepEqual(a,b,`player and wild twin heal identically (${mode})`);assert.ok(a.cost>0,'repair costs energy')}
stage(w);const rest=step(w,'rest').gain;stage(w);const active=step(w,'active').gain;stage(w);const strained=step(w,'strained').gain;
assert.ok(rest>active&&active>strained&&strained>0,'rest heals faster than activity, strain slowest');
stage(w,{energy:S.maxEnergy*.1});assert.equal(step(w,'rest').gain,0,'a starving body does not repair');
stage(w,{hydration:S.maxHydration*.1});assert.equal(step(w,'rest').gain,0,'a parched body does not repair');
stage(w,{infected:true});assert.ok(Math.abs(step(w,'rest').gain-rest/2)<1e-9,'infection halves repair');
// A severe 60-health wound: about 10 days resting well fed, never within five days.
stage(w,{health:40});let steps=0;while(w.health<100&&steps<800){w.energy=S.maxEnergy*.9;w.hydration=S.maxHydration*.9;step(w,'rest');steps++}
const days=steps/8;assert.ok(days>5&&days<20,`resting recovery from a severe wound takes ${days.toFixed(1)} days`);
// Any bitten animal gets a wound record and is slowed by it.
const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw'&&a.age>=SPECIES.needlejaw.maturity);stage(w,{health:100,x:p.x+30,y:p.y});w.injuryCare=null;Object.assign(h,{x:w.x+.4,y:w.y});
const chance=sim.rng.chance;sim.rng.chance=()=>true;sim.tryKill(h,w);sim.rng.chance=chance;
assert.ok(w.injuryCare?.active&&w.health<100&&w.health>0,'a bitten wild animal carries a wound');assert.ok(sim.injury.movementMultiplier(w)<1,'and moves slower while wounded');
HEALING_REVIEW.enabled=false;stage(w);const old=step(w,'rest').gain;HEALING_REVIEW.enabled=true;assert.ok(old>0&&old<rest/3,'?healing=0 restores the old slow flat rate');
console.log(`healing physiology: parity, nourishment, activity, infection, cost, severe wound ${days.toFixed(1)} days resting: PASS`);
