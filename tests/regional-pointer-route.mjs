import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';import {World} from '../src/world/world.js';
import {PointerApproach} from '../src/ui/pointer-approach.js';import {regionalGroundTarget} from '../src/ui/regional-pointer-route.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {BorderTerrain} from '../src/render/border-terrain.js';
let sim=new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1'});const original=sim,p=sim.player(),east=new World(sim.seed,{generator:'planetary/1',planetOrigin:{x:128,y:0},planetDescriptor:sim.world.planet.descriptor});
const worlds=new Map([['128,0',east]]),route=new PointerApproach({getSim:()=>sim,blocked:()=>false,getRegionWorld:o=>worlds.get(o.x+','+o.y)});
let goal;for(let y=12.5;y<115.5&&!goal;y++){p.x=123.5;p.y=y;p.dir=2;const g={kind:'regional-ground',label:'Neighbouring ground',seed:sim.seed,x:132.5,y,planetX:132.5,planetY:y};if(route.availability(g).enabled)goal=g}
assert.ok(goal,'genuine reachable land frontier and neighbouring target');
const before=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed'})),position={x:p.x,y:p.y};
assert.ok(route.availability(goal).enabled);assert.equal(route.path,null);assert.ok(isDeepStrictEqual(createSimulationSnapshot(sim,{savedAt:'fixed'}),before),'planning changes no organisms, stocks or RNG');
let arrived=0;assert.ok(route.start(goal,()=>arrived++).ok);let transferred=false,steps=0;
for(;steps<2000&&route.path;steps++){
 const controls=route.read({});sim.playerControlStep(controls,64);
 const direction=route.regionalIntent();if(direction){const status=planetaryTravelAvailability(sim);assert.equal(status.enabled,true,status.reason);assert.equal(status.direction,direction);const crossing=crossPlanetaryBorder(sim);assert.ok(crossing.ok);const old=sim;sim=crossing.simulation;assert.equal(route.continueRegional(old,sim),true);transferred=true;assert.equal(arrived,0,'crossing is not final arrival')}
}
assert.ok(transferred);assert.equal(route.path,null);assert.equal(arrived,1);assert.equal(sim.world.regionOrigin.x,128);assert.ok(Math.hypot(sim.player().x+128-goal.planetX,sim.player().y-goal.planetY)<.3,'finish at the clicked planetary point');assert.equal(sim.playerId,p.id);assert.ok(original.player().x>position.x,'ordinary paid control movement approached the frontier');assert.ok(sim.player().energy<p.energy,'canonical transfer and subsequent walking debit energy');
const ids=[...sim.animals,...sim.planetaryTravel.sessions.flatMap(s=>s.snapshot.animals)].map(a=>a.id);assert.equal(ids.length,new Set(ids).size,'no duplicated organisms');
// Manual, pause, actor/world replacement and forged targets cannot execute arrival.
const localGoal={kind:'regional-ground',seed:sim.seed,planetX:128+sim.player().x+1,planetY:sim.player().y};assert.ok(route.start(localGoal,()=>arrived++).ok);route.read({left:true});assert.equal(route.path,null);assert.equal(arrived,1);
assert.ok(route.start(localGoal,()=>arrived++).ok);sim.paused=true;route.read({});assert.equal(route.path,null);assert.equal(arrived,1);sim.paused=false;
assert.equal(route.availability({...localGoal,seed:'other-world'}).enabled,false);assert.equal(route.availability({...localGoal,planetX:Infinity}).enabled,false);assert.equal(route.availability({...localGoal,planetX:999999}).enabled,false);
// A visible neighbour can be selected only through the same surface-view rule
// as border terrain. Unknown/unloaded/underground space reveals nothing.
const border=new BorderTerrain(class{});border.sim=original;const n=border.neighbours(original).find(n=>n.key==='128,0');border.views.set('128,0',{...n,world:east});const renderer={borderTerrain:border};
p.x=124.5;p.y=goal.planetY;p.dir=2;const target=regionalGroundTarget(original,renderer,130.5,p.y);assert.equal(target?.kind,'regional-ground');assert.equal(target.planetX,130.5);assert.equal(original.interactionOptions(target).length,0,'neighbour selection grants no resource execution');
assert.equal(regionalGroundTarget(original,renderer,160.5,p.y),null);p.underground=true;assert.equal(regionalGroundTarget(original,renderer,130.5,p.y),null);delete p.underground;renderer.borderTerrain.sim=sim;assert.equal(regionalGroundTarget(original,renderer,130.5,p.y),null);
// An actual transfer receipt is insufficient while the app still owns the
// old world: stale callbacks cannot rebind a route or execute arrival.
const stale=new PointerApproach({getSim:()=>original,blocked:()=>false,getRegionWorld:o=>worlds.get(o.x+','+o.y)});let staleArrival=0;
assert.ok(stale.start(goal,()=>staleArrival++).ok);assert.equal(stale.continueRegional(original,sim),false);assert.equal(stale.path,null);assert.equal(staleArrival,0);
// The same mouse route uses canonical movement and transfer in every cardinal
// direction; no special east-only coordinate or arrival convention.
for(const [direction,ox,oy] of [['west',-128,0],['north',0,-128],['south',0,128]]){
 let live=new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1'});const actor=live.player(),neighbour=new World(live.seed,{generator:'planetary/1',planetOrigin:{x:ox,y:oy},planetDescriptor:live.world.planet.descriptor});
 const walker=new PointerApproach({getSim:()=>live,blocked:()=>false,getRegionWorld:o=>o.x===ox&&o.y===oy?neighbour:null});let destination;
 for(let c=12.5;c<115.5;c++){actor.x=direction==='west'?4.5:c;actor.y=direction==='north'?4.5:direction==='south'?123.5:c;if(!live.canOccupy(actor,actor.x,actor.y))continue;const g={kind:'regional-ground',seed:live.seed,planetX:ox?ox+122.5:c,planetY:oy?(oy<0?oy+122.5:oy+5.5):c};if(walker.availability(g).enabled){destination=g;break}}
 assert.ok(destination,direction+' physical mouse route exists');let completions=0;assert.ok(walker.start(destination,()=>completions++).ok);
 for(let k=0;k<2500&&walker.path;k++){live.playerControlStep(walker.read({}),64);if(walker.regionalIntent()){const passage=crossPlanetaryBorder(live);assert.ok(passage.ok,passage.message);const previous=live;live=passage.simulation;assert.equal(walker.continueRegional(previous,live),true)}}
 assert.equal(completions,1,direction+' arrival executes exactly once');assert.ok(Math.hypot(live.player().x+ox-destination.planetX,live.player().y+oy-destination.planetY)<.3);assert.deepEqual(live.world.regionOrigin,{x:ox,y:oy});
}
console.log('Regional pointer PASS: read-only physical planning, paid real movement/canonical transfer, planetary endpoint, no duplicate IDs, exactly-once arrival, cancel/pause/forgery safety and visible navigation-only neighbour targets.');
