import {CreatureContextTray} from '../src/ui/creature-context-tray.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {visibleRegionalFauna,resolveRegionalCreature,regionalCreatureAt} from '../src/world/regional-fauna.js';
import {drawRegionalAnimal} from '../src/render/regional-fauna.js';
import {PointerApproach} from '../src/ui/pointer-approach.js';
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'regional-fauna'}));
const origin=new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1',regionalFrontier:true});origin.phaseClimate();
const actual=origin.animals.find(a=>a.id===176);assert.ok(actual?.alive&&actual.bodyPlan,'untouched genuine border founder');
origin.uiTutorialStage='goals';origin.openingGraceUntilDay=7;origin.openingGraceEnded=true;
origin.player().x=128;origin.player().y=actual.y;const trip=crossPlanetaryBorder(origin);assert.ok(trip.ok);
let sim=trip.simulation;sim.player().dir=6;
assert.equal(sim.uiTutorialStage,'goals');assert.equal(sim.openingGraceUntilDay,7);assert.equal(sim.openingGraceEnded,true,'crossing cannot restart introductory protection');
const remoteRenderer={sim:{terrain:true},ctx:{terrain:true},camera:{x:64,y:64},w:1,h:1,zoom:1,renderNow:0,screenPos:new Map(),screenBounds:new Map(),drawAnimal(actor){assert.equal(actor,entry.actor,'draw the owned body, not a fabricated substitute');assert.equal(this.sim.animals,session.snapshot.animals);assert.equal(this.sim.world.water,session.snapshot.world.surfaceWater.mask);this.screenPos.set(actor.id,{x:300,y:200});this.screenBounds.set(actor.id,{left:290,top:190,right:310,bottom:210})}};
let session=sim.planetaryTravel.sessions.find(s=>s.key==='0,0');
const border={sim,views:new Map([['0,0',{renderer:remoteRenderer}]])};
const before=snapshot(sim),entries=visibleRegionalFauna(sim,border),entry=entries.find(e=>e.actor.id===actual.id);
assert.ok(entry);assert.equal(entry.actor,session.snapshot.animals.find(a=>a.id===actual.id));assert.equal(entry.x,actual.x-128);
const target={kind:'regional-creature',id:actual.id,seed:sim.seed,x:entry.x,y:entry.y,planetX:actual.x,planetY:actual.y};
assert.equal(resolveRegionalCreature(sim,border,target).actor,entry.actor);
assert.equal(sim.interactionOptions(target).length,0,'remote identity grants no local interaction or target fallback');
const main={sim,borderTerrain:border,ctx:{main:true},camera:{x:0,y:actual.y},w:1366,h:768,zoom:2,renderNow:100,regionalScreenPos:new Map(),screenBounds:new Map(),overlayRegionalTargetId:actual.id};
const originalRenderer={...remoteRenderer};drawRegionalAnimal(main,entry,32);assert.deepEqual(remoteRenderer,originalRenderer,'draw restores the entire temporary rendering context');
assert.equal(main.regionalScreenPos.get(actual.id).x,300);assert.equal(regionalCreatureAt(sim,main,300,200).id,actual.id);assert.equal(regionalCreatureAt(sim,main,500,500),null);
assert.deepEqual(snapshot(sim),before,'collection, sight, hit testing and body rendering change no biology, stocks or RNG');
const draw=remoteRenderer.drawAnimal;remoteRenderer.drawAnimal=()=>{throw Error('draw failed')};assert.throws(()=>drawRegionalAnimal(main,entry,32),/draw failed/);assert.equal(remoteRenderer.sim,originalRenderer.sim);assert.equal(remoteRenderer.ctx,originalRenderer.ctx);remoteRenderer.drawAnimal=draw;
const tick=session.snapshot.core.tickCount;session.snapshot.core.tickCount=sim.tickCount-7;assert.equal(visibleRegionalFauna(sim,border).length,0,'no stale population ghosts');session.snapshot.core.tickCount=tick;
session.snapshot.core.tickCount=-1;assert.equal(visibleRegionalFauna(sim,border).length,0);session.snapshot.core.tickCount=sim.tickCount+1;assert.equal(visibleRegionalFauna(sim,border).length,0);session.snapshot.core.tickCount=tick;
session.biologicalMode='regional-demography/1';assert.equal(visibleRegionalFauna(sim,border).length,0);session.biologicalMode='canonical-ticks/1';
session.parked=true;assert.equal(resolveRegionalCreature(sim,border,target),null);delete session.parked;
entry.actor.alive=false;assert.equal(resolveRegionalCreature(sim,border,target),null);entry.actor.alive=true;
sim.player().underground=true;assert.equal(visibleRegionalFauna(sim,border).length,0);delete sim.player().underground;
entry.actor.diveDepth=1;assert.equal(resolveRegionalCreature(sim,border,target),null);delete entry.actor.diveDepth;
assert.equal(resolveRegionalCreature(sim,border,{...target,seed:'other'}),null);assert.equal(resolveRegionalCreature(sim,border,{...target,id:999999}),null);
border.views.delete('0,0');assert.equal(resolveRegionalCreature(sim,border,target),null);border.views.set('0,0',{renderer:remoteRenderer});
// The existing discovery authority records the actual observed body without
// writing to its owner or pretending it belongs to the player's lineage.
const ownedBefore=structuredClone(session.snapshot);sim.discovery.noteCreatureAppearance(entry.actor);
assert.deepEqual(session.snapshot,ownedBefore);assert.ok(sim.discovery.observedBodies.some(a=>a.id===actual.id&&a.bodyPlan.id===actual.bodyPlan.id));
const noted=snapshot(sim);assert.deepEqual(snapshot(restoreSimulationSnapshot(structuredClone(noted))),noted,'observation and both population owners survive a save');
const route=new PointerApproach({getSim:()=>sim,blocked:()=>false,getRegionWorld:()=>entry.owner.facade.world,getRegionalCreature:t=>resolveRegionalCreature(sim,border,t)});
// A newly published moving body replaces the old snapshot; a held route
// must resolve the same identity again, not follow its obsolete coordinates.
assert.ok(route.start(target).ok);const published=session.snapshot,moved=structuredClone(published);moved.animals.find(a=>a.id===actual.id).x+=.9;session.snapshot=moved;
route.read({});assert.equal(route.planetaryGoal.planetX,actual.x+.9,'approach replans from the current publication');
session.snapshot=published;route.read({});assert.equal(route.planetaryGoal.planetX,actual.x);
let refused=0;const guarded={resourceTarget:{kind:'regional-creature'},onResult:r=>{assert.equal(r.ok,false);refused++},getSim(){throw Error('Remote target reached local combat')}};
assert.equal(CreatureContextTray.prototype.attack.call(guarded).ok,false);assert.equal(CreatureContextTray.prototype.attack.call(guarded,{pounce:true}).ok,false);assert.equal(refused,2);
let arrived=0;assert.ok(route.start(target,()=>{arrived++;assert.ok(sim.animals.some(a=>a.id===actual.id&&a.alive))}).ok);
const energy=sim.player().energy;let crossed=false;
for(let k=0;k<2000&&route.path;k++){
 sim.playerControlStep(route.read({}),64);
 if(route.regionalIntent()){const result=crossPlanetaryBorder(sim);assert.ok(result.ok,result.message);const old=sim;sim=result.simulation;border.sim=sim;border.views.clear();assert.equal(route.continueRegional(old,sim),true);crossed=true}
}
assert.ok(crossed);assert.equal(arrived,1);assert.equal(route.path,null);assert.ok(sim.player().energy<energy);
const current=sim.animals.find(a=>a.id===actual.id);assert.deepEqual(current.bodyPlan,actual.bodyPlan);assert.deepEqual(current.genes,actual.genes);
assert.ok(Math.hypot(sim.player().x-current.x,sim.player().y-current.y)<=1.5);
const ids=[...sim.animals,...sim.planetaryTravel.sessions.flatMap(s=>s.snapshot.animals)].map(a=>a.id);assert.equal(new Set(ids).size,ids.length);
assert.ok(resolveRegionalCreature(sim,border,target).local,'the same identity resolves under its new active owner');
assert.ok(route.start(target,()=>arrived++).ok);current.alive=false;route.read({});assert.equal(route.path,null);assert.equal(arrived,1,'a dead or lost target never executes approach arrival');current.alive=true;
console.log('Regional fauna PASS: genuine resident bodies and identity, canonical-clock/surface/sight guards, read-only rendering with owner-world inputs, restored renderer on failure, precise hit testing, observed anatomy/save continuity, paid approach/crossing to the same owned animal and death cancellation.');
