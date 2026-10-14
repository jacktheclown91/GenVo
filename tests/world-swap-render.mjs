import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {Renderer} from '../src/render/renderer.js';
import {buildVisualWaterMask} from '../src/render/landform.js';
import {CFG} from '../src/sim/config.js';

// v1.32.5: swapping from the title-screen world to a loaded or new world must drop every
// cache keyed only by tile position, or old-world land draws in new-world water (and back).

const title=new Simulation('GENVO8-SWAP-TITLE',{player:false}),real=new Simulation('GENVO8-SWAP-REAL',{player:false});
// A tile that is water in one world and land in the other.
let tile=null;
for(let y=4;y<CFG.worldSize-4&&!tile;y++)for(let x=4;x<CFG.worldSize-4;x++){const i=title.world.idx(x,y);if(!title.world.water[i]&&real.world.water[i]){tile={x,y};break}}
assert.ok(tile,'the two test worlds differ somewhere');

const r=Object.create(Renderer.prototype);
Object.assign(r,{sim:title,motionSim:title,partExpressions:{reset(){}},landformMaskCache:new Map(),habitatMaskCache:new Map(),landBaseTileCache:new Map(),waterBaseTileCache:new Map(),staticLandTileCache:new Map(),terrainChunkCache:new Map(),terrainRefreshQueue:[],terrainRefreshQueued:new Set(),habitatField:{},habitatFieldDay:1});
const before=r.visualWaterMask(tile.x,tile.y);
for(const k of ['habitatMaskCache','landBaseTileCache','waterBaseTileCache','staticLandTileCache','terrainChunkCache'])r[k].set(1,{});
r.terrainRefreshQueue.push({});r.terrainRefreshQueued.add('0,0,8');

// render() resets the caches when the simulation it draws has changed.
let called=0;const reset=r.resetWorldCaches;r.motion={clear(){}};r.resetWorldCaches=function(){called++;reset.call(this);throw new Error('stop')};
r.sim=real;assert.throws(()=>r.render(),/stop/);assert.equal(called,1,'a world swap resets the world caches');
for(const k of ['landformMaskCache','habitatMaskCache','landBaseTileCache','waterBaseTileCache','staticLandTileCache','terrainChunkCache','terrainRefreshQueued'])assert.equal(r[k].size,0,`${k} is empty after the swap`);
assert.equal(r.terrainRefreshQueue.length,0);assert.equal(r.habitatField,null,'the old habitat field is rebuilt for the new world');

r.resetWorldCaches=reset;
const after=r.visualWaterMask(tile.x,tile.y);
assert.notStrictEqual(after,before,'the landform mask is rebuilt');
assert.deepEqual(after,buildVisualWaterMask(real.world,tile.x,tile.y),'the tile reads the new world\'s water, not the title world\'s land');
console.log('world swap render caches ok');
