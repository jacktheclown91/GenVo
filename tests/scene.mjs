import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildSmoothedHabitatField} from '../src/render/habitat.js';
import {habitatSceneAt,collectHabitatScenes} from '../src/render/scene.js';

const sim=new Simulation('GENVO8-SCENE-READABILITY',{player:false}),field=buildSmoothedHabitatField(sim.world),before=sim.rng.state;
const a=collectHabitatScenes(sim,field,{startX:0,startY:0,cols:sim.world.n,rows:sim.world.n,block:8});
const b=collectHabitatScenes(sim,field,{startX:0,startY:0,cols:sim.world.n,rows:sim.world.n,block:8});
assert.deepEqual(a,b,'habitat scene anchors must be deterministic');
assert.equal(sim.rng.state,before,'habitat scene interpretation must not consume simulation RNG');
assert.ok(a.length>=20,'world should expose a useful number of recognizable scene anchors');
const kinds=new Set(a.map(s=>s.kind));
assert.ok(kinds.has('watering-margin'),'initial world should expose watering margins');
assert.ok(kinds.has('feeding-ground'),'initial world should expose feeding grounds');
assert.ok(kinds.has('thicket-pocket'),'initial world should expose dense habitat pockets');
assert.ok(kinds.has('open-clearing'),'initial world should preserve intentional negative-space clearings');
for(const s of a){assert.ok(s.score>=0&&s.score<=1,'scene score normalized');for(const v of Object.values(s.scores))assert.ok(v>=0&&v<=1,'subscore normalized')}

// A real environmental-history route should become interpretable as a game trail without
// changing any animal/world authority.
const animal=sim.animals.find(x=>x.alive&&!sim.world.water[sim.world.idx(x.x,x.y)]);assert.ok(animal);
for(let oy=-1;oy<=1;oy++)for(let ox=-2;ox<=2;ox++){const x=Math.max(1,Math.min(sim.world.n-2,animal.x+ox)),y=Math.max(1,Math.min(sim.world.n-2,animal.y+oy)),i=sim.world.idx(x,y);sim.history.traffic[i]=.62}
const trail=habitatSceneAt(sim,animal.x,animal.y,field,1);
assert.ok(trail.scores['game-trail']>.55,'sustained real traffic should strongly score as a game trail');
console.log('habitat scene checks: PASS',Object.fromEntries([...kinds].map(k=>[k,a.filter(s=>s.kind===k).length])));
