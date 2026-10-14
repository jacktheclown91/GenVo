import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
const ids=['walking-leg','spring-leg','grasper','runner-leg','sturdy-leg','webbed-leg','padded-leg','digging-forelimb'];
let count=0;
for(const id of ids){
 const file=new URL(`../assets/art/parts/${id}.json`,import.meta.url),raw=JSON.parse(fs.readFileSync(file));
 assert.equal(raw.width,32);assert.equal(raw.height,32);
 assert.equal(raw.rig.kind,'two-bone');
 const [upper,lower]=[raw.rig.upper,raw.rig.lower];
 for(const segment of [upper,lower]){
  assert.ok(segment.rect[2]>=28,`${id} source section is still an 11px scrap`);
  assert.ok(Math.hypot(segment.end[0]-segment.start[0],segment.end[1]-segment.start[1])>=22,`${id} anchor range too short`);
 }
 assert.ok(upper.rect[1]+upper.rect[3]<=lower.rect[1],`${id} sections must not overlap`);
 const f=raw.frames.find(f=>f.facing===2&&f.index===0);
 const pix=Buffer.from(f.rgbaBase64,'base64');let opaque=0, segments=[];
 for(const r of [upper.rect,lower.rect]){
  let count=0,cols=new Set(),rows=new Set(),rgb=new Set();
  for(let y=r[1];y<r[1]+r[3];y++)for(let x=r[0];x<r[0]+r[2];x++){
   const k=(y*32+x)*4;
   if(pix[k+3]){count++;cols.add(x);rows.add(y);rgb.add(`${pix[k]},${pix[k+1]},${pix[k+2]}`)}
  }
  assert.ok(count>=170,`${id} sparse limb bone ${count} pixels`);
  assert.ok(cols.size>=25,`${id} limb bone length only ${cols.size} pixels`);
  assert.ok(rows.size>=8,`${id} limb lacks usable texture height`);
  assert.ok(rgb.size>=5,`${id} not enough anatomical materials`);
  segments.push(count);opaque+=count;
 }
 assert.ok(opaque>=430,`${id} total art too sparse`);
 const compiled=await compileSourceRgbaPart({...raw,frames:raw.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
 for(const f of raw.frames){const b=recolorIndexedFrame(compiled,`idle:${f.facing}:${f.index}`);assert.ok(Buffer.from(b).equals(Buffer.from(f.rgbaBase64,'base64')));count++}
 // The dedicated anatomy sheet still follows the canonical hip/knee/foot rig.
 const context={createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(){}};
 const renderer=prepareIndexedPartRenderer(compiled,{createCanvas:()=>({getContext:()=>context})});
 const tx=[];const canvas={imageSmoothingEnabled:false,save(){},restore(){},translate(x,y){tx.push(['translate',x,y])},rotate(a){assert.ok(Number.isFinite(a))},scale(x,y){assert.ok(x>0&&y>0);tx.push(['scale',x,y])},drawImage(...args){assert.equal(args.length,9)}};
 assert.equal(renderer.drawLimb(canvas,{root:{x:10,y:10},knee:{x:25,y:8},foot:{x:36,y:18},facing:4}),true);
 assert.deepEqual(tx.filter(x=>x[0]==='translate').map(x=>x.slice(1)),[[10,10],[25,8],[25,8]],'Native joint insertion shares the actual anatomical knee');
 console.log(`${id}: ${segments.join('+')} detailed pixels; 16 exact frames`);
}
console.log(`native-limb-detail-v173: eight full-length dual-section native sheets, ${count} exact frames, rig transforms PASS`);
