import assert from 'node:assert/strict';
import {habitatGroundArt} from '../assets/art/environment/overhead-habitats.js';
import {habitatGroundFrame,drawHabitatGround} from '../src/render/habitat-ground.js';
assert.equal(habitatGroundArt.frames.length,4);
assert.equal(new Set(habitatGroundArt.frames.map(f=>JSON.stringify(f))).size,4);
for(const f of habitatGroundArt.frames){assert.equal(f.length,1024);assert.ok(f.every(p=>Number.isInteger(p)&&p>=0&&p<habitatGroundArt.palette.length));assert.ok(f.filter(p=>p>0).length>100);for(let i=0;i<32;i++){assert.equal(f[i],0);assert.equal(f[31*32+i],0);assert.equal(f[i*32],0);assert.equal(f[i*32+31],0)}}
assert.equal(habitatGroundFrame('watering-margin'),0);assert.equal(habitatGroundFrame('berry-grove'),1);assert.equal(habitatGroundFrame('mushroom-hollow'),2);assert.equal(habitatGroundFrame('game-trail'),3);assert.equal(habitatGroundFrame('water'),null);
let alloc=0;const previous=globalThis.document;
globalThis.document={createElement(){alloc++;return{getContext(){return{createImageData(){return{data:new Uint8ClampedArray(4096)}},putImageData(){},getImageData(){throw Error('Ground paint cannot read back GPU pixels')}}}}}};
try{const calls=[],ctx={globalAlpha:1,save(){},restore(){},translate(){},rotate(){},drawImage(...a){calls.push(a)}};
 for(const kind of ['watering-margin','thicket-pocket','fungal-hollow','open-clearing'])for(const season of ['SPRING','SUMMER','AUTUMN','WINTER'])assert.equal(drawHabitatGround(ctx,{kind,px:0,py:0,u:2,season}),true);
 assert.equal(alloc,16);for(let i=0;i<100;i++)drawHabitatGround(ctx,{kind:'watering-margin',px:0,py:0,u:2});assert.equal(alloc,16,'Repeated projection reuses prepared native ground');
 const n=calls.length;assert.equal(drawHabitatGround(ctx,{kind:'water',px:0,py:0,u:2}),false);assert.equal(calls.length,n);
}finally{globalThis.document=previous}
console.log('Four distinct bounded native substrates, habitat mapping, seasonal cache reuse and zero GPU readback PASS');
