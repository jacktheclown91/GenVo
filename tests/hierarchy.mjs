import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildSmoothedHabitatField} from '../src/render/habitat.js';
import {visualHierarchyAt,foregroundAlphaFor} from '../src/render/hierarchy.js';

const sim=new Simulation('GENVO8-HIERARCHY',{player:true}),w=sim.world,field=buildSmoothedHabitatField(w),p=sim.player(),rng=sim.rng.state,before=[...w.moisture];
const near=visualHierarchyAt(w,Math.floor(p.x),Math.floor(p.y),{focusX:p.x,focusY:p.y,habitatField:field});
const far=visualHierarchyAt(w,Math.min(w.n-2,Math.floor(p.x)+10),Math.floor(p.y),{focusX:p.x,focusY:p.y,habitatField:field});
assert.ok(near.focus>.65,'controlled creature should create a strong local readability pocket');
assert.ok(far.focus<.05,'far terrain should not receive player-focus suppression');
assert.ok(near.microAlpha<far.microAlpha||near.openness>far.openness-.2,'near terrain should generally quiet low-value detail');
assert.ok(near.microAlpha>=.25&&near.microAlpha<=.94);assert.ok(near.traceAlpha>=.38&&near.traceAlpha<=.96);
assert.ok(foregroundAlphaFor(near,{playerContact:true})<foregroundAlphaFor(near,{playerContact:false}),'player-contact foreground should clear more strongly');
assert.equal(sim.rng.state,rng,'visual hierarchy must not consume simulation RNG');assert.deepEqual([...w.moisture],before,'visual hierarchy must not mutate ecology');
console.log('creature-scale visual hierarchy checks: PASS', {near:+near.focus.toFixed(2),nearMicro:+near.microAlpha.toFixed(2),farMicro:+far.microAlpha.toFixed(2)});
