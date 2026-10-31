// Verification of first-life experience polish:
// 1. Generation reveal displays exact kinship identity (daughter of #1, son of #1, etc.)
// 2. Naturalist field notes produce grounded observations for key milestones
// 3. Dynamic goals surface acute survival needs before long-term projects
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildGenerationReveal} from '../src/ui/generation-reveal.js';
import {buildJournalEntry} from '../src/ui/journal.js';
import {TutorialController} from '../src/ui/tutorial.js';

// --- Test 1: Generation reveal exact kinship identity ---
{
  const fromRecord = {id: 1, generation: 1, sex: 'female', genes: {}, bodyPlanParts: []};
  const toRecordFemale = {id: 2, generation: 2, sex: 'female', parentIds: [1], genes: {}, bodyPlanParts: []};
  const toRecordMale = {id: 3, generation: 2, sex: 'male', parentIds: [1], genes: {}, bodyPlanParts: []};
  const toRecordGrandson = {id: 4, generation: 3, sex: 'male', parentIds: [2], genes: {}, bodyPlanParts: []};

  const handoff = {generation: 2, changes: [], founderChanges: []};

  const revealDaughter = buildGenerationReveal({handoff, fromRecord, toRecord: toRecordFemale});
  assert.match(revealDaughter.lead, /#2 \(daughter of #1\)/);
  assert.equal(revealDaughter.toLabel, 'Generation 2 #2 (daughter of #1)');

  const revealSon = buildGenerationReveal({handoff, fromRecord, toRecord: toRecordMale});
  assert.match(revealSon.lead, /#3 \(son of #1\)/);
  assert.equal(revealSon.toLabel, 'Generation 2 #3 (son of #1)');

  const revealGrandson = buildGenerationReveal({handoff: {generation: 3, changes: [], founderChanges: []}, fromRecord, toRecord: toRecordGrandson});
  assert.match(revealGrandson.lead, /#4 \(grandson of #1\)/);
  assert.equal(revealGrandson.toLabel, 'Generation 3 #4 (grandson of #1)');

  console.log('Test 1: Generation reveal exact kinship: PASS');
}

// --- Test 2: Naturalist field notes ---
{
  const sim = new Simulation('FIRST-LIFE-POLISH', {player: true});
  const p = sim.player();

  sim.cognition.recordOnce(p, 'first-drink', 'First drink');
  sim.cognition.recordOnce(p, 'first-meal:bramble', 'First ate Berries', {kind: 'bramble'});
  sim.cognition.recordOnce(p, 'first-mate', 'Paired with #2', {id: 2});
  sim.cognition.recordOnce(p, 'threat:stalker', 'Encountered Stalker', {species: 'stalker'});
  sim.cognition.recordOnce(p, 'flee', 'Fled');

  const entry = buildJournalEntry(sim, p.id);
  const notesText = entry.notes.map(n => n.text).join('\n');

  assert.match(notesText, /First recorded drinking from open freshwater/);
  assert.match(notesText, /First recorded feeding on berries/);
  assert.match(notesText, /Courtship accepted; paired with #2/);
  assert.match(notesText, /Sighted predator/);
  assert.match(notesText, /Evaded predator pursuit into dense cover/);

  console.log('Test 2: Naturalist field notes: PASS');
}

// --- Test 3: Acute survival alerts take priority over long-term projects ---
{
  const sim = new Simulation('SURVIVAL-ALERT-TEST', {player: true});
  const p = sim.player();

  const c = Object.create(TutorialController.prototype);
  c.sim = sim;
  c.renderer = {guideTarget: null};
  c.toasts = [];
  c.showToast = (msg, ms, tone, channel) => c.toasts.push({msg, tone, channel});
  c.shown = null;
  c.render = (title, body, opts = {}) => {
    c.shown = {title, body, opts};
  };

  // With normal hydration and energy, acute survival should not trigger
  p.energy = 50;
  p.hydration = 50;
  assert.equal(c.renderAcuteSurvival(p), false);
  assert.equal(c.shown, null);

  // When hydration is critical and already at water
  p.hydration = 10;
  assert.equal(c.renderAcuteSurvival(p), true);
  assert.equal(c.shown.title, 'Drink now · critical thirst');

  // When hydration is critical and not at water
  p.x = 2; p.y = 2; // move to dry ground
  if (!sim.world.isDrinkable(p.x, p.y)) {
    assert.equal(c.renderAcuteSurvival(p), true);
    assert.equal(c.shown.title, 'Dehydration danger');
  }

  // When energy is critical (< 28%) and worse than hydration
  p.hydration = 40;
  p.energy = 8;
  assert.equal(c.renderAcuteSurvival(p), true);
  assert.equal(c.shown.title, 'Starvation danger');

  console.log('Test 3: Acute survival alerts: PASS');
}

console.log('All first-life polish tests PASS');
