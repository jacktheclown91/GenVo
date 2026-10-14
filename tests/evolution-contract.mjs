import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {PARTS,PART_IDS,SOCKET_TYPES,CAPABILITIES,registryProblems,partDef} from '../src/lineage/part-registry.js';
import {makePlan,validatePlan,serializePlan,deserializePlan,bodyPlanFromLegacy,canonicalId} from '../src/lineage/body-plan.js';
import {resolvePhenotype} from '../src/lineage/phenotype-resolver.js';
import {expressedAdaptations,adaptationEffects,anatomyFromAdaptations,bodyAbility,hasAdaptation} from '../src/lineage/evolution.js';
import {canSwim} from '../src/lineage/lifestyle.js';
import {BUDGET} from '../src/lineage/evolution-budget.js';

// Evolution Expansion Phase A gate (GDD v1, section 14): the part registry, body-plan graph and
// phenotype resolver, run as a no-op migration over the frozen v1.33.7 creature fixture, must
// reproduce the existing anatomy effects, adaptations, Pounce and water results exactly.

const fixture=JSON.parse(fs.readFileSync(new URL('../docs/evolution-expansion/baseline-v1.33.7/creature-fixture.json',import.meta.url),'utf8'));
assert.equal(fixture.version,'1.33.7');assert.ok(fixture.creatures.length>=100,'the frozen fixture holds real and staged creatures');

// EV-002: registry shape.
assert.deepEqual(registryProblems(),[],'every part has the GDD 6.1 fields and known sockets, capabilities and prerequisites');
// The 18-part starter slice, wave 1 (eight bodies, legs, mouths and eyes: 21 more parts) and the
// small founder torso every GenVo8 now starts with (creator decision 2026-10-09).
assert.equal(PART_IDS.length,72,'the starter slice, wave 1, the founder torso, wave 2 and eight relic parts make 72 functional parts');
assert.equal(new Set(PART_IDS).size,72);assert.equal(Object.values(PARTS).filter(p=>p.tags.includes('exclusive')).length,8,'eight relic parts');
// Wave 2: eight tails, back parts, flank parts and spurs.
for(const type of ['tail','dorsal','flank','spur'])assert.equal(Object.values(PARTS).filter(p=>p.compatibleSocketTypes.includes(type)&&!p.tags.includes('exclusive')).length,8,`eight ${type} parts`);
for(const family of ['feeding','senses'])assert.equal(Object.values(PARTS).filter(p=>!p.tags.includes('exclusive')).filter(p=>family==='core'?p.tags.includes('torso'):family==='feeding'?p.tags.includes('mouth'):p.tags.includes('eye')).length,8,`eight ${family} parts`);
assert.equal(Object.values(PARTS).filter(p=>p.tags.includes('leg')).length,8,'eight leg types');
assert.equal(Object.values(PARTS).filter(p=>p.tags.includes('torso')).length,9,'eight bodies plus the founder torso');
for(const p of Object.values(PARTS)){assert.ok(Object.isFrozen(p));assert.deepEqual(Object.keys(p.effectContributions),[],`${p.id} adds no numbers in Phase A`)}
assert.ok(SOCKET_TYPES.length&&CAPABILITIES.includes('pounce'));
assert.ok(!PARTS['paddle-tail'].legacy,'the paddle tail stands for no legacy ability');

// EV-003: graph validation, serialization and canonical ids.
{
  const ok=makePlan([{partId:'soft-torso',parent:null,socket:null},{partId:'walking-leg',parent:'root',socket:'limb.0'},{partId:'claw',parent:'root/limb.0',socket:'spur'}]);
  assert.deepEqual(validatePlan(ok),{ok:true,errors:[]});
  const bad=[
    [[{partId:'walking-leg',parent:null,socket:null}],/cannot be a root/],
    [[{partId:'soft-torso',parent:null,socket:null},{partId:'claw',parent:'root/limb.3',socket:'spur'}],/orphan/],
    [[{partId:'soft-torso',parent:null,socket:null},{partId:'walking-leg',parent:'root',socket:'mouth'}],/cannot mount on a mouth socket/],
    [[{partId:'soft-torso',parent:null,socket:null},{partId:'simple-eye',parent:'root',socket:'eye.left'},{partId:'wide-field-eye',parent:'root',socket:'eye.left'}],/holds more than 1/],
    [[{partId:'soft-torso',parent:null,socket:null},{partId:'gill-of-the-future',parent:'root',socket:'flank.left'}],/unknown part gill-of-the-future/],
    [[{partId:'soft-torso',parent:null,socket:null},{partId:'soft-torso',parent:null,socket:null}],/exactly one root|duplicate node/]
  ];
  for(const [placements,why] of bad){const r=validatePlan(makePlan(placements));assert.equal(r.ok,false);assert.match(r.errors.join(' | '),why)}
  // Cycles cannot be built by socket paths; check the validator catches a hand-made one.
  const cyc={...ok,nodes:ok.nodes.map(n=>n.id==='root/limb.0'?{...n,parent:'root/limb.0/spur'}:n)};assert.match(validatePlan(cyc).errors.join(' | '),/cycle|not named/);
  assert.match(validatePlan(makePlan([{partId:'soft-torso',parent:null,socket:null},{partId:'crushing-jaw',parent:'root',socket:'mouth'}]),{ancestry:['soft-torso','grazing-mouth']}).errors.join(),/needs ancestral tearing-jaw/,'radical changes need precursor ancestry');
  const back=deserializePlan(serializePlan(ok));assert.deepEqual(back,ok,'plans round-trip exactly');assert.equal(canonicalId(back),ok.id);
  const shuffled=makePlan([{partId:'claw',parent:'root/limb.0',socket:'spur'},{partId:'walking-leg',parent:'root',socket:'limb.0'},{partId:'soft-torso',parent:null,socket:null}]);
  assert.equal(shuffled.id,ok.id,'placement order does not change a body\'s identity');
  assert.throws(()=>deserializePlan({schema:'genvo8.bodyplan/9',nodes:[]}),/Unknown body plan schema/,'a future schema fails visibly');
}

// EV-004 and EV-005: the no-op migration over every fixture creature.
const sim=new Simulation('GENVO8-EV-CONTRACT',{player:true}),player=sim.player();
let pounceBodies=0,swimmers=0,checked=0;
for(const c of fixture.creatures){
  const animal={...c,anatomy:c.anatomy?{...c.anatomy}:null},plan=bodyPlanFromLegacy(animal);
  assert.equal(validatePlan(plan).ok,true,`${c.source} #${c.id}: migrated plan is valid`);
  const r=resolvePhenotype(deserializePlan(serializePlan(plan)),{animal});assert.equal(r.ok,true);
  const anatomy=animal.anatomy||anatomyFromAdaptations(animal.adaptations),legacyBody={...animal,anatomy,adaptations:expressedAdaptations(anatomy)};
  assert.deepEqual(r.adaptations,expressedAdaptations(anatomy),`${c.source}: adaptations unchanged`);
  if(c.lineage&&c.anatomy)assert.deepEqual([...r.adaptations].sort(),[...c.adaptations].sort(),`${c.source}: matches the adaptations the v1.33.7 creature had`);
  assert.deepEqual(r.effects,adaptationEffects(legacyBody),`${c.source}: adaptation effects unchanged`);
  // Pounce: the same reach the live combat authority computes for this body.
  Object.assign(player,{anatomy:{...anatomy},adaptations:expressedAdaptations(anatomy)});
  assert.equal(r.pounceReach,sim.playerCombat.pounceReach(player),`${c.source}: Pounce reach unchanged`);
  assert.equal(r.actions.includes('pounce'),bodyAbility(legacyBody,'pounce')>0,`${c.source}: Pounce available exactly when it was`);
  assert.equal(r.actions.includes('carry'),hasAdaptation(legacyBody,'grasping-limbs'),`${c.source}: carrying follows Grasping Limbs`);
  assert.equal(r.canSwim,canSwim(legacyBody),`${c.source}: water rule unchanged`);
  if(r.actions.includes('pounce'))pounceBodies++;if(r.canSwim)swimmers++;checked++;
}
assert.ok(pounceBodies>0&&swimmers>0,'the fixture exercises Pounce and swimming');
// A paddle tail alone never grants open-water travel (GDD 6.2 slice restriction).
{
  const plan=makePlan([{partId:'soft-torso',parent:null,socket:null},{partId:'paddle-tail',parent:'root',socket:'tail'}],{legacyAnatomy:anatomyFromAdaptations([])});
  const r=resolvePhenotype(plan);assert.equal(r.ok,true);assert.ok(r.actions.includes('swim-propel'));assert.equal(r.canSwim,false,'no fake swimming');
}
// Mutation budget valuation (GDD 7.2): base 8 MP plus a capped earned bonus of 0 to 4.
{
  const b=sim.evolutionBudget;assert.equal(b.budget(),BUDGET.baseMP);b.sinceHandoff=1000;assert.equal(b.earnedBonus(),BUDGET.bonusCap);assert.equal(b.budget(),BUDGET.baseMP+BUDGET.bonusCap,'the earned bonus is capped');
  assert.deepEqual(b.consume(),{budget:12,bonus:4});assert.equal(b.sinceHandoff,0,'each committed design starts a fresh earned bonus');
  assert.equal(typeof b.shape,'undefined','nothing spends points on a living creature');
}
console.log(`evolution contract ok · ${checked} creatures migrated with no change`);
