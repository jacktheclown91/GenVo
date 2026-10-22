import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {surfaceIceArt} from '../assets/art/environment/surface-ice.js';
import {surfaceIceTileData,drawSurfaceIce} from '../src/render/surface-ice.js';
import {SURFACE_ICE} from '../src/world/surface-ice.js';
const master=fs.readFileSync(new URL('../assets/art/production-review/ice-surfaces-v1/ice-master.png',import.meta.url));
assert.equal(createHash('sha256').update(master).digest('hex'),surfaceIceArt.sourceSha256);
assert.equal(surfaceIceArt.width,32);assert.equal(surfaceIceArt.height,32);assert.equal(surfaceIceArt.frames.length,4);
assert.equal(new Set(surfaceIceArt.frames.map(f=>JSON.stringify(f))).size,4);
for(const frame of surfaceIceArt.frames){assert.equal(frame.length,1024);assert.ok(frame.every(v=>Number.isInteger(v)&&v>=0&&v<4))}
for(const broken of [false,true])for(const strong of [false,true])for(let variant=0;variant<4;variant++){
 const pixels=surfaceIceTileData({broken,strong,variant});assert.equal(pixels.length,4096);
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const oldCoverage=!broken||y<5||x<5||x>=27||y>=27;
  assert.equal(pixels[(y*32+x)*4+3],oldCoverage?255:0,'Exact physical hole coverage must survive every art variant');
 }
}
assert.notDeepEqual(surfaceIceTileData({strong:true}),surfaceIceTileData({strong:false}),'thin and supporting sheets need distinct paint');
const priorDocument=globalThis.document;let allocations=0,draws=0;
globalThis.document={createElement(){allocations++;return{getContext(){return{createImageData(){return{data:new Uint8ClampedArray(4096)}},putImageData(){}}}}}};
try{
 const world={n:2,water:new Uint8Array([1,0,1,1]),environment:{icePolicy:SURFACE_ICE.policy,ice:new Float64Array([.12,0,.001,.04]),iceBroken:new Uint8Array([1,0,0,0])},idx(x,y){return y*2+x}},before=structuredClone({water:world.water,environment:world.environment});
 const c={globalAlpha:1,save(){},restore(){},fillRect(){},drawImage(){draws++}},renderer={sim:{world},ctx:c,camera:{x:0,y:0},w:800,h:600};
 for(let i=0;i<100;i++)assert.equal(drawSurfaceIce(renderer,{tile:32,startX:0,startY:0,cols:2,rows:2}),2);
 assert.equal(draws,200);assert.equal(allocations,2,'Repeating the same physical states must reuse native textures');
 assert.deepEqual({water:world.water,environment:world.environment},before,'Surface art cannot change water, frozen stocks or fractures');
 world.environment.icePolicy=undefined;const calls=draws;assert.equal(drawSurfaceIce(renderer,{tile:32,startX:0,startY:0,cols:2,rows:2}),0);assert.equal(draws,calls,'Historical missing policy cannot acquire ice paint');
}finally{globalThis.document=priorDocument}
console.log('Native ice art PASS: preserved master, distinct native32 paint, exact intact/broken masks, physical wet-cell eligibility, no state writes and bounded cache reuse.');
