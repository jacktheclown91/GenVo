import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {TutorialController} from '../src/ui/tutorial.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

// --- 1. HTML Verification ---
assert.match(html,/WELCOME TO GENVO/,'welcome card has exact heading');
assert.match(html,/You're the creature with the gold ring!/,'welcome card has exact player subtitle');
assert.match(html,/Mouse — Move, select, and interact\./,'welcome card has mouse controls');
assert.match(html,/E<\/strong> — Interact with most things/,'welcome card has E interaction');
assert.match(html,/SPACE<\/strong> — Attack/,'welcome card has SPACE attack');
assert.match(html,/SHIFT<\/strong> — Sprint/,'welcome card has SHIFT sprint');
assert.match(html,/WASD<\/strong> — Move/,'welcome card has WASD movement');
assert.match(html,/LET'S BEGIN/,'welcome card has exact button label');

assert.match(html,/YOU'RE READY!/,'completion modal has exact heading');
assert.match(html,/You've eaten, drunk, and found a mate\./,'completion modal has exact summary');
assert.match(html,/Survive\. Evolve\. Leave a Legacy\./,'completion modal has exact legacy motto');
assert.match(html,/The rest of your story is yours to discover\./,'completion modal has exact closing sentence');
assert.match(html,/CONTINUE PLAYING/,'completion modal has exact continue button label');

// Verify no skip button inside #welcome
const welcomeSection=html.match(/<section id="welcome"[^>]*>([\s\S]*?)<\/section>/)?.[1]||'';
assert.doesNotMatch(welcomeSection,/skipTutorial|Skip/i,'welcome card has no skip button');

// Helper to create mock DOM elements for TutorialController
function createMockController(sim){
  const welcomeEl={hidden:true};
  const completeEl={hidden:true};
  const tutorialEl={
    hidden:true,
    className:'',
    dataset:{},
    innerHTML:'',
    setAttribute(){},
    removeAttribute(){}
  };
  const c=Object.create(TutorialController.prototype);
  c.sim=sim;
  c.renderer={guideTarget:null};
  c.welcome=welcomeEl;
  c.completeModal=completeEl;
  c.tutorial=tutorialEl;
  c.toasts=[];
  c.showToast=(msg,ms,tone,channel)=>c.toasts.push({msg,tone,channel});
  c.render=(title,body,opts={})=>{
    c.shown={title,body,opts};
    tutorialEl.dataset.guideTitle=title;
    tutorialEl.dataset.guideStep=opts.step||'';
  };
  return c;
}

// --- 2. Fresh World Initialization ---
{
  const sim=new Simulation('MANDATORY-TUTORIAL-FRESH',{player:true});
  const c=createMockController(sim);
  c.setSimulation(sim,{fresh:true});

  assert.equal(c.stage,'welcome','new world starts at welcome stage');
  assert.equal(sim.uiTutorialStage,'welcome','simulation records welcome stage');
  assert.equal(c.welcome.hidden,false,'welcome card is displayed on fresh start');
  assert.equal(sim.paused,true,'simulation is paused while welcome card is up');
  assert.equal(c.worldInputBlocked(),true,'world input is blocked while reading welcome card');

  // Key handling: Space or Enter begins tutorial
  const handled=c.handleKey('Space');
  assert.equal(handled,true,'Space triggers begin from welcome card');
  assert.equal(c.stage,'step-food','advances to step-food');
  assert.equal(sim.uiTutorialStage,'step-food');
  assert.equal(c.welcome.hidden,true,'welcome card is closed');
  assert.equal(sim.paused,false,'game is unpaused into active play');
  assert.equal(c.worldInputBlocked(),false,'world input is active for gameplay');

  // Verify Step 1 UI
  assert.equal(c.shown.title,'STEP 1/3 — FIND FOOD');
  assert.match(c.shown.body,/You're hungry! Find something edible\./);
  assert.match(c.shown.body,/Click the highlighted food and choose Eat, or move close and press E\./);
  assert.equal(c.shown.opts.step,'1/3');
  assert.equal(c.shown.opts.compact,false,'step instructions are clearly readable and not collapsed');
  assert.ok(c.renderer.guideTarget,'food guide target is set for player');
  assert.equal(c.renderer.guideTarget.label,'Food');
}

// --- 3. Step 1 -> Step 2 (Food -> Water) ---
{
  const sim=new Simulation('MANDATORY-TUTORIAL-STEP1',{player:true});
  const p=sim.player();
  const c=createMockController(sim);
  c.setSimulation(sim,{fresh:true});
  c.begin(); // Let's begin

  assert.equal(c.stage,'step-food');
  assert.equal(c.toasts.length,0);

  // Player eats real food
  sim.cognition.recordOnce(p,'first-meal:bramble','First ate Berries',{kind:'bramble'});
  p.lastMeal={kind:'bramble',tick:sim.tickCount};
  c.update(true);

  // Verifies success toast & advance
  assert.ok(c.toasts.some(t=>t.msg==="✓ Nice! You've eaten."),"shows exact '✓ Nice! You\\'ve eaten.' success message");
  assert.equal(c.stage,'step-water','advances to step-water');
  assert.equal(sim.uiTutorialStage,'step-water');

  // Verify Step 2 UI
  assert.equal(c.shown.title,'STEP 2/3 — FIND WATER');
  assert.match(c.shown.body,/Every creature needs water\./);
  assert.match(c.shown.body,/Click the highlighted freshwater source and choose Drink, or stand beside it and press Shift\+E\./);
  assert.equal(c.shown.opts.step,'2/3');
  assert.equal(c.shown.opts.compact,false);
  assert.ok(c.renderer.guideTarget,'water guide target is set');
  assert.equal(c.renderer.guideTarget.label,'Water');
}

// --- 4. Step 2 -> Step 3 (Water -> Mate) ---
{
  const sim=new Simulation('MANDATORY-TUTORIAL-STEP2',{player:true});
  const p=sim.player();
  const c=createMockController(sim);
  c.setSimulation(sim,{fresh:true});
  c.advance('step-water');

  assert.equal(c.stage,'step-water');

  // Player drinks actual water
  sim.cognition.onDrink(p);
  c.onInteraction({ok:true,type:'drink',message:'Drank freshwater'});

  // Verifies success toast & advance
  assert.ok(c.toasts.some(t=>t.msg==="✓ You're hydrated!"),"shows exact '✓ You\\'re hydrated!' success message");
  assert.equal(c.stage,'step-mate','advances to step-mate');
  assert.equal(sim.uiTutorialStage,'step-mate');

  // This fixture advanced directly while paused. Do not falsely mark an
  // unavailable partner; explain the actual blocking state first.
  assert.equal(c.shown.title,'STEP 3/3 — NO READY PARTNER NEARBY');
  assert.match(c.shown.body,/Resume the world/);
  assert.equal(c.renderer.guideTarget,null);
  sim.paused=false;c.update(true);
  assert.equal(c.shown.title,'STEP 3/3 — MEET A POSSIBLE MATE');
  assert.match(c.shown.body,/Click the creature marked Mate/);
  assert.equal(c.shown.opts.step,'3/3');
  assert.equal(c.shown.opts.compact,false);
  assert.ok(c.renderer.guideTarget,'only a currently available mate receives a marker');
  assert.equal(c.renderer.guideTarget.label,'Mate');
}

// --- 5. Step 3 -> Completion Modal -> Normal Gameplay ---
{
  const sim=new Simulation('MANDATORY-TUTORIAL-STEP3',{player:true});
  const p=sim.player();
  const mate=sim.animals.find(a=>a.id===sim.starterMateId);
  const c=createMockController(sim);
  c.setSimulation(sim,{fresh:true});
  c.advance('step-mate');

  assert.equal(c.stage,'step-mate');

  // Establish mate through courtship
  p.lastMate=mate.id;
  mate.lastMate=p.id;
  c.update(true);

  // Verifies success toast & completion modal
  assert.ok(c.toasts.some(t=>t.msg==="✓ You've found a mate!"),"shows exact '✓ You\\'ve found a mate!' success message");
  assert.equal(c.stage,'step-complete','advances to step-complete');
  assert.equal(sim.uiTutorialStage,'step-complete');
  assert.equal(c.completeModal.hidden,false,'completion modal is visible');
  assert.equal(sim.paused,true,'simulation is paused during completion modal');
  assert.equal(c.worldInputBlocked(),true,'world input blocked while viewing modal');

  // Pressing Enter on completion modal finishes tutorial
  const handled=c.handleKey('Enter');
  assert.equal(handled,true);
  assert.equal(c.completeModal.hidden,true,'completion modal closed');
  assert.equal(c.stage,'done','tutorial finished');
  assert.equal(sim.uiTutorialStage,'done');
  assert.equal(sim.paused,false,'game resumes normal unpaused gameplay');
  assert.equal(c.worldInputBlocked(),false);
  assert.equal(c.renderer.guideTarget,null,'guide target cleared');

  // Dynamic contextual guidance now active
  c.update(true);
  assert.notEqual(c.shown.title,'STEP 3/3 — FIND A MATE');
}

// --- 6. Save and Resume Persistence Across Steps ---
{
  const sim=new Simulation('MANDATORY-TUTORIAL-SAVE',{player:true});
  const c=createMockController(sim);
  c.setSimulation(sim,{fresh:true});

  // Verify save at step-food
  c.advance('step-food');
  const snap1=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  assert.equal(snap1.uiTutorialStage,'step-food','saved snapshot remembers step-food');
  const c1=createMockController(snap1);
  c1.setSimulation(snap1,{resume:true});
  assert.equal(c1.stage,'step-food','resuming world stays at step-food');
  assert.equal(c1.shown.title,'STEP 1/3 — FIND FOOD');

  // Verify save at step-water
  c.advance('step-water');
  const snap2=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  assert.equal(snap2.uiTutorialStage,'step-water','saved snapshot remembers step-water');
  const c2=createMockController(snap2);
  c2.setSimulation(snap2,{resume:true});
  assert.equal(c2.stage,'step-water','resuming world stays at step-water');
  assert.equal(c2.shown.title,'STEP 2/3 — FIND WATER');

  // Verify save at step-mate
  c.advance('step-mate');
  const snap3=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  assert.equal(snap3.uiTutorialStage,'step-mate','saved snapshot remembers step-mate');
  const c3=createMockController(snap3);
  c3.setSimulation(snap3,{resume:true});
  assert.equal(c3.stage,'step-mate','resuming world stays at step-mate');
  assert.match(c3.shown.title,/^STEP 3\/3 — /);
  assert.ok(c3.tutorial.dataset.mateStep,'resumed lesson derives its next cue from current availability');

  // Verify save at done
  c.advance('done');
  const snap4=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  assert.equal(snap4.uiTutorialStage,'done','saved snapshot remembers done');
  const c4=createMockController(snap4);
  c4.setSimulation(snap4,{resume:true});
  assert.equal(c4.stage,'done','completed tutorial remains completed on reload');
}

// --- 7. Starting Environment Accessibility ---
{
  const sim=new Simulation('MANDATORY-TUTORIAL-STARTING-ENV',{player:true});
  const p=sim.player();
  assert.ok(p,'player exists');

  // Food within starting range
  const nearbyFood=sim.foraging.options(p);
  assert.ok(nearbyFood.length>0,'reachable food available from start without teleport');

  // Freshwater within starting range
  const drinkable=sim.world.nearestDrinkable(p.x,p.y,30);
  assert.ok(drinkable,'reachable water available from start without teleport');

  // Compatible mate nearby
  const mate=sim.animals.find(a=>a.id===sim.starterMateId);
  assert.ok(mate&&mate.alive,'starter mate exists');
  assert.ok(Math.hypot(mate.x-p.x,mate.y-p.y)<=20,'starter mate within accessible distance');
}

console.log('Mandatory simplified tutorial test suite: PASS');
