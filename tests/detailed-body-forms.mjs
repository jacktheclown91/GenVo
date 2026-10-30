import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {authorTorsoPart,BODY_FORM_PARTS} from '../tools/art-production/torso-recipes.mjs';
const folder=new URL('../assets/art/production-candidate-v1/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',folder)));
const before=JSON.parse(fs.readFileSync(new URL('../docs/body-form-detail-2026-10-29/before/catalog.json',import.meta.url)));
assert.equal(catalog.parts.length,before.parts.length+6);
for(const old of before.parts.filter(e=>!['flight-wing','proto-wing'].includes(e.partId)))assert.deepEqual(catalog.parts.find(e=>e.partId===old.partId&&e.resolution===old.resolution),old,'preceding non-wing variants remain exact; revised wings have independent coverage');
const scaled=(v,r)=>Array.isArray(v)?v.map(x=>scaled(x,r)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scaled(x,r)])):typeof v==='number'?v*r:v;
let frames=0;
const contours=new Map();
for(const id of BODY_FORM_PARTS)for(const resolution of [64,128]){
  const source=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/'+id+'.indexed.json',import.meta.url)));
  const entry=catalog.parts.find(e=>e.partId===id&&e.resolution===resolution);
  const asset=await compileIndexedPart(JSON.parse(gunzipSync(fs.readFileSync(new URL(entry.path,folder)))));
  assert.equal(asset.checksum,entry.checksum);
  assert.equal((await compileIndexedPart(authorTorsoPart(source,resolution))).checksum,asset.checksum);
  assert.equal(entry.sourceChecksum,source.checksum);
  assert.deepEqual(asset.rig,scaled(source.rig,resolution/32));
  assert.deepEqual(asset.rootAnchorPx,source.rootAnchorPx.map(v=>v*resolution/32));
  assert.equal(asset.displayScale*resolution/32,source.displayScale);
  assert.deepEqual(asset.regions,source.regions);
  contours.set(id+'-'+resolution,JSON.stringify(asset.frames[0].alpha));
  for(const frame of asset.frames){
    const native=source.frames.find(f=>f.facing===frame.facing&&f.index===frame.index);
    assert.equal(frame.durationMs,native.durationMs);
    assert.ok(new Set(frame.indices.filter((_,i)=>frame.alpha[i])).size>=4);
    const rest=asset.frames.find(f=>f.facing===frame.facing&&f.index===0);
    assert.deepEqual(frame.alpha,rest.alpha,'canonical torso breathing is not duplicated');
    for(let i=0;i<resolution;i++)assert.equal(frame.alpha[i]+frame.alpha[(resolution-1)*resolution+i]+frame.alpha[i*resolution]+frame.alpha[i*resolution+resolution-1],0,'all directions fit');
    const rgba=recolorIndexedFrame(asset,frame.key),tint=recolorIndexedFrame(asset,frame.key,{skin:source.regions[0].colors.map(rgb=>rgb.map(v=>Math.round(v*.6)))});
    assert.ok(tint.some((v,i)=>i%4!==3&&v!==rgba[i]));
    for(let i=3;i<rgba.length;i+=4)assert.equal(tint[i],rgba[i]);
    frames++;
  }
}
for(const resolution of [64,128])assert.equal(new Set(BODY_FORM_PARTS.map(id=>contours.get(id+'-'+resolution))).size,3,'distinct anatomical contours');
console.log('Detailed body forms PASS: '+frames+' native torso frames, three distinct contours, reproducible recipe, exact roots/rigs/palettes/timing, all8 directions, inherited tint and preceding non-wing variants unchanged (wing-root revision checked separately).');
