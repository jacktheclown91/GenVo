import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {PREDATION_PARITY} from '../src/gameplay/predation-parity.js';
const sim=new Simulation('INTERFERENCE-CHECK',{player:false});
const pred=sim.animals.find(a=>a.species==='needlejaw'),prey=sim.animals.find(a=>a.species==='mosskip');
let neighbors=1,probability;
sim.localCount=(_animal,species)=>species==='needlejaw'?neighbors:CFG.wildHunt.scarceCount;
sim.rng.chance=p=>{probability=p;return false};
const chance=()=>{sim.tryKill(pred,prey);return probability};
const alone=chance();neighbors=5;const crowded=chance();
assert.ok(crowded<alone,'nearby hunters reduce wild capture probability');
assert.ok(Math.abs(crowded/alone-1/(1+CFG.wildHunt.interference*4))<1e-10,'interference matches local competitor density');
// Phase 3I predation parity: a player-owned prey meets the same competitor interference as wild prey.
prey.player=true;neighbors=1;const playerAlone=chance();neighbors=5;const playerCrowded=chance();
assert.equal(playerAlone,alone,'player-owned prey has the wild capture odds');assert.equal(playerCrowded,crowded,'interference applies to player-owned prey too');
PREDATION_PARITY.enabled=false;neighbors=1;const oldAlone=chance();neighbors=5;assert.equal(chance(),oldAlone,'?predationParity=0 restores the old player exemption');PREDATION_PARITY.enabled=true;
console.log('predator interference: PASS');
