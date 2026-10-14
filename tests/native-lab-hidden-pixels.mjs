import assert from 'node:assert/strict';
import {preserveInvisibleRgb} from '../tools/creature-lab/native-frame-preservation.js';
const old=new Uint8Array(4096),canvas=new Uint8Array(4096);
for(let i=0;i<4096;i+=4){old.set([23,43,48,0],i);canvas.set([0,0,0,0],i)}
old.set([247,236,207,255],12);canvas.set([200,110,70,255],12);
old.set([157,195,170,255],20);canvas.set([0,0,0,0],20);
const fixed=preserveInvisibleRgb(canvas,old,[23,43,48]);
assert.deepEqual(fixed.slice(0,4),[23,43,48,0]);
assert.deepEqual(fixed.slice(12,16),[200,110,70,255]);
assert.deepEqual(fixed.slice(20,24),[157,195,170,0]);
const transparent=preserveInvisibleRgb(canvas,null,[23,43,48]);
assert.deepEqual(transparent.slice(0,4),[23,43,48,0]);
assert.throws(()=>preserveInvisibleRgb(new Uint8Array(4000)),/32×32/);
console.log('native-lab-hidden-pixels: edit, erased pixel, and transparent-source RGB recovery PASS');
