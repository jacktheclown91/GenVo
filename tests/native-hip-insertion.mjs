import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
const source=JSON.parse(fs.readFileSync('assets/art/parts/walking-leg.indexed.json'));
assert.deepEqual(source.rig.hipSurface.anchor,source.rig.upper.start);
for(const hipSurface of [null,{rect:[0,16,10,14],anchor:[4,24]},{rect:[0,1,10,14],anchor:[5,8]},{rect:[0,1,0,14],anchor:[4,8]},{rect:[0,1,10,14],anchor:[Infinity,8]}]){
 const bad=structuredClone(source);bad.rig.hipSurface=hipSurface;await assert.rejects(()=>compileIndexedPart(bad),/hip surface/);
}
// The two generated states change only the intended toe region, not the skeleton or calf.
for(let facing=0;facing<8;facing++){
 const a=recolorIndexedFrame(source,`idle:${facing}:0`),b=recolorIndexedFrame(source,`idle:${facing}:1`);let changed=0;
 for(let i=0;i<1024;i++)if(a.slice(i*4,i*4+4).some((v,k)=>v!==b[i*4+k])){changed++;assert.ok(i%32>=26&&i/32>=16,'Toe edit changed thigh/calf paint')}
 assert.ok(changed>0,'Lifted state must contain actual toe articulation');
}
let allocations=0;const renderer=prepareIndexedPartRenderer(source,{createCanvas(){allocations++;return{getContext(){return{createImageData(){return{data:new Uint8ClampedArray(4096)}},putImageData(){}}}}}});
const pigment=[[9,22,25],[25,49,60],[65,99,110],[130,173,185],[219,232,221]];
let cases=0;
for(let facing=0;facing<8;facing++)for(const frameIndex of [0,1])for(const bend of [-3,.1,4])for(const tint of [null,pigment]){
 const root={x:1.3,y:-2.1},knee={x:3.2,y:bend},foot={x:3.3,y:bend+.1},before=JSON.stringify({root,knee,foot});
 const calls=[],translations=[],scales=[],ctx={save(){},restore(){},rotate(){},translate(...v){translations.push(v)},scale(...v){scales.push(v)},drawImage(...v){calls.push(v)}};
 assert.ok(renderer.drawLimb(ctx,{root,knee,foot,facing,frameIndex,scale:2,pigment:tint}));
 assert.equal(calls.length,4);assert.deepEqual(translations,[Object.values(root),Object.values(knee),Object.values(root),Object.values(knee)]);
 assert.deepEqual(calls[2].slice(1,5),source.rig.hipSurface.rect);assert.deepEqual(calls[3].slice(1,5),source.rig.jointSurface.rect);
 assert.equal(calls[0][0],calls[2][0]);assert.equal(calls[0][0],calls[3][0],'One current frame/pigment owns both joints');
 for(const insertion of scales.slice(2)){assert.equal(insertion[0],insertion[1]);assert.equal(insertion[0],scales[0][1]);}
 assert.equal(JSON.stringify({root,knee,foot}),before);
 const count=allocations;renderer.drawLimb(ctx,{root,knee,foot,facing,frameIndex,scale:2,pigment:tint});assert.equal(allocations,count,'Repeat projection must reuse prepared paint');cases++;
}
console.log(`${cases} native hip/knee/pigment/facing cases, invalid anchors rejected, stable generated calf and toe-only flex PASS`);
