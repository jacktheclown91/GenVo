import assert from 'node:assert/strict';
import {drawNestArt,drawEggArt} from '../src/render/clutch-art.js';
const calls=[],ctx={set fillStyle(v){this.color=v},fillRect(...r){assert.ok(r.every(Number.isFinite));assert.ok(r[2]>0&&r[3]>0);calls.push([this.color,...r])}};
const paint=(fn,record)=>{calls.length=0;const before=JSON.stringify(record);fn(ctx,Object.freeze(record),{scale:2});assert.equal(JSON.stringify(record),before);for(const [,x,y,w,h] of calls){assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(x>=-16&&y>=-16&&x+w<=16&&y+h<=16)}return JSON.stringify(calls)};
const materialImages=new Set();
for(const material of ['marshroot','sunmoss','thistlepod','bramble','rotcap','woodspire']){
 const intact=paint(drawNestArt,{material,integrity:1});materialImages.add(intact);
 assert.notEqual(paint(drawNestArt,{material,integrity:.2}),intact);
 assert.equal(paint(drawNestArt,{material,integrity:0}),'[]');
}
assert.equal(materialImages.size,6,'actual materials have distinct native artwork');
const shell=paint(drawEggArt,{condition:1});
assert.notEqual(paint(drawEggArt,{condition:.2}),shell);
assert.equal(paint(drawEggArt,{condition:1,incubationDays:1,species:'invented'}),shell,'no invented imminent-hatch or species shell trait');
assert.equal(paint(drawEggArt,{condition:1,nestId:4}),shell,'egg painter never manufactures a nest');
assert.equal(paint(drawEggArt,{condition:1,incubationDays:8}),shell);
console.log('Clutch art PASS: immutable records, finite native bounds, six actual materials, integrity and condition distinction; no fabricated nesting or hatching state. Authored painter fixtures only.');
