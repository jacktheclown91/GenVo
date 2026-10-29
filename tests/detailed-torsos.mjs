import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const folder=new URL('../assets/art/production-candidate-v1/',import.meta.url),beforeRoot=new URL('../docs/torso-refinement-2026-10-29/before/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',folder))),before=JSON.parse(fs.readFileSync(new URL('catalog.json',beforeRoot))),ids=['small-torso','soft-torso','dome-torso'];
const scaled=(v,r)=>Array.isArray(v)?v.map(x=>scaled(x,r)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scaled(x,r)])):typeof v==='number'?v*r:v;
let frames=0;const silhouettes=new Map();
const originalBatch=catalog.parts.filter(e=>before.parts.some(p=>p.partId===e.partId&&p.resolution===e.resolution));
assert.equal(originalBatch.length,before.parts.length,'every original batch entry remains present');
for(const e of originalBatch){
 const prior=before.parts.find(p=>p.partId===e.partId&&p.resolution===e.resolution);
 if(!ids.includes(e.partId)){if(e.partId==='head-base')continue;assert.deepEqual(e,prior,'other22 variants remain exact; head revision is checked by detailed-heads');continue}
 const asset=await compileIndexedPart(JSON.parse(gunzipSync(fs.readFileSync(new URL(e.path,folder))))),old=JSON.parse(gunzipSync(fs.readFileSync(new URL(prior.path,beforeRoot)))),source=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/'+e.partId+'.indexed.json',import.meta.url))),ratio=e.resolution/32;
 assert.equal(asset.checksum,e.checksum);assert.notEqual(asset.checksum,old.checksum);
 assert.deepEqual(asset.rig,scaled(source.rig,ratio));assert.deepEqual(asset.rootAnchorPx,scaled(source.rootAnchorPx,ratio));assert.equal(asset.displayScale*ratio,source.displayScale);assert.deepEqual(asset.regions,source.regions);
 silhouettes.set(e.partId+'-'+e.resolution,JSON.stringify(asset.frames[0].alpha));
 for(const frame of asset.frames){
  const priorFrame=old.frames.find(f=>f.facing===frame.facing&&f.index===frame.index);assert.equal(frame.durationMs,priorFrame.durationMs);
  assert.ok(new Set(frame.indices.filter((_,i)=>frame.alpha[i])).size>=4);
  assert.ok(frame.alpha.filter((a,i)=>a!==priorFrame.alpha[i]||frame.indices[i]!==priorFrame.indices[i]).length>e.resolution*e.resolution*.08,'new surface and contour differ materially from old round study');
  for(let i=0;i<e.resolution;i++)assert.equal(frame.alpha[i]+frame.alpha[(e.resolution-1)*e.resolution+i]+frame.alpha[i*e.resolution]+frame.alpha[i*e.resolution+e.resolution-1],0,'all directions fit native raster');
  const resting=asset.frames.find(f=>f.facing===frame.facing&&f.index===0);assert.deepEqual(frame.alpha,resting.alpha,'rig breathing is not duplicated by skin animation');
  const rgba=recolorIndexedFrame(asset,frame.key),tint=recolorIndexedFrame(asset,frame.key,{skin:source.regions[0].colors.map(rgb=>rgb.map(c=>Math.round(c*.6)))});assert.ok(tint.some((v,i)=>i%4!==3&&v!==rgba[i]));for(let i=3;i<rgba.length;i+=4)assert.equal(tint[i],rgba[i]);frames++;
 }
}
for(const resolution of [64,128])assert.equal(new Set(ids.map(id=>silhouettes.get(id+'-'+resolution))).size,3,'three distinct anatomical contours');
assert.equal(originalBatch.reduce((n,e)=>n+e.decodedRgbaBytes,0),before.parts.reduce((n,e)=>n+e.decodedRgbaBytes,0));
console.log('Detailed torsos PASS: '+frames+' native frames, three distinct contours, real new tissue, exact rigs/pivots/palettes/timing, inherited tint, no clipping or doubled breathing, unchanged decoded memory and other22 variants (head revision separately checked).');
