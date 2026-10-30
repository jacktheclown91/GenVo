import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
import {drawPart} from '../src/render/part-sprites.js';
const root=new URL('../assets/art/production-candidate-v1/',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',root)));
let frames=0;
for(const id of ['simple-eye','compound-eye','grazing-mouth','beak-mouth'])for(const resolution of [64,128]){
 const entry=catalog.parts.find(e=>e.partId===id&&e.resolution===resolution),input=JSON.parse(gunzipSync(fs.readFileSync(new URL(entry.path,root)))),asset=await compileIndexedPart(input);
 assert.equal(asset.checksum,entry.checksum);const native=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/'+id+'.indexed.json',import.meta.url)));
 assert.deepEqual(asset.regions,native.regions);assert.deepEqual(asset.rootAnchorPx.map(v=>v/(resolution/32)),native.rootAnchorPx);assert.equal(asset.displayScale*(resolution/32),native.displayScale??1);
 for(let facing=0;facing<8;facing++){
  const open=asset.frames.find(f=>f.facing===facing&&f.index===0),working=asset.frames.find(f=>f.facing===facing&&f.index===1);assert.ok(open&&working);
  assert.notDeepEqual(working.indices,open.indices,'actual authored working tissue differs, rather than merely changing a pose flag');
  assert.equal(open.durationMs,native.frames.find(f=>f.facing===facing&&f.index===0).durationMs);
  for(const frame of [open,working])for(let i=0;i<resolution;i++)assert.equal(frame.alpha[i]+frame.alpha[(resolution-1)*resolution+i]+frame.alpha[i*resolution]+frame.alpha[i*resolution+resolution-1],0,'rotated face tissue remains unclipped');
  if(id==='simple-eye')assert.ok(working.indices.every((tone,i)=>!working.alpha[i]||tone<5),'a blink closes the actual iris/pupil');
  if(id==='compound-eye'){assert.deepEqual(working.alpha,open.alpha,'no invented lid closes a compound organ');assert.ok(working.indices.some((tone,i)=>working.alpha[i]&&tone>=6),'lenses remain visible during physiological squint');}
  const palette={skin:native.regions[0].colors.map(([r,g,b])=>[Math.round(r*.65),Math.round(g*.7),Math.round(b*.75)])},plain=recolorIndexedFrame(asset,open.key),tinted=recolorIndexedFrame(asset,open.key,palette);
  for(let i=0;i<open.alpha.length;i++){assert.equal(plain[i*4+3],tinted[i*4+3]);if(open.indices[i]>=5)assert.deepEqual(plain.slice(i*4,i*4+4),tinted.slice(i*4,i*4+4),'optics/keratin preserve their protected material');}
  frames+=2;
 }
 if(id==='beak-mouth'){
  const at=Math.floor(16.2*resolution/32)*resolution+Math.floor(18*resolution/32),rest=asset.frames.find(f=>f.facing===2&&f.index===0),work=asset.frames.find(f=>f.facing===2&&f.index===1);assert.notEqual(rest.indices[at],work.indices[at],'feeding exposes the bill gap at the same local contact');
 }
 // Existing drawPart must actually hand the funded/open or blink index through.
 const surfaces=[],createCanvas=()=>({width:0,height:0,getContext(){return{createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(image){surfaces.push(image.data.slice())}}}}),art=prepareIndexedPartRenderer(asset,{createCanvas});
 const c={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(){}};
 for(const index of [0,1])drawPart(c,id,{s:2,fx:1,fy:0,perp:{x:0,y:1},...(id.includes('eye')?{eye:{x:1,y:2}}:{mouth:{x:1,y:2}}),authoredFacing:2,authoredFrameIndex:index,authoredParts:{[id]:art}});
 assert.ok(surfaces.length>=2);assert.notDeepEqual(surfaces[0],surfaces[1],'the actual prepared native surfaces differ');
}
console.log('Detailed faces PASS: '+frames+' native facial frames, real mouth opening/simple-eye closure, retained compound lenses, eight directions, exact palettes/pivots/scale/timing, protected tissue and actual draw handoff.');
