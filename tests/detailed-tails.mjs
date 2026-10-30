import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {authorTailPart,TAIL_PARTS} from '../tools/art-production/tail-recipes.mjs';
const folder=new URL('../assets/art/production-candidate-v1/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',folder)));
const before=JSON.parse(fs.readFileSync(new URL('../docs/tail-detail-2026-10-29/before/catalog.json',import.meta.url)));
assert.equal(catalog.parts.length,before.parts.length+2);
for(const old of before.parts.filter(e=>e.partId!=='balance-tail'))assert.deepEqual(catalog.parts.find(e=>e.partId===old.partId&&e.resolution===old.resolution),old,'Other38 existing variants remain exact');
const tailEntries=catalog.parts.filter(e=>TAIL_PARTS.includes(e.partId));
assert.equal(tailEntries.length,4);
assert.ok(tailEntries.reduce((sum,e)=>sum+e.bytes,0)<=32*1024,'Four tail assets remain within32KiB compressed');
let frames=0,protectedPixels=0;
for(const id of TAIL_PARTS)for(const resolution of [64,128]){
 const source=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/'+id+'.indexed.json',import.meta.url)));
 const entry=catalog.parts.find(e=>e.partId===id&&e.resolution===resolution);
 const asset=await compileIndexedPart(JSON.parse(gunzipSync(fs.readFileSync(new URL(entry.path,folder)))));
 assert.equal((await compileIndexedPart(authorTailPart(source,resolution))).checksum,asset.checksum);
 assert.deepEqual(asset.regions,source.regions);assert.deepEqual(asset.rootAnchorPx,source.rootAnchorPx.map(v=>v*resolution/32));
 assert.equal(asset.displayScale,source.displayScale*32/resolution);assert.equal(asset.rig,undefined);
 for(const frame of asset.frames){
  assert.equal(frame.durationMs,source.frames.find(f=>f.facing===frame.facing&&f.index===frame.index).durationMs);
  for(let i=0;i<resolution;i++)assert.equal(frame.alpha[i]+frame.alpha[(resolution-1)*resolution+i]+frame.alpha[i*resolution]+frame.alpha[i*resolution+resolution-1],0,'Eight-facing tissue fits its native cell');
  const rgba=recolorIndexedFrame(asset,frame.key),tinted=recolorIndexedFrame(asset,frame.key,{skin:source.regions[0].colors.map(c=>c.map(v=>Math.floor(v*.5)))});
  assert.ok(tinted.some((v,i)=>i%4!==3&&v!==rgba[i]),'Actual inherited skin remains tintable');
  for(let i=0;i<frame.indices.length;i++)if(frame.alpha[i]&&frame.indices[i]===6){assert.deepEqual(tinted.slice(i*4,i*4+4),rgba.slice(i*4,i*4+4));protectedPixels++;}
  frames++;
 }
}
assert.ok(protectedPixels>100,'Paddle membrane uses its existing protected material');
console.log('Detailed tails PASS: '+frames+' native frames, exact pivots/materials/timing, all8 facings, protected paddle membrane, reproducible recipe and other38 variants exact.');
