import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// An amphibious creature already occupying freshwater must not seek an
// unreachable dry bank just to drink. The locomotion gate still owns entry.
const sim=new Simulation('FRESHWATER-ACCESS',{player:true}),w=sim.world,p=sim.player();
const water=[...w.water].findIndex((v,i)=>v&&i%w.n>3&&i%w.n<w.n-4&&(i/w.n|0)>3&&(i/w.n|0)<w.n-4);
assert.ok(water>=0);p.x=water%w.n+.5;p.y=(water/w.n|0)+.5;
p.adaptations=['water-sacs','webbed-limbs'];p.hydration=20;
assert.equal(sim.canOccupy(p,p.x,p.y),true);
assert.equal(w.isDrinkable(p.x,p.y),true,'occupied freshwater is drinkable');
assert.deepEqual(w.nextDrinkStep(p.x,p.y),{x:p.x,y:p.y,score:1,drinkable:true});
const before=p.hydration;assert.equal(sim.playerInteract().type,'drink');assert.ok(p.hydration>before,'player drinks in occupied freshwater');
p.intent='drink';p.hydration=20;sim.resolveInteraction(p);assert.ok(p.hydration>20,'autonomous interaction drinks the same water');
const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
assert.equal(restored.world.isDrinkable(p.x,p.y),true,'save/load rebuilds the same access authority');
const terrestrial={...p,adaptations:[],bodyPlan:null,ecoLifestyle:null};
assert.equal(sim.canOccupy(terrestrial,p.x,p.y),false,'drinking does not grant land bodies water locomotion');

// A narrow river at the edge used to advertise bank x=.5, outside the
// simulation's movement bounds. Routes must terminate at playable banks.
const edge=new Simulation('FRESHWATER-EDGE',{player:false}),ew=edge.world;
ew.water.fill(0);ew.moisture.fill(.2);
for(let y=0;y<ew.n;y++)ew.water[ew.idx(1,y)]=1;
ew.buildLandRegions();ew.buildHydrology();
assert.ok(ew.drinkSpots.length>0);
for(const spot of ew.drinkSpots)assert.ok(spot.x>1&&spot.y>1&&spot.x<ew.n-2&&spot.y<ew.n-2,'all advertised drink banks are playable');
let x=12.5,y=40.5;
for(let k=0;k<20&&!ew.isDrinkable(x,y);k++){const step=ew.nextDrinkStep(x,y);assert.ok(step);assert.ok(step.x>1&&step.y>1&&step.x<ew.n-2&&step.y<ew.n-2);x=step.x;y=step.y}
assert.equal(ew.isDrinkable(x,y),true);
assert.equal(ew.isDrinkable(.5,40.5),false,'unplayable edge cannot be a drink interaction');
assert.equal(ew.regionAt(.5,40.5),0,'land connectivity cannot route around an unplayable edge');
console.log('freshwater drinking and playable-bank access: PASS');
