import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {buildSuccessorChoices} from '../src/ui/succession-chooser.js';
import {hudDoingLine,relativeSummary} from '../src/ui/inspector.js';
import {buildGenerationReveal} from '../src/ui/generation-reveal.js';
import {buildJournalEntry} from '../src/ui/journal.js';
import {setForm} from '../src/lineage/readings.js';
import {TutorialController} from '../src/ui/tutorial.js';

// v1.33.4 runtime/UI pass: successor cards show each body, AUTO says what the creature is
// doing, and the journal lists what a creature itself knows.

const sim=new Simulation('GENVO8-OBSERVER-READ',{player:true}),f=sim.player(),mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==f.id);
const kids=[];for(let i=0;i<2;i++){const c=sim.spawnAnimal('genvo',f.x+1+i,f.y,[f,mate]);sim.lineage.registerBirth(c,[f,mate]);c.age=SPECIES.genvo.maturity+5;c.health=100;kids.push(c)}
setForm(kids[0],{kind:'forager',strength:.7,sourceGeneration:2});kids[1].genes.body=.85;

// Successor cards carry what the portrait needs: the body's genes, adaptations, form and trait.
{
  const cards=buildSuccessorChoices(sim);assert.equal(cards.length,2);
  for(const c of cards){assert.ok(c.portrait?.genes,'each card has a portrait');assert.ok(Array.isArray(c.portrait.adaptations))}
  assert.equal(cards.find(c=>c.id===kids[0].id).portrait.divergence.kind,'forager','the portrait shows the inherited form');
  assert.equal(cards.find(c=>c.id===kids[1].id).portrait.genes.body,.85,'and the body genes that shape it');
}

// AUTO: the HUD says what the creature is doing; outside AUTO it keeps the habit line.
{
  f.intent='drink';sim.playerAutonomy=false;assert.equal(hudDoingLine(sim,f),'');
  sim.playerAutonomy=true;assert.match(hudDoingLine(sim,f),/now: Seeking water/);
  f.intent='tendency-forage';assert.match(hudDoingLine(sim,f),/now: Foraging</,'qualifiers the AUTO badge already implies are dropped');
  f.intent='explore';f.target={x:1,y:1,avoiding:true};assert.match(hudDoingLine(sim,f),/Steering clear of a feared place/,'fear steering is named');
  sim.playerAutonomy=false;f.target=null;
}

// Journal: places a creature itself knows, and the places it fears.
{
  const e0=buildJournalEntry(sim,kids[0].id);assert.equal(e0.lastWater,'knows no places of its own yet');assert.equal(e0.lastFood,'fears no places');
  const bank=sim.world.nearestDrinkable(kids[0].x,kids[0].y,60);sim.cognition.knowPlace(kids[0],'water',bank.x,bank.y);sim.cognition.knowPlace(kids[0],'danger',kids[0].x,kids[0].y,{cause:{victimId:kids[0].id}});
  const e1=buildJournalEntry(sim,kids[0].id);assert.equal(e1.lastWater,'knows 1 water bank');assert.equal(e1.lastFood,'fears 1 place where a Stalker struck');
  assert.doesNotMatch(JSON.stringify(e1),/today ago/,'no broken memory ages');
  sim.kill(kids[1],'old age');assert.equal(buildJournalEntry(sim,kids[1].id).lastWater,'its places died with it');
}
// v1.33.5: switching to a relative, and taking over, say what it has learned and knows.
{
  const r=sim.spawnAnimal('genvo',f.x+3,f.y);r.lineage=true;r.age=SPECIES.genvo.maturity+2;
  assert.equal(relativeSummary(sim,r),'no settled habits yet · knows no places yet');
  sim.habits.ensure(r).home=.6;const bank=sim.world.nearestDrinkable(r.x,r.y,60);sim.cognition.knowPlace(r,'water',bank.x,bank.y);sim.cognition.knowPlace(r,'danger',r.x,r.y,{cause:{victimId:r.id}});
  assert.match(relativeSummary(sim,r),/^strongly stays near home · knows 1 place · fears 1$/);
  const rev=buildGenerationReveal({bringsText:relativeSummary(sim,r),handoff:{generation:2,changes:[],founderChanges:[]},fromRecord:{generation:1,genes:{}},toRecord:{generation:2,genes:{}}});
  assert.match(rev.lead,/What it brings: strongly stays near home · knows 1 place · fears 1\./,'the reveal says what the new creature brings in its visible lead');
}
// v1.33.6: in AUTO the opening goals describe what the creature does on its own and say plainly
// what only you can do; any goal naming a key adds that you have to take over.
{
  const s2=new Simulation('GENVO8-OBSERVER-AUTO',{player:true}),p2=s2.player(),c=Object.create(TutorialController.prototype);
  c.sim=s2;c.renderer={guideTarget:null};c.stage='goals';s2.uiTutorialStage='goals';c.startPos={x:p2.x-5,y:p2.y};c.toasts=[];c.showToast=m=>c.toasts.push(m);
  c.tutorial={hidden:true,dataset:{},className:'',innerHTML:'',title:''};
  s2.playerAutonomy=true;c.renderOpeningGoals(p2);assert.match(c.tutorial.dataset.guideBody,/looks for food and water on its own/);
  s2.cognition.recordOnce(p2,'first-drink','d');s2.cognition.recordOnce(p2,'first-meal:sunmoss','m');p2.lastMate=1;c.renderOpeningGoals(p2);
  assert.ok(c.tutorial.dataset.guideBody.includes('builds a family shelter on its own once this ground becomes home'),'v1.33.7: AUTO builds the first home itself once home ground settles');
  c.render('Stock the shelter','Stand beside it · F stores nearby food for the family.',{compact:true});assert.match(c.tutorial.dataset.guideBody,/take over to do this$/);
  s2.playerAutonomy=false;c.render('Stock the shelter','Stand beside it · F stores nearby food for the family.',{compact:true});assert.doesNotMatch(c.tutorial.dataset.guideBody,/take over/,'not when you are in control');
}
console.log('observer readability ok');
