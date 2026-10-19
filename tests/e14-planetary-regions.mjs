import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {World} from '../src/world/world.js';
import {PlanetRegionAtlas,planetRegionOrigin,neighboringRegion,planetaryCell,regionKey} from '../src/world/planet-regions.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const seed='PLANET-B0-A',sim=new Simulation(seed,{player:true,bootstrap:false,worldGenerator:'planetary/1'});
const atlas=sim.planetaryRegions,center=sim.world,origin={x:0,y:0};
assert.ok(atlas instanceof PlanetRegionAtlas);
assert.equal(atlas.regions.size,1,'one real active World is the starting region');
assert.deepEqual(center.regionOrigin,origin);
assert.deepEqual(neighboringRegion(origin,'east'),{x:128,y:0});
assert.deepEqual(neighboringRegion(origin,'west'),{x:-128,y:0});
assert.deepEqual(neighboringRegion(origin,'north'),{x:0,y:-128});
assert.deepEqual(neighboringRegion(origin,'south'),{x:0,y:128});
assert.throws(()=>neighboringRegion(origin,'diagonal'),/direction/);
for(const invalid of [{x:1,y:0},{x:128.5,y:0},{x:Infinity,y:0},{x:0,y:null},{x:1e10,y:0}])
 assert.throws(()=>planetRegionOrigin(invalid),/region origin/);
assert.equal(atlas.neighbor(origin,'east'),null,'unsurveyed region never materializes implicitly');

// A neighboring region owns physically different but contiguous geography.
// World sampling is NEVER reset to the original landing coordinate.
const east=atlas.neighbor(origin,'east',{create:true});
const west=atlas.neighbor(origin,'west',{create:true});
const north=atlas.neighbor(origin,'north',{create:true});
assert.equal(atlas.regions.size,4);
assert.notStrictEqual(east,center);
assert.notStrictEqual(east.plants.bramble,center.plants.bramble);
assert.deepEqual(east.regionOrigin,{x:128,y:0});
assert.deepEqual(west.regionOrigin,{x:-128,y:0});
assert.deepEqual(north.regionOrigin,{x:0,y:-128});
assert.strictEqual(atlas.neighbor(origin,'east',{create:true}),east,'survey cannot overwrite living region stocks');

for(const w of [center,east,west,north]){
 assert.equal(w.n,128,'existing local ecology remains bounded and typed');
 assert.equal(w.len,16384);
 assert.deepEqual(w.planet.descriptor,center.planet.descriptor,'global planet identity is shared');
 assert.ok(w.plantResources?.energy?.bramble?.length===w.len&&w.seedBank.bramble.length===w.len);
 for(const [x,y] of [[0,0],[11,41],[63,63],[127,127]]){
  const i=w.idx(x,y),pos=planetaryCell(w,x+.5,y+.5);
  assert.equal(pos.worldX,w.regionOrigin.x+x+.5);
  assert.equal(pos.worldY,w.regionOrigin.y+y+.5);
  const geo=w.planet.sample(pos.worldX,pos.worldY);
  assert.equal(w.water[i],geo.water,'each region samples actual global sea/river, not a repeated starting map');
  assert.ok(Math.abs(w.terrain.elevation[i]-geo.elevation)<2e-7,'height is global and reproducible');
  assert.ok(Math.abs(w.temperature[i]-geo.temperature)<2e-7,'regional climate is sampled at correct global coordinate');
 }
}
const edgeA=center.planet.sample(127.5,41.5),edgeB=east.planet.sample(128.5,41.5);
assert.ok(Math.abs(edgeA.elevation-edgeB.elevation)<.04,'adjacent mountain surface remains smooth across 128-cell frontier');
assert.ok(Math.abs(edgeA.temperature-edgeB.temperature)<.05,'global climate is continuous across frontier');
const southEdge=center.planet.sample(41.5,127.5),northNeighbor=center.planet.sample(41.5,128.5);
assert.ok(Math.abs(southEdge.elevation-northNeighbor.elevation)<.04);
assert.notDeepEqual(center.temperature,east.temperature,'two regions must not repeat the same world field');

// Independent region stocks are mutated as real canonical arrays and cannot
// produce duplicate resources by repeatedly loading the neighbor.
const i=east.idx(23,53),old=east.plants.bramble[i],oldOther=center.plants.bramble[i];
east.plants.bramble[i]=.376;
east.seedBank.bramble[i]=.14;
east.plantResources.energy.bramble[i]=.17;
east.moisture[i]=.44;
east.carrion[i]=.29;
assert.equal(center.plants.bramble[i],oldOther);
assert.strictEqual(atlas.get({x:128,y:0}),east);
assert.equal(east.plants.bramble[i],.376,'returning to a region sees consumed or modified stocks, not new founders');
assert.equal(atlas.entries().length,4);
const snapshot=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'e14'}));
assert.equal(snapshot.regionalWorlds.length,3,'exactly one copy per inactive region and none of active world');
const resumed=restoreSimulationSnapshot(structuredClone(snapshot));
assert.deepEqual(resumed.world.regionOrigin,origin);
assert.equal(resumed.planetaryRegions.regions.size,4);
const returned=resumed.planetaryRegions.get({x:128,y:0});
assert.equal(returned.plants.bramble[i],east.plants.bramble[i]);
assert.equal(returned.seedBank.bramble[i],east.seedBank.bramble[i]);
assert.equal(returned.plantResources.energy.bramble[i],east.plantResources.energy.bramble[i]);
assert.equal(returned.moisture[i],east.moisture[i]);
assert.equal(returned.carrion[i],east.carrion[i]);
assert.deepEqual(structuredClone(createSimulationSnapshot(resumed,{savedAt:'fixed',reason:'e14'})),snapshot,'remote region save/load is byte-equivalent and stable');
assert.strictEqual(resumed.planetaryRegions.neighbor(origin,'east'),returned);
const outsider=new World('PLANET-B0-B',{generator:'planetary/1'});
assert.throws(()=>atlas.install(outsider),/different planets/);
assert.throws(()=>atlas.install(new World(seed,{generator:'planetary/1',planetOrigin:{x:128,y:0}})),/already owns/);
const wrong=structuredClone(snapshot);wrong.regionalWorlds[0].world.regionOrigin={x:384,y:0};
assert.throws(()=>restoreSimulationSnapshot(wrong),/inconsistent geographic identity/);
const duplicate=structuredClone(snapshot);duplicate.regionalWorlds[0].origin={x:0,y:0};
assert.throws(()=>restoreSimulationSnapshot(duplicate),/Duplicate planetary region/);
const wrongSeed=structuredClone(snapshot);wrongSeed.regionalWorlds[0].world.planet.seed='other';
assert.throws(()=>restoreSimulationSnapshot(wrongSeed),/planet descriptor/);

// Older planetary saves require no extra regional map and must retain exact
// origin 0. Non-planetary games remain single-world and unchanged.
const legacy=structuredClone(snapshot);delete legacy.world.regionOrigin;delete legacy.regionalWorlds;
const oldLoaded=restoreSimulationSnapshot(legacy);
assert.deepEqual(oldLoaded.world.regionOrigin,{x:0,y:0});
assert.equal(oldLoaded.planetaryRegions.regions.size,1);
const other=new Simulation('GENVO-LEGACY',{player:false,bootstrap:false});
assert.equal(other.planetaryRegions,null);
assert.throws(()=>new World('GENVO-LEGACY',{generator:'freshwater/1',planetOrigin:{x:128,y:0}}),/Only planetary/);
console.log('E14 global regional offsets, 128-seam geography, independent finite ecological stores, three real adjacent regions, strict origin/planet integrity and byte-exact save/load PASS');
