import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {UNDERGROUND_FEEDING} from '../src/ecology/underground-feeding.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// underground-feeding/1: wild animals eating underground use the wild feeding
// interaction at the life-stride cadence, like surface wildlife, and never the
// player's eat action or its forage memory.
const seed='GENVO8-FORAGE-SEASON-HEADLESS',strides=12;
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'underground-feeding'}));
function observe(sim){
 const meals=[];const resolve=sim.resolveInteraction.bind(sim);
 sim.resolveInteraction=a=>{const e=a.energy,feeding=a.underground&&a.intent==='feed';resolve(a);if(feeding)meals.push({tick:sim.tickCount,gain:a.energy-e})};
 return meals;
}
const sim=new Simulation(seed,{player:false,undergroundFeeding:UNDERGROUND_FEEDING.policy});
assert.equal(sim.undergroundFeedingRules,UNDERGROUND_FEEDING.policy);
const meals=observe(sim);
for(let i=0;i<CFG.lifeStride*strides;i++)sim.update(null);
assert.ok(meals.length>0,'wild animals in this world feed underground');
assert.ok(meals.every(m=>m.tick%CFG.lifeStride===0),'underground meals follow the life stride, not every tick');
assert.ok(meals.some(m=>m.gain>0),'the wild interaction actually feeds them');
assert.equal(sim.foraging.states.size,0,'wild underground eaters hold no player forage memory');

// The rule is saved, restored and continues identically.
const saved=snap(sim),restored=restoreSimulationSnapshot(structuredClone(saved));
assert.equal(restored.undergroundFeedingRules,UNDERGROUND_FEEDING.policy);
for(let i=0;i<CFG.lifeStride*4;i++){sim.update(null);restored.update(null)}
assert.ok(isDeepStrictEqual(snap(sim),snap(restored)),'restored worlds continue underground feeding identically');
const unknown=structuredClone(saved);unknown.core.undergroundFeedingRules='nearest-anything/9';
assert.throws(()=>restoreSimulationSnapshot(unknown),/Unknown saved underground feeding rules/);
assert.throws(()=>new Simulation(seed,{player:false,undergroundFeeding:'nearest-anything/9'}),/Unknown underground feeding policy/);

// Worlds built without the rule keep their original underground eating.
const legacy=new Simulation(seed,{player:false});
assert.equal(legacy.undergroundFeedingRules,undefined);
for(let i=0;i<CFG.lifeStride*strides;i++)legacy.update(null);
assert.ok(legacy.foraging.states.size>0,'the original rule is retained for worlds created without it');
const old=snap(legacy);assert.equal(Object.hasOwn(old.core,'undergroundFeedingRules'),false,'a legacy save records no new rule');
assert.equal(restoreSimulationSnapshot(structuredClone(old)).undergroundFeedingRules,undefined);
console.log(`Underground feeding PASS: ${meals.length} wild underground meals on the life stride without player memory, saved rule continuity, unknown rules refused, original worlds unchanged`);
