import assert from 'node:assert/strict';
import {groundDiet,plantPreference,mouthOf} from '../src/ecology/functional-diet.js';
import {PLANTS} from '../src/sim/config.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {SPECIES} from '../src/organisms/species.js';

// Compare the batched survey against the independently retained authoritative
// per-kind lookup. Every named founding template and every registry mouth part
// is covered, including unknown and multi-mouth plans.
const kinds=Object.keys(PLANTS);
let checked=0;
function check(a,label){
  // Historical bodyless founders return the full saved species diet object,
  // including zero-valued fields; the mounted pathway filters positive foods.
  const legacy=!a?.bodyPlan?.nodes?.length;
  const expected=legacy?{...(SPECIES[a?.species]?.diets||{})}:{};
  if(!legacy){
    for(const kind of kinds){const p=plantPreference(a,kind);if(p>0)expected[kind]=p;}
    const carrion=plantPreference(a,'carrion');if(carrion>0)expected.carrion=carrion;
  }
  assert.deepEqual(groundDiet(a),expected,label);
  assert.notStrictEqual(groundDiet(a),groundDiet(a),'surveys must not expose shared mutable diet objects');
  checked++;
}
for(const species of Object.keys(SPECIES))check({species},'legacy '+species);
const mouths=Object.keys(PARTS).filter(id=>/(mouth|jaw|beak)/.test(id));
assert.ok(mouths.length>=5,'registry has specialized mounted feeders');
for(const partId of mouths)check({species:'mosskip',bodyPlan:{nodes:[{id:1,socket:'mouth',partId}]}},partId);
check({species:'mosskip',bodyPlan:{nodes:[{id:1,socket:'tail',partId:'grazing-mouth'}]}},'no mounted mouth');
check({species:'mosskip',bodyPlan:{nodes:[{id:1,socket:'mouth',partId:'unknown-part'}]}},'unknown mouth');
const changing={species:'mosskip',bodyPlan:{nodes:[{id:1,socket:'mouth',partId:'grazing-mouth'},{id:2,socket:'mouth',partId:'kernel-beak'}]}};
check(changing,'first mounted mouth');
assert.equal(mouthOf(changing),'grazing-mouth');
changing.bodyPlan.nodes[0].socket='limb';
check(changing,'in-place socket change');
assert.equal(mouthOf(changing),'kernel-beak');
changing.bodyPlan.nodes[1].partId='tearing-jaw';
check(changing,'in-place part change');
console.log('p3 diet capability parity ok ('+checked+' distinct actor/plans)');
