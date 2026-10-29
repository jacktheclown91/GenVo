import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {compileIndexedPart} from '../src/render/indexed-part-art.js';
import {loadPartArtVariant} from '../src/render/part-art-variants.js';
import {nativeArtRevision,artForPart} from '../src/render/runtime-part-art.js';
const folder=new URL('../assets/art/production-candidate-v1/',import.meta.url),catalogUrl=new URL('catalog.json',folder);
const catalog=JSON.parse(await fs.readFile(catalogUrl,'utf8'));
assert.equal(catalog.parts.length,34);assert.equal(catalog.native32Fallback,true);
for(const entry of catalog.parts){
 const asset=JSON.parse(gunzipSync(await fs.readFile(new URL(entry.path,folder))));
 assert.equal((await compileIndexedPart(asset)).checksum,entry.checksum);
 const original=JSON.parse(await fs.readFile(new URL('../assets/art/parts/'+entry.partId+'.indexed.json',import.meta.url),'utf8'));
 assert.equal(entry.sourceChecksum,original.checksum);assert.deepEqual(asset.regions,original.regions);
 const ratio=entry.resolution/32;
 assert.equal(asset.displayScale*ratio,original.displayScale??1);assert.deepEqual(asset.rootAnchorPx.map(v=>v/ratio),original.rootAnchorPx);
 if(entry.master){
  assert.equal(createHash('sha256').update(await fs.readFile(new URL(entry.master.path,folder))).digest('hex'),entry.master.sha256,'unmodified generated source retained');
  for(const frame of asset.frames){
   for(let i=0;i<asset.width;i++)assert.equal(frame.alpha[i]+frame.alpha[(asset.height-1)*asset.width+i]+frame.alpha[i*asset.width]+frame.alpha[i*asset.width+asset.width-1],0,'rotated material fits native raster without clipping');
  }
 }
}
let canvases=0;
const createCanvas=()=>{canvases++;return{width:0,height:0,getContext(){return{createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}};};
const requested=[];
const fetcher=async url=>{requested.push(String(url));return new Response(await fs.readFile(url));};
const revision=nativeArtRevision(),before=artForPart('fur-mantle');
for(const resolution of [64,128]){
 const result=await loadPartArtVariant(catalogUrl,{resolution,createCanvas,fetcher});
 assert.equal(result.parts.size,17);assert.equal(result.resolution,resolution);
 assert.ok([...result.parts.values()].every(part=>part.frameAt({facing:7})!==null),'real indexed renderer supports every supplied facing');
 assert.ok(requested.filter(u=>u.endsWith('.gz')).every(u=>u.includes('-'+resolution+'.indexed')),'only selected resolution is decoded');
 requested.length=0;
}
assert.equal(artForPart('fur-mantle'),before);assert.equal(nativeArtRevision(),revision,'optional loading never installs or changes stable32');
await assert.rejects(()=>loadPartArtVariant(catalogUrl,{resolution:256,fetcher,createCanvas}),/64 or 128/);
const corrupt=async url=>{
 const bytes=await fs.readFile(url);
 if(String(url).endsWith('fur-mantle-64.indexed.json.gz')){
  const altered=JSON.parse(gunzipSync(bytes));altered.frames[0].alpha[0]=255;
  return new Response(gzipSync(JSON.stringify(altered)));
 }
 return new Response(bytes);
};
await assert.rejects(()=>loadPartArtVariant(catalogUrl,{resolution:64,fetcher:corrupt,createCanvas}),/checksum mismatch/,'claimed checksum cannot hide altered pixels');
assert.equal(nativeArtRevision(),revision,'failed candidate load cannot replace installed art');
console.log('Production candidate PASS: 34 real modular variants, retained masters/palettes/pivots, no clipped facings, resolution-selective loading and fail-closed pixel identity.');
