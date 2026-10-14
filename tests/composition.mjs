import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildSmoothedHabitatField} from '../src/render/habitat.js';
import {visualCompositionAt,compositionKind} from '../src/render/composition.js';

const sim=new Simulation('GENVO8-COMPOSITION',{player:false}),w=sim.world,field=buildSmoothedHabitatField(w);
const before=sim.rng.state;const kinds=new Map();let corridors=0,open=0,thickets=0,maxStep=0;
for(let y=4;y<w.n-4;y+=2){let last=null;for(let x=4;x<w.n-4;x+=2){const a=visualCompositionAt(w,x+.5,y+.5,field),b=visualCompositionAt(w,x+.5,y+.5,field);assert.deepEqual(a,b,'composition must be deterministic');for(const v of ['openness','corridor','thicket','wetPocket','dryPocket','richPocket','landmark'])assert.ok(a[v]>=0&&a[v]<=1,`${v} normalized`);const k=compositionKind(a);kinds.set(k,(kinds.get(k)||0)+1);if(a.corridor>.65)corridors++;if(a.openness>.62)open++;if(a.thicket>.62)thickets++;if(last)maxStep=Math.max(maxStep,Math.abs(a.openness-last.openness));last=a}}
assert.equal(sim.rng.state,before,'renderer composition must not consume ecology RNG');
assert.ok(corridors>20,'world should contain broad habitat corridors');assert.ok(open>20,'world should contain open glades');assert.ok(thickets>20,'world should contain landmark-rich thickets');assert.ok(kinds.size>=4,'composition should produce several recognizable region types');assert.ok(maxStep<.75,'composition should vary smoothly rather than as hard macro blocks');
console.log('world composition checks: PASS',Object.fromEntries(kinds));
