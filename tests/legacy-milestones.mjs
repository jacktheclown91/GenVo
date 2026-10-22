import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {recordLegacyHandoff,firstLegacyProgress,validateLegacyMilestones} from '../src/gameplay/legacy-milestones.js';
import {buildLegacySummary} from '../src/ui/legacy-summary.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// The First Legacy (creator direction 2026-10-22): earned only by handing
// control to a living descendant through the existing lineage rules.
const sim=new Simulation('PLANET-OBS-3',{player:true,worldGenerator:'planetary/1'});sim.playerAutonomy=true;
const founder=sim.player();assert.equal(sim.legacyMilestones,undefined,'no record until a milestone is earned');
const before=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'}));
assert.deepEqual(structuredClone(createSimulationSnapshot(restoreSimulationSnapshot(structuredClone(before)),{savedAt:'t',reason:'t'})),before,'saves without a milestone round-trip unchanged');

// A natural birth to the founder (AUTO play; no staging of reproduction).
let child=null;for(let d=0;d<40&&!child;d++){for(let t=0;t<CFG.dayTicks;t++)sim.update(null);child=sim.animals.find(a=>a.alive&&a.parentIds?.includes(founder.id))}
assert.ok(child,'the founder reproduces naturally');
const progress=firstLegacyProgress(sim,founder,{fedAndWatered:true});assert.equal(progress.family,true);assert.equal(progress.complete,false);

// A non-descendant never earns it.
const stranger=sim.animals.find(a=>a.alive&&a.id!==founder.id&&!sim.lineage.isDescendant(a.id,founder.id));
assert.deepEqual(recordLegacyHandoff(sim,founder,stranger,{reason:'handoff'}),[]);assert.equal(sim.legacyMilestones,undefined);

// Staged only for test time: the natural child is aged to maturity (the real
// timing is measured separately); the handoff itself is the ordinary H path.
child.age=SPECIES[child.species].maturity;sim.lineage.refreshSelection();
assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true);
const handoff=sim.lineage.handoffs.at(-1),m=sim.legacyMilestones?.firstLegacy;
assert.deepEqual(handoff.legacy,['firstLegacy']);assert.ok(m);
assert.equal(m.from.id,founder.id);assert.equal(m.to.id,child.id);assert.equal(m.to.generation,founder.generation+1);assert.equal(m.reason,'handoff');
assert.ok(m.offspringBorn>=1&&m.offspringAlive>=1);assert.ok(m.inheritedParts.length>0);
for(const p of m.inheritedParts)assert.ok(m.from.parts.includes(p)&&m.to.parts.includes(p));
assert.equal(firstLegacyProgress(sim,sim.player()).complete,true);

// Earned once; the world continues.
const grand={...child,id:-901};assert.deepEqual(recordLegacyHandoff({...sim,legacyMilestones:sim.legacyMilestones,lineage:{isDescendant:()=>true}},child,{...grand,generation:3},{reason:'handoff'}),[]);
for(let t=0;t<CFG.dayTicks;t++)sim.update(null);assert.ok(sim.player()?.alive,'play continues after the milestone');

// Eight-Generation Legacy from the same handoff rule.
{const stub={animals:[],day:400,year:3,tickCount:1,lineage:{isDescendant:()=>true}},from={id:1,generation:7,species:'genvo',age:200,bodyPlan:{nodes:[{partId:'soft-torso'}]}},to={id:2,generation:8,species:'genvo',age:40,bodyPlan:{nodes:[{partId:'soft-torso'}]}};
 assert.deepEqual(recordLegacyHandoff(stub,from,to,{reason:'death'}),['firstLegacy','eightGenerations']);assert.equal(stub.legacyMilestones.eightGenerations.to.generation,8)}

// Summary reports the real record; saves keep it exactly; corrupt records fail.
const model=buildLegacySummary('firstLegacy',m);assert.equal(model.title,'Your Legacy Begins');assert.ok(model.rows.some(([k,v])=>k==='Offspring'&&v.includes(String(m.offspringBorn))));
const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})),back=restoreSimulationSnapshot(structuredClone(snap));
assert.deepEqual(back.legacyMilestones,sim.legacyMilestones);assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),snap);
const bad=structuredClone(snap);bad.core.legacyMilestones.firstLegacy.to.generation=1;assert.throws(()=>restoreSimulationSnapshot(bad),/Invalid legacy milestone/);
assert.doesNotThrow(()=>validateLegacyMilestones(undefined));
console.log('Legacy milestones PASS: natural birth, descendant-only award at the ordinary handoff, real summary of parent, descendant, inherited anatomy and offspring, awarded once with play continuing, eight-generation rule, exact save and validation.');
