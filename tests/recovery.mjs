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

// Founder-relative recovery assertions are preserved in the dated repair report.
// Population authoring counts cannot change runtime behavior at fixed biology.
const before={drive:sim.recovery.driveBoost('rootling'),near:sim.recovery.mateRadius('rootling'),far:sim.recovery.mateRadius('rootling',{far:true})},initial=CFG.initial.rootling;
try{CFG.initial.rootling=1;assert.deepEqual({drive:sim.recovery.driveBoost('rootling'),near:sim.recovery.mateRadius('rootling'),far:sim.recovery.mateRadius('rootling',{far:true})},before)}finally{CFG.initial.rootling=initial}
assert.equal(before.drive,1);assert.equal(before.near,12);assert.equal(before.far,20);assert.equal(sim.recovery.mayRelaxSibling(a),false);
const pred=sim.animals.find(x=>x.alive&&x.species==='needlejaw');
for(const energy of [10,60,120]){pred.energy=energy;assert.equal(sim.recovery.preyIsRefuged(pred,'rootling',{rootling:1,mosskip:80},{rootling:2}),false)}
console.log('founder-independent opportunity and retained kinship/inbreeding checks: PASS');
