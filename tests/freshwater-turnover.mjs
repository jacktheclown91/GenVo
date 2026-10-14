import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {advanceFreshwater} from '../src/ecology/freshwater-food.js';
const sim=new Simulation('FRESHWATER-TURNOVER',{player:false}),w=sim.world;
w.water.fill(0);w.fertility.fill(0);w.carrion.fill(0);
for(const field of Object.values(w.freshwaterFood))field.fill(0);
const i=w.idx(50.5,50.5);w.water[i]=1;w.freshwaterFood.fry[i]=.35;
const before=w.freshwaterFood.fry[i];
for(let k=0;k<30;k++)advanceFreshwater(w);
assert.ok(w.freshwaterFood.fry[i]<before,'aquatic prey cannot persist at capacity indefinitely without food');
assert.ok(w.carrion[i]>0||w.fertility[i]>0,'consumer losses participate in the detritus/nutrient cycle');
// Mature prey still consumes a real maintenance ration at its capacity.
w.carrion.fill(0);w.fertility.fill(0);
for(const field of Object.values(w.freshwaterFood))field.fill(0);
w.freshwaterFood.fry[i]=.35;w.freshwaterFood.larvae[i]=.2;
const larvae=w.freshwaterFood.larvae[i];advanceFreshwater(w);
assert.ok(w.freshwaterFood.larvae[i]<larvae,'standing prey must consume lower trophic food even when not growing');
assert.ok(w.freshwaterFood.fry[i]<=.35000001);
// Larvae can use existing organic debris; their gain remains source-funded.
for(const field of Object.values(w.freshwaterFood))field.fill(0);
w.freshwaterFood.larvae[i]=.1;w.carrion[i]=1;
const debris=w.carrion[i],larval=w.freshwaterFood.larvae[i];advanceFreshwater(w);
assert.ok(w.freshwaterFood.larvae[i]>larval);assert.ok(w.carrion[i]<debris);
console.log('aquatic consumer starvation and nutrient recycling: PASS');
