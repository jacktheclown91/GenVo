import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileIndexedPart} from '../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
const path=new URL('../assets/art/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',path)));
const T=['small-torso','soft-torso','reinforced-torso','sleek-torso','light-torso','stout-torso','barrel-torso','dome-torso','long-torso'];
const L=['walking-leg','spring-leg','grasper','runner-leg','sturdy-leg','webbed-leg','padded-leg','digging-forelimb'];
let segments=0;
for(const id of [...T,...L]){
 const entry=catalog.parts.find(p=>p.partId===id);assert.ok(entry,'unregistered art '+id);
 const source=JSON.parse(fs.readFileSync(new URL(entry.path,path)));
 const indexed=JSON.parse(fs.readFileSync(new URL(entry.indexed,path)));
 assert.equal(indexed.rig?.kind,T.includes(id)?'torso':'two-bone');
 assert.deepEqual(indexed.rig,source.rig);
 assert.equal(indexed.frames.length,16);
 for(const facing of Array.from({length:8},(_,i)=>i))assert.ok(indexed.frames.some(f=>f.facing===facing));
 const context={createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(){}};
 const renderer=prepareIndexedPartRenderer(indexed,{createCanvas:()=>({getContext:()=>context})});
 const calls=[];
 const ctx={imageSmoothingEnabled:false,save(){calls.push('save')},restore(){calls.push('restore')},translate(x,y){assert.ok(Number.isFinite(x+y));calls.push('translate')},scale(x,y){assert.ok(x>0&&y>0);calls.push('scale')},rotate(x){assert.ok(Number.isFinite(x))},drawImage(...args){calls.push('drawImage');assert.ok(args.length===3||args.length===9)}};
 if(T.includes(id)){
  assert.equal(renderer.drawTorso(ctx,{x:0,y:0,width:20,height:13,facing:2}),true);
  assert.equal(calls.filter(c=>c==='drawImage').length,1);
  assert.equal(renderer.drawLimb(ctx,{root:{x:0,y:0},knee:{x:2,y:2},foot:{x:4,y:3}}),false);
 }else{
  assert.equal(renderer.drawLimb(ctx,{root:{x:0,y:0},knee:{x:7,y:-3},foot:{x:11,y:6},facing:5}),true);
  assert.equal(calls.filter(c=>c==='drawImage').length,3,'Two bones plus one native knee surface');
  assert.equal(renderer.drawTorso(ctx,{width:8,height:8}),false);
  segments+=2;
 }
 assert.equal(calls.filter(c=>c==='save').length,calls.filter(c=>c==='restore').length);
 const broken=structuredClone(indexed);broken.rig=T.includes(id)?{kind:'torso',bodyBoundsPx:[0,21]}:{...broken.rig,lower:{...broken.rig.lower,rect:[30,0,10,10]}};
 await assert.rejects(()=>compileIndexedPart(broken),/invalid torso native bounds|invalid limb section rectangle/);
}
assert.equal(segments,16);
console.log('native-anatomy-rig: 9 body silhouettes + 8 two-bone limbs / 16 bone transforms + 8 native knee surfaces, negative rig validation PASS');
