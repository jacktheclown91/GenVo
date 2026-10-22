// Validate preserved native paint and compare physical masks to immutable baseline.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {caveRockArt} from '../assets/art/environment/cave-rock.js';
import {caveTileData} from '../src/render/cave-surface.js';
import {CAVES} from '../src/world/cave-policy.js';
const file=new URL('../src/render/cave-surface.js',import.meta.url);
const text=execFileSync('git',['show','983a95a:src/render/cave-surface.js'],{encoding:'utf8'}).replace(/from '([^']+)'/g,(_m,s)=>`from '${new URL(s,file).href}'`);
const baseline=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
const master=fs.readFileSync(new URL('../assets/art/production-review/cave-surfaces-v1/limestone-master.png',import.meta.url));
assert.equal(createHash('sha256').update(master).digest('hex'),caveRockArt.sourceSha256);
assert.equal(caveRockArt.width,32);assert.equal(caveRockArt.height,32);assert.equal(caveRockArt.frames.length,4);
for(const f of caveRockArt.frames){assert.equal(f.length,1024);assert.ok(f.every(v=>Number.isInteger(v)&&v>=0&&v<4));assert.equal(new Set(f).size,4)}
const n=8,len=n*n,w={n,len,seedHash:517,water:new Uint8Array(len),moisture:new Float32Array(len).fill(.62),terrain:{elevation:new Float32Array(len).fill(.36)},plants:{woodspire:new Float32Array(len)},subsurface:{revision:0,passages:new Map()}};
for(const natural of [false,true])for(const flooded of [false,true])for(const rooted of [false,true]){
 const p={i:27,entry:false,closed:false,floor:6,void:.04,...(natural?{origin:CAVES.policy}:{})};w.subsurface.passages=new Map([[27,p],[28,{...p,i:28}]]);w.water[27]=+flooded;w.plants.woodspire[27]=+rooted;
 const prior=structuredClone(w),old=baseline.caveTileData(w,p),next=caveTileData(w,p);
 for(const key of ['neighbors','wallPixels','floorPixels','natural','wet','source'])assert.deepEqual(next[key],old[key],key+' changed physical geometry');
 assert.deepEqual(w,prior,'Art changed canonical world');
 if(!natural)assert.deepEqual(next.pixels,old.pixels,'Excavated soil changed');
 if(flooded)for(let i=0;i<1024;i++){
  // Floor water is identified by the unchanged physical water mask and blue channel.
  const k=i*4;if(old.pixels[k+2]-old.pixels[k]>25)assert.deepEqual(next.pixels.slice(k,k+4),old.pixels.slice(k,k+4),'Physical water paint changed');
 }
}
console.log('Cave native master hash, four native32 frames, exact geometry, water, excavated earth and immutable physical state PASS');
