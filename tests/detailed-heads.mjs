import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {authorHeadPart} from '../tools/art-production/head-recipes.mjs';
const folder=new URL('../assets/art/production-candidate-v1/',import.meta.url);
const priorRoot=new URL('../docs/head-refinement-2026-10-29/before/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',folder)));
const prior=JSON.parse(fs.readFileSync(new URL('catalog.json',priorRoot)));
const source=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/head-base.indexed.json',import.meta.url)));
const sourceBefore=JSON.stringify(source);
const scaled=(v,r)=>Array.isArray(v)?v.map(x=>scaled(x,r)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scaled(x,r)])):typeof v==='number'?v*r:v;
let frames=0;
const originalBatch=catalog.parts.filter(e=>prior.parts.some(p=>p.partId===e.partId&&p.resolution===e.resolution));
assert.equal(originalBatch.length,prior.parts.length,'every original batch entry remains present');
for(const entry of originalBatch){
  const oldEntry=prior.parts.find(e=>e.partId===entry.partId&&e.resolution===entry.resolution);
  if(entry.partId!=='head-base'){
    assert.deepEqual(entry,oldEntry,'all other 28 candidate variants remain exact');
    continue;
  }
  const asset=await compileIndexedPart(JSON.parse(gunzipSync(fs.readFileSync(new URL(entry.path,folder)))));
  const old=JSON.parse(gunzipSync(fs.readFileSync(new URL(oldEntry.path,priorRoot))));
  const authored=await compileIndexedPart(authorHeadPart(source,entry.resolution));
  assert.equal(asset.checksum,entry.checksum);
  assert.equal(asset.checksum,authored.checksum,'committed tissue reproduces from the head recipe');
  assert.notEqual(asset.checksum,old.checksum);
  const ratio=entry.resolution/32;
  assert.deepEqual(asset.rig,scaled(source.rig,ratio));
  assert.deepEqual(asset.rootAnchorPx,scaled(source.rootAnchorPx,ratio));
  assert.deepEqual(asset.regions,source.regions);
  assert.equal(asset.displayScale*ratio,source.displayScale);
  assert.equal(entry.sourceChecksum,oldEntry.sourceChecksum,'native32 authority unchanged');
  for(const frame of asset.frames){
    const preceding=old.frames.find(f=>f.facing===frame.facing&&f.index===frame.index);
    assert.equal(frame.durationMs,preceding.durationMs);
    assert.ok(frame.indices.filter((v,i)=>frame.alpha[i]&&(v!==preceding.indices[i]||frame.alpha[i]!==preceding.alpha[i])).length>entry.resolution**2*.08,'substantial new native tissue');
    assert.ok(new Set(frame.indices.filter((_,i)=>frame.alpha[i])).size>=4);
    for(let p=0;p<entry.resolution;p++)assert.equal(frame.alpha[p]+frame.alpha[(entry.resolution-1)*entry.resolution+p]+frame.alpha[p*entry.resolution]+frame.alpha[p*entry.resolution+entry.resolution-1],0,'every facing fits without clipping');
    const rest=asset.frames.find(f=>f.facing===frame.facing&&f.index===0);
    assert.deepEqual(frame.alpha,rest.alpha,'real head pose owns motion');
    const rgba=recolorIndexedFrame(asset,frame.key),tint=recolorIndexedFrame(asset,frame.key,{skin:source.regions[0].colors.map(rgb=>rgb.map(v=>Math.round(v*.6)))});
    assert.ok(tint.some((v,i)=>i%4!==3&&v!==rgba[i]));
    for(let p=3;p<rgba.length;p+=4)assert.equal(tint[p],rgba[p]);
    frames++;
  }
}
assert.equal(JSON.stringify(source),sourceBefore);
assert.equal(originalBatch.reduce((n,e)=>n+e.decodedRgbaBytes,0),prior.parts.reduce((n,e)=>n+e.decodedRgbaBytes,0));
assert.ok(originalBatch.reduce((n,e)=>n+e.bytes,0)<=prior.parts.reduce((n,e)=>n+e.bytes,0));
console.log('Detailed heads PASS: '+frames+' real native frames, coherent new cranial/cheek tissue, exact registration/palette/timing, inherited tint, all8 directions unclipped, reproducible recipe, Native32 source and other28 variants preserved; no decoded-memory increase.');
