import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {Renderer} from '../src/render/renderer.js';import {BorderTerrain} from '../src/render/border-terrain.js';
import {Simulation} from '../src/sim/simulation.js';import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const canvas=()=>({width:0,height:0,style:{},getContext:()=>({setTransform(){},imageSmoothingEnabled:true})});
let listeners=0;globalThis.document={createElement:()=>canvas()};globalThis.innerWidth=1366;globalThis.innerHeight=768;globalThis.addEventListener=()=>listeners++;
try{
 const source=new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1'}),player=source.player();
 let status;for(let y=8.5;y<118.5;y++){player.x=125.2;player.y=y;const s=planetaryTravelAvailability(source);if(s.enabled){status=s;break}}assert.ok(status);
 const renderer=new Renderer(canvas(),source);renderer.prepareTerrainOnly();renderer.scenePending=false;renderer.cameraReady=true;renderer.playerVisual={x:player.x,y:player.y};
 const sourceChunk={canvas:{tag:'source-ground'},vegetation:{tag:'source-flora'},sig:1};renderer.terrainChunkCache.set('31,12,4',sourceChunk);
 const border=renderer.borderTerrain=new BorderTerrain(Renderer);border.sim=source;
 const n=border.neighbours(source).find(n=>n.key==='128,0'),src=border.source(source,n),view=border.createView(source,n,src.build(),src);
 assert.ok(view);assert.equal(view.renderer.canvas.width,1);assert.equal(view.renderer.canvas.height,1);assert.equal(listeners,1,'neighbours have no resize listeners or viewport buffers');
 const destinationChunk={canvas:{tag:'destination-ground'},vegetation:{tag:'destination-flora'},sig:1};view.renderer.terrainChunkCache.set('0,12,4',destinationChunk);border.views.set(n.key,view);
 const trip=crossPlanetaryBorder(source);assert.ok(trip.ok,trip.message);const next=trip.simulation;
 const before=structuredClone(createSimulationSnapshot(next,{savedAt:'fixed'}));
 // A geological edit in the SAME world must invalidate signatures while
 // retaining the last native scene until bounded refresh replaces each chunk.
 const signature=renderer.terrainChunkSignature(31,12,4);renderer.subsurfaceRevision=(renderer.subsurfaceRevision||0)+1;
 renderer.resetWorldCaches({keepTerrain:true});assert.equal(renderer.terrainChunkCache.get('31,12,4'),sourceChunk);assert.notEqual(renderer.terrainChunkSignature(31,12,4),signature);
 renderer.visibleAnimals=[player];renderer.screenPos=new Map([[player.id,{x:12,y:12}]]);renderer.screenBounds=new Map([[player.id,{}]]);
 assert.equal(renderer.continueRegionalScene(source,next),true);
 assert.equal(renderer.sceneShown,true);assert.equal(renderer.scenePending,false);assert.equal(renderer.sim,next);assert.equal(renderer.motionSim,next);
 assert.equal(renderer.terrainChunkCache.get('0,12,4'),destinationChunk,'prepared destination native canvases are promoted');
 assert.equal(renderer.terrainChunkCache.has('31,12,4'),false,'source chunks do not become destination chunks');
 const departed=border.views.get('0,0');assert.equal(departed.renderer.terrainChunkCache.get('31,12,4'),sourceChunk,'departed ground remains drawable');
 assert.deepEqual({x:departed.ox,y:departed.oy},{x:-128,y:0});assert.equal(border.views.has('128,0'),false,'active region is never also a neighbour');
 assert.equal(border.sim,next);assert.equal(border.views.size,1);assert.equal(listeners,1);
 assert.equal(renderer.screenPos.size,0);assert.equal(renderer.screenBounds.size,0);assert.equal(renderer.visibleAnimals.length,0,'old interaction targets never survive an ownership switch');
 assert.deepEqual(renderer.camera,{x:next.player().x,y:next.player().y});
 assert.ok(isDeepStrictEqual(createSimulationSnapshot(next,{savedAt:'fixed'}),before),'render handoff changes no saved ecology or RNG');
 const archive=next.planetaryTravel.sessions.find(s=>s.key==='0,0');assert.notEqual(departed.world.water,archive.snapshot.world.surfaceWater.mask);departed.world.plants.sunmoss[5]=99;assert.notEqual(archive.snapshot.world.plants.sunmoss[5],99,'presentation has no canonical writeback');
 // Cold frontiers use the ordinary progressive chunk path, never startup blanking.
 const cold=new Renderer(canvas(),source);cold.prepareTerrainOnly();cold.scenePending=false;assert.equal(cold.continueRegionalScene(source,next),true);assert.equal(cold.regionalSceneStats.last.promotedChunks,0);assert.equal(cold.sceneShown,true);assert.equal(cold.scenePending,false);
 // A real zero-distance physical handoff translates the existing camera,
 // including its normal follow lag; it does not snap the camera to the actor.
 const continuous=new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1',regionalFrontier:true}),walker=continuous.player();
 let modern;for(let y=12.5;y<115.5;y++){walker.x=128;walker.y=y;const q=planetaryTravelAvailability(continuous);if(q.enabled){modern=q;break}}assert.ok(modern);
 const moved=crossPlanetaryBorder(continuous);assert.ok(moved.ok);
 const smooth=new Renderer(canvas(),continuous);smooth.prepareTerrainOnly();smooth.scenePending=false;smooth.cameraReady=true;smooth.camera={x:127.945,y:walker.y-.01};
 const absoluteCamera={...smooth.camera};assert.equal(smooth.continueRegionalScene(continuous,moved.simulation),true);
 assert.equal(smooth.camera.x+128,absoluteCamera.x);assert.equal(smooth.camera.y,absoluteCamera.y,'camera retains absolute position and follow lag');
 const unrelated=new Simulation('DIFFERENT-PLANET',{worldGenerator:'planetary/1'});const active=renderer.sim;assert.equal(renderer.continueRegionalScene(next,unrelated),false);assert.equal(renderer.sim,active,'unrelated loads still require normal world preparation');
 // Canonical cardinal crossings rebase the departing region in the correct
 // direction even without a prepared destination view.
 for(const [direction,dx,dy] of [['west',-128,0],['north',0,-128],['south',0,128]]){
  const start=new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1'}),actor=start.player();let passage;
  for(let c=8.5;c<118.5;c++){actor.x=direction==='west'?2.8:c;actor.y=direction==='north'?2.8:direction==='south'?125.2:c;const available=planetaryTravelAvailability(start);if(available.enabled&&available.direction===direction){passage=crossPlanetaryBorder(start);break}}
  assert.ok(passage?.ok,'real '+direction+' crossing exists');const target=passage.simulation;
  const screen=new Renderer(canvas(),start);screen.prepareTerrainOnly();screen.scenePending=false;const listenerCount=listeners;
  assert.equal(screen.continueRegionalScene(start,target),true);const old=screen.borderTerrain.views.get('0,0');
  assert.deepEqual({x:old.ox,y:old.oy},{x:-dx||0,y:-dy||0});assert.equal(screen.borderTerrain.views.has(dx+','+dy),false);assert.equal(screen.borderTerrain.views.size,1);assert.equal(listeners,listenerCount,'cardinal handoff adds no resize listeners');
  assert.equal(screen.sceneShown,true);assert.equal(screen.scenePending,false);
 }
 let presented=false;const ready=renderer.sceneReady().then(()=>{presented=true});await Promise.resolve();assert.equal(presented,false,'sceneReady waits for the new owner to actually render');renderer.render=()=>{};renderer.renderOrPrepare();await ready;assert.equal(presented,true);
 console.log('Regional scene PASS: exact ownership handoff, prepared native cache promotion, independent departing terrain, rebased neighbours, no blank preparation, cold frontier, interaction invalidation, bounded terrain-only surfaces and no biology/RNG changes.');
}finally{delete globalThis.document;delete globalThis.innerWidth;delete globalThis.innerHeight;delete globalThis.addEventListener}
