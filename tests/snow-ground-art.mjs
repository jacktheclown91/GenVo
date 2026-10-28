import assert from 'node:assert/strict';
import {snowGroundPixels,drawSnowGround,beginSnowWindow,snowGroundArtStats} from '../src/render/snow-ground-art.js';
const base={seed:125,x:8,y:5,cover:.4},a=snowGroundPixels(base),deep=snowGroundPixels({...base,cover:.85});assert.equal(a.length,1024);assert.ok(a.some(v=>v>0)&&a.some(v=>v===0));assert.deepEqual(snowGroundPixels(base),a);assert.notDeepEqual(snowGroundPixels({...base,x:9}),a);assert.deepEqual(snowGroundPixels({...base,x:136}),snowGroundPixels({...base,originX:128}));assert.ok(a.every((v,i)=>!v||deep[i]>0));assert.ok(deep.filter(Boolean).length>a.filter(Boolean).length);assert.ok(snowGroundPixels({...base,cover:0}).every(v=>v===0));const mask=new Uint8Array(1024);mask.fill(1,0,512);assert.ok(snowGroundPixels({...base,cover:1,waterMask:mask}).slice(0,512).every(v=>v===0));
const world={n:8,idx:(x,y)=>y*8+x,seedHash:12,water:new Uint8Array(64),soilWater:{snowpack:new Float64Array(64)}},calls=[],ctx={globalAlpha:1,save(){},restore(){},fillRect(...r){calls.push(r);assert.ok(r[0]>=0&&r[1]>=0&&r[0]+r[2]<=32&&r[1]+r[3]<=32)}};assert.equal(drawSnowGround(ctx,{world,x:2,y:2,px:0,py:0,tile:32}),false);world.soilWater.snowpack[18]=.34;const before=JSON.stringify(world);assert.equal(drawSnowGround(ctx,{world,x:2,y:2,px:0,py:0,tile:32}),true);assert.ok(calls.length>0);assert.equal(JSON.stringify(world),before);world.soilWater.snowpack[18]=0;assert.equal(drawSnowGround(ctx,{world,x:2,y:2,px:0,py:0,tile:32}),false);world.soilWater.snowpack[18]=.34;world.water[18]=1;assert.equal(drawSnowGround(ctx,{world,x:2,y:2,px:0,py:0,tile:32}),false);
// A dense visible window can exceed 1024 cells. Every unchanged texture must remain warm.
const large={n:40,idx:(x,y)=>y*40+x,seedHash:991,water:new Uint8Array(1600),soilWater:{snowpack:new Float64Array(1600).fill(.14)}},quiet={globalAlpha:1,save(){},restore(){},fillRect(){}};
beginSnowWindow(large,1600);for(let pass=0;pass<2;pass++){const before=snowGroundArtStats(large).builds;for(let y=0;y<40;y++)for(let x=0;x<40;x++)drawSnowGround(quiet,{world:large,x,y,px:0,py:0,tile:32});if(pass)assert.equal(snowGroundArtStats(large).builds,before,'Unchanged dense window must not rebuild textures')}
assert.equal(snowGroundArtStats(large).entries,1600);beginSnowWindow(large,80);assert.ok(snowGroundArtStats(large).entries<=80);beginSnowWindow(world,64);assert.equal(snowGroundArtStats(large).entries,0,'Previous World artwork is released');
// Panning must retain the intersection, not churn a window-sized LRU. Use an
// interior window so every entering edge is real and row-major order matters.
const pan={n:8,idx:(x,y)=>y*8+x,seedHash:992,water:new Uint8Array(64),soilWater:{snowpack:new Float64Array(64).fill(.14)}};
const paintWindow=bounds=>{
  const capacity=(bounds.x1-bounds.x0)*(bounds.y1-bounds.y0);
  beginSnowWindow(pan,capacity,bounds);
  const before=snowGroundArtStats(pan).builds;
  for(let y=bounds.y0;y<bounds.y1;y++)for(let x=bounds.x0;x<bounds.x1;x++)
    drawSnowGround(quiet,{world:pan,x,y,px:0,py:0,tile:32});
  assert.equal(snowGroundArtStats(pan).entries,capacity);
  return snowGroundArtStats(pan).builds-before;
};
const untouched={...pan,water:pan.water.slice(),soilWater:{snowpack:pan.soilWater.snowpack.slice()}};
assert.equal(paintWindow({x0:1,y0:1,x1:5,y1:5}),16);
assert.equal(paintWindow({x0:2,y0:1,x1:6,y1:5}),4,'Right pan builds only its entering column');
assert.equal(paintWindow({x0:1,y0:1,x1:5,y1:5}),4,'Left pan builds only its entering column');
assert.equal(paintWindow({x0:1,y0:2,x1:5,y1:6}),4,'Vertical pan builds only its entering row');
assert.equal(paintWindow({x0:2,y0:3,x1:6,y1:7}),7,'Diagonal pan preserves the nine-cell intersection');
assert.equal(paintWindow({x0:2,y0:3,x1:6,y1:7}),0);
assert.equal(paintWindow({x0:3,y0:3,x1:6,y1:7}),0,'Shrinking retains every remaining texture');
assert.equal(paintWindow({x0:3,y0:3,x1:3,y1:3}),0,'An empty window releases every texture');
assert.deepEqual(pan,untouched,'Camera retention cannot change physical snow or the World');
assert.throws(()=>beginSnowWindow(pan,16,{x0:-1,y0:0,x1:4,y1:4}),/Invalid snow artwork window/);
console.log('Snow artwork PASS: native32 variable geometry, monotonic physical cover, absolute regional coordinates, water clipping, zero marks without stored snow, live melt despite cache and immutable world. Synthetic presentation fixtures only.');
