import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {loadPartArtVariant} from '../src/render/part-art-variants.js';
import {authorWingPart,WING_PARTS} from '../tools/art-production/wing-recipes.mjs';
import {PARTS} from '../src/lineage/part-registry.js';
const folder=new URL('../assets/art/production-candidate-v1/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',folder)));
const before=JSON.parse(fs.readFileSync(new URL('../docs/wing-detail-2026-10-29/before/catalog.json',import.meta.url)));
assert.equal(catalog.parts.filter(e=>WING_PARTS.includes(e.partId)).length,4);
for(const old of before.parts.filter(e=>e.partId!=='balance-tail'))assert.deepEqual(catalog.parts.find(e=>e.partId===old.partId&&e.resolution===old.resolution),old,'original28 non-tail variants remain exact, including original byte budgets');
let frames=0,protectedQuills=0;
for(const id of WING_PARTS)for(const resolution of [64,128]){
  const source=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/'+id+'.indexed.json',import.meta.url)));
  const entry=catalog.parts.find(e=>e.partId===id&&e.resolution===resolution);
  const bytes=fs.readFileSync(new URL(entry.path,folder));
  assert.equal(bytes.length,entry.bytes);
  const asset=await compileIndexedPart(JSON.parse(gunzipSync(bytes)));
  assert.equal(asset.checksum,entry.checksum);
  assert.equal((await compileIndexedPart(authorWingPart(source,resolution))).checksum,entry.checksum,'reproducible native feather recipe');
  const ratio=resolution/32;
  assert.equal(entry.sourceChecksum,source.checksum);
  assert.deepEqual(asset.regions,source.regions);
  assert.deepEqual(asset.rootAnchorPx,source.rootAnchorPx.map(v=>v*ratio));
  assert.equal(asset.displayScale*ratio,source.displayScale);
  if(source.rig){
    assert.equal(asset.rig.foldedExtent,source.rig.foldedExtent,'folding factor must never be multiplied by pixel resolution');
    assert.deepEqual(asset.rig.rootRect,source.rig.rootRect.map(v=>v*ratio));
    assert.deepEqual(asset.rig.panels,source.rig.panels.map(r=>r.map(v=>v*ratio)));
  }else assert.equal(asset.rig,undefined);
  for(const frame of asset.frames){
    const native=source.frames.find(f=>f.facing===frame.facing&&f.index===frame.index);
    assert.equal(frame.durationMs,native.durationMs);
    assert.ok(new Set(frame.indices.filter((_,i)=>frame.alpha[i])).size>=4);
    assert.ok(frame.alpha[(resolution/2)*resolution+resolution/2],'real dorsal root remains covered');
    for(let i=0;i<resolution;i++)assert.equal(frame.alpha[i]+frame.alpha[(resolution-1)*resolution+i]+frame.alpha[i*resolution]+frame.alpha[i*resolution+resolution-1],0,'all facings retain transparent margin');
    const rgba=recolorIndexedFrame(asset,frame.key),tint=recolorIndexedFrame(asset,frame.key,{skin:source.regions[0].colors.map(rgb=>rgb.map(c=>Math.round(c*.6)))});
    assert.ok(tint.some((v,i)=>i%4!==3&&v!==rgba[i]));
    for(let i=3;i<rgba.length;i+=4)assert.equal(tint[i],rgba[i]);
    for(let i=0;i<frame.indices.length;i++)if(frame.alpha[i]){
      if(id==='proto-wing')assert.ok(frame.indices[i]<5,'precursor feather tissue remains inheritable');
      else if(frame.indices[i]>=5){assert.deepEqual([...tint.slice(i*4,i*4+4)],[...rgba.slice(i*4,i*4+4)],'protected quill material retains its native pigment');protectedQuills++;}
    }
    frames++;
  }
  assert.notDeepEqual(asset.frames[0].alpha,asset.frames[1].alpha,'existing recovery frame has its own native feather tissue');
}
assert.ok(protectedQuills>0,'flight quills retain actual protected material');
assert.equal(PARTS['proto-wing'].actionCapabilities.includes('fly'),false,'precursor never acquires powered flight');
let canvasBytes=0;
for(const resolution of [64,128]){
  const canvases=[],createCanvas=()=>{const c={width:0,height:0,getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}};canvases.push(c);return c;};
  const result=await loadPartArtVariant(new URL('catalog.json',folder),{resolution,createCanvas,fetcher:async url=>new Response(fs.readFileSync(url))});
  assert.equal(result.parts.size,21);
  const renderer=result.parts.get('flight-wing'),prepared=canvases.length;
  let draws=0,depth=0;
  const c={save(){depth++},restore(){depth--},translate(x,y){assert.ok(Number.isFinite(x+y))},rotate(a){assert.ok(Number.isFinite(a))},scale(x,y){assert.ok(Number.isFinite(x+y))},drawImage(){draws++}};
  for(let dir=0;dir<8;dir++)for(const deployment of [0,.3,1])assert.equal(renderer.drawDorsal(c,{x:4,y:7,scale:2,headingRadians:(dir-2)*Math.PI/4,sweepRadians:.2,deployment,facing:dir,frameIndex:dir%2}),true);
  assert.equal(draws,72,'every detailed draw reuses two registered panels and the root');
  assert.equal(depth,0);
  assert.equal(canvases.length,prepared,'folding/strokes never allocate new tissue per draw');

  canvasBytes+=canvases.reduce((n,c)=>n+c.width*c.height*4,0);
}
assert.ok(canvasBytes<=32*1024*1024,'combined untinted prepared variant canvases, including wing panel copies, remain below32MiB');
console.log('Detailed wings PASS: '+frames+' native frames, real feather detail, exact roots/palettes/timing/folding, no clipped facings, unchanged original28 non-tail variants, precursor capabilities preserved; prepared canvas bytes='+canvasBytes+'.');
