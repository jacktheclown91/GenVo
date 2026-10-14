import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
import {recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const eyes=['simple-eye','wide-field-eye','hunter-eye','tracker-eye','stalk-eye','compound-eye','glow-eye','display-eye'];
const mouths=['grazing-mouth','tearing-jaw','crushing-jaw','kernel-beak','reed-sieve-mouth','filter-mouth','sucker-mouth','gape-mouth'];
const base=new URL('../assets/art/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',base)));
let uniqueRest=new Set(),uniqueActive=new Set(),different=0;
for(const id of [...eyes,...mouths]){
 const entry=catalog.parts.find(v=>v.partId===id);assert.ok(entry,id);
 const bytes=fs.readFileSync(new URL(entry.path,base));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.checksumSha256);
 const spec=JSON.parse(bytes),asset=JSON.parse(fs.readFileSync(new URL(entry.indexed,base)));
 assert.equal(spec.frames.length,16,id);assert.equal(asset.frames.length,16,id);assert.ok(asset.regions.some(r=>r.id==='skin'&&!r.protected));
 assert.ok(asset.regions.some(r=>r.id==='protected-detail'&&r.protected));
 for(let facing=0;facing<8;facing++){
  const rest=Buffer.from(recolorIndexedFrame(asset,`idle:${facing}:0`));
  const active=Buffer.from(recolorIndexedFrame(asset,`idle:${facing}:1`));
  assert.ok(!rest.equals(active),`${id} facing ${facing}: expression must change image`);different++;
 }
 const rest=Buffer.from(recolorIndexedFrame(asset,'idle:2:0'));
 const active=Buffer.from(recolorIndexedFrame(asset,'idle:2:1'));
 uniqueRest.add(crypto.createHash('sha256').update(rest).digest('hex'));
 uniqueActive.add(crypto.createHash('sha256').update(active).digest('hex'));
 const renderer=prepareIndexedPartRenderer(asset,{createCanvas(){return {getContext(){return {createImageData(){return {data:new Uint8ClampedArray(4096)}},putImageData(){}}}}}});
 assert.equal(renderer.frameAt({facing:2,timeMs:0,frameIndex:0}).index,0);
 assert.equal(renderer.frameAt({facing:2,timeMs:0,frameIndex:1}).index,1);
 assert.throws(()=>renderer.frameAt({facing:2,frameIndex:-1}),/frame index/);
 assert.equal(renderer.frameAt({facing:2,frameIndex:2}),null);
}
assert.equal(uniqueRest.size,16,'all 16 facial morphologies must be visually distinct');
assert.equal(uniqueActive.size,16,'all 16 expressions must be visually distinct');
assert.equal(different,128);
console.log('native-face-expression-v172: 16 anatomy-specific faces, 128 visible expression transitions, fixed-index action selection, protected detail and distinct silhouettes PASS');
