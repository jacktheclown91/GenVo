import assert from 'node:assert/strict';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {partEffectFactors} from '../src/lineage/part-abilities.js';
import {wildStartPlan} from '../src/organisms/wild-bodies.js';
for(const source of [founderPlan(),wildStartPlan('mosskip'),wildStartPlan('needlejaw')]){
 const shared=structuredClone(source),labels=['genvo','mosskip','needlejaw','rootling'];
 const expected=new Map(labels.map(species=>[species,partEffectFactors({species,bodyPlan:structuredClone(source)})]));
 for(const species of [...labels,...labels.toReversed()])assert.deepEqual(partEffectFactors({species,bodyPlan:shared}),expected.get(species),'Shared plans must not inherit another actor normalization');
 const animal={species:'genvo',bodyPlan:shared};partEffectFactors(animal);animal.species='mosskip';assert.deepEqual(partEffectFactors(animal),expected.get('mosskip'),'Live contextual changes invalidate the old result');
}
console.log('Shared-plan evaluation order, live founding-context changes, and independently computed legacy baselines PASS');
