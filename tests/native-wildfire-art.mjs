import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {wildfireArt as art} from '../assets/art/environment/wildfire.js';
import {fireFrameRgba,fireVisualProfile,paintNativeFire} from '../src/render/wildfire-art.js';
import {drawWildfire} from '../src/render/wildfire.js';
import {Simulation} from '../src/sim/simulation.js';
import {igniteWildfire,fireFuel,fireDryness} from '../src/ecology/wildfire.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
assert.equal(art.schema,'genvo.environment-indexed-effect/1');assert.equal(art.width,32);assert.equal(art.height,32);assert.equal(art.frames.length,4);
assert.equal(createHash('sha256').update(fs.readFileSync('assets/art/production-review/wildfire-v1/fire-master-v2.png')).digest('hex'),art.sourceSha256);
assert.equal(new Set(art.frames.map(f=>JSON.stringify(f))).size,4,'four distinct native phases retained');
for(let f=0;f<4;f++){const source=art.frames[f],rgba=fireFrameRgba(f);assert.equal(source.indices.length,1024);assert.equal(source.alpha.length,1024);assert.equal(source.durationTicks,3);let visible=0;
 for(let i=0;i<1024;i++){assert.ok(Number.isInteger(source.indices[i])&&source.indices[i]>=0&&source.indices[i]<art.palette.length);assert.deepEqual([...rgba.slice(i*4,i*4+3)],art.palette[source.indices[i]]);assert.equal(rgba[i*4+3],source.alpha[i]);if(source.alpha[i]>128)visible++}
 assert.ok(visible>100&&visible<450,'readable fire cluster must retain transparent terrain gaps');for(const i of [0,31,992,1023])assert.equal(rgba[i*4+3],0,'effect cannot paint a tile-sized badge');
}
const cell={since:20,intensity:.25},copy=structuredClone(cell);assert.equal(new Set(Array.from({length:12},(_,t)=>fireVisualProfile(cell,20+t,3).frame)).size,4);assert.deepEqual(fireVisualProfile(cell,20,3),fireVisualProfile(cell,22,3));assert.notEqual(fireVisualProfile(cell,22,3).frame,fireVisualProfile(cell,23,3).frame);assert.deepEqual(cell,copy);assert.ok(fireVisualProfile({...cell,intensity:1},20).opacity>fireVisualProfile(cell,20).opacity);
let allocations=0,draws=0;const old=globalThis.document;globalThis.document={createElement(){allocations++;return{getContext(){return{createImageData(){return{data:new Uint8ClampedArray(4096)}},putImageData(){}}}}}};
const stack=[],ctx={globalAlpha:1,imageSmoothingEnabled:true,save(){stack.push([this.globalAlpha,this.imageSmoothingEnabled])},restore(){[this.globalAlpha,this.imageSmoothingEnabled]=stack.pop()},drawImage(_canvas,x,y,w,h){draws++;assert.ok([x,y,w,h].every(Number.isFinite));assert.ok(w<=32&&h<=32)}};
try{
 for(let t=20;t<120;t++)paintNativeFire(ctx,{x:0,y:0,tile:32,profile:fireVisualProfile(cell,t)});assert.equal(allocations,4,'native cache bounded to four animation phases');assert.equal(draws,100);assert.equal(ctx.globalAlpha,1);assert.equal(ctx.imageSmoothingEnabled,true);
 const sim=new Simulation('NATIVE-FIRE-CONTRACT',{player:true}),w=sim.world,p=sim.player();for(let t=0;t<10&&!sim.climate;t++)sim.update(null);
 const i=Array.from({length:w.len},(_,i)=>i).find(i=>!w.water[i]&&fireDryness(sim,i)>=.35&&fireFuel(sim,i)>.04&&sim.canOccupy(p,i%w.n+.5,(i/w.n|0)+.5));assert.ok(Number.isInteger(i));Object.assign(p,{x:i%w.n+.5,y:(i/w.n|0)+.5});sim.rebuildSpatial();assert.equal(igniteWildfire(sim,i),true);
 const renderer={sim,ctx,camera:{x:p.x,y:p.y},zoom:2,w:1000,h:750},before=createSimulationSnapshot(sim,{savedAt:'same'});const d=draws;drawWildfire(renderer);assert.equal(draws,d+1,'only the actual visible burning cell is painted');assert.deepEqual(createSimulationSnapshot(sim,{savedAt:'same'}),before,'drawing cannot change fire, fuel, injury, resources, RNG or saves');
 sim.wildfire.cells.clear();const empty=draws;drawWildfire(renderer);assert.equal(draws,empty,'no active fire means no effect');assert.equal(igniteWildfire(sim,i),true);p.underground=true;drawWildfire(renderer);assert.equal(draws,empty,'underground observer receives no surface effect');p.underground=false;delete sim.fireRules;drawWildfire(renderer);assert.equal(draws,empty,'historical absent fire policy remains absent');
}finally{if(old===undefined)delete globalThis.document;else globalThis.document=old}
console.log('Native wildfire art PASS: master hash, four transparent indexed native32 phases, exact alpha/palette, canonical clock/intensity, bounded cache, context restoration, real burning-cell gates and full snapshot immutability.');
