// Focused physical-expression regression. Browser/GPU presentation approval
// remains separate and must use the running game, not mock creature screenshots.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {physicalMotionExpression,applyPhysicalMotionExpression,drawBrakeScuff} from '../src/render/physical-motion-expression.js';

const inertia={inertiaRules:'inertia/1'};
const support={structuralSupportRules:'structural-support/1'};
const sample=(vx,vy,ax,ay)=>({motion:{schema:1,vx,vy,ax,ay}});
const before={bodyLean:.2,bodySway:0,bodyDrop:.1,stanceSpread:.05,compress:0};
const brake=physicalMotionExpression(inertia,sample(2.15,0,-5,0),{dir:2,moving:true});
const start=physicalMotionExpression(inertia,sample(.8,0,5,0),{dir:2,moving:true});
const turn=physicalMotionExpression(inertia,sample(2.15,0,0,5),{dir:2,moving:true});
assert.ok(brake.lean>0,'braking pitches the body forward');
assert.ok(brake.skid>.25,'strong braking can leave a transient trace');
assert.ok(start.lean<0,'starting leans backward and cannot paint a brake trace');
assert.equal(start.skid,0);
assert.ok(turn.sway>0,'lateral acceleration leans to the right of facing');
assert.ok(turn.skid===0,'pure turning without velocity loss never fakes a brake');
assert.deepEqual({...physicalMotionExpression({},sample(2,0,-5,0),{dir:2,moving:true})},
 {lean:0,sway:0,drop:0,stance:0,compress:0,skid:0,vx:0,vy:0},
 'a historical world without inertia/1 retains its existing presentation');
assert.equal(physicalMotionExpression(inertia,sample(2.15,0,-5,0),{dir:2,moving:false}).skid,0,
 'a visibly stationary body cannot paint skid marks');
assert.equal(physicalMotionExpression(inertia,{...sample(2.15,0,-5,0),torpor:true},{dir:2,moving:true}).skid,0,
 'dormant bodies remain dormant');

// Old animals do not need an anatomical plan; the actual structural authority
// evaluates the reference founder geometry for missing plans. Growth scales stress.
const animal=(s)=>({bodySize:{schema:1,alleles:[Math.log(s),Math.log(s)]}});
const sound=physicalMotionExpression(support,animal(1),{growth:1,moving:false});
const strained=physicalMotionExpression(support,animal(2),{growth:1,moving:false});
const overloaded=physicalMotionExpression(support,animal(3),{growth:1,moving:false});
const juvenile=physicalMotionExpression(support,animal(3),{growth:.25,moving:false});
assert.equal(sound.drop,0);
assert.ok(strained.drop>0&&strained.drop<overloaded.drop);
assert.ok(overloaded.stance>strained.stance);
assert.equal(juvenile.drop,0,'juvenile stress uses actual current growth, not adult scale alone');
assert.equal(physicalMotionExpression(support,animal(3),{growth:1,grounded:false}).drop,0,
 'flying, swimming or underground bodies do not show a false load-bearing stance');

const posed={...before};
applyPhysicalMotionExpression(posed,brake);
assert.ok(posed.bodyLean>before.bodyLean,'the physical reading composes with existing behaviors');
assert.equal(before.bodyLean,.2,'existing behavior state was not overwritten');
assert.ok(Object.isFrozen(brake),'read-only presentation receipt');

const trace={calls:[],save(){this.calls.push('save')},restore(){this.calls.push('restore')},
 fillRect(...args){this.calls.push(args)}};
drawBrakeScuff(trace,brake,{contact:{soil:'dry',inWater:false},scale:2});
assert.ok(trace.calls.some(x=>Array.isArray(x)),'strong dry-ground braking draws physical marks');
trace.calls=[];
drawBrakeScuff(trace,brake,{contact:{soil:'meadow',inWater:false},scale:2});
drawBrakeScuff(trace,brake,{contact:{soil:'mud',inWater:true},scale:2});
drawBrakeScuff(trace,start,{contact:{soil:'dry',inWater:false},scale:2});
assert.deepEqual(trace.calls,[],'no false marks in grass, water or while accelerating');

const renderer=readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
for(const snippet of [
 'physicalMotionExpression(this.sim,a,{dir:drawDir,moving,growth:dev.growth',
 'applyPhysicalMotionExpression(behavior,physical);',
 'drawBrakeScuff(c,physical,{contact,scale});',
 'grounded:!inWater&&!a.airborne&&!a.perched&&!a.underground'
])assert.ok(renderer.includes(snippet),'renderer connects authoritative receipt: '+snippet);
console.log('physical motion and load-bearing presentation: PASS');
