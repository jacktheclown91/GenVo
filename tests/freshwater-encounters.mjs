import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {advanceFreshwater} from '../src/ecology/freshwater-food.js';
function sample(prey){const sim=new Simulation('FRESHWATER-ENCOUNTERS',{player:false}),w=sim.world;
  w.water.fill(0);w.fertility.fill(0);w.carrion.fill(0);for(const f of Object.values(w.freshwaterFood))f.fill(0);
  const i=w.idx(50.5,50.5);w.water[i]=1;w.freshwaterFood.larvae[i]=prey;w.freshwaterFood.fry[i]=.35;
  advanceFreshwater(w);return {prey:w.freshwaterFood.larvae[i],predator:w.freshwaterFood.fry[i]};}
const scarce=sample(.0001),abundant=sample(.2),empty=sample(0);
assert.ok(scarce.prey>0,'a sparse prey patch is not perfectly swept clean in one feeding update');
assert.ok(scarce.predator<abundant.predator,'scarce encounters cannot fund the same predator ration');
assert.equal(empty.prey,0,'encounter limits do not invent depleted prey or enforce a stock floor');
console.log('density-dependent aquatic encounters without prey rescue: PASS');
