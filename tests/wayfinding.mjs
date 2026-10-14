import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildSmoothedHabitatField} from '../src/render/habitat.js';
import {collectRegionalFocals} from '../src/render/regional-focal.js';
import {collectHabitatTransitions,habitatTransitionAt,focalApproachFor,drawHabitatTransition,drawFocalApproach} from '../src/render/wayfinding.js';

function recorder(){const ops=[];return {ops,fillStyle:'',globalAlpha:1,save(){ops.push(['save'])},restore(){ops.push(['restore'])},translate(x,y){ops.push(['translate',x,y])},fillRect(x,y,w,h){ops.push(['rect',this.fillStyle,x,y,w,h,this.globalAlpha])}}}
const sim=new Simulation('GENVO8-WAYFINDING',{player:false}),w=sim.world,field=buildSmoothedHabitatField(w),rng=sim.rng.state,before=[...w.moisture];
const a=collectHabitatTransitions(w,field),b=collectHabitatTransitions(w,field);
assert.deepEqual(a.map(t=>[t.kind,t.x,t.y,+t.strength.toFixed(4)]),b.map(t=>[t.kind,t.x,t.y,+t.strength.toFixed(4)]),'transition field must be deterministic');
assert.ok(a.length>=12&&a.length<=500,`expected sparse transition cues, got ${a.length}`);
assert.ok(new Set(a.map(t=>t.kind)).size>=2,'world should expose multiple ecotone types');
for(const t of a.slice(0,24)){assert.ok(t.strength>=0&&t.strength<=1);assert.ok(Math.abs(Math.hypot(t.nx,t.ny)-1)<.001);const x=recorder(),y=recorder();drawHabitatTransition(x,{transition:t,px:20,py:30,u:3,season:'AUTUMN'});drawHabitatTransition(y,{transition:t,px:20,py:30,u:3,season:'AUTUMN'});assert.deepEqual(x.ops,y.ops);assert.ok(x.ops.some(o=>o[0]==='rect'))}
const focals=collectRegionalFocals(sim,field);assert.ok(focals.length>=3);
for(const f of focals){const approach=focalApproachFor(w,f,field);assert.ok(approach&&Number.isFinite(approach.dx)&&Number.isFinite(approach.dy));const r=recorder();drawFocalApproach(r,{focal:f,approach,px:0,py:0,u:3,season:'WINTER'});assert.ok(r.ops.some(o=>o[0]==='rect'))}
const probe=habitatTransitionAt(w,a[0].x,a[0].y,field);assert.ok(probe);
assert.equal(sim.rng.state,rng,'wayfinding presentation must not consume simulation RNG');assert.deepEqual([...w.moisture],before,'wayfinding presentation must not mutate ecology');
console.log('habitat transition + focal approach checks: PASS',a.length,Object.fromEntries([...new Set(a.map(t=>t.kind))].map(k=>[k,a.filter(t=>t.kind===k).length])));
