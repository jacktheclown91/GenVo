import assert from 'node:assert/strict';
import fs from 'node:fs';
import {floraVisualAnchor} from '../src/render/flora.js';

const source=fs.readFileSync(new URL('../src/render/flora.js',import.meta.url),'utf8'),before=fs.readFileSync(new URL('../docs/art/flora-variation-v1-handoff/before/flora.js',import.meta.url),'utf8'),hash=s=>Function('return ('+s.match(/^function hash2\([^\n]+/m)[0]+')')(),oldHash=hash(before),newHash=hash(source),turns=new Set(),oldTurns=new Set();
let min=1,max=0;
for(let y=-64;y<64;y++)for(let x=-64;x<64;x++){
 const value=newHash(x,y,17);min=Math.min(min,value);max=Math.max(max,value);turns.add(Math.floor(value*4));oldTurns.add(Math.floor(oldHash(x,y,17)*4));
 for(const shape of ['tuft','shrub','reed','fungus','pod','tree','bulb','sage','lichen','snowberry']){
  const a=floraVisualAnchor(shape,x,y),b=floraVisualAnchor(shape,x,y);assert.deepEqual(a,b);
  assert.ok(a.x>=.5&&a.x<=15.5&&a.y>=.5&&a.y<=15.5,shape+' target escaped its real resource cell');
  assert.equal(a.cx+a.jx,a.x);assert.equal(a.cy+a.jy,a.y);
 }
}
assert.deepEqual([...oldTurns].sort(),[0,1],'Retained baseline demonstrates missing orientations');
assert.deepEqual([...turns].sort(),[0,1,2,3]);assert.ok(min<.01&&max>.99);
for(const offset of [[-1,0],[1,0],[0,-1],[0,1]]){const a=floraVisualAnchor('reed',0,0,(x,y)=>x===offset[0]&&y===offset[1]);assert.ok(a.x>=.5&&a.x<=15.5&&a.y>=.5&&a.y<=15.5,'Shore target must stay in its actual cell')}
console.log('Flora variation PASS: baseline half-range regression, four deterministic rotations, full-range unsigned paint hash, negative coordinates, ten plant anchors and shore ownership.');
