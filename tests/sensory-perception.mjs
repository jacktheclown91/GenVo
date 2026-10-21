import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {creatureView,viewCanSee,visuallyObservable,undergroundLineOfSight} from '../src/ecology/atmospheric-visibility.js';
import {sensoryRegionKey,recordSensoryMemory,rememberedCells,sensoryProfile,sensorySignals} from '../src/ecology/sensory-world.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('SENSORY-FOG-FOUNDATION',{player:true}),p=sim.player();
assert.ok(p&&p.bodyPlan?.nodes?.length,'requires real modular body');
assert.equal(sim.sensoryFogEnabled,true,'creature mode uses biological awareness by default');
const view=creatureView(sim,p);
assert.ok(view.range>view.touch,'functional eyes support sight beyond touching');
const dir=view.facing,unit=Math.hypot(...dir);
const front={x:p.x+dir[0]/unit*view.range*.55,y:p.y+dir[1]/unit*view.range*.55};
const rear={x:p.x-dir[0]/unit*view.range*.9,y:p.y-dir[1]/unit*view.range*.9};
assert.equal(viewCanSee(view,front.x,front.y),true,'directly ahead is visible');
if(view.rearLimit>-.9)assert.equal(viewCanSee(view,rear.x,rear.y),false,'facing shapes the visual cone');
assert.equal(viewCanSee(view,p.x+view.range+3,p.y),false,'body-specific sight has a finite range');
const s0=sensoryProfile(p);assert.ok(s0.hearing>0&&s0.scent>0);
const count=recordSensoryMemory(sim,p);
assert.ok(count>0,'real near-body surveyed cells are remembered');
const current=rememberedCells(sim,p);
assert.ok(current.size>0);
const saved=[...current.values()].map(x=>[...x]);
const old=sim.tickCount;
const snapshot=createSimulationSnapshot(sim,{reason:'sensory-memory-contract'});
const restored=restoreSimulationSnapshot(structuredClone(snapshot));
assert.equal(restored.sensoryFogEnabled,true,'fog state survives Save/Continue');
assert.deepEqual([...rememberedCells(restored,restored.player()).values()],saved,'physical, per-creature remembered terrain survives Save/Continue');
assert.equal(restored.tickCount,old,'recording a sensory observation cannot advance biological simulation time');
const createdRegionKey=sensoryRegionKey(sim.world);
assert.equal(createdRegionKey,sensoryRegionKey(restored.world));

const fake={id:-12345,x:p.x+dir[0]/unit*2.5,y:p.y+dir[1]/unit*2.5,underground:!!p.underground};
const hidden={...fake,x:p.x-dir[0]/unit*4,y:p.y-dir[1]/unit*4};
assert.equal(visuallyObservable(sim,p,hidden),false,'creature target selection cannot ignore its field of view');
sim.sensoryFogEnabled=false;
assert.equal(visuallyObservable(sim,p,hidden),true,'opt-out / unrestricted observer restores legacy survey behavior within range');
sim.sensoryFogEnabled=true;
const hearing=sensoryProfile(p).hearing;
const active={...hidden,id:-40,x:p.x-dir[0]/unit*Math.min(3,hearing*.65),y:p.y-dir[1]/unit*Math.min(3,hearing*.65),alive:true,intent:'attack',species:'needlejaw'};
const originals=sim.animals;sim.animals=[p,active];
assert.ok(sensorySignals(sim,p).some(x=>x.kind==='heard'),'real nearby activity gives an uncertain sound bearing');
sim.animals=originals;
assert.ok(!sensorySignals(sim,p).some(x=>x.x!==undefined||x.y!==undefined),'signals must not leak exact world positions');
const others=originals.filter(a=>a.alive&&!a.player);
if(others.length){
 const other=others[0],prior=p.sensoryMemory;
 p.sensoryMemory={schema:1,regions:{[createdRegionKey]:[[4,5,0,7]]}};
 assert.equal(other.sensoryMemory?.regions?.[createdRegionKey]?.length||0,0,'survey knowledge belongs to the individual');
 p.sensoryMemory=prior;
}

// Optical contact below ground follows actual persistent excavated/cave
// passages. Solid rock blocks rays, including diagonal corner peeking.
// This does not modify geology, RNG, or the world being simulated.
const rock={n:8,subsurface:{passages:new Map()}};
const open=(x,y)=>rock.subsurface.passages.set(y*rock.n+x,{closed:false,entry:false});
open(1,1);open(2,1);open(3,1);
assert.equal(undergroundLineOfSight(rock,1.5,1.5,3.5,1.5),true,'light travels along opened passages');
rock.subsurface.passages.get(rock.n+2).closed=true;
assert.equal(undergroundLineOfSight(rock,1.5,1.5,3.5,1.5),false,'solid rock blocks underground sight');
rock.subsurface.passages.get(rock.n+2).closed=false;
open(2,2);
assert.equal(undergroundLineOfSight(rock,1.5,1.5,2.5,2.5),false,'diagonal wall corners cannot be peered through');
open(1,2);
assert.equal(undergroundLineOfSight(rock,1.5,1.5,2.5,2.5),true,'wide open tunnel junction is visually connected');
const prepared={observer:{x:1.5,y:1.5},world:rock,level:'underground',touch:1.55,range:4,eyes:1,facing:[1,0],rearLimit:-.2};
assert.equal(viewCanSee(prepared,3.5,1.5),true,'shared field-of-view uses cave paths');
rock.subsurface.passages.get(rock.n+2).closed=true;
assert.equal(viewCanSee(prepared,3.5,1.5),false,'rendered underground area obeys cave occlusion');
const undergroundObserver={...p,id:8001,x:1.5,y:1.5,dir:2,underground:true};
const undergroundTarget={id:8002,x:2.5,y:1.5,underground:true};
const caveSim={world:rock,sensoryFogEnabled:true};
assert.equal(visuallyObservable(caveSim,undergroundObserver,undergroundTarget),false,'touch-distance actor behind rock is not a target');
rock.subsurface.passages.get(rock.n+2).closed=false;
assert.equal(visuallyObservable(caveSim,undergroundObserver,undergroundTarget),true,'near creature in connected cave is selectable');

const blind={...p,bodyPlan:{...p.bodyPlan,nodes:p.bodyPlan.nodes.filter(n=>!n.socket?.startsWith('eye'))}};
const blindedView=creatureView(sim,blind);
assert.equal(blindedView.eyes,0);
assert.ok(blindedView.range<view.range,'missing functional eyes remove distant vision without hiding touch');

console.log('sensory fog, evolutionary sight, uncertain signals and save continuity PASS');
