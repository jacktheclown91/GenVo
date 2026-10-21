import assert from 'node:assert/strict';
import {CAVES} from '../src/world/cave-policy.js';
import {caveTileData,caveNeighborOpen,openPassage,caveArtwork} from '../src/render/cave-surface.js';

const n=8,len=n*n,idx=(x,y)=>y*n+x;
const world={n,len,seedHash:517,regionOrigin:{x:0,y:0},water:new Uint8Array(len),
 moisture:new Float32Array(len).fill(.62),terrain:{elevation:new Float32Array(len).fill(.36)},
 plants:{woodspire:new Float32Array(len)},
 subsurface:{revision:0,passages:new Map()}};
const put=(x,y,origin=CAVES.policy)=>{const p={i:idx(x,y),entry:false,closed:false,floor:6,void:.04,origin};world.subsurface.passages.set(p.i,p);return p};
const p=put(3,3),east=put(4,3),south=put(3,4);
assert.equal(openPassage(world,3,3),p,'only true physical passage returns as open');
assert.equal(openPassage(world,2,2),false,'solid geology remains impassable');
assert.equal(caveNeighborOpen(world,p,1,0),true);
assert.equal(caveNeighborOpen(world,p,0,1),true);
assert.equal(caveNeighborOpen(world,p,-1,0),false);
const natural=caveTileData(world,p);
assert.deepEqual(natural.neighbors,[false,true,true,false]);
assert.equal(natural.pixels.length,32*32*4);
assert.ok(natural.floorPixels>natural.wallPixels,'wide connected cave is dominated by walkable floor');
assert.ok(natural.wallPixels>0,'solid-side walls are present');
const repeat=caveTileData(world,p);
assert.deepEqual(repeat.pixels,natural.pixels,'geological art uses deterministic hashes, no biological RNG');
const sample=(array,x,y)=>[...array.pixels.slice((y*32+x)*4,(y*32+x)*4+3)];
const match=caveTileData(world,east);
assert.notDeepEqual(sample(natural,2,16),sample(natural,31,16),'boundary rock and opening floor differ');
assert.equal(natural.neighbors[1],true);
assert.equal(match.neighbors[3],true,'adjacent real passages have continuous open visual seam');
east.floor+=2;assert.equal(caveNeighborOpen(world,p,1,0),false,'a vertical gap is not painted as connected');
east.floor=6;
const dug=put(3,3,undefined);delete dug.origin;
assert.equal(caveTileData(world,dug).natural,false,'excavated earth has a different art identity from limestone');
assert.notDeepEqual(caveTileData(world,dug).pixels,natural.pixels,'burrows do not masquerade as natural caverns');
world.subsurface.passages.set(p.i,p);
world.water[p.i]=1;
const flooded=caveTileData(world,p);
assert.equal(flooded.wet,true);assert.notDeepEqual(flooded.pixels,natural.pixels,'water art requires actual world water');
world.water[p.i]=0;
p.closed=true;assert.equal(openPassage(world,3,3),false);
assert.throws(()=>caveTileData(world,p),/real open passage/);
p.closed=false;
const priorDocument=globalThis.document;
let creates=0;
globalThis.document={createElement:()=>{
 creates++;
 const image={data:new Uint8ClampedArray(32*32*4)};
 return{width:0,height:0,getContext:()=>({createImageData:()=>image,putImageData:()=>{}})};
}};
try{
 const renderer={sim:{world}},first=caveArtwork(renderer,p);
 assert.ok(first);
 assert.equal(caveArtwork(renderer,p),first,'unchanged bedrock tiles are cached');
 assert.equal(creates,1);
 world.subsurface.revision++;
 assert.notEqual(caveArtwork(renderer,p),first,'physical erosion or excavation invalidates imagery');
 assert.equal(creates,2);
}finally{globalThis.document=priorDocument}
console.log('Natural subterranean art PASS: canonical voids, seamless connected boundaries, distinct burrows, physical water, deterministic pixels and revision-safe cache.');
