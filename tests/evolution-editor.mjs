import {bodyPlanFromLegacy} from '../src/lineage/body-plan.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';
import {place,mirror} from '../src/lineage/evolution-draft.js';
import {planFor} from '../src/lineage/reproduction-bridge.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Evolution Expansion Phase C gate (GDD v1, section 14): edit, commit, reproduce, save, reload,
// all deterministic, with no edits to living creatures and old saves still opening.

function setup(seed,generation=2){
  const sim=new Simulation(seed,{player:true}),p=sim.player();p.generation=generation;p.age=SPECIES.genvo.maturity+5;p.adaptations=[];
  const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex);mate.age=SPECIES.genvo.maturity+5;mate.adaptations=[];
  // These tests design on the old eight-legged body, now a mid-developed creature (v1.39.0).
  // Body-less creatures no longer exist in play (pre-modular saves are refused); use the canonical
  // conversion of that legacy eight-legged body instead of deleting the plan.
  p.bodyPlan=bodyPlanFromLegacy({adaptations:[]});mate.bodyPlan=bodyPlanFromLegacy({adaptations:[]});
  return{sim,p,mate};
}
function mate(sim,a,b){const female=a.sex==='F'?a:b,male=a.sex==='F'?b:a;female.pregnant={fatherId:male.id,days:1,totalDays:16,startedDay:sim.day,startedYear:sim.year};sim.reproduction.onMated(a,b);return female}

// AUTO play cannot skip the editor: when the active creature mates on its own, the litter still waits for a design.
{const {sim,p,mate:m}=setup('GENVO8-EDITOR-AUTO',1);sim.setPlayerAutonomy(true);m.x=p.x+.5;m.y=p.y;for(const x of [p,m]){x.reproCooldown=0;x.energy=SPECIES.genvo.maxEnergy;x.health=100;x.pregnant=null}
 placeSupportedBreedingPair(sim,p,m);
 assert.equal(sim.tryMate(p,m),true,'the autonomous creature mates');assert.ok(sim.evolutionEditor.pending(),'an AUTO mating still opens the editor')}
// The editor opens from the founder's first litter (creator direction 2026-10-10).
{const {sim,p,mate:m}=setup('GENVO8-EDITOR-G1',1);mate(sim,p,m);assert.ok(sim.evolutionEditor.pending(),'the founder shapes its first litter in the editor');assert.equal(sim.evolutionEditor.pending().generation,2)}

const {sim,p,mate:m}=setup('GENVO8-EDITOR-FLOW');
const mother=mate(sim,p,m);const offer=sim.evolutionEditor.pending();assert.ok(offer,'mating as Generation 2 opens the editor');assert.equal(offer.motherId,mother.id);

// Draft: editing never touches the live creature or the world RNG.
const rng=sim.rng.state,before=JSON.stringify({p:p.anatomy,a:p.adaptations,plan:p.bodyPlan||null});
const draft=sim.evolutionEditor.openDraft();assert.equal(draft.budget,8+sim.evolutionBudget.earnedBonus());
assert.equal(place(draft,'spring-leg','root','limb.3').ok,true);mirror(draft,'root/limb.3');assert.equal(place(draft,'spring-leg','root','limb.4').ok,true);
assert.equal(place(draft,'tearing-jaw','root','mouth').ok,true);assert.equal(place(draft,'armor-plate','root','flank.left').ok,true);mirror(draft,'root/flank.left');
assert.equal(JSON.stringify({p:p.anatomy,a:p.adaptations,plan:p.bodyPlan||null}),before,'the living parent is never edited');assert.equal(sim.rng.state,rng,'editing does not move the world RNG');

// Cancel costs nothing.
sim.evolutionBudget.sinceHandoff=12;const bonus=sim.evolutionBudget.earnedBonus();assert.equal(bonus,2);
assert.equal(sim.evolutionEditor.cancel(),true);assert.equal(sim.evolutionBudget.earnedBonus(),bonus,'cancelling spends nothing');assert.equal(sim.evolutionEditor.pending(),null);
// Mating again reopens it; commit attaches the design to the expecting mother and spends the bonus.
mother.pregnant=null;mate(sim,p,m);const d2=sim.evolutionEditor.openDraft();for(const i of [3,4,5])place(d2,'spring-leg','root',`limb.${i}`);place(d2,'tearing-jaw','root','mouth');
const r=sim.evolutionEditor.commit(d2);assert.equal(r.ok,true,JSON.stringify(r.problems));assert.equal(sim.evolutionBudget.sinceHandoff,0);assert.ok(mother.lineageTarget?.plan);
assert.equal(p.adaptations.includes('spring-tendons'),false,'still no retroactive edit after commit');

// Save and reload mid-pregnancy keeps the committed design.
const snap=structuredClone(createSimulationSnapshot(sim)),s2=restoreSimulationSnapshot(structuredClone(snap)),m2=s2.animals.find(a=>a.id===mother.id);
assert.deepEqual(m2.lineageTarget.plan,mother.lineageTarget.plan,'the committed design survives save and reload');

// Reproduce: the litter carries the design and its abilities; the parent does not.
function birth(s,mum){const kids=s.giveBirth(mum);return kids}
const kidsA=birth(sim,mother),kidsB=birth(s2,m2);assert.ok(kidsA.length>0);
for(const k of kidsA){assert.deepEqual(planFor(k).nodes.map(n=>n.partId).filter(x=>x==='spring-leg').length,3);assert.ok(k.adaptations.includes('spring-tendons'),'spring legs give Spring Tendons');assert.ok(k.adaptations.includes('heavy-jaw'),'a tearing jaw gives Heavy Jaw');assert.equal(k.adaptations.includes('hardened-mantle'),false,'the second edit (armor) was not committed')}
assert.equal(mother.lineageTarget,undefined,'the design is used up by its litter');
assert.deepEqual(kidsA.map(k=>[k.id,k.adaptations,k.bodyPlan.id]),kidsB.map(k=>[k.id,k.adaptations,k.bodyPlan.id]),'reloading reproduces the same litter (deterministic)');
assert.equal(sim.lineage.records.get(kidsA[0].id).bodyPlanParts.includes('spring-leg'),true,'the lineage remembers the design for ancestry');
// Next generation's draft starts from the shaped body, and crushing jaw is now reachable.
{const k=kidsA[0];k.age=SPECIES.genvo.maturity+2;sim.lineage.handoffTo(k.id,{manual:true});const m3=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.sex!==k.sex&&a.id!==k.id);m3.age=SPECIES.genvo.maturity+2;m3.bodyPlan=structuredClone(k.bodyPlan);mate(sim,k,m3);
 const d3=sim.evolutionEditor.openDraft();assert.ok(d3.base.nodes.some(n=>n.partId==='spring-leg'),'the child\'s design is the next starting point');assert.equal(place(d3,'crushing-jaw','root','mouth').ok,true,'the tearing jaw ancestor unlocks the crushing jaw')}

// Removing a mapped part removes its ability.
{const {sim:s,p:q,mate:mm}=setup('GENVO8-EDITOR-REMOVE');q.adaptations=['hardened-mantle'];q.anatomy={...(q.anatomy||{}),armor:.65};mm.anatomy={...q.anatomy};mm.adaptations=[...q.adaptations];for(const x of [q,mm])x.bodyPlan=bodyPlanFromLegacy({adaptations:x.adaptations});const mum=mate(s,q,mm);const d=s.evolutionEditor.openDraft();
 assert.ok(d.base.nodes.some(n=>n.partId==='armor-plate'));for(const n of d.base.nodes.filter(n=>n.partId==='armor-plate'))d.plan=d.plan; // keep base
 const {remove}=await import('../src/lineage/evolution-draft.js');for(const id of d.plan.nodes.filter(n=>n.partId==='armor-plate').map(n=>n.id))remove(d,id);
 assert.equal(s.evolutionEditor.commit(d).ok,true);const kids=s.giveBirth(mum);for(const k of kids)assert.equal(k.adaptations.includes('hardened-mantle'),false,'removing armor removes Hardened Mantle in the litter')}

// Wildlife still has its own inherited body plan; no editor commits to wild adults.
{const wild=sim.animals.find(a=>a.alive&&a.species==='genvo'&&!a.lineage);if(wild)assert.ok(wild.bodyPlan)}
console.log('evolution editor ok');
