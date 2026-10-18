import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {TROPHIC_RECOGNITION,trophicallyMateable} from '../src/reproduction/trophic-recognition.js';
import {preyPreference} from '../src/ecology/functional-diet.js';
// Phase 3J: a predator does not court the prey species it hunts (and vice versa); conspecifics still court
// even where unrelated cannibalism is possible; non-trophic gene flow is untouched.
assert.equal(TROPHIC_RECOGNITION.enabled,true);
const sim=new Simulation('TROPHIC-RECOGNITION',{player:false}),adult=(sp,sex)=>sim.animals.find(a=>a.alive&&a.species===sp&&a.age>=SPECIES[sp].maturity&&(!sex||a.sex===sex));
const nj=adult('needlejaw','M'),nj2=adult('needlejaw','F'),moss=adult('mosskip','F'),genvo=adult('genvo','F'),root=adult('rootling','M');
assert.ok(preyPreference(nj,moss)>0,'Stalkers hunt mosskip');assert.equal(trophicallyMateable(nj,moss),false,'so they do not court them');
assert.equal(sim.canMatePair(nj,moss),false,'pairing refused with a trophic reason');
if(nj2){assert.ok(preyPreference(nj,nj2)>0,'unrelated cannibalism is possible in the diet model');assert.equal(trophicallyMateable(nj,nj2),true,'yet Stalkers court their own kind')}
assert.equal(preyPreference(genvo,root)>0||preyPreference(root,genvo)>0,false);assert.equal(trophicallyMateable(genvo,root),true,'non-trophic gene flow unaffected');
TROPHIC_RECOGNITION.enabled=false;assert.equal(trophicallyMateable(nj,moss),true);TROPHIC_RECOGNITION.enabled=true;
console.log('trophic recognition: no predator-prey courtship, conspecifics and grazers unaffected: PASS');
