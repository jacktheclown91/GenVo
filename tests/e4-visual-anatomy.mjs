import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PARTS} from '../src/lineage/part-registry.js';
import {PART_SPRITES,hasComponent,drawPartAlone} from '../src/render/part-sprites.js';
import {LEG_GAIT,LEG_REACH} from '../src/render/creature-assembler.js';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {bodyPlanFromLegacy,validatePlan} from '../src/lineage/body-plan.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';

const ids=['filament-tuft','fur-mantle','feather-mantle','proto-wing','climber-leg','hook-pad'];
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/art/catalog.json',import.meta.url),'utf8'));
assert.equal(catalog.parts.length,Object.keys(PARTS).length,'native catalog covers every real registered part');
for(const id of ids)assert.ok(PART_SPRITES[id]&&hasComponent(id),id+' has guaranteed procedural fallback');
assert.equal(LEG_GAIT['climber-leg'].stride<LEG_GAIT['walking-leg'].stride,true,'climber legs have specific stance');
assert.ok(LEG_REACH['climber-leg']<LEG_REACH['walking-leg'],'gripping limbs have short grounded reach');

const tints={body:'#7aa8e8',shade:'#3d5e9a',light:'#cfe3ff'};
const seen=new Map();
for(const id of ids){
 const def=PARTS[id],type=def.compatibleSocketTypes[0],rects=[];
 let color='#000',ctx={
  set fillStyle(v){color=v},get fillStyle(){return color},
  fillRect(x,y,w,h){rects.push([Math.round(x*100)/100,Math.round(y*100)/100,w,h,color])},
  save(){},restore(){},translate(){},scale(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},ellipse(){},arc(){},closePath(){}
 };
 drawPartAlone(ctx,id,{type,s:4,p:tints});
 assert.ok(rects.length>=3,id+' standalone editor fallback is an actual detailed drawing');
 seen.set(id,JSON.stringify(rects));
 const entry=catalog.parts.find(e=>e.partId===id);
 assert.ok(entry,id+' has native 32px source, compiled and preview assets');
 const srcBuf=fs.readFileSync(new URL('../assets/art/'+entry.path.slice(2),import.meta.url));
 assert.equal(crypto.createHash('sha256').update(srcBuf).digest('hex'),entry.checksumSha256,'authored source is hash locked: '+id);
 const src=JSON.parse(srcBuf);
 assert.equal(src.width,32);assert.equal(src.height,32);assert.equal(src.frames.length,16,'eight facings and two states');
 assert.deepEqual(src.rootAnchorPx,[16,16]);
 const native=JSON.parse(fs.readFileSync(new URL('../assets/art/'+entry.indexed.slice(2),import.meta.url)));
 const rebuild=await compileSourceRgbaPart({...src,frames:src.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
 assert.equal(native.checksum,rebuild.checksum,id+' compiled hash matches source');
 assert.equal(native.checksum,entry.compiledChecksum,id+' manifest identity matches compiled biology-independent art');
 const images=[];
 for(let dir=0;dir<8;dir++){
  const frames=[];
  for(let i=0;i<2;i++){
   const frame=src.frames.find(f=>f.facing===dir&&f.index===i);
   assert.ok(frame,id+' missing facing/frame');
   const out=Buffer.from(recolorIndexedFrame(native,`idle:${dir}:${i}`));
   assert.deepEqual(out,Buffer.from(frame.rgbaBase64,'base64'),id+' preserved original source RGBA');
   assert.ok(out.some((v,k)=>k%4===3&&v>0),id+' empty frame');
   frames.push(crypto.createHash('sha256').update(out).digest('hex'));
  }
  assert.notEqual(frames[0],frames[1],id+' animation must not be an inert two-frame duplicate');
  images.push(frames[0]);
 }
 assert.ok(new Set(images).size>=4,id+' has genuine multi-directional silhouettes');
 const png=fs.readFileSync(new URL('../assets/art/'+entry.png.slice(2),import.meta.url));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','native thumbnail is a real PNG');
}
assert.equal(new Set(seen.values()).size,6,'all six procedural fallback silhouettes are distinct');
const draft=createDraft({base:bodyPlanFromLegacy({adaptations:[]}),budget:20,ancestry:['filament-tuft','feather-mantle','grasper','grip-pad']});
assert.equal(place(draft,'proto-wing','root','dorsal').ok,true);
assert.ok(validatePlan(draft.plan).ok,'native proto-wing art attaches to a real valid body');
assert.ok(!PARTS['proto-wing'].actionCapabilities.includes('fly'),'drawn wings still grant no flight');
console.log('E4 six evolved native 32x32 packs: original RGBA exact, eight facings, moving frames, distinct editor art, correct biological sockets, no flight PASS');
