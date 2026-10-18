import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {courtshipObservation} from '../src/ui/courtship-observation.js';
import {matePreferencesFor} from '../src/reproduction/mate-preferences.js';

// Phase 3J Step 4: a declined pairing says who held back, and for the player's own creature, which
// inherited inclination did; the partner's genotype is never shown. Repeated refusals suggest another partner.
const sim=new Simulation('REFUSAL-EXPLANATION',{player:true});sim.endOpeningGrace?.('test');
const p=sim.player(),w=sim.animals.find(a=>a.alive&&!a.player&&a.species==='genvo'&&a.sex!==p.sex&&a.age>=SPECIES.genvo.maturity);assert.ok(p&&w);
const base={refusal:null,failure:null,lastMate:null};
const neutral={weights:{size:0,strength:0,ornament:0,display:0,behavior:0},selectivity:.5,similarity:0};
// The player's creature strongly prefers contrast and is shown a look-alike partner.
p.matePreferences={...matePreferencesFor(sim.seed,p),...neutral,selectivity:1,similarity:-1};w.matePreferences={...matePreferencesFor(sim.seed,w),...neutral};
Object.assign(w,{bodyPlan:structuredClone(p.bodyPlan),genes:{...w.genes,colorShift:p.genes?.colorShift}});
sim.conceptionAvailability=()=>({enabled:true,reasonCode:'available',compatibility:{conceptionChance:1}});
assert.equal(sim.tryMate(p,w),false);
const own=courtshipObservation(sim,p,w,base);assert.equal(own.kind,'declined');
assert.match(own.text,/^Your creature held back: it is drawn to partners that look unlike itself\.$/,own.text);
// Now the partner declines, twice.
p.matePreferences={...p.matePreferences,similarity:0,selectivity:.5};w.matePreferences={...w.matePreferences,selectivity:1,similarity:-1};
assert.equal(sim.tryMate(p,w),false);let obs=courtshipObservation(sim,p,w,base);
assert.match(obs.text,/^The partner turned away from your creature\./);assert.ok(!/drawn to|similar|contrast|score/.test(obs.text),'the partner\'s taste is not revealed');
assert.equal(sim.tryMate(p,w),false);obs=courtshipObservation(sim,p,w,base);assert.match(obs.text,/another partner may suit better/);
console.log('courtship refusal explanation: who held back, own inclination in words, partner genotype hidden: PASS');
