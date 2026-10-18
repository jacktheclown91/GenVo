import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;// needs every configured species present
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {individualMateChoice,reciprocalMateChoice,appearanceDistance,matePreferencesFor,SIMILARITY_PREFERENCE} from '../src/reproduction/mate-preferences.js';
import {reproductiveCompatibility} from '../src/reproduction/reproductive-compatibility.js';

// Phase 3I Milestone 3: heritable similarity/contrast preference is individual attraction only. It is never
// a compatibility rule, never a species-name gate, and acceptance stays reciprocal.
assert.equal(SIMILARITY_PREFERENCE.enabled,true);
const sim=new Simulation('SIMILARITY-VALIDATION',{player:false}),seed=sim.seed;
const adults=sp=>sim.animals.filter(a=>a.alive&&a.species===sp&&a.age>=SPECIES[sp].maturity);
const [f,m]=[adults('genvo').find(a=>a.sex==='F'),adults('genvo').find(a=>a.sex==='M')],other=adults('mosskip').find(a=>a.sex==='M');assert.ok(f&&m&&other);
const tastes=(a,similarity,selectivity=.5)=>{a.matePreferences={...matePreferencesFor(seed,a),weights:{size:0,strength:0,ornament:0,display:0,behavior:0},selectivity,similarity}};
const twin=(src,dst)=>Object.assign(dst,{bodyPlan:structuredClone(src.bodyPlan),genes:{...dst.genes,colorShift:src.genes?.colorShift??dst.genes?.colorShift},age:src.age});

// 1. Not a compatibility rule: conception compatibility ignores the allele entirely.
const base=reproductiveCompatibility(f,m);
for(const s of [-.55,0,.55]){tastes(f,s);tastes(m,s);assert.deepEqual(reproductiveCompatibility(f,m),base,`compatibility unchanged by similarity allele ${s}`)}
// 2. A strong contrast-seeker may refuse a look-alike of its own species: a legitimate individual choice.
twin(f,m);assert.ok(appearanceDistance(f,m)<.15,'staged look-alike pair');
tastes(f,-.55,1);tastes(m,0);const refusal=individualMateChoice(f,m,seed);
assert.equal(refusal.accepted,false,'extreme contrast preference can reject a compatible look-alike');assert.equal(refusal.dominant,'similarity');
assert.equal(reciprocalMateChoice(m,f,seed).accepted,false,'acceptance is reciprocal: one refusal ends the pairing');
// ...yet the same chooser is attracted by contrasting anatomy, even another species: no species-name gate.
assert.ok(appearanceDistance(f,other)>appearanceDistance(f,m),'mosskip looks different');
assert.ok(individualMateChoice(f,other,seed).score>refusal.score,'contrast preference scores a contrasting partner higher');
// 3. A similarity-seeker prefers the look-alike; the score follows perceived appearance only.
tastes(f,.55,1);assert.ok(individualMateChoice(f,m,seed).score>individualMateChoice(f,other,seed).score,'similarity preference favours look-alikes');
// 4. Neutral preferences never block an isolated compatible pair (no universal barrier).
tastes(f,0);tastes(m,0);assert.equal(reciprocalMateChoice(f,m,seed).accepted,true,'neutral isolated compatible pair accepts');
// 5. Extreme genotypes stay bounded.
for(const s of [-5,5]){tastes(f,s,1);const c=individualMateChoice(f,m,seed);assert.ok(c.score>=-1&&c.score<=1,'score bounded')}
// 6. Kinship remains its own rule: preference cannot make close kin a pair.
const kid={...m,id:999991,parentIds:[f.id,m.id],sex:'M'};sim.animals.push(kid);tastes(f,.55,0);tastes(kid,.55,0);
assert.equal(reciprocalMateChoice(f,kid,seed).accepted,true,'they are mutually attracted');assert.equal(sim.canMatePair(f,kid),false,'but close kin cannot pair');
console.log('similarity preference validation: attraction only, reciprocal, appearance not species name, kinship separate: PASS');
