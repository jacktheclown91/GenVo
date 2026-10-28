import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {setPartArtPreview,artForPart,nativeArtRevision} from '../src/render/runtime-part-art.js';
import {validatePlan} from '../src/lineage/body-plan.js';
import {studyCreatures} from '../tools/art-resolution/specimens.mjs';
const folder=new URL('../assets/art/experiments/resolution-v1/',import.meta.url);
const catalog=JSON.parse(await fs.readFile(new URL('catalog.json',folder),'utf8'));
assert.equal(catalog.parts.length,30);
let detailedBlocks=0,blocks=0;
for(const entry of catalog.parts){
 const compressed=await fs.readFile(new URL(entry.path,folder)),asset=JSON.parse(gunzipSync(compressed));
 const source=JSON.parse(await fs.readFile(new URL('../assets/art/parts/'+entry.partId+'.indexed.json',import.meta.url),'utf8'));
 const ratio=entry.resolution/32;
 assert.deepEqual(asset.regions,source.regions,'inherited ramps and protected optical/material colors retain native identity');
 assert.equal(source.checksum,entry.sourceChecksum,'original native32 identity remains intact');
 assert.equal(asset.checksum,(await compileIndexedPart(asset)).checksum,'pixels, palette, dimensions, rig and pivot have verified identity');
 assert.equal(asset.displayScale*ratio,source.displayScale??1,'resolution does not increase world footprint');
 assert.deepEqual(asset.rootAnchorPx.map(v=>v/ratio),source.rootAnchorPx,'socket origin remains identical');
 if(source.rig?.bodyBoundsPx)assert.deepEqual(asset.rig.bodyBoundsPx.map(v=>v/ratio),source.rig.bodyBoundsPx);
 for(const segment of ['upper','lower','jointSurface','hipSurface'])if(source.rig?.[segment]){
  for(const field of ['rect','start','end','anchor'])if(source.rig[segment][field])assert.deepEqual(asset.rig[segment][field].map(v=>v/ratio),source.rig[segment][field]);
 }
 for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++)assert.ok(asset.frames.some(f=>f.facing===facing&&f.index===index),'every direction and contact frame supplied');
 const frame=asset.frames[0],rgba=recolorIndexedFrame(asset,frame.key);
 assert.equal(rgba.length,asset.width*asset.height*4);
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const values=new Set();for(let j=0;j<ratio;j++)for(let i=0;i<ratio;i++){
   const k=((y*ratio+j)*asset.width+x*ratio+i);values.add(frame.alpha[k]+':'+frame.indices[k]);
  }
  blocks++;if(values.size>1)detailedBlocks++;
 }
 assert.ok(asset.frames.every(f=>f.alpha.some(a=>a===255)),'no empty directional frame');
 assert.equal(compressed.length,entry.bytes);
 const png=await fs.readFile(new URL(entry.partId+'-'+entry.resolution+'.png',folder));
 assert.equal(png.readUInt32BE(16),entry.resolution*8,'editable atlas covers eight native facings');
 assert.equal(png.readUInt32BE(20),entry.resolution*2,'both contact frames exported');
}
assert.ok(detailedBlocks/blocks>.12,'high-resolution artwork contains genuine native subpixel shape/shading, not enlarged 32px blocks');
for(const animal of studyCreatures())assert.equal(validatePlan(animal.bodyPlan).ok,true,'every study uses real legal modular anatomy');
const revision=nativeArtRevision(),stub={draw(){return true}};
setPartArtPreview(new Map([['simple-eye',stub]]));assert.equal(artForPart('simple-eye'),stub);
setPartArtPreview();assert.equal(artForPart('simple-eye'),null,'preview can be fully removed without installing assets');assert.equal(nativeArtRevision(),revision+2,'cache identity changes on selection and restore');
assert.throws(()=>setPartArtPreview({}),/part map/);
const asset=JSON.parse(gunzipSync(await fs.readFile(new URL(catalog.parts[0].path,folder))));
await assert.rejects(()=>compileIndexedPart({...asset,width:256,height:256}),/32, 64 or 128/);
await assert.rejects(()=>compileIndexedPart({...asset,displayScale:undefined}),/explicit display scale/);
console.log('Resolution study PASS: 30 verified native assets, exact pivots/rig footprint, 8 facings, original identity, legal bodies and reversible preview; '+(100*detailedBlocks/blocks).toFixed(1)+'% non-enlarged pixel blocks.');
