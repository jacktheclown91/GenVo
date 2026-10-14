import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('GENVO8-ONBOARD',{player:true});
const p=sim.player(),spec=SPECIES[p.species];
assert.ok(p,'founder exists');
assert.ok(p.age>=spec.maturity,'founder starts adult');
assert.ok(p.energy/spec.maxEnergy>=.9,'founder starts well-fed');
assert.ok(p.hydration/spec.maxHydration>=.88,'founder starts hydrated');
assert.equal(p.reproCooldown,0,'founder starts reproductively ready');
const mate=sim.animals.find(a=>a.id===sim.starterMateId);
assert.ok(mate&&mate.alive,'starter mate exists');
assert.notEqual(mate.sex,p.sex,'starter mate is compatible sex');
assert.ok(mate.age>=spec.maturity&&mate.reproCooldown===0,'starter mate is mature and ready');
assert.ok(Math.hypot(mate.x-p.x,mate.y-p.y)<=26,'starter mate is within learnable range');
assert.equal(sim.isOpeningProtected(p),true,'founder gets opening protection');
assert.equal(sim.isOpeningProtected(mate),true,'starter mate gets opening protection');

const startDay=sim.day;
for(let i=0;i<CFG.dayTicks-1;i++)sim.update(null);
assert.equal(sim.day,startDay,'day does not advance early');
sim.update(null);
assert.equal(sim.day,startDay+1,'one day uses the slower readable clock');

const moveSim=new Simulation('GENVO8-MOVE-ONBOARD',{player:true});
const mp=moveSim.player(),mx=mp.x,my=mp.y;
moveSim.update({right:true});
assert.ok(Math.hypot(mp.x-mx,mp.y-my)>0,'manual movement remains responsive between ecology steps');

const waterSim=new Simulation('GENVO8-WATER-ONBOARD',{player:true});
const wp=waterSim.player(),spot=waterSim.world.nearestDrinkable(wp.x,wp.y,40);
assert.ok(spot,'starter region has reachable shoreline water');
wp.x=spot.x;wp.y=spot.y;wp.hydration=spec.maxHydration*.4;
const result=waterSim.playerInteract();
assert.equal(result.type,'drink');
assert.ok(wp.hydration>spec.maxHydration*.4,'E interaction restores water');

const pred=sim.animals.find(a=>a.species==='needlejaw'&&a.alive);
const before=p.health;sim.tryKill(pred,p);assert.equal(p.health,before,'opening protection blocks predator damage');
console.log('onboarding + pacing checks: PASS');
