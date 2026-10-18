import assert from 'node:assert/strict';
import {PlanetGeography,createPlanetDescriptor} from '../src/world/planet-geography.js';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {validateEnvironment} from '../src/world/environment.js';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';
const seed='PLANET-B0-A',p=new PlanetGeography(seed),d=p.descriptor;
assert.equal(d.equatorialCircumferenceTiles,1048576);assert.equal(d.macroWidth,512);assert.equal(d.macroHeight,256);assert.equal(d.pageSizeTiles,64);assert.deepEqual(createPlanetDescriptor(seed),d);
assert.throws(()=>{d.anchor.latitude=0});assert.throws(()=>{p.macroCell(3,3).elevation=0});
assert.deepEqual(p.macroCell(0,100),p.macroCell(512,100),'macro longitude sampling wraps without changing identity');
let ocean=0,land=0,drainage=0;
for(let y=0;y<256;y++)for(let x=0;x<512;x++){const a=p.macroCell(x,y);if(a.ocean)ocean++;else land++;if(a.downstream>=0){const b=p.macroCell(a.downstream%512,Math.floor(a.downstream/512));assert.ok(b.elevation<a.elevation,'strictly descending drainage cannot cycle');assert.equal(a.watershed,b.watershed);assert.ok(b.flow>a.flow);drainage++}}
assert.ok(ocean>0&&land>0&&drainage>0,'the generated macro world contains ocean, land and drainage; no specific biodiversity outcome');
const left=p.region(0,0,64,64),right=p.region(64,0,64,64),whole=p.region(0,0,128,64),negative=p.region(-64,-64,64,64);
for(let y=0;y<64;y++)for(let x=0;x<64;x++){assert.deepEqual(left[y*64+x],whole[y*128+x]);assert.deepEqual(right[y*64+x],whole[y*128+x+64])}
for(const i of [0,63,511,4095]){const s=negative[i];assert.deepEqual(s,p.sample(s.x,s.y),'negative regions use global coordinates')}
assert.deepEqual(p.pageCrossings(0,0).east,p.pageCrossings(1,0).west,'shared river/watershed boundary has one canonical representation');
assert.deepEqual(p.pageCrossings(0,0).south,p.pageCrossings(0,1).north);
assert.ok(Math.abs(p.localToGeo(0,0).latitude-p.localToGeo(0,128).latitude-128*2*Math.PI/1048576)<1e-12,'latitude range is not rescaled to window size');
assert.throws(()=>p.sample(1e8,0),/projection/);assert.throws(()=>p.region(0,0,256,256),/current-sized/);
const other=new PlanetGeography('PLANET-B0-B');assert.notDeepEqual(other.descriptor,p.descriptor);assert.notEqual(other.macroCell(0,128).elevation,p.macroCell(0,128).elevation);
const w=new World(seed,{generator:'planetary/1'});assert.equal(w.n,128);validateEnvironment(w,w.environment);assert.ok(w.water.some(Boolean)&&w.water.some(v=>!v));assert.equal(w.planet.descriptor.seed,seed);
const s=new Simulation(seed,{player:true,worldGenerator:'planetary/1'}),initial=s.animals.filter(a=>a.alive).length,snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'planet-test'}));
const before=snapshot(s);s.world.pages.unload(0,0);s.world.planet.region(-64,64,64,64);assert.deepEqual(snapshot(s),before,'generation/view requests cannot reset biological stocks');
const loaded=restoreSimulationSnapshot(structuredClone(before));assert.deepEqual(snapshot(loaded),before);
for(let i=0;i<60;i++){s.update(null);loaded.update(null)}assert.deepEqual(snapshot(loaded),snapshot(s),'planet save resumes exact completed biological history');checkEcologicalIntegrity(s,initial);
const noMask=structuredClone(before);delete noMask.world.surfaceWater;assert.deepEqual(restoreSimulationSnapshot(noMask).world.water,new World(seed,{generator:'planetary/1'}).water,'missing-mask fallback uses the correct planetary descriptor');
for(const mutate of [x=>delete x.world.planet,x=>x.world.planet.anchor.latitude+=.01,x=>x.world.planet.seed='wrong',x=>x.world.planet.generator='unknown']){const bad=structuredClone(before);mutate(bad);assert.throws(()=>restoreSimulationSnapshot(bad),/planet descriptor/)}
const conflict=structuredClone(before);conflict.world.generator='freshwater/1';assert.throws(()=>restoreSimulationSnapshot(conflict),/conflicts/);
const legacy=new Simulation('PLANET-LEGACY-CONTINUITY',{player:false});assert.equal(legacy.world.generator,'freshwater/1');assert.equal(legacy.world.planet,undefined);assert.deepEqual(snapshot(restoreSimulationSnapshot(snapshot(legacy))),snapshot(legacy));
console.log('planet geography: macro drainage, global scale, deterministic region order/seams, strict descriptors, finite current World and exact persistence PASS');
