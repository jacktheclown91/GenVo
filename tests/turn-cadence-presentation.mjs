import assert from 'node:assert/strict';
import {Renderer} from '../src/render/renderer.js';
import before from './fixtures/turn-cadence-before-629ad29a.mjs';

const after=Renderer.prototype.easedDir;
function timeline(method,times,start=0,target=4){
  const renderer={renderNow:0};method.call(renderer,1,start);
  return times.map(time=>{renderer.renderNow=time;return{time,facing:method.call(renderer,1,target)}});
}
for(const fps of [24,30,60,120]){
  const times=Array.from({length:Math.ceil(.5*fps)},(_,i)=>(i+1)*1000/fps);
  const result=timeline(after,times),arrival=result.find(row=>row.facing===4);
  assert.ok(arrival&&arrival.time>=280&&arrival.time<280+1000/fps+1e-8,
    `Four existing facing beats finish at 280 ms, within one ${fps} fps sample`);
}
const hiccup=[16,33,50,80,100,116,250,266,283,300,320];
assert.equal(timeline(before,hiccup).at(-1).facing,5,'Frozen original loses elapsed facing beats');
assert.equal(timeline(after,hiccup).at(-1).facing,4,'Presentation catches up after a delayed frame');
for(let start=0;start<8;start++)for(let target=0;target<8;target++){
  const result=timeline(after,[70,140,210,280],start,target);
  assert.equal(result.at(-1).facing,target,'All eight headings and wrap-around targets remain reachable');
  assert.ok(result.every(row=>Number.isInteger(row.facing)&&row.facing>=0&&row.facing<8));
}
const actor={id:8,dir:2,x:4,y:5},saved=structuredClone(actor),renderer={renderNow:0};
after.call(renderer,actor.id,actor.dir);renderer.renderNow=1000;
after.call(renderer,actor.id,6);
assert.deepEqual(actor,saved,'The renderer only owns its presentation map');
renderer.renderNow=1001;assert.equal(after.call(renderer,actor.id,6),6,'Settled facing does not overshoot');
console.log('Turn cadence presentation PASS: 24/30/60/120 fps, delayed frames, all 64 heading pairs, no overshoot or actor mutation.');
