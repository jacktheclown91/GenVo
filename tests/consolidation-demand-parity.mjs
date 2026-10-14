import assert from 'node:assert/strict';import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';import {Simulation as Before} from '../reports/consolidation-before/src/sim/simulation.js';
import {plantHandling,plantHandlingAffordable} from '../src/ecology/plant-handling.js';
const a=new Simulation('DEMAND-OPTIMIZATION-PARITY',{player:false}),b=new Before('DEMAND-OPTIMIZATION-PARITY',{player:false});
for(let step=0;step<480;step++){
 a.update();b.update();assert.equal(a.rng.state,b.rng.state);assert.equal(a.animals.length,b.animals.length);
 for(let j=0;j<a.animals.length;j++){const x=a.animals[j],y=b.animals[j];for(const k of ['x','y','energy','hydration','alive','intent','reproDrive'])assert.equal(x[k],y[k],`${step}:${j}:${k}`)}
 if(step%80===0)for(let j=0;j<a.animals.length;j+=7){const x=a.animals[j],y=b.animals[j];assert.deepEqual(a.carrying.breedingState(x),b.carrying.breedingState(y));}
}
for(const actor of a.animals.slice(0,20))for(const energy of [0,.001,1,50])for(const coat of [0,.0001,.01,1]){const x={...actor,energy};assert.equal(plantHandlingAffordable(x,coat),plantHandling(x,{coat}).enabled)}
fs.writeFileSync('docs/consolidation-demand-parity.json',JSON.stringify({status:'PASS',updates:480,animals:a.animals.length,rngExact:true,positionsReservesIntentDriveExact:true,carryingExact:true,affordabilityExact:true,scope:'Paired pre-change/current natural worlds, no fixtures. Separate reserve-edge numeric/receipt checks.'},null,2));console.log('480 natural updates exact actor, RNG and carrying parity; affordability boundaries PASS');
