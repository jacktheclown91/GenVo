import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const inspector=fs.readFileSync(new URL('../src/ui/inspector.js',import.meta.url),'utf8');
const tutorial=fs.readFileSync(new URL('../src/ui/tutorial.js',import.meta.url),'utf8');

assert.match(html,/id="populations" class="detail-panel ecology readable-panel"/,'Population is an interactive readable panel');
assert.match(html,/id="territory" class="detail-panel readable-panel"/,'Home Range is an interactive readable panel');
assert.match(html,/id="help" class="detail-panel help readable-panel"/,'Help is an interactive readable panel');
assert.match(css,/\.readable-panel\{[^}]*overflow-y:auto/,'long data panels scroll instead of clipping');
assert.match(css,/\.panel-summary\{/,'summary-first panel layout exists');
assert.match(css,/\.readable-panel summary\{[^}]*min-height:36px/,'expandable data rows provide a larger full-row click target');
assert.match(css,/\.readable-panel summary:before\{[^}]*width:22px[^}]*height:22px/,'expand/collapse marker is large enough to locate and click');
assert.match(html,/data-action="autonomy"/,'quick menu exposes selected-creature automation');
assert.match(html,/class="quick-auto-label"[^>]*>AUTO<\/span>/,'automation toggle is visibly labeled instead of icon-only');
assert.match(html,/Tab \/ 1-5 \/ R/,'Help exposes family switching early');
assert.ok((html.match(/<details/g)||[]).length>=6,'Help is split into expandable topics instead of one wall of text');
assert.match(inspector,/renderReadablePanel\(pop/,'Population preserves an interactive section layout during live refresh');
assert.match(inspector,/sectionBlock\('Threat landscape'/,'Home Range keeps deep threat data available on demand');
assert.match(inspector,/Fleeing counts\./,'Danger teaching explicitly tells the player that fleeing is valid');
assert.match(tutorial,/sprint away or defend/,'current task copy teaches flee-or-defend response');

function family(seed='GENVO8-DANGER-TEACH'){
  const sim=new Simulation(seed,{player:true}),parent=sim.player();
  let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id&&a.sex!==parent.sex);
  if(!mate){mate=sim.spawnAnimal('genvo',parent.x+.5,parent.y);mate.sex=parent.sex==='F'?'M':'F'}
  parent.age=mate.age=SPECIES.genvo.maturity+3;parent.energy=mate.energy=110;parent.hydration=mate.hydration=104;parent.health=mate.health=100;
  const child=sim.spawnAnimal('genvo',parent.x-2.7,parent.y,[parent,mate]);sim.lineage.registerBirth(child,[parent,mate]);sim.family.registerBirth(child,parent,mate);
  child.age=SPECIES.genvo.maturity*.32;child.energy=90;child.hydration=88;child.health=100;child.careStress=.12;
  child.learningLessons={water:1,food:1,shelter:1,danger:0};child.learningMemory={water:null,food:null,shelter:null,danger:null};child.learningLessonDays={};
  const stalker=sim.animals.find(a=>a.alive&&a.species==='needlejaw');stalker.x=parent.x+6.5;stalker.y=parent.y;for(let i=0;i<16&&!sim.canReach(parent,stalker.x,stalker.y);i++){const ang=i*Math.PI/8;stalker.x=parent.x+Math.cos(ang)*6.5;stalker.y=parent.y+Math.sin(ang)*6.5}stalker.playerHunt={targetId:parent.id,phase:'stalk',startedTick:sim.tickCount,untilTick:sim.tickCount+100};
  sim.rebuildSpatial();return{sim,parent,child,stalker};
}

{
  const {sim,parent,child}=family();
  assert.equal(sim.family.learningProfile(child).next,'danger','danger is the next lesson in the staged family');
  assert.ok(sim.family.followTarget(child),'young tighten their follow distance while the danger lesson is active');
  parent.intent='player';parent.target={dx:-1,dy:0,sprint:true};
  sim.family.phaseCare();
  assert.equal(child.learningLessons.danger,1,'sprinting away from an engaged nearby Stalker teaches danger without forcing the young into bite range');
  assert.equal(child.learningMemory.danger.response,'flee','the lesson records fleeing as the demonstrated response');
}

{
  const {sim,parent,child}=family('GENVO8-DANGER-WALK-AWAY');
  parent.intent='player';parent.target={dx:-1,dy:0,sprint:false};
  sim.family.phaseCare();
  assert.equal(child.learningLessons.danger,1,'moving away during an active Stalker hunt is also recognized as a flee response');
}

console.log('menu clarity + teachable Stalker flee response: PASS');
