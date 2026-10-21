import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {BorderTerrain,BORDER_TERRAIN} from '../src/render/border-terrain.js';
import {restorePresentationWorld,createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {creatureView,viewReachesBeyond} from '../src/ecology/atmospheric-visibility.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';

const sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'}),p=sim.player(),border=new BorderTerrain(class{});
// Only neighbours the player is close enough to see across are wanted.
p.x=64;p.y=64;assert.equal(border.neighbours(sim).length,8);
const near=n=>Math.hypot(Math.max(n.ox-p.x,0,p.x-(n.ox+sim.world.n)),Math.max(n.oy-p.y,0,p.y-(n.oy+sim.world.n)))<=BORDER_TERRAIN.reach;
assert.equal(border.neighbours(sim).filter(near).length,0,'the interior needs no neighbour terrain');
p.x=124.5;p.y=3;assert.deepEqual(border.neighbours(sim).filter(near).map(n=>n.key).sort(),['0,-128','128,-128','128,0'].sort(),'a corner needs its three neighbours');
for(const n of border.neighbours(sim))assert.equal(Math.abs(n.ox)%128+Math.abs(n.oy)%128,0);
// The finite projection: regions beyond its edge are never offered.
const edge=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:{x:-34176,y:0}});
assert.ok(new BorderTerrain(class{}).neighbours(edge).length<8,'no terrain is invented beyond the projection edge');

// Unvisited neighbours use their generated World; nothing is shared with a simulation.
assert.equal(border.source(sim,border.neighbours(sim).find(n=>n.key==='128,0')).kind,'generated');
p.energy=SPECIES[p.species].maxEnergy*.94;p.hydration=SPECIES[p.species].maxHydration*.95;
let east=null;for(let y=8.5;y<118.5&&!east;y++){p.x=125.2;p.y=y;sim.rebuildSpatial();if(planetaryTravelAvailability(sim).enabled)east=crossPlanetaryBorder(sim).simulation}
assert.ok(east);
const home=east.planetaryTravel.sessions.find(s=>s.key==='0,0'),src=border.source(east,border.neighbours(east).find(n=>n.key==='0,0'));
assert.equal(src.kind,'resident');
const copy=src.build(),saved=home.snapshot.world;
assert.notStrictEqual(copy.water,saved.surfaceWater.mask);assert.deepEqual(Array.from(copy.water),Array.from(saved.surfaceWater.mask),'presentation shows the real saved water');
for(const k of Object.keys(copy.plants))assert.deepEqual(Array.from(copy.plants[k]),Array.from(saved.plants[k]),'presentation shows real plant stocks: '+k);
copy.plants.sunmoss[5]=99;assert.notEqual(home.snapshot.world.plants.sunmoss[5],99,'the presentation copy never writes back');
assert.throws(()=>restorePresentationWorld('x',{generator:'freshwater/1'}),/planetary/);
// Fog reveals across a border only for surface eyes, within range and facing.
const q=east.player();q.dir=6;const view=creatureView(east,q);
assert.equal(viewReachesBeyond(view,q.x-3,q.y),true);
assert.equal(viewReachesBeyond(view,q.x-view.range-1,q.y),false);
assert.equal(viewReachesBeyond({...view,level:'underground'},q.x-2,q.y),false);
const before=createSimulationSnapshot(east,{savedAt:'t',reason:'t'});border.source(east,border.neighbours(east)[0])?.build?.();
assert.deepEqual(createSimulationSnapshot(east,{savedAt:'t',reason:'t'}),before,'building presentation terrain does not change the simulation');
console.log('Border terrain PASS: proximity-limited neighbours, projection edge, generated and resident sources, independent copies of real saved terrain and border visibility rules.');
