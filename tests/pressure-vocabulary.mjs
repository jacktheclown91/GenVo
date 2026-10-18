import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {PRESSURE_AXES,ENVIRONMENT_PRESSURES} from '../src/lineage/pressure.js';
import {ADAPTATIONS} from '../src/lineage/evolution.js';
import {PROTO_TRAITS} from '../src/lineage/proto-speciation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,SAVE_SCHEMA} from '../src/persistence/save-manager.js';

// v1.32 consolidation Stage B: one lived-pressure vocabulary.
const ids=new Set(PRESSURE_AXES.map(p=>p.id));
assert.equal(ids.size,PRESSURE_AXES.length);
for(const [id,def] of Object.entries(ADAPTATIONS))for(const k of Object.keys(def.pressure||{}))assert.ok(ids.has(k),`${id} weights an unknown pressure "${k}"`);
for(const def of Object.values(PROTO_TRAITS))assert.ok(ENVIRONMENT_PRESSURES.some(p=>p.id===def.pressure),`proto-trait ${def.id} reads a shared environmental axis`);

const sim=new Simulation('GENVO8-PRESSURE-VOCAB',{player:true});sim.endOpeningGrace('test');const p=sim.player();
p.hydration=5;p.infected=true;sim.world.temperature[sim.world.idx(p.x,p.y)]=.1;
for(const item of sim.pressure.evaluate(p))assert.ok(ids.has(item.kind),`per-creature pressure "${item.kind}" uses the shared vocabulary`);
sim.rebuildSpatial();for(let i=0;i<120;i++)sim.update(null);
const memory=sim.populationMemory.profile('home');if(memory)for(const a of memory.axes)assert.ok(ids.has(a.id),`population memory axis ${a.id} is shared`);

// Older saves rename their per-creature kinds.
assert.ok(SAVE_SCHEMA>=5);
const st=sim.pressure.ensure(p);st.exposure={water:4,thermal:2,bottleneck:1,predation:3};st.peak={water:.6,thermal:.4,bottleneck:.2};
const old=structuredClone(createSimulationSnapshot(sim));old.schema=4;
// v1.39.0 (creator decision 2026-10-09): saves start fresh; an older save is refused with a clear message.
assert.throws(()=>restoreSimulationSnapshot(old),/predates GenVo's modular creature bodies/,'older saves are refused, not migrated');
console.log('pressure vocabulary ok');
