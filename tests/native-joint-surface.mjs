import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
let allocations=0;const asset=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/walking-leg.indexed.json',import.meta.url)));const prepared=prepareIndexedPartRenderer(asset,{createCanvas(){allocations++;return{getContext(){return{createImageData(){return{data:new Uint8ClampedArray(4096)}},putImageData(){}}}}}});
const scales=[],ctx=Object.fromEntries(['save','restore','translate','rotate','drawImage'].map(n=>[n,()=>{}]));ctx.scale=(x,y)=>scales.push({x,y});
for(const facing of [0,1,2,3,4,5,6,7])for(const length of [.1,.5,2,5]){
 scales.length=0;const root={x:0,y:0},knee={x:5,y:1},foot={x:5+length,y:1},before=JSON.stringify({root,knee,foot});assert.equal(prepared.drawLimb(ctx,{root,knee,foot,scale:2,facing}),true);assert.equal(scales.length,3);assert.equal(scales[2].x,scales[2].y,'native joint insertion is isotropic');assert.equal(scales[2].x,scales[0].y,'insertion shares both bone tissue widths');assert.equal(scales[0].y,scales[1].y,'short projected shin retains joint tissue width');assert.ok(scales.every(s=>s.x>0&&s.y>0));assert.equal(JSON.stringify({root,knee,foot}),before);
}
assert.equal(allocations,asset.frames.length,'no drawing allocations');console.log('Native flexed-limb shared tissue width across eight facings, immutable contacts and allocation-free drawing PASS');
