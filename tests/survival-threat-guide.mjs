import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SurvivalThreatGuide,observedSurvivalThreat} from '../src/ui/survival-threat-guide.js';
import {HomeTutorialGuide} from '../src/ui/home-tutorial-guide.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Controlled perception/presentation fixture; no artificial encounter is a completion requirement.
const sim=new Simulation('SURVIVAL-THREAT-GUIDE'),actor=sim.player();
const hunter=sim.animals.find(a=>a.species==='needlejaw'&&sim.isPredatorTo(a,actor));assert.ok(hunter);
for(const a of sim.animals)if(a!==actor&&a!==hunter){a.x=110;a.y=110}
hunter.x=actor.x+.8;hunter.y=actor.y;actor.dir=2;
const guide=new SurvivalThreatGuide({querySelectorAll:()=>[]}),rng=sim.rng.state,energy=actor.energy;
assert.equal(observedSurvivalThreat(sim,actor).hunter.id,hunter.id);
assert.match(guide.read(sim).text,/reachable target.*costs breath.*provoke/);
const resumeStage=sim.uiTutorialStage='step-home';
hunter.playerHunt={targetId:actor.id,phase:'stalk',pursuit:'chase'};
assert.match(guide.read(sim).text,/WASD.*Shift.*breath.*not guaranteed/);
hunter.playerHunt.phase='charge';assert.match(guide.read(sim).text,/facing.*reduces frontal damage/);
assert.equal(sim.uiTutorialStage,resumeStage,'Threat priority must not advance or reset the lesson');
assert.equal(sim.rng.state,rng);assert.equal(actor.energy,energy);
const mate=sim.animals.find(a=>a.id===sim.starterMateId);mate.x=actor.x+.5;mate.y=actor.y;
hunter.x=actor.x+40;assert.equal(guide.read(sim),null,'Hidden hunter identity and pursuit cannot leak');
hunter.x=actor.x+.8;delete hunter.playerHunt;guide.reset();guide.read(sim);sim.tickCount+=100;
assert.equal(guide.read(sim),null,'Quiet sighting expires without repeated warnings');
hunter.x+=40;guide.read(sim);hunter.x=actor.x+.8;assert.equal(guide.read(sim),null,'Same quiet hunter does not spam on re-entry');

const homeGuide=new HomeTutorialGuide({querySelectorAll:()=>[]});
const state=sim.territory.state(actor);state.home={x:actor.x,y:actor.y};state.established=true;state.radius=8;
sim.uiTutorialHome={preexisting:true};assert.equal(homeGuide.read(sim).complete,true,'Recognize an earned home predating the step');
sim.uiTutorialHome={preexisting:false};assert.notEqual(homeGuide.read(sim).complete,true,'New planned home still needs the actual ground action');
assert.ok(sim.territory.markHomeSite(actor,{kind:'ground',x:actor.x,y:actor.y}).ok);
assert.equal(homeGuide.read(sim).complete,true);
sim.uiTutorialRules='survival-home/1';sim.uiTutorialDefense={braced:true};
const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
assert.equal(restored.uiTutorialRules,sim.uiTutorialRules);assert.deepEqual(restored.uiTutorialHome,sim.uiTutorialHome);
assert.deepEqual(restored.uiTutorialDefense,sim.uiTutorialDefense);assert.deepEqual(restored.territory.homeSiteFor(restored.player()),sim.territory.homeSiteFor(actor));
console.log('Survival guidance PASS: actual perceived threats, priority without progress corruption, bounded warnings, read-only biology and saved earned-home lessons.');
