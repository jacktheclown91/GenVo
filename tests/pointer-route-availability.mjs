import assert from 'node:assert/strict';
import {PointerApproach} from '../src/ui/pointer-approach.js';
const a={alive:true,x:1.5,y:1.5},s={paused:false,player:()=>a,world:{n:5,isPlayable:(x,y)=>x>=0&&y>=0&&x<5&&y<5},canOccupy:()=>true};let block=false;const p=new PointerApproach({getSim:()=>s,blocked:()=>block}),goal={x:3.5,y:1.5};
assert.ok(p.availability(goal).enabled);assert.equal(p.path,null,'checking a route cannot start movement');assert.ok(p.start(goal).ok);p.cancel();s.canOccupy=()=>false;assert.equal(p.availability(goal).enabled,false);assert.match(p.availability(goal).reason,/No walkable route/);assert.equal(p.start(goal).ok,false);assert.equal(p.path,null);
s.canOccupy=()=>true;s.paused=true;assert.equal(p.availability(goal).enabled,false);s.paused=false;let completed=0;p.start({x:a.x,y:a.y},()=>completed++);p.read({});assert.equal(completed,1);p.start(goal,()=>completed++);p.read({right:true});assert.equal(p.path,null);assert.equal(completed,1,'manual cancellation never runs a pending action');
let reached=false,readyCalls=0;p.start(goal,()=>completed++,{ready:()=>{readyCalls++;return reached}});p.read({});assert.equal(completed,1);reached=true;p.read({});assert.equal(completed,2,'canonical reach readiness executes before the arbitrary path endpoint');assert.equal(p.path,null);assert.equal(p.ready,null);assert.equal(a.x,1.5,'the UI does not teleport to a target');
p.start(goal,()=>completed++,{ready:()=>true});s.paused=true;p.read({});s.paused=false;assert.equal(completed,2,'pause cannot execute a pending action');assert.equal(p.ready,null);
p.start(goal,()=>completed++,{ready:()=>true});p.read({left:true});assert.equal(completed,2,'manual input wins over ready action');
let interruption;p.start(goal,()=>completed++,{onInterrupted:message=>interruption=message});s.canOccupy=()=>false;p.read({});assert.match(interruption,/no longer walkable/);assert.equal(p.path,null);assert.equal(completed,2,'blocked navigation never executes the action');
console.log('Read-only route availability, execution parity, authoritative early reach, pause and manual-cancel safety PASS');

s.canOccupy=()=>true;let valid=true;
p.start(goal,()=>completed++,{validate:()=>({enabled:valid,reason:'Plant material was used before arrival.'}),onInterrupted:message=>interruption=message});
valid=false;p.read({});assert.equal(completed,2);assert.match(interruption,/material/);assert.equal(p.path,null);assert.equal(p.validate,null);
p.start(goal,()=>completed++,{validate:()=>({enabled:true}),onInterrupted:message=>interruption=message});
p.read({left:true});assert.equal(completed,2);assert.match(interruption,/cancelled by movement/);
