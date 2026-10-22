import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {biomeSubstrateArt as art} from '../assets/art/environment/biome-substrates.js';
import {substrateWeightsAt,substrateTileData,drawNativeSubstrate} from '../src/render/biome-substrates.js';

assert.equal(art.schema,'genvo.environment-indexed-substrates/1');assert.equal(art.width,32);assert.equal(art.height,32);
const distinct=new Set();
for(const [name,material] of Object.entries(art.materials)){
 const master=fs.readFileSync(new URL('../assets/art/production-review/biome-substrates-v1/'+name+'-master.png',import.meta.url));
 assert.equal(createHash('sha256').update(master).digest('hex'),material.sourceSha256,'retained original master matches compiled provenance');
 assert.equal(material.palette.length,4);assert.equal(material.frames.length,4);
 for(const frame of material.frames){assert.equal(frame.length,1024);assert.ok(frame.every(v=>Number.isInteger(v)&&v>=0&&v<4));distinct.add(JSON.stringify(frame))}
}
assert.equal(distinct.size,12,'all twelve native artwork cells remain distinct');
function world(n=40){return{n,regionOrigin:{x:200,y:-400},idx(x,y){return Math.floor(y)*n+Math.floor(x)},temperature:new Float32Array(n*n).fill(.5),moisture:new Float32Array(n*n).fill(.5),water:new Uint8Array(n*n),terrain:{elevation:new Float32Array(n*n).fill(.1)}}}
const w=world(),zero={dry:0,cold:0,rock:0};assert.deepEqual(substrateWeightsAt(w,4,4),zero);assert.equal(substrateTileData(w,4,4),null);
w.moisture.fill(.1);assert.equal(substrateWeightsAt(w,4,4).dry,1);w.temperature.fill(.1);assert.deepEqual(substrateWeightsAt(w,4,4),{dry:0,cold:1,rock:0});
w.terrain.elevation.fill(.9);const blend=substrateWeightsAt(w,4,4);assert.equal(blend.cold,.5);assert.equal(blend.rock,.5);
w.water[w.idx(4,4)]=1;assert.equal(substrateTileData(w,4,4),null,'actual water must receive no terrestrial substrate');w.water.fill(0);
const snapshot=JSON.stringify(w),tile=substrateTileData(w,4,4);assert.equal(tile.pixels.length,4096);assert.ok(tile.pixels.every((v,i)=>i%4!==3||v<=64),'quiet paint stays below quarter opacity');assert.deepEqual(substrateTileData(w,4,4),tile);assert.equal(JSON.stringify(w),snapshot,'sampling never edits physical fields');
assert.equal(substrateTileData(w,5,4).variant,1);assert.equal(substrateTileData(w,4,5).variant,2);assert.equal(substrateTileData(w,5,5).variant,3);
for(let y=0;y<w.n;y++)for(let x=0;x<w.n;x++){const i=w.idx(x,y);w.temperature[i]=.1+x*.01;w.moisture[i]=.1+y*.01;w.terrain.elevation[i]=x*.025}
for(let y=1;y<36;y+=3)for(let x=1;x<36;x+=3)for(const field of ['dry','cold','rock'])assert.ok(Math.abs(substrateWeightsAt(w,x-1e-6,y)[field]-substrateWeightsAt(w,x+1e-6,y)[field])<.0001,'no cell-boundary material step');
let allocations=0,draws=0,depth=0;const previous=globalThis.document;
globalThis.document={createElement(){allocations++;return{getContext(){return{createImageData(){return{data:new Uint8ClampedArray(4096)}},putImageData(){}}}}}};
const ctx={imageSmoothingEnabled:true,save(){depth++},restore(){depth--},drawImage(){draws++}};
try{
 const cached=world();cached.temperature.fill(.1);const opts={world:cached,px:0,py:0,u:2,x:2,y:2};
 assert.equal(drawNativeSubstrate(ctx,opts),true);assert.equal(allocations,1);drawNativeSubstrate(ctx,opts);assert.equal(allocations,1,'unchanged native tile reuses its canvas');
 cached.temperature.fill(.5);cached.terrain.elevation.fill(.9);drawNativeSubstrate(ctx,opts);assert.equal(allocations,2,'physical weight changes invalidate cached paint');
 cached.water[cached.idx(2,2)]=1;assert.equal(drawNativeSubstrate(ctx,opts),false);cached.water.fill(0);
 for(let y=0;y<33;y++)for(let x=0;x<33;x++)drawNativeSubstrate(ctx,{...opts,x,y});
 const bounded=allocations;drawNativeSubstrate(ctx,{...opts,x:0,y:0});assert.equal(allocations,bounded+1,'old entries evicted beyond 1024-tile capacity');assert.equal(depth,0);
}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous}
assert.ok(draws>1000);console.log('native biome substrates: PASS (12 indexed native32 frames, state-driven weights, water exclusion, continuity, immutable sampling, bounded cache invalidation)');
