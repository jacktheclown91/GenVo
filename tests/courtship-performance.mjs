import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {performCourtship,activeCourtship,courtshipContest,displayIntensity,courtshipCost,COURTSHIP_PERFORMANCE,performedMateChoice,learnCourtshipOutcome} from '../src/reproduction/courtship-performance.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('COURTSHIP-PERFORMANCE-TEST',{player:false});
const [a,b,c]=sim.animals.filter(v=>v.species==='rootling').slice(0,3);
assert.ok(a&&b&&c,'three natural creatures exist');
const species=SPECIES.rootling;
const neutral={weights:{size:0,strength:0,ornament:0,display:0,behavior:0},selectivity:.5};
const strongSize={weights:{...neutral.weights,size:1},selectivity:.3};
for(const x of [a,b,c]){
  x.age=species.maturity+25;x.pregnant=null;x.reproCooldown=0;x.health=100;x.infected=false;
  x.energy=species.maxEnergy*.98;x.hydration=species.maxHydration*.98;
  x.matePreferences=structuredClone(neutral);x.reproDrive=1;
}
a.sex=c.sex='M';b.sex='F';b.matePreferences=strongSize;
a.genes.body=1.23;c.genes.body=.93;
const loc={x:40,y:40};
for(const [i,x] of [a,b,c].entries()){x.x=loc.x+i*.08;x.y=loc.y;x.intent=i===1?'idle':'mate';x.target=i===1?null:b;}
assert.ok(sim.canMatePair(a,b,{ready:true}));
assert.ok(sim.canMatePair(c,b,{ready:true}));
let contest=courtshipContest(sim,b);
assert.deepEqual(contest.contenders,[a.id,c.id],'the receiver prefers the larger phenotype without a male-only dominance role');
const original=sim.rng.state,energy=a.energy;
assert.equal(performCourtship(sim,c,b),false,'losing local rival does not conceive');
assert.ok(c.courtshipPerformance,'a less-preferred suitor can still perform a genuine ritual');
assert.ok(c.energy<species.maxEnergy*.98,'a less-preferred suitor pays real energy too');
assert.equal(performCourtship(sim,a,b),false,'first arrival begins a finite display');
assert.ok(a.courtshipPerformance,'real display state recorded');
assert.ok(Math.abs(a.energy-(energy-courtshipCost(a,a.courtshipPerformance.sequence)))<1e-8,'real energy spent once');
assert.equal(sim.rng.state,original,'display and contest do not consume ecology RNG');
assert.equal(performCourtship(sim,a,b),false,'no premature reproduction');
assert.ok(Math.abs(a.energy-(energy-courtshipCost(a,a.courtshipPerformance.sequence)))<1e-8,'repeated checks do not double-charge');
assert.equal(activeCourtship(sim,a)?.id,b.id,'the display can hold a valid partner briefly');
const snapshot=structuredClone(createSimulationSnapshot(sim));
const restored=restoreSimulationSnapshot(snapshot);
assert.equal(restored.animals.find(x=>x.id===a.id).courtshipPerformance.partnerId,b.id,'display survives save/load');
sim.tickCount=a.courtshipPerformance.endsAt;
assert.equal(performCourtship(sim,a,b),true,'completed display delegates to the normal mating authority');
assert.equal(a.courtshipPerformance,null,'completed display cannot be replayed for free');
assert.equal(sim.rng.state,original,'display completion has no random selection');
// Inherited dislike is a preference, not a permanent mating prohibition.
b.matePreferences={weights:{...neutral.weights,size:-1},selectivity:1};
a.completedCourtship={partnerId:b.id,sequence:['dance'],attempt:30,endsAt:sim.tickCount,quality:.65,tempo:0};
const soft=performedMateChoice(sim,a,b);
assert.ok(soft.chances.every(p=>p>0&&p<1),'mutual acceptance is fallible but never impossible on taste alone');
a.completedCourtship=null;
// Strong competing display can change the receiver's preferred winner; the sex roles do not.
b.matePreferences={weights:{...neutral.weights,size:-1},selectivity:.3};
a.matePreferences=structuredClone(neutral);c.matePreferences=structuredClone(neutral);
for(const x of [a,c]){x.intent='mate';x.target=b}
contest=courtshipContest(sim,b);
assert.equal(contest.winner.id,c.id,'opposing inherited tastes reverse the rival outcome');
assert.ok(displayIntensity(a)>=0&&displayIntensity(a)<=1);
assert.ok(COURTSHIP_PERFORMANCE.beats>0);
// Actual need can interrupt a paid display; it does not get an automatic conception.
b.matePreferences=structuredClone(neutral);a.intent='mate';a.target=b;c.intent='idle';c.target=null;
assert.equal(performCourtship(sim,a,b),false);
assert.ok(a.courtshipPerformance);
a.x+=3;
assert.equal(activeCourtship(sim,a),null,'moving away ends courtship');
assert.equal(a.courtshipPerformance,null);

// Verify the full gameplay interaction calls the new stage rather than conceiving on contact.
for(const x of [a,b]){x.reproCooldown=0;x.pregnant=null;x.health=100;x.energy=species.maxEnergy*.98;x.hydration=species.maxHydration*.98}
b.matePreferences=structuredClone(neutral);
a.intent='mate';a.target=b;c.intent='idle';c.target=null;a.x=b.x;a.y=b.y;
a.courtshipPerformance=null;
sim.resolveInteraction(a);
assert.ok(a.courtshipPerformance,'live interaction begins courtship before tryMate');
assert.equal(b.pregnant,null,'arrival itself cannot automatically conceive');
const stagedUntil=a.courtshipPerformance.endsAt;
sim.tickCount=stagedUntil;
sim.resolveInteraction(a);
assert.equal(a.courtshipPerformance,null,'live interaction completes or rejects with no parallel gestation path');

console.log('courtship-performance: anatomy-costed action, nonbinding competition, soft consent, persistence and interruption PASS');
