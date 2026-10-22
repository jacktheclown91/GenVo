import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {REGIONAL_FRONTIER,frontierStep,frontierDistance} from '../src/world/regional-frontier.js';
import {planetaryWalkIntent,planetaryPosition} from '../src/world/planetary-walkthrough.js';
import {planetaryTravelAvailability,preparePlanetaryDestination,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {PointerApproach} from '../src/ui/pointer-approach.js';
import {regionalControls} from '../src/ui/regional-pointer-route.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'frontier'}));
const fresh=()=>new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1',regionalFrontier:true});
const old=new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1'});
assert.equal(old.world.isPlayable(0,40),false);assert.equal(old.world.isPlayable(127,40),false);
assert.equal(Object.hasOwn(restoreSimulationSnapshot(snap(old)).world,'frontierRules'),false);
assert.match(readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),/worldGenerator:geography,regionalFrontier:geography==='planetary\/1'/,'normal fresh planetary game opts in');
for(const [direction,ox,oy] of [['east',128,0],['west',-128,0],['north',0,-128],['south',0,128]]){
 let live=fresh();live.phaseClimate();const actor=live.player(),input=regionalControls(direction),destination=preparePlanetaryDestination(live,{x:ox,y:oy});
 assert.equal(destination.world.frontierRules,REGIONAL_FRONTIER.policy);
 const walker=new PointerApproach({getSim:()=>live,blocked:()=>false,getRegionWorld:o=>o.x===ox&&o.y===oy?destination.world:null});let goal;
 for(let c=12.5;c<115.5;c++){
  actor.x=ox?(ox>0?124.5:3.5):c;actor.y=oy?(oy>0?124.5:3.5):c;
  const g={kind:'regional-ground',seed:live.seed,planetX:ox?(ox>0?ox+3.5:ox+124.5):c,planetY:oy?(oy>0?oy+3.5:oy+124.5):c};
  if(live.canOccupy(actor,actor.x,actor.y)&&walker.availability(g).enabled){goal=g;break}
 }
 assert.ok(goal,direction+' genuine land route reaches the actual region line');
 assert.equal(planetaryWalkIntent(live,input),null,'no early ownership switch at the old inset');
 assert.equal(planetaryTravelAvailability(live).enabled,false);
 let completed=0;assert.ok(walker.start(goal,()=>completed++).ok);let crossed=false,walkingCost=0;
 for(let k=0;k<2500&&walker.path;k++){
  const a=live.player(),energy=a.energy;live.playerControlStep(walker.read({}),64);walkingCost+=energy-a.energy;
  assert.ok(a.x>=0&&a.x<=128&&a.y>=0&&a.y<=128,'movement never leaves its owned region');
  if(!walker.regionalIntent())continue;
  assert.equal(frontierDistance(live.world,direction,a),0,'physically walk to the exact line');
  assert.equal(planetaryWalkIntent(live,input),direction);
  assert.ok(live.world.pages.cellAt(a.x,a.y),'waiting actor retains a real source page');
  assert.ok(live.regionalEcology.pageOwner(a),'fauna scheduling keeps the actor at the line');
  assert.doesNotThrow(()=>live.world.biomeAt(a.x,a.y,live.climate));
  const boundary=snap(live),restored=restoreSimulationSnapshot(structuredClone(boundary));
  assert.deepEqual(snap(restored),boundary,'boundary saves restore exact stocks, body, position and RNG');
  const regenerated=restoreSimulationSnapshot(structuredClone(boundary),{regenerateWorld:true});
  assert.deepEqual(snap(regenerated),boundary,'regenerated scaffold retains the same versioned boundary');
  for(let j=0;j<8;j++){live.update(input,{externalPlayerControl:true});restored.update(input,{externalPlayerControl:true})}
  assert.deepEqual(snap(live),snap(restored),'real boundary ecology advances identically after Continue');
  assert.equal(frontierDistance(live.world,direction,a),0);
  const waitingEnergy=a.energy;for(let j=0;j<12;j++)live.playerControlStep(input,64);
  assert.equal(a.energy,waitingEnergy,'waiting against the line charges no fictitious movement');
  const before=planetaryPosition(live),travelEnergy=a.energy,body=structuredClone(a.genes),rng=live.rng.state;
  const crossing=crossPlanetaryBorder(live,{preparedDestination:destination});assert.ok(crossing.ok,crossing.message);
  const previous=live;live=crossing.simulation;assert.equal(walker.continueRegional(previous,live),true);
  const after=planetaryPosition(live);
  assert.equal(after.worldX,before.worldX);assert.equal(after.worldY,before.worldY,'ownership transfer has zero physical displacement');
  assert.equal(live.player().energy,travelEnergy,'zero-distance ownership transfer has no travel fee');
  assert.equal(live.playerId,actor.id);assert.deepEqual(live.player().genes,body);assert.equal(previous.rng.state,rng);
  const ids=[...live.animals,...live.planetaryTravel.sessions.flatMap(s=>s.snapshot.animals)].map(a=>a.id);
  assert.equal(new Set(ids).size,ids.length);assert.equal(live.world.frontierRules,REGIONAL_FRONTIER.policy);
  const saved=snap(live);assert.deepEqual(snap(restoreSimulationSnapshot(structuredClone(saved))),saved);
  const corrupt=structuredClone(saved);delete corrupt.core.regionalFrontierRules;assert.throws(()=>restoreSimulationSnapshot(corrupt),/frontier/);
  const corruptArchive=structuredClone(saved);delete corruptArchive.core.planetaryTravel.sessions[0].snapshot.world.frontierRules;assert.throws(()=>restoreSimulationSnapshot(corruptArchive),/frontier/);
  crossed=true;
 }
 assert.ok(crossed,direction);assert.equal(completed,1);assert.ok(walkingCost>0);
 assert.ok(Math.hypot(live.player().x+ox-goal.planetX,live.player().y+oy-goal.planetY)<.3,'ordinary paid movement resumes to the clicked point');
}
const s=fresh(),a=s.player();
const diagonal=frontierStep(s.world,127.9,127.8,128.3,128.2);assert.equal(diagonal.x,128);assert.ok(Math.abs(diagonal.y-127.9)<1e-12,'diagonal motion stops at first line, preserving direction');
a.x=128;a.y=128;a.target={dx:0,dy:1};assert.equal(planetaryWalkIntent(s,{down:true}),'south');assert.equal(planetaryTravelAvailability(s).direction,'south');
a.target={dx:1,dy:0};assert.equal(planetaryWalkIntent(s,{right:true}),'east');assert.equal(planetaryTravelAvailability(s).direction,'east');
// Same last physical distance costs the same at two control frequencies.
a.x=127.999;a.y=40.5;const base=snap(s),slow=restoreSimulationSnapshot(structuredClone(base)),fast=restoreSimulationSnapshot(structuredClone(base));
slow.playerControlStep({right:true},64);fast.playerControlStep({right:true},128);
assert.equal(slow.player().x,128);assert.equal(fast.player().x,128);assert.ok(Math.abs(slow.player().energy-fast.player().energy)<1e-12);
console.log('Regional frontier PASS: genuine paid cardinal mouse routes, exact physical line and zero-distance identity transfer, no waiting movement cost, clipped-step cost parity, source page ownership, exact boundary/regenerated saves, policy corruption refusal and corner intents.');
