import assert from 'node:assert/strict';
import {RNG} from '../src/core/rng.js';
import {mutatePlan,founderPlan,recombineBodyPlans} from '../src/lineage/body-inheritance.js';
import {wildStartPlan} from '../src/organisms/wild-bodies.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {DEVELOPMENTAL_SYMMETRY,ASYMMETRIC_SHARE} from '../src/lineage/developmental-symmetry.js';
import {asymmetries} from '../tools/symmetry-audit.mjs';

// Developmental symmetry (creator decision 2026-10-16): homologous left/right structures change together; front
// and hind pairs may differ; asymmetry arises only through a rare one-sided developmental change, and is heritable.
assert.equal(DEVELOPMENTAL_SYMMETRY.enabled,true);
const lineages=[founderPlan(),...['mosskip','rootling','needlejaw','podshell'].map(wildStartPlan)];
// Rules over many mutation steps: symmetric bodies stay symmetric except through the one-sided route.
const rng=new RNG('DEV-SYMMETRY');let events=0,changed=0,oneSided=0,halfPairs=0;
const chance=rng.chance.bind(rng);
for(const start of lineages)for(let run=0;run<60;run++){let plan=start;for(let g=0;g<6;g++){
  let forced=null;rng.chance=p=>{const r=chance(p);if(p===ASYMMETRIC_SHARE)forced=r;return r};
  const next=mutatePlan(rng,plan);rng.chance=chance;events++;if(next===plan)continue;changed++;
  const before=asymmetries(plan).length,after=asymmetries(next).length;
  if(forced)oneSided++;else if(after>before)halfPairs++;
  plan=next}}
assert.equal(halfPairs,0,'an ordinary mutation never leaves a mirrored pair half-changed');
assert.ok(changed>events*.5,`mutations still happen (${changed}/${events})`);
assert.ok(oneSided>0&&oneSided<events*.12,`one-sided development is rare but possible (${oneSided}/${events})`);
// Front and hind pairs are free to differ (mosskip: walking forelegs, spring hind legs) and that is symmetric.
assert.deepEqual(asymmetries(wildStartPlan('mosskip')),[],'distinct front and hind pairs are still bilateral');
// A spur mutation develops on both legs of a mirrored pair.
{let spurs=0,paired=0;const r=new RNG('DEV-SYMMETRY-SPUR');for(let i=0;i<400;i++){const p=mutatePlan(r,founderPlan());const sp=p.nodes.filter(n=>n.socket==='spur');if(sp.length&&!asymmetries(p).length)paired++;if(sp.length)spurs++}
  assert.ok(spurs>0,'spur mutations occur');assert.ok(paired>=spurs*.8,`spurs come in mirrored pairs (${paired}/${spurs}; the rest are the rare one-sided route)`)}
// Inherited asymmetry is kept: an asymmetric parent's pair travels as a unit and is not rewritten.
{const asym=makePlan([{partId:'small-torso',parent:null,socket:null},{partId:'walking-leg',parent:'root',socket:'limb.1'},{partId:'grasper',parent:'root',socket:'limb.7'},{partId:'walking-leg',parent:'root',socket:'limb.3'},{partId:'walking-leg',parent:'root',socket:'limb.5'},{partId:'grazing-mouth',parent:'root',socket:'mouth'},{partId:'simple-eye',parent:'root',socket:'eye.left'},{partId:'simple-eye',parent:'root',socket:'eye.right'}]);
  assert.equal(asymmetries(asym).length,1);assert.equal(recombineBodyPlans(new RNG('x'),asym,asym),asym,'identical parents pass their body on unchanged');
  let kept=0;const r=new RNG('DEV-SYMMETRY-HEIR');for(let i=0;i<200;i++){const c=recombineBodyPlans(r,asym,founderPlan());if(asymmetries(c).length)kept++}
  assert.ok(kept>40&&kept<160,`the asymmetric pair is inherited as a unit from one parent (${kept}/200)`)}
// Switch off: the previous behaviour (spurs on one leg) returns.
DEVELOPMENTAL_SYMMETRY.enabled=false;{let one=0;const r=new RNG('DEV-SYMMETRY-SPUR');for(let i=0;i<400;i++){const p=mutatePlan(r,founderPlan());if(p.nodes.some(n=>n.socket==='spur')&&asymmetries(p).length)one++}assert.ok(one>0,'?developmentalSymmetry=0: one-sided spurs as before')}DEVELOPMENTAL_SYMMETRY.enabled=true;
console.log(`developmental symmetry: ${changed} mutations, 0 half pairs, ${oneSided} one-sided, paired spurs, inherited asymmetry kept: PASS`);
