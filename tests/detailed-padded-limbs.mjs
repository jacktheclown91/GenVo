import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {authorLimbPart} from '../tools/art-production/limb-recipes.mjs';
const root=new URL('../assets/art/production-candidate-v1/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',root)));
const prior=JSON.parse(fs.readFileSync(new URL('../docs/padded-limb-detail-2026-10-29/before/catalog.json',import.meta.url)));
assert.equal(catalog.parts.length,prior.parts.length+2);
for(const entry of prior.parts)assert.deepEqual(catalog.parts.find(e=>e.partId===entry.partId&&e.resolution===entry.resolution),entry,'All42 prior variants, including their original budgets, remain exact');
const entries=catalog.parts.filter(e=>e.partId==='padded-leg');
assert.equal(entries.length,2);assert.ok(entries.reduce((n,e)=>n+e.bytes,0)<=16*1024,'Both new padded assets stay within16KiB');
const scale=(v,r)=>Array.isArray(v)?v.map(x=>scale(x,r)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scale(x,r)])):typeof v==='number'?v*r:v;
let frames=0;
for(const entry of entries){
  const native=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/padded-leg.indexed.json',import.meta.url)));
  const asset=await compileIndexedPart(JSON.parse(gunzipSync(fs.readFileSync(new URL(entry.path,root))))),r=entry.resolution/32;
  assert.equal((await compileIndexedPart(authorLimbPart(native,entry.resolution))).checksum,entry.checksum);
  assert.deepEqual(asset.rig,scale(native.rig,r));assert.deepEqual(asset.regions,native.regions);
  assert.deepEqual(asset.rootAnchorPx,native.rootAnchorPx.map(v=>v*r));assert.equal(asset.displayScale*r,native.displayScale);
  for(let facing=0;facing<8;facing++){
    const a=asset.frames.find(f=>f.facing===facing&&f.index===0),b=asset.frames.find(f=>f.facing===facing&&f.index===1);
    assert.notDeepEqual(a.alpha,b.alpha,'Digital cushions flex in the existing recovery frame');
    for(const frame of [a,b]){
      assert.equal(frame.durationMs,native.frames.find(f=>f.facing===facing&&f.index===frame.index).durationMs);
      assert.ok(new Set(frame.indices.filter((v,i)=>frame.alpha[i])).size>=4);
      for(let n=0;n<asset.width;n++)assert.equal(frame.alpha[n]+frame.alpha[(asset.height-1)*asset.width+n]+frame.alpha[n*asset.width]+frame.alpha[n*asset.width+asset.width-1],0,'Tissue fits native cells');
      frames++;
    }
    const base=recolorIndexedFrame(asset,a.key),tint=recolorIndexedFrame(asset,a.key,{skin:native.regions[0].colors.map(c=>c.map(v=>Math.floor(v*.6)))});
    assert.ok(base.some((v,i)=>i%4!==3&&v!==tint[i]));
    for(let i=3;i<base.length;i+=4)assert.equal(base[i],tint[i],'Pigmentation cannot alter tissue silhouette');
  }
}
// Extending the recipe cannot change existing walking/runner/sturdy tissue.
for(const id of ['walking-leg','runner-leg','sturdy-leg'])for(const resolution of [64,128]){
  const source=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/'+id+'.indexed.json',import.meta.url)));
  assert.equal((await compileIndexedPart(authorLimbPart(source,resolution))).checksum,catalog.parts.find(e=>e.partId===id&&e.resolution===resolution).checksum);
}
console.log('Detailed padded limbs PASS: '+frames+' native frames; exact rigs, pivots, materials and timing; flexing soft pads, inherited tint, no clipping, prior42 variants and earlier limb recipes exact.');
