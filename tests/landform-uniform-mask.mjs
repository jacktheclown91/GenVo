import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildVisualWaterMask,sampleVisualWaterMask} from '../src/render/landform.js';
import {Renderer} from '../src/render/renderer.js';

// The uniform-tile shortcut must give exactly the sampled contour on every tile it covers.
let shortcut=0,sampled=0;
for(const [seed,o] of [['PLANET-OBS-3',{worldGenerator:'planetary/1'}],['PLANET-OBS-2',{worldGenerator:'planetary/1'}],['GENVO8-TEST-A',{}]]){
 const w=new Simulation(seed,{player:true,...o}).world;
 for(let y=0;y<w.n;y+=1)for(let x=0;x<w.n;x+=1){
  const fast=buildVisualWaterMask(w,x,y);
  if(!(fast.full||fast.empty)){sampled++;continue}
  // Every uniform tile is compared on a stride to keep the test fast; edge tiles always.
  if((x+y)%3&&x>2&&y>2&&x<w.n-3&&y<w.n-3)continue;
  const ref=sampleVisualWaterMask(w,x,y);shortcut++;
  assert.deepEqual([...fast],[...ref],`mask ${seed} ${x},${y}`);assert.deepEqual([...fast.depth],[...ref.depth],`depth ${seed} ${x},${y}`);
  assert.deepEqual([fast.full,fast.empty,fast.wetCount],[ref.full,ref.empty,ref.wetCount]);
 }
}
assert.ok(shortcut>1000&&sampled>100,'both paths exercised');
console.log(`Landform uniform mask PASS: ${shortcut} shortcut tiles identical to sampled contours (${sampled} shoreline tiles still sampled).`);

// Underground changes (a passage dug or collapsed) keep the surface-water masks and the regional
// focals; switching worlds still clears them. Stub canvas as in regional-scene.mjs.
{
 const canvas=()=>({width:0,height:0,style:{},getContext:()=>({setTransform(){},imageSmoothingEnabled:true})});
 globalThis.document={createElement:()=>canvas()};globalThis.innerWidth=1366;globalThis.innerHeight=768;globalThis.addEventListener=()=>{};
 try{
  const sim=new Simulation('PLANET-OBS-3',{player:true,worldGenerator:'planetary/1'}),r=new Renderer(canvas(),sim);r.prepareTerrainOnly();r.scenePending=false;
  r.syncScene(0);for(let x=0;x<20;x++)r.visualWaterMask(x,5);const masks=r.landformMaskCache.size,focals=r.regionalFocals,seed=r.macroHabitatSeed;
  assert.ok(masks>=20&&seed!=null);
  sim.world.subsurface.revision=(sim.world.subsurface.revision||0)+1;r.syncScene(0);
  assert.equal(r.landformMaskCache.size,masks,'water masks survive an underground change');assert.equal(r.regionalFocals,focals,'regional focals are not recomputed for a dig');
  assert.equal(r.subsurfaceRevision,sim.world.subsurface.revision,'the underground revision is still tracked');
  r.resetWorldCaches();assert.equal(r.landformMaskCache.size,0,'a full reset still clears masks');assert.equal(r.macroHabitatSeed,null);
 }finally{delete globalThis.document;delete globalThis.innerWidth;delete globalThis.innerHeight;delete globalThis.addEventListener}
 console.log('Underground changes keep water masks and regional focals; full resets still clear them.');
}
