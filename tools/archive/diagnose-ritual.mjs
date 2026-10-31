import assert from 'node:assert/strict';
import {Simulation} from '../../src/sim/simulation.js';
import {SPECIES} from '../../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../../src/persistence/save-manager.js';
import {availableCourtshipMoves,chooseCourtshipSequence,performCourtship,activeCourtship,
  performedMateChoice,ritualAppeal,courtshipContest,learnCourtshipOutcome,observedRituals,
  courtshipCost,currentCourtshipMove} from '../../src/reproduction/courtship-performance.js';
import {matePreferencesFor} from '../../src/reproduction/mate-preferences.js';
import {registryProblems} from '../../src/lineage/part-registry.js';

assert.deepEqual(registryProblems(),[],'all declared part actions have a single registry authority');
const world=new Simulation('EVOLVING-RITUALS-TEST',{player:false});
const [a,b,c]=world.animals.filter(x=>x.species==='rootling').slice(0,3),s=SPECIES.rootling;
for(const x of [a,b,c]){
  x.age=s.maturity+10;x.reproCooldown=0;x.pregnant=null;x.health=100;x.energy=s.maxEnergy*.99;
  x.hydration=s.maxHydration*.99;x.infected=false;x.reproDrive=1;
  x.x=41;x.y=41;x.matePreferences={weights:{size:0,strength:0,ornament:0,display:0,behavior:0},selectivity:.5,
    ritualTastes:{dance:-1,call:1,flare:1,scent:0,gesture:0},tempo:0};
}
a.sex=c.sex='M';b.sex='F';a.intent=c.intent='mate';a.target=c.target=b;
// A biological ability must come from an actual, mounted part. No phantom moves.
a.bodyPlan={nodes:[{partId:'small-torso'},{partId:'walking-leg'},{partId:'grazing-mouth'}]};
assert.deepEqual(availableCourtshipMoves(a),['call','dance']);
a.bodyPlan={nodes:[{partId:'small-torso'},{partId:'walking-leg'},{partId:'grazing-mouth'},{partId:'display-frill'}]};
assert.deepEqual(availableCourtshipMoves(a),['call','dance','flare']);
a.bodyPlan={nodes:[{partId:'small-torso'}]};
assert.deepEqual(availableCourtshipMoves(a),[]);
assert.deepEqual(chooseCourtshipSequence(world,a),['approach'],'a body without a signal can still court');
a.bodyPlan={nodes:[{partId:'small-torso'},{partId:'walking-leg'},{partId:'grazing-mouth'},{partId:'display-frill'}]};
const prefs=matePreferencesFor(world.seed,b);
assert.equal(prefs.ritualTastes.call,1);
const favorable={partnerId:b.id,sequence:['call','flare'],quality:.9,tempo:0};
const different={...favorable,sequence:['dance']};
assert.ok(ritualAppeal(world,b,a,favorable)>ritualAppeal(world,b,a,different),'recipient favors call-flare, not a global best ritual');
// Soft choice remains optional, genuinely fallible and capable of unusual success.
const outcomes=new Set();
for(let attempt=0;attempt<240;attempt++){
  a.completedCourtship={...different,attempt,endsAt:world.tickCount};
  const result=performedMateChoice(world,a,b);assert.ok(result);
  outcomes.add(result.accepted);
  assert.ok(result.chances.every(p=>p>0&&p<1),'no preference creates certain refusal or success');
}
assert.deepEqual([...outcomes].sort(),[false,true],'repeated unconventional performances can sometimes succeed, never guaranteed');
// Rivalry is comparative and only changes a probability, never locks a loser out.
a.completedCourtship={...favorable,attempt:900,endsAt:world.tickCount};
c.completedCourtship={...different,attempt:900,endsAt:world.tickCount};
world.animals=[a,b,c];world.rebuildSpatial();
const rival=courtshipContest(world,b);
assert.equal(rival.contenders.length,2);
assert.ok(performedMateChoice(world,c,b).chances.every(p=>p>0),'less-favored rival still has a chance');
// A genuine finite action is charged once, survives saving, and can be interrupted.
a.completedCourtship=null;a.courtshipLearning={attempts:0,patterns:{'call>flare':{success:4,failure:0,observed:0}}};
for(const x of [b,c])x.bodyPlan=structuredClone(a.bodyPlan);
const pre=a.energy;const rng=world.rng.state;
assert.equal(performCourtship(world,a,b),false);
assert.deepEqual(a.courtshipPerformance.sequence,['call','flare'],'personal prior success informs learned performance');
assert.ok(a.energy<pre);
assert.equal(world.rng.state,rng,'exploration and performance leave shared ecological RNG unchanged');
assert.equal(currentCourtshipMove(world,a),'call');
const saved=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(world)));
assert.deepEqual(saved.animals.find(x=>x.id===a.id).courtshipPerformance.sequence,['call','flare']);
world.tickCount=a.courtshipPerformance.endsAt;
assert.equal(currentCourtshipMove(world,a),'flare');
assert.equal(performCourtship(world,a,b),true);
assert.deepEqual(a.completedCourtship.sequence,['call','flare']);
assert.equal(a.courtshipPerformance,null);
learnCourtshipOutcome(world,a,b,true);
assert.ok(a.courtshipLearning.patterns['call>flare'].success>=5);
assert.ok(b.courtshipLearning.patterns['call>flare'].observed>=1,'partner learns from observed success');
assert.ok(c.courtshipLearning.patterns['call>flare'].observed>=1,'witness can imitate without genetic inheritance');
assert.equal(a.completedCourtship,null);
assert.equal(observedRituals(world,'rootling')[0][0],'call>flare');
// The learned social sequence cannot grant a missing anatomical part.
a.bodyPlan={nodes:[{partId:'small-torso'},{partId:'walking-leg'}]};
a.courtshipLearning.attempts=0;
assert.ok(chooseCourtshipSequence(world,a).every(move=>['dance'].includes(move)));
assert.equal(availableCourtshipMoves(a).includes('call'),false);
assert.equal(activeCourtship(world,a),null);
const playerWorld=new Simulation('PLAYER-RITUAL-QUEUE',{player:true});
const player=playerWorld.player(),moves=availableCourtshipMoves(player);
assert.ok(moves.length>0,'founder body has at least one actual ritual move');
assert.equal(playerWorld.reproduction.queueRitualMove('scent').ok,moves.includes('scent'),'unavailable anatomy cannot queue scent');
playerWorld.reproduction.clearRitualQueue();
assert.equal(playerWorld.reproduction.queueRitualMove(moves[0]).ok,true);
assert.equal(playerWorld.reproduction.queueRitualMove(moves[0]).ok,true,'players can deliberately repeat a dance or call');
assert.deepEqual(playerWorld.reproduction.ritualQueue,[moves[0],moves[0]]);
playerWorld.reproduction.clearRitualQueue();
assert.deepEqual(playerWorld.reproduction.ritualQueue,[]);
// Full conception authority: an isolated dance-only animal can encounter a
// call/flare-preferring mate, fail real attempts, then succeed without any
// magical anatomy, fixed script or fertility adjustment.
const isolated=new Simulation('ISOLATED-BODY-RITUAL-REPRO',{player:false});
const [performer,recipient]=isolated.animals.filter(x=>x.species==='rootling').slice(0,2);
isolated.animals=[performer,recipient];const spec=SPECIES.rootling;
for(const x of [performer,recipient])Object.assign(x,{x:40,y:40,age:spec.maturity+10,health:100,
  energy:spec.maxEnergy*.99,hydration:spec.maxHydration*.99,reproCooldown:0,infected:false,
  pregnant:null,parentIds:[],reproDrive:1});
performer.sex='M';recipient.sex='F';performer.intent='mate';performer.target=recipient;
performer.bodyPlan={nodes:[{partId:'small-torso'},{partId:'walking-leg'}]};
const emptyWeights={size:0,strength:0,ornament:0,display:0,behavior:0};
performer.matePreferences={weights:emptyWeights,selectivity:.5,ritualTastes:{dance:1,call:0,flare:0,scent:0,gesture:0},tempo:0};
recipient.matePreferences={weights:emptyWeights,selectivity:.5,ritualTastes:{dance:-1,call:1,flare:1,scent:0,gesture:0},tempo:0};
isolated.rebuildSpatial();console.log('INITIAL CONCEPTION GATES',JSON.stringify({performer:isolated.carrying.breedingState(performer),recipient:isolated.carrying.breedingState(recipient),occupied:isolated.canOccupy(performer,40,40)}));let declined=0,conceived=false;
for(let attempt=0;attempt<35&&!conceived;attempt++){
  performer.intent='mate';performer.target=recipient;performer.queuedCourtshipSequence=['dance'];
  assert.equal(performCourtship(isolated,performer,recipient),false);
  assert.deepEqual(performer.courtshipPerformance.sequence,['dance']);
  isolated.tickCount=performer.courtshipPerformance.endsAt;
  assert.equal(performCourtship(isolated,performer,recipient),true);
  conceived=isolated.tryMate(performer,recipient);
  if(!conceived)declined++;
}
console.log('FINAL CONCEPTION STATE',JSON.stringify({declined,conceived,attempt:performer.lastReproductiveAttempt,refusal:performer.lastCourtshipRefusal,energy:performer.energy}));assert.ok(declined>0&&conceived&&recipient.pregnant,'real, limited, finite-cost repeated dance sometimes conceives with mismatch');
assert.ok(performer.courtshipLearning.patterns.dance.success>0,'successful dance becomes learned');
console.log('evolving-courtship-rituals: anatomical repertoire, taste, optional attempts, social learning, save/load and ecology RNG PASS');
