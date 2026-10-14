import assert from 'node:assert/strict';
import {compileSourceRgbaPart,indexSourceRgbaFrame,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const regions=[{id:'skin',colors:[[10,20,30],[80,100,120],[200,210,220]]},{id:'eye',protected:true,colors:[[0,0,0],[255,255,255]]}];
const colors=regions.flatMap(r=>r.colors),frames=[];
for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
 const rgba=[];for(let pixel=0;pixel<1024;pixel++)rgba.push(...colors[(pixel+index+facing)%colors.length],[0,128,255][pixel%3]);
 frames.push({state:'idle',facing,index,durationMs:80+index*40,rgba});
}
const spec={partId:'stalk-eye',version:1,rootAnchorPx:[29,28],regions,frames},before=structuredClone(spec),asset=await compileSourceRgbaPart(spec);
for(let i=0;i<frames.length;i++)assert.deepEqual(Array.from(recolorIndexedFrame(asset,asset.frames[i].key)),frames[i].rgba,'source RGBA round trip includes transparent RGB and partial alpha');
assert.deepEqual(spec,before);frames[0].rgba[0]=99;assert.notEqual(recolorIndexedFrame(asset,'idle:0:0')[0],99);
const shared=[{id:'skin',colors:[[0,0,0],[80,100,120]]},{id:'eye',protected:true,colors:[[0,0,0]]}],black={state:'idle',facing:0,index:0,durationMs:100,rgba:Array.from({length:1024},()=>[0,0,0,255]).flat()};
assert.throws(()=>indexSourceRgbaFrame(black,shared),/ambiguous/);
const explicit={...black,regionIds:Array.from({length:1024},(_,i)=>i%2?'eye':'skin')};
const indexed=indexSourceRgbaFrame(explicit,shared);assert.equal(indexed.indices[0],0);assert.equal(indexed.indices[1],2);
const mapped=await compileSourceRgbaPart({...spec,regions:shared,frames:[explicit]});
const changed=recolorIndexedFrame(mapped,'idle:0:0',{skin:[[10,20,30],[100,120,140]]});assert.deepEqual(Array.from(changed.slice(0,8)),[10,20,30,255,0,0,0,255]);
assert.throws(()=>indexSourceRgbaFrame({...black,rgba:[1,2,3,0,...black.rgba.slice(4)]},shared),/unmapped/,'transparent colors must not silently disappear');
assert.throws(()=>indexSourceRgbaFrame({...explicit,regionIds:['skin']},shared),/assignments/);
assert.throws(()=>indexSourceRgbaFrame({...explicit,regionIds:Array(1024).fill('missing')},shared),/unknown pixel/);
assert.throws(()=>indexSourceRgbaFrame({...black,rgba:black.rgba.slice(1)},shared),/RGBA/);
assert.throws(()=>indexSourceRgbaFrame({...black,rgba:Array(4096).fill(NaN)},shared),/RGBA/);
console.log('source RGBA ingestion: sixteen-frame exact round trip, transparent detail, explicit shared pigments, protected substitution and fail-closed mapping PASS');
