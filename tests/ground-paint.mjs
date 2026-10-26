import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {groundPaintHash,groundGrainSample,groundMicroSample} from '../src/render/ground-paint.js';
const require=createRequire(import.meta.url),prototype=require('../tools/ground-paint-prototype.cjs');
assert.equal(prototype.groundGrainSample,groundGrainSample,'Review tool must reuse the installed paint authority');
const world=Object.freeze({seedHash:13,regionOrigin:Object.freeze({x:128,y:-128})}),adjacent=Object.freeze({seedHash:13,regionOrigin:Object.freeze({x:0,y:0})}),xs=new Set(),ys=new Set();let lights=0;
for(let y=-32;y<32;y++)for(let x=-32;x<32;x++)for(let k=0;k<14;k++){
 const g=groundGrainSample(world,x,y,k);assert.deepEqual(g,groundGrainSample(adjacent,x+128,y-128,k));
 assert.ok(g.x>=0&&g.x<32&&g.y>=0&&g.y<32);xs.add(g.x);ys.add(g.y);lights+=g.light?1:0;
 const m=groundMicroSample(world,x,y,k%2);assert.deepEqual(m,groundMicroSample(adjacent,x+128,y-128,k%2));assert.ok(m.x>=2&&m.x<=13&&m.y>=2&&m.y<=13);
 assert.ok(groundPaintHash(x,y,k)>=0&&groundPaintHash(x,y,k)<1);
}
assert.equal(xs.size,32);assert.equal(ys.size,32);assert.ok(lights>0);
const before=fs.readFileSync(new URL('../docs/art/ground-paint-variation-v1-handoff/before/renderer.js',import.meta.url),'utf8'),installed=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8'),generated=prototype.prototypeRenderer(before),tail='\n'+[groundPaintHash,groundGrainSample,groundMicroSample].map(fn=>fn.toString()).join('\n');
assert.ok(generated.endsWith(tail));assert.equal(installed,"import {groundGrainSample,groundMicroSample} from './ground-paint.js';\n"+generated.slice(0,-tail.length),'Installed renderer must match the inspected HTTP prototype exactly');
assert.equal(installed.match(/^function hash2\([^\n]+/m)[0],before.match(/^function hash2\([^\n]+/m)[0],'Other renderer hash consumers remain unchanged');
console.log('Ground paint PASS: full-cell distribution, immutable inputs, absolute regional identity/negative coordinates, bounded microdetail, single model authority and exact installed/prototype source parity.');
