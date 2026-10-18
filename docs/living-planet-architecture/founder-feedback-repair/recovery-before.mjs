import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';

const sim=new Simulation('GENVO8-RECOVERY',{player:false});
const roots=sim.animals.filter(a=>a.alive&&a.species==='rootling');
assert.ok(roots.length>=4,'expected starter rootlings');

// Build a synthetic sibling pair without changing the population itself.
const a=roots[0],b=roots[1],parentA=900001,parentB=900002;
a.parentIds=[parentA,parentB]; b.parentIds=[parentA,parentB]; a.sex='F'; b.sex='M';
assert.equal(sim.recovery.kinship(a,b),'sibling');
assert.equal(sim.recovery.inbreedingLoad([a,b]),.18);

// Direct parent/child relationships never qualify for relaxed mating.
const child=roots[2];child.parentIds=[a.id,999999];
assert.equal(sim.recovery.kinship(a,child),'direct');

// Low-density state strengthens recovery but still creates no organisms.
sim._decisionPopulation={...sim.population(),rootling:Math.max(2,Math.floor(CFG.initial.rootling*.3)),genvo:CFG.initial.genvo,mosskip:CFG.initial.mosskip,needlejaw:CFG.initial.needlejaw};
assert.ok(sim.recovery.critical('rootling'));
assert.ok(sim.recovery.driveBoost('rootling')>1);
assert.ok(sim.recovery.mateRadius('rootling',{far:true})>50);
assert.ok(sim.recovery.mayRelaxSibling(a));

// Predators switch away from rare prey while common alternatives exist unless
// they are in an actual starvation emergency.
const pred=sim.animals.find(x=>x.alive&&x.species==='needlejaw');
pred.energy=120;
const rareGlobal={mosskip:80,rootling:6,needlejaw:10,genvo:24};
assert.equal(sim.recovery.preyIsRefuged(pred,'rootling',rareGlobal),true);
pred.energy=10;
assert.equal(sim.recovery.preyIsRefuged(pred,'rootling',rareGlobal),false);

// A well-fed hunter must not suppress its only local recovering cohort merely
// because abundant alternatives live on an unreachable island.
pred.energy=120;
assert.equal(sim.recovery.preyIsRefuged(pred,'rootling',rareGlobal,{rootling:2}),true);
pred.energy=60;
assert.equal(sim.recovery.preyIsRefuged(pred,'rootling',rareGlobal,{rootling:2}),false,'hungry hunters can use their only local prey');
pred.energy=10;
assert.equal(sim.recovery.preyIsRefuged(pred,'rootling',rareGlobal,{rootling:2,mosskip:30}),false,'starvation overrides refuge even with alternatives');

console.log('low-density recovery + rare-prey refuge checks: PASS');
