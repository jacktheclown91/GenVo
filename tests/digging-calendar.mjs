import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {PART_ABILITY} from '../src/lineage/part-abilities.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const sim=new Simulation('DIGGING-CALENDAR',{player:false}),a=sim.animals.find(a=>a.species==='genvo'),root=sim.animals.find(a=>a.species==='rootling');
// Explicit historical-policy regression: legacy patch renewal and clock conversion remain supported.
sim.diggingRules='legacy-patch-reward/1';
// Controlled capability fixture; no claim of natural mutation or adult editing.
a.bodyPlan=structuredClone(root.bodyPlan);a.energy=20;const cell=sim.world.idx(a.x,a.y);
assert.equal(sim.world.water[cell],0);
sim.day=CFG.seasonDays*4;sim.year=1;sim.seasonIndex=3;
assert.equal(sim.partAbilities.dig(a).ok,true);
const advance=s=>{s.tickCount+=CFG.dayTicks;s.advanceDay()};
advance(sim);assert.equal(sim.year,2);
assert.equal(sim.partAbilities.canDigAt(a),false,'a year boundary cannot replenish a patch after one actual day');
for(let k=1;k<PART_ABILITY.dig.regrowDays;k++)advance(sim);
assert.equal(sim.partAbilities.canDigAt(a),true,'the patch renews after the existing six actual days');

const saved=structuredClone(createSimulationSnapshot(sim));
saved.core.day=34;saved.core.year=2;saved.core.seasonIndex=0;
saved.controllers.partAbilities.dug[cell]=65; // Legacy: year2 day33 was encoded as65.
delete saved.controllers.partAbilities.digClock;
const loaded=restoreSimulationSnapshot(saved),la=loaded.animals.find(b=>b.id===a.id);
assert.equal(loaded.partAbilities.canDigAt(la),false,'older current-schema dig cooldown is retained');
for(let k=0;k<4;k++)advance(loaded);
assert.equal(loaded.partAbilities.canDigAt(la),false,'legacy patch remains depleted through actual day38');
advance(loaded);assert.equal(loaded.partAbilities.canDigAt(la),true,'legacy patch renews on actual day39');
const current=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(loaded))),ca=current.animals.find(b=>b.id===a.id);
assert.equal(current.partAbilities.canDigAt(ca),true,'converted clock survives another save/load');
console.log('bounded excavation renewal across years and current-schema saves: PASS');
