import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const root=new URL('../assets/art/production-candidate-v1/',import.meta.url),oldRoot=new URL('../docs/art-covering-refinement-2026-10-28/before/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',root))),before=JSON.parse(fs.readFileSync(new URL('catalog.json',oldRoot)));
assert.equal(catalog.native32Fallback,true);const results=[];
for(const id of ['fur-mantle','feather-mantle','shell-back'])for(const resolution of [64,128]){
 const entry=catalog.parts.find(e=>e.partId===id&&e.resolution===resolution),prior=before.parts.find(e=>e.partId===id&&e.resolution===resolution);
 assert.ok(entry.master.path.includes('refinement-v2/'));assert.notEqual(entry.master.sha256,prior.master.sha256);
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL(entry.master.path,root))).digest('hex'),entry.master.sha256);
 const asset=JSON.parse(gunzipSync(fs.readFileSync(new URL(entry.path,root)))),old=JSON.parse(gunzipSync(fs.readFileSync(new URL(prior.path,oldRoot))));
 assert.equal((await compileIndexedPart(asset)).checksum,entry.checksum);assert.notEqual(entry.checksum,prior.checksum);
 assert.deepEqual(asset.regions,old.regions);assert.deepEqual(asset.rootAnchorPx,old.rootAnchorPx);assert.equal(asset.displayScale,old.displayScale,'richer tissue never increases the world scale');
 let changed=0;for(let i=0;i<asset.frames[0].alpha.length;i++)if(asset.frames[0].alpha[i]!==old.frames[0].alpha[i]||asset.frames[0].indices[i]!==old.frames[0].indices[i])changed++;
 assert.ok(changed/(resolution*resolution)>.05,'refinement includes actual tissue changes at the same resolution');
 for(let dir=0;dir<8;dir++)for(const index of [0,1]){
  const frame=asset.frames.find(f=>f.facing===dir&&f.index===index);assert.ok(frame);assert.ok(frame.alpha.some(a=>a===255));
  assert.equal(frame.durationMs,old.frames.find(f=>f.facing===dir&&f.index===index).durationMs);
  const tint=recolorIndexedFrame(asset,frame.key,Object.fromEntries(asset.regions.filter(r=>!r.protected).map(r=>[r.id,r.colors.map(([red,green,blue])=>[Math.min(255,Math.round(red*1.04+2)),Math.round(green*.8),Math.round(blue*.65)])])));assert.equal(tint.length,resolution*resolution*4);
 }
 // Dense dorsal tissue covers the torso, rather than retaining the old collar hole.
 assert.equal(asset.frames[0].alpha[(resolution/2)*resolution+resolution/2],255);
 results.push({id,resolution,changedFraction:changed/(resolution*resolution),bytes:entry.bytes,decodedRgbaBytes:entry.decodedRgbaBytes});
}
console.log('Covering refinement PASS: six newly authored surfaces, preserved pigment regions, pivots, physical scale, timing, all facings and dense dorsal tissue. '+JSON.stringify(results));
