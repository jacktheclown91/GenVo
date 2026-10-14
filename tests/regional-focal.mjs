import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildSmoothedHabitatField} from '../src/render/habitat.js';
import {collectRegionalFocals,drawRegionalFocalBackdrop,drawRegionalFocalForeground} from '../src/render/regional-focal.js';

function recorder(){const ops=[];return {ops,fillStyle:'',globalAlpha:1,save(){ops.push(['save'])},restore(){ops.push(['restore'])},translate(x,y){ops.push(['translate',x,y])},fillRect(x,y,w,h){ops.push(['rect',this.fillStyle,x,y,w,h])}}}
const sim=new Simulation('GENVO8-REGIONAL-FOCALS',{player:false}),field=buildSmoothedHabitatField(sim.world),rng=sim.rng.state,before=[...sim.world.moisture];
const a=collectRegionalFocals(sim,field),b=collectRegionalFocals(sim,field);
assert.deepEqual(a.map(x=>[x.kind,x.x,x.y,x.regionX,x.regionY]),b.map(x=>[x.kind,x.x,x.y,x.regionX,x.regionY]),'regional focals must be deterministic');
assert.ok(a.length>=5&&a.length<=36,`expected sparse broad-region landmarks, got ${a.length}`);
assert.equal(new Set(a.map(x=>`${x.regionX},${x.regionY}`)).size,a.length,'at most one focal per broad region');
assert.ok(new Set(a.map(x=>x.kind)).size>=3,'world should expose multiple focal silhouettes');
for(const focal of a){assert.ok(focal.strength>=.56&&focal.strength<=1);const x=recorder(),y=recorder();drawRegionalFocalBackdrop(x,{focal,px:10,py:20,u:3,season:'AUTUMN'});drawRegionalFocalBackdrop(y,{focal,px:10,py:20,u:3,season:'AUTUMN'});assert.deepEqual(x.ops,y.ops);assert.ok(x.ops.some(o=>o[0]==='rect'));const fg=recorder();drawRegionalFocalForeground(fg,{focal,px:0,py:0,u:3,season:'WINTER'});}
assert.equal(sim.rng.state,rng,'regional focal interpretation must not consume simulation RNG');assert.deepEqual([...sim.world.moisture],before,'regional focal drawing must not mutate ecology');
console.log('regional focal checks: PASS',a.length,Object.fromEntries([...new Set(a.map(x=>x.kind))].map(k=>[k,a.filter(x=>x.kind===k).length])));
