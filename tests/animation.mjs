import assert from 'node:assert/strict';
import fs from 'node:fs';
import {genvoVisualPose} from '../src/render/genvo.js';
import {LEG_GAIT} from '../src/render/creature-assembler.js';
import {LIMB_ART} from '../src/render/part-sprites.js';
import {Renderer} from '../src/render/renderer.js';

// v1.59.0 animation pass (creator review 2026-10-10): wild creatures animate between whole poses,
// each leg type moves its own way, near-side legs overlap the torso, and turns ease through facings.

// Leg types differ in how they move, not only in how they look.
const swing=gait=>{let lo=Infinity,hi=-Infinity,top=0;for(let f=0;f<8;f+=.25){const p=genvoVisualPose({dir:2,frame:f,moving:true,legSlots:[{slot:4,reach:1,gait}]}),leg=p.legs[0];lo=Math.min(lo,leg.foot.x);hi=Math.max(hi,leg.foot.x);top=Math.max(top,leg.liftAmount)}return{stride:hi-lo,lift:top}};
const runner=swing(LEG_GAIT['runner-leg']),sturdy=swing(LEG_GAIT['sturdy-leg']),spring=swing(LEG_GAIT['spring-leg']),walking=swing(LEG_GAIT['walking-leg']);
assert.ok(runner.stride>walking.stride&&walking.stride>sturdy.stride,'runner legs take the longest strides, sturdy legs the shortest');
assert.ok(spring.lift>=walking.lift&&sturdy.lift<walking.lift,'spring legs lift highest, sturdy legs lowest');
for(const id of ['runner-leg','sturdy-leg','spring-leg','webbed-leg','padded-leg','digging-forelimb'])assert.equal(typeof LIMB_ART[id],'function',`${id} has its own limb art`);

// Wild creatures animate in quarter frames while moving, not whole frames.
const src=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
assert.match(src,/cachePhase=moving\?Math\.floor\(phase\*4\)\/4/,'moving creatures use quarter-frame phases');
assert.doesNotMatch(src,/frame:Math\.floor\(phase\)/,'no creature is drawn at a whole-frame phase while moving');

// Near-side legs are drawn after the torso.
const draw=fs.readFileSync(new URL('../src/render/genvo-draw.js',import.meta.url),'utf8');
assert.match(draw,/nearLegs\.push\(leg\)/);assert.ok(draw.indexOf('for(const leg of nearLegs')>draw.indexOf('roundedMantleRows(bodyW*D'),'near-side legs draw after the body');

// Turning eases one facing at a time (every 70 ms), the short way round.
const r={renderNow:0};const ease=Renderer.prototype.easedDir;
assert.equal(ease.call(r,1,2),2);r.renderNow=100;assert.equal(ease.call(r,1,6),1,'a turn from east to west passes through the in-between facings');
r.renderNow=180;assert.equal(ease.call(r,1,6),0);r.renderNow=260;assert.equal(ease.call(r,1,6),7);r.renderNow=340;assert.equal(ease.call(r,1,6),6);
r.renderNow=345;assert.equal(ease.call(r,1,6),6,'and stays once it arrives');
console.log('animation ok');
// v1.60.2: a new or loaded world starts every creature at its own facing (ids are reused across worlds).
const w={renderNow:0};ease.call(w,7,2);w.renderNow=100;ease.call(w,7,6);Renderer.prototype.resetWorldCaches.call(Object.assign(w,{partExpressions:{reset(){}},terrainChunkCache:new Map(),terrainRefreshQueue:[],terrainRefreshQueued:new Set(),landformMaskCache:new Map(),habitatMaskCache:new Map(),landBaseTileCache:new Map(),waterBaseTileCache:new Map(),staticLandTileCache:new Map()}));
assert.equal(ease.call(w,7,6),6,'turn state is cleared with the world caches');
console.log('turn reset ok');
