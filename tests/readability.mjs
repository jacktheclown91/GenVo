import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {nearestThreat,nearbyFood,directionWord} from '../src/ui/readability.js';
import {PLANTS} from '../src/sim/config.js';

const sim=new Simulation('READABILITY-TEST',{player:true});
const p=sim.player();
assert.ok(p,'player founder exists');
const hunter=sim.animals.find(a=>a.species==='needlejaw');
assert.ok(hunter,'needlejaw exists');
hunter.x=p.x+3;hunter.y=p.y;
const threat=nearestThreat(sim,p,6);
assert.equal(threat?.animal.id,hunter.id,'nearest threatening predator is found');
assert.equal(directionWord(p,hunter),'east','direction wording is readable');

for(const kind of Object.keys(PLANTS))sim.world.plants[kind].fill(0);
const i=sim.world.idx(p.x+1,p.y);
sim.world.plants.bramble[i]=.8;
const food=nearbyFood(sim,p,3);
assert.equal(food?.kind,'bramble','nearby edible biomass is found');
assert.ok(food.distance<3,'food cue is local');
console.log('readability checks passed');
