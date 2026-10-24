import assert from 'node:assert/strict';
import {waterRippleTile,drawWaterSurfaceMarks} from '../src/render/water-surface-art.js';
import {SURFACE_ICE} from '../src/world/surface-ice.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
import {buildVisualWaterMask} from '../src/render/landform.js';
const full=new Uint8Array(1024).fill(1);full.full=true;full.empty=false;
const empty=new Uint8Array(1024);empty.empty=true;empty.full=false;
const w={n:128,seedHash:83173,regionOrigin:{x:0,y:0},idx(x,y){return Math.floor(y)*128+Math.floor(x)}};
let crossings=0;const placements=new Set();
for(let y=0;y<20;y++)for(let x=0;x<20;x++){
 const marks=waterRippleTile(w,x,y,full),other=waterRippleTile(w,x+1,y,full);assert.equal(waterRippleTile(w,x,y,full),marks,'immutable prepared geometry is reused');assert.ok(Object.isFrozen(marks));placements.add(JSON.stringify(marks.map(m=>m.rects)));
 for(const m of marks)for(const [rx,ry,width,h]of m.rects){assert.ok(rx>=0&&ry>=0&&rx+width<=16&&ry+h<=16&&width>0&&h===.5);for(const n of other)if(n.id===m.id){assert.equal(n.phase,m.phase,'same crossing crest keeps its temporal phase');for(const [nx,ny]of n.rects)if(rx+width===16&&nx===0&&ny===ry)crossings++}}
}
assert.ok(crossings>5,'multiple actual crests join across tile boundaries');assert.ok(placements.size>60,'water no longer stamps one placement in every cell');
const right={...w,regionOrigin:{x:128,y:-128}};assert.deepEqual(waterRippleTile(w,132,-123,full),waterRippleTile(right,4,5,full),'identical absolute location has identical ink under another region owner');
const half=full.slice();half.full=false;half.empty=false;for(let y=0;y<32;y++)for(let x=0;x<32;x++)if((x+y)%3===0)half[y*32+x]=0;
for(let y=0;y<15;y++)for(let x=0;x<15;x++)for(const m of waterRippleTile(w,x,y,half))for(const [rx,ry,width]of m.rects)for(let k=rx*2;k<(rx+width)*2;k++)assert.equal(half[ry*2*32+k],1,'no crest ink outside its unchanged water mask');
assert.deepEqual(waterRippleTile(w,0,0,empty),[]);
function recorder(){return{globalAlpha:.7,fillStyle:'original',ops:[],stack:[],save(){this.stack.push([this.globalAlpha,this.fillStyle])},restore(){[this.globalAlpha,this.fillStyle]=this.stack.pop()},fillRect(...a){this.ops.push([...a,this.globalAlpha])}}}
let tile;for(let y=0;y<20&&!tile;y++)for(let x=0;x<20&&!tile;x++)if(waterRippleTile(w,x,y,full).length)tile={x,y};assert.ok(tile);
const draw=(world=w,time=2)=>{const c=recorder();drawWaterSurfaceMarks(c,{world,...tile,mask:full,px:0,py:0,u:2,seconds:time});assert.equal(c.globalAlpha,.7);assert.equal(c.fillStyle,'original');assert.ok(c.ops.every(op=>op[4]>=0&&op[4]<=.7*.25+1e-10));return c.ops};assert.deepEqual(draw(),draw(),'paused clock repeats exactly');assert.notDeepEqual(draw(w,2),draw(w,3),'existing clock changes only shimmer intensity');
const environment={icePolicy:SURFACE_ICE.policy,ice:new Float64Array(128*128),iceBroken:new Uint8Array(128*128)};environment.ice[w.idx(tile.x,tile.y)]=.1;assert.deepEqual(draw({...w,environment}),[],'coherent actual ice suppresses liquid shimmer');environment.iceBroken[w.idx(tile.x,tile.y)]=1;assert.ok(draw({...w,environment}).length,'canonical broken ice exposes water again');
const sim=new Simulation('WATER-SURFACE-STATE'),snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'water-art'}))),before=snap();for(let y=0;y<sim.world.n;y+=7)for(let x=0;x<sim.world.n;x+=7)drawWaterSurfaceMarks(recorder(),{world:sim.world,x,y,mask:buildVisualWaterMask(sim.world,x,y),px:0,py:0,u:2,seconds:4});assert.equal(snap(),before,'complete saved state and RNG unchanged');
console.log('Water surface art PASS: cross-tile crests, absolute coordinates, native mask clipping, nonrepeated placement, pause-stable clock, actual ice, canvas restoration and full saved-state parity.');
