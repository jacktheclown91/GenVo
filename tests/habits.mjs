import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {buildJournalEntry} from '../src/ui/journal.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,SAVE_SCHEMA} from '../src/persistence/save-manager.js';

// v1.30 Habits: what you do with a creature becomes how it behaves on its own.
const sim=new Simulation('GENVO8-HABITS',{player:true});sim.endOpeningGrace('test');
const p=sim.player(),H=sim.habits;
const shelter={id:901,ownerId:p.id,x:p.x,y:p.y,integrity:100,foodStore:0,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(shelter);

// Player feeding far from home trains ranging; near home trains staying home.
{
  const x0=p.x;p.x=shelter.x+12;for(let i=0;i<10;i++)H.noteFeed(p);const far=p.habits.range;
  assert.ok(far>.25,'repeated far feeding builds a ranging habit');
  p.x=shelter.x+1;for(let i=0;i<20;i++)H.noteFeed(p);
  assert.ok(p.habits.home>.25,'feeding at home builds a home habit');assert.ok(p.habits.range<far,'opposite habits pull against each other');p.x=x0;
}

// Encounter outcomes train caution or boldness.
{
  p.habits.caution=0;p.habits.boldness=0;
  H.noteDanger(p,'outrun');H.noteDanger(p,'lost');assert.ok(p.habits.caution>.15,'escaping builds caution');
  for(let i=0;i<4;i++)H.noteDanger(p,'driven-off');assert.ok(p.habits.boldness>p.habits.caution,'driving Stalkers off builds boldness');
}

// Autonomous creatures change much more slowly than the creature you control.
{
  const relative=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);relative.lineage=true;H.ensure(relative);
  const gainAuto=H.reinforce(relative,'hunting',.1),gainManual=H.reinforce(p,'hunting',.1);
  assert.ok(gainManual>gainAuto*2,'player actions train the controlled creature fastest');
}

// Young copy their caregiver, weakly.
{
  const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
  const child=sim.spawnAnimal('genvo',p.x+.5,p.y,[p,mate]);sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);
  child.caregiverId=p.id;p.habits={range:0,home:.9,caution:.8,boldness:0,hunting:0};
  assert.equal(H.ensure(child).caution,0,'habits are not genetic: newborns start with none');
  H.advanceDay();const one=child.habits.caution;assert.ok(one>0&&one<.15,'one day of imitation is a weak pull');
  for(let i=0;i<20;i++){child.x=p.x+.5;child.y=p.y;H.advanceDay()}
  assert.ok(child.habits.caution>.35&&child.habits.home>.35,'a caregiver\'s habits show up in its young over time');
  assert.match(H.summary(child),/wary of Stalkers|stays near home/);
}

// Autonomous decisions read habits.
{
  const a=sim.animals.find(x=>x.alive&&x.species==='genvo'&&x.id!==p.id&&!sim.family.isDependent(x));a.lineage=true;a.age=SPECIES.genvo.maturity+5;a.health=100;
  a.habits={range:0,home:0,caution:.9,boldness:0,hunting:0};assert.ok(H.threatRadiusMultiplier(a)>1.3,'cautious creatures notice threats farther away');
  a.habits={range:0,home:0,caution:0,boldness:.8,hunting:0};assert.equal(H.standsGround(a),true);
  const h=sim.animals.find(x=>x.alive&&x.species==='needlejaw');h.x=a.x+2;h.y=a.y;h.playerHunt=null;sim.rebuildSpatial();
  sim.carrying.shouldRefreshDecision=()=>true;sim.phaseDecision(null);
  assert.equal(a.intent,'mob','a bold adult stands its ground against a nearby Stalker instead of fleeing');
  a.habits={range:.9,home:0,caution:0,boldness:0,hunting:0};assert.ok(H.forageRangeMultiplier(a)>1.4,'a ranging habit widens the food search');assert.equal(H.rangeStyle(a),'forager');
  a.habits={range:0,home:0,caution:0,boldness:0,hunting:.8};assert.ok(H.huntRadius(a)>10,'a hunting habit makes a hungry adult look for prey');
}

// The family tendency adds up real habits, and cards show them.
{
  const adults=sim.tendency.adults();for(const a of adults)a.habits={range:.9,home:0,caution:0,boldness:0,hunting:0};
  const before=sim.tendency.scores.forager;sim.tendency.advanceDay();if(adults.length>=2)assert.ok(sim.tendency.scores.forager>before+.15,'ranging habits push the family toward Independent foragers');
  const entry=buildJournalEntry(sim,p.id);assert.ok(entry.habits&&!/undefined/.test(entry.habits),'journal card shows habits');
}

// Saves: v1.29 schema 2 saves migrate to schema 3 with empty habits.
{
  assert.ok(SAVE_SCHEMA>=3);
  const old=structuredClone(createSimulationSnapshot(sim));old.schema=2;for(const a of old.animals)delete a.habits;delete old.controllers.habits;
// v1.39.0 (creator decision 2026-10-09): saves start fresh; an older save is refused with a clear message.
  assert.throws(()=>restoreSimulationSnapshot(old),/earlier GenVo8/,'older saves are refused, not migrated');
  const rt=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));rt.player().habits.caution=.5;const again=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(rt)));assert.equal(again.player().habits.caution,.5,'habits round-trip');
}
console.log('habits ok');
