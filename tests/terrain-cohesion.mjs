import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {buildSmoothedHabitatField,visualHabitatAt} from '../src/render/habitat.js';
import {terrainPaletteAt} from '../src/render/identity.js';
import {collectHabitatScenes} from '../src/render/scene.js';
import {terrainMotifFor,drawTerrainMotifBackdrop} from '../src/render/terrain-motifs.js';

function recorder(){const ops=[];return {ops,fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,save(){},restore(){},translate(){},rotate(){},fillRect(x,y,w,h){ops.push(['rect',x,y,w,h,this.fillStyle])},beginPath(){},arc(){},ellipse(){},stroke(){}}}

const sim=new Simulation('GENVO8-TERRAIN-COHESION',{player:false}),field=buildSmoothedHabitatField(sim.world),before=sim.rng.state;
let maxHue=0,maxLight=0,maxSat=0,samples=0;
for(let y=12;y<42;y+=.5)for(let x=12;x<42;x+=.5){
  const a=visualHabitatAt(sim.world,x,y,field),b=visualHabitatAt(sim.world,x+.125,y,field),pa=terrainPaletteAt(sim.world,x,y,a.moisture,a.fertility),pb=terrainPaletteAt(sim.world,x+.125,y,b.moisture,b.fertility);
  maxHue=Math.max(maxHue,Math.abs(pa.hue-pb.hue));maxLight=Math.max(maxLight,Math.abs(pa.light-pb.light));maxSat=Math.max(maxSat,Math.abs(pa.sat-pb.sat));samples++;
}
assert.ok(samples>1000);
assert.ok(maxHue<1.2,`continuous terrain hue bias should not jump between nearby samples (max ${maxHue})`);
assert.ok(maxLight<.6,`continuous terrain light bias should not jump between nearby samples (max ${maxLight})`);
assert.ok(maxSat<.6,`continuous terrain saturation bias should not jump between nearby samples (max ${maxSat})`);
assert.equal(sim.rng.state,before,'terrain palette sampling must not consume simulation RNG');

const scenes=collectHabitatScenes(sim,field,{startX:0,startY:0,cols:sim.world.n,rows:sim.world.n,block:8});
let checked=0;
for(const scene of scenes){const p=terrainMotifFor(sim,scene);if(p.kind==='none'||p.strength<.47)continue;const c=recorder();drawTerrainMotifBackdrop(c,{sim,scene,px:0,py:0,u:1});for(const op of c.ops){if(op[0]!=='rect')continue;const area=Math.abs(op[3]*op[4]);assert.ok(area<=120,`${p.kind} backdrop should be broken detail, not a large translucent rectangle (area ${area})`)}checked++}
assert.ok(checked>=8,'expected representative terrain motifs');

const renderer=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
assert.match(renderer,/terrainPaletteAt\(this\.sim\.world,wx,wy,mask\.moisture\[idx\],mask\.fertility\[idx\]\)/,'land base uses continuous sub-tile palette sampling');
assert.doesNotMatch(renderer,/terrainColor\([^\n]+identity\.palette\)/,'land base no longer applies a discrete identity palette to a whole tile');
console.log('terrain cohesion checks: PASS',{maxHue,maxLight,maxSat,motifs:checked});
