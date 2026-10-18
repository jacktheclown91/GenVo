import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';

// Simulation.player() remembers a "no living player" result (render-time cost) but must notice every way
// a living player can reappear: a new actor with the player id, a new actor list, or a changed id.
const sim=new Simulation('PLAYER-LOOKUP-CACHE',{player:true}),p=sim.player();assert.ok(p);
p.alive=false;assert.equal(sim.player(),null,'dead player is not returned');assert.equal(sim.player(),null,'cached miss');
const heir=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a!==p);assert.ok(heir);
sim.playerId=heir.id;assert.equal(sim.player(),heir,'changed player id is found after a cached miss');
heir.alive=false;assert.equal(sim.player(),null);
const pushed={...heir,id:heir.id,alive:true};sim.animals.push(pushed);assert.equal(sim.player(),pushed,'actor appended with the player id is found');
pushed.alive=false;assert.equal(sim.player(),null);const fresh={...pushed,alive:true};sim.animals=sim.animals.filter(a=>a!==pushed).concat([fresh]);assert.equal(sim.player(),fresh,'replaced actor list is rescanned');
const snap=JSON.stringify(createSimulationSnapshot(sim));assert.ok(!snap.includes('_playerMiss'),'miss cache is not saved');
console.log('player lookup cache: PASS');
