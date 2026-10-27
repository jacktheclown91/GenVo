import assert from 'node:assert/strict';
import {PopulationPressureMemoryController} from '../src/ecology/population-memory.js';
import {AUTONOMOUS_POPULATIONS,AUTONOMOUS_POPULATIONS_V1} from '../src/ecology/autonomous-founding.js';
import {installFoundingObservation} from '../tools/founding-observation.mjs';
import {Simulation} from '../src/sim/simulation.js';
import {ProtoSpeciationController} from '../src/lineage/proto-speciation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {dayTicksFor,DAY_CLOCK} from '../src/sim/day-clock.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';
import {performCourtship} from '../src/reproduction/courtship-performance.js';
import {preparePlanetaryDestination,planetaryPreparationKey} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Controlled ledger mechanics, not a natural-birth claim. Resource eligibility
// is an input from the existing breeding authority; no biology is simulated here.
function fixture({supported=true,count=4,breedingAllowed=supported,policy=AUTONOMOUS_POPULATIONS.policy}={}) {
  const sim={autonomousPopulationRules:policy,day:1,tickCount:0,
    world:{regionOrigin:{x:0,y:0}},animals:[],canReach:()=>true,
    carrying:{breedingState:()=>({allowed:breedingAllowed,support:{share:supported?1:0,need:1.5}})}};
  for(let i=0;i<count;i++)sim.animals.push({id:i+1,alive:true,species:'genvo',lineage:false,age:50,x:20+i*.2,y:20});
  const memory=new PopulationPressureMemoryController(sim);sim.populationMemory=memory;
  const day=()=>{memory.advanceDay();sim.day++;sim.tickCount+=240};
  const birth=(mother=sim.animals[0],father=sim.animals[1])=>{
    const child={id:sim.animals.length+1,alive:true,species:'genvo',lineage:false,age:0,x:mother.x+.1,y:mother.y};
    sim.animals.push(child);memory.noteBirth(child,[mother,father]);return child;
  };
  return{sim,memory,day,birth};
}
// Legacy player G3/home routing must not borrow an unrelated natural cohort
// through the older nearest-secondary fallback when natural membership refuses.
const routing=fixture();routing.sim.territory={cellSize:6};const lineageAnimal=routing.sim.animals[0];lineageAnimal.lineage=true;
const home={key:'home',id:'home',kind:'home',primary:true,x:60,y:60};
const unrelatedNatural={key:'natural:other',id:'natural:other',kind:'autonomous',
  species:'mosskip',primary:false,x:lineageAnimal.x,y:lineageAnimal.y};
assert.equal(routing.memory.populationForAnimal(lineageAnimal,[home,unrelatedNatural]),home,
  'Player population fallback cannot assign an unrelated natural population');
assert.equal(routing.memory.populationForAnimal(lineageAnimal,[unrelatedNatural]),null,
  'Absent a legacy home or centre, unrelated natural cohorts remain unassigned');

// Regional sources must respect physical disconnection even for identical
// founding labels, and must not duplicate a coextensive local community.
const islands=fixture({count:8});
for(const animal of islands.sim.animals.slice(4))animal.x+=50;
islands.sim.canReach=(animal,x)=> (animal.x<40)===(x<40);
islands.day();islands.birth();islands.birth(islands.sim.animals[4],islands.sim.animals[5]);
islands.day();islands.birth();islands.birth(islands.sim.animals[4],islands.sim.animals[5]);
for(let i=0;i<12;i++)islands.day();
const islandRoots=islands.memory.populations();
assert.equal(islandRoots.length,2,'Each independently recruited reachable component establishes once');
assert.ok(islandRoots.every(pop=>pop.scope==='regional-source'));
assert.equal(new Set(islandRoots.flatMap(pop=>[...pop.memberIds])).size,12);
assert.ok([...islandRoots[0].memberIds].every(id=>!islandRoots[1].memberIds.has(id)));
assert.ok(islandRoots.every(pop=>pop.recruits.size===2&&pop.litters.size===2));

// One supported mouth cannot lend its survey result to other bodies, even
// when regional and local records both observe the same animals that day.
const distinctMouths=fixture();const observations=new Map();
distinctMouths.memory.supportsMaintenance=animal=>{
 observations.set(animal.id,(observations.get(animal.id)||0)+1);return animal.id===1;
};
distinctMouths.day();
assert.ok([...observations.values()].every(count=>count===1),'Same body observation reused within this census only');
assert.ok(observations.has(2),'A second body receives its own maintenance assessment');
distinctMouths.birth();distinctMouths.day();distinctMouths.birth();
for(let i=0;i<12;i++)distinctMouths.day();
assert.equal(distinctMouths.memory.populations().length,0,'One supported adult cannot satisfy two-adult support');

// An established wild regional source cannot shadow an existing player G3
// centre; the proto authority consumes this same canonical routing decision.
const rooted=fixture();rooted.day();rooted.birth();rooted.day();rooted.birth();
for(let i=0;i<12;i++)rooted.day();
const resident=rooted.sim.animals[0],root=rooted.memory.populations()[0];
resident.lineage=true;rooted.sim.territory={cellSize:6};
const centre={id:99,key:'center:99',kind:'satellite',primary:false,x:20,y:20};
rooted.memory.assignedCenter=()=>centre;
assert.equal(rooted.memory.populationForAnimal(resident,[root,centre]),centre,
 'Player assigned centre takes priority over a regional wildlife source');
const protoRouting=new ProtoSpeciationController(rooted.sim);
assert.equal(protoRouting.sourcePopulationFor(resident).key,root.key,
 'Absent a real listed centre, proto uses actual membership');
rooted.sim.generationProgress={centers:()=>[centre]};
assert.equal(protoRouting.sourcePopulationFor(resident).key,centre.key,
 'Proto inheritance uses the same existing G3 centre when present');

const wanderer=fixture({count:1});for(let i=0;i<20;i++)wanderer.day();
assert.equal(wanderer.memory.natural.records.size,0,'One wanderer never founds a population');

const gathering=fixture();for(let i=0;i<20;i++)gathering.day();
assert.equal(gathering.memory.populations().length,0,'Residence and numbers without births are insufficient');
const separated=fixture();separated.sim.canReach=(animal,x,y)=>animal.x===x&&animal.y===y;
for(let i=0;i<10;i++)separated.day();
assert.equal(separated.memory.natural.records.size,0,'Unreachable nearby organisms do not form a geographic cohort');

const oneLitter=fixture();oneLitter.day();oneLitter.birth();oneLitter.birth();
for(let i=0;i<20;i++)oneLitter.day();
assert.equal(oneLitter.memory.populations().length,0,'Several children in one litter are not independent recruitment events');

const unsupported=fixture({supported:false});unsupported.day();unsupported.birth();unsupported.day();unsupported.birth();
for(let i=0;i<20;i++)unsupported.day();
assert.equal(unsupported.memory.populations().length,0,'Births cannot override missing current finite-food support');

// A cohort may sustain its current members without the reproductive surplus
// needed for another brood. Founding observes that distinction; it grants no food.
const maintenanceOnly=fixture({breedingAllowed:false});
assert.equal(maintenanceOnly.sim.carrying.breedingState().allowed,false);
maintenanceOnly.day();maintenanceOnly.birth();maintenanceOnly.day();maintenanceOnly.birth();
for(let i=0;i<10;i++)maintenanceOnly.day();
assert.equal(maintenanceOnly.memory.populations().length,1,
  'Existing paid recruits and maintenance support do not require surplus for another brood');

const failedRecruits=fixture();failedRecruits.day();const lost=failedRecruits.birth();failedRecruits.day();failedRecruits.birth();
lost.alive=false;failedRecruits.memory.noteDeath(lost,'controlled-fixture');
for(let i=0;i<20;i++)failedRecruits.day();
assert.equal(failedRecruits.memory.populations().length,0,'Dead offspring cannot satisfy living recruitment');

const established=fixture();established.day();established.birth();established.day();established.birth();
for(let i=0;i<10;i++)established.day();
const populations=established.memory.populations();assert.equal(populations.length,1);
const population=populations[0];assert.equal(population.kind,'autonomous');
assert.equal(population.status,'established');assert.equal(population.recruits.size,2);
assert.ok(established.sim.animals.every(a=>!a.lineage),'No player ancestry is manufactured');
assert.ok(established.sim.animals.every(a=>a.geographicPopulation.key===population.key));
const identity=population.key;
for(let i=0;i<10;i++)established.day();
assert.equal(established.memory.populations()[0].key,identity,'Successful occupancy keeps identity');
for(const a of established.sim.animals){a.alive=false;established.memory.noteDeath(a,'controlled-fixture')}
for(let i=0;i<AUTONOMOUS_POPULATIONS.absenceDays+1;i++)established.day();
assert.equal(population.status,'extinct');assert.ok(population.endedDay);
assert.equal(established.memory.populations()[0].key,identity,'Extinction history is retained');

// Controlled dispersal verifies identity mechanics independently of whether a
// particular natural field happens to establish a daughter population.
const splitting=fixture({count:8});splitting.day();splitting.birth();splitting.day();splitting.birth();
for(let i=0;i<10;i++)splitting.day();
const source=splitting.memory.populations()[0],sourceKey=source.key;
const migrants=splitting.sim.animals.slice(4,8);
for(const animal of migrants){animal.x=64+(animal.id-5)*.2;animal.y=20}
splitting.day();
assert.equal(splitting.memory.populations().length,1,'Dispersal alone cannot found a daughter');
splitting.birth(migrants[0],migrants[1]);splitting.day();splitting.birth(migrants[0],migrants[1]);
for(let i=0;i<10;i++)splitting.day();
assert.equal(splitting.memory.populations().length,2);
const daughter=splitting.memory.populations().find(pop=>pop.key!==sourceKey);
assert.deepEqual(daughter.parentPopulationKeys,[sourceKey]);
assert.equal(source.status,'established','The reproducing original community retains identity');
assert.ok(migrants.every(animal=>animal.geographicPopulation.originKey===sourceKey&&
  animal.geographicPopulation.key===daughter.key));
assert.ok(splitting.sim.animals.every(animal=>animal.lineage===false));

// Local extinction history cannot be overwritten by a later occupied cohort.
const replacement=fixture();replacement.day();replacement.birth();replacement.day();replacement.birth();
for(let i=0;i<10;i++)replacement.day();
const extinct=replacement.memory.populations()[0];
for(const animal of replacement.sim.animals)animal.alive=false;
for(let i=0;i<AUTONOMOUS_POPULATIONS.absenceDays+1;i++)replacement.day();
const firstNewId=replacement.sim.animals.length+1;
for(let i=0;i<4;i++)replacement.sim.animals.push({id:firstNewId+i,alive:true,
  species:'genvo',lineage:false,age:50,x:20+i*.2,y:20});
const newParents=replacement.sim.animals.slice(-4);
replacement.day();replacement.birth(newParents[0],newParents[1]);replacement.day();
replacement.birth(newParents[0],newParents[1]);for(let i=0;i<10;i++)replacement.day();
assert.equal(extinct.status,'extinct');
const renewed=replacement.memory.populations().find(pop=>pop.status==='established');
assert.ok(renewed);assert.notEqual(renewed.key,extinct.key);
assert.equal(replacement.memory.populationByKey(extinct.key),extinct);

// Two overlapping census candidates retain separate identities until actual
// surviving local offspring connect their resident parents. This ledger fixture
// stages contact, not courtship or natural dispersal; actual funding is tested below.
function contactFixture({policy=AUTONOMOUS_POPULATIONS.policy,dead=false,distant=false}={}){
 const f=fixture({policy});
 for(let i=0;i<4;i++)f.sim.animals.push({id:i+5,alive:true,species:'genvo',lineage:false,age:50,x:33+i*.1,y:20});
 f.day();f.day();
 const initial=[...f.memory.natural.records.values()].filter(p=>p.scope!=='regional-source');assert.equal(initial.length,2);
 if(policy===AUTONOMOUS_POPULATIONS.policy)assert.equal([...f.memory.natural.records.values()].filter(p=>p.scope==='regional-source').length,1);
 if(!distant)for(const animal of f.sim.animals.slice(4))animal.x=31.8+(animal.id-5)*.01;
 f.day();
 assert.equal(f.memory.natural.events.filter(e=>e.type==='candidate-joined').length,0,
  'Overlapping residence alone cannot join census histories');
 const child=f.birth(f.sim.animals[0],f.sim.animals[4]);if(dead)child.alive=false;
 for(let i=0;i<4;i++)f.day();
 return{...f,initial,child};
}
const contacted=contactFixture();
assert.equal(contacted.memory.natural.events.filter(e=>e.type==='candidate-joined').length,1);
const joined=contacted.initial.find(p=>p.status==='merged');assert.ok(joined);
const retained=contacted.memory.natural.records.get(joined.mergedInto);
assert.ok(retained.candidateKeys.has(joined.key));
assert.equal(joined.establishedDay,null,'Joining candidates does not establish a population');
assert.equal(contacted.memory.populations().length,0,'One paid contact cannot bypass the existing two-litter gate');
assert.ok(contacted.memory.natural.births.get(contacted.child.id).residentKeys.includes(joined.key),
 'Original birth provenance is retained rather than rewritten to the joined ID');
for(const options of [{policy:AUTONOMOUS_POPULATIONS_V1.policy},{dead:true},{distant:true}]){
 const f=contactFixture(options);
 assert.equal(f.memory.natural.events.filter(e=>e.type==='candidate-joined').length,0,
  'Legacy policy, dead offspring or a distant candidate cannot grant demographic joining');
}

// Controlled occupied-time regression: ordinary outings at the census moment
// must not erase a community that actually inhabits its core most of each day.
// Positions, observation timing and birth inputs are staged ledger fixtures.
function outingFixture(policy,{passing=false}={}){
 const f=fixture({policy});f.sim.territory={cellSize:8};f.sim.dayClockRules=DAY_CLOCK.policy;
 f.day();
 for(let day=0;day<16;day++){
  for(const animal of f.sim.animals){animal.x=20+(animal.id%4)*.2;animal.y=20}
  if(day<2)f.birth();
  const steps=dayTicksFor(f.sim)/CFG.lifeStride;
  for(let step=0;step<steps;step++){
   for(const animal of f.sim.animals){animal.x=(passing?(step===steps-1?20:70):(step<steps*.75?20:38))+(animal.id%4)*.2;animal.y=20}
   f.sim.tickCount+=CFG.lifeStride;f.memory.observeResidence();
  }
  f.memory.advanceDay();f.sim.day++;
 }
 return f;
}
const lived=outingFixture(AUTONOMOUS_POPULATIONS.policy);
assert.equal(lived.memory.populations().length,1,'Real occupied time preserves residence during a brief foraging outing');
assert.ok(lived.sim.animals.every(animal=>animal.x>37&&animal.geographicPopulation),
 'Resident identities remain separate from the current foraging position');
const flash=outingFixture(AUTONOMOUS_POPULATIONS_V1.policy);
assert.equal(flash.memory.populations().length,0,'The frozen v1 daily-position rule retains its original result');
assert.equal(flash.memory.natural.spatialResidence,undefined,'Historical v1 gains no spatial records');
const passing=outingFixture(AUTONOMOUS_POPULATIONS.policy,{passing:true});
assert.ok(passing.memory.populations().every(pop=>Math.hypot(pop.x-20,pop.y-20)>AUTONOMOUS_POPULATIONS.radius),
 'A brief daily visit cannot establish a community there; a real distant home remains eligible');
const oldPassing=outingFixture(AUTONOMOUS_POPULATIONS_V1.policy,{passing:true});
assert.equal(oldPassing.memory.populations().length,1,
 'The original v1 point census retains its demonstrable brief-visit false positive');
const originalResidence=lived.memory.populations()[0];
for(let day=0;day<AUTONOMOUS_POPULATIONS.absenceDays+2;day++){
 for(let step=0;step<dayTicksFor(lived.sim)/CFG.lifeStride;step++){
  for(const animal of lived.sim.animals){animal.x=70+(animal.id%4)*.2;animal.y=20}
  lived.sim.tickCount+=CFG.lifeStride;lived.memory.observeResidence();
 }
 lived.memory.advanceDay();lived.sim.day++;
}
assert.equal(originalResidence.status,'established',
 'A regional source retains its identity as the same community moves within the connected region');
assert.ok(originalResidence.x>60,'The occupied point follows the actual new home; obsolete core evidence expires');


// A coherent unfounded community can actually move more than one census
// radius between days; no organism is moved by population memory itself.
function movingFixture(policy){
 const f=fixture({policy});f.day();f.birth();f.day();f.birth();
 for(let day=0;day<12;day++){
  for(const animal of f.sim.animals){animal.x=day%2?20:40;animal.y=20+animal.id*.01}
  f.day();
 }
 return f;
}
const moving=movingFixture(AUTONOMOUS_POPULATIONS.policy);
assert.ok(moving.memory.natural.records.size<3,'Known cohesive residents retain candidate identity through real movement');
assert.equal(movingFixture(AUTONOMOUS_POPULATIONS_V1.policy).memory.populations().length,0,
 'The original fixed-before-assignment census loses a moving candidate as recorded');

const merging=fixture();
for(let i=0;i<4;i++)merging.sim.animals.push({id:i+5,alive:true,species:'genvo',lineage:false,age:50,x:64+i*.2,y:20});
merging.day();merging.birth();merging.birth(merging.sim.animals[4],merging.sim.animals[5]);
merging.day();merging.birth();merging.birth(merging.sim.animals[4],merging.sim.animals[5]);
for(let i=0;i<10;i++)merging.day();
assert.equal(merging.memory.populations().length,2,'Separate recruited cohorts found separate populations');
const [left,right]=merging.memory.populations().sort((a,b)=>a.x-b.x);
for(const a of merging.sim.animals)if(right.memberIds.has(a.id)){a.x=20+a.id*.01;a.y=20}
merging.day();
assert.notEqual(right.status,'merged','A gathering alone cannot merge established histories');
merging.birth(merging.sim.animals[4],merging.sim.animals[0]);
for(let i=0;i<3;i++)merging.day();
assert.equal(right.status,'merged');assert.equal(right.mergedInto,left.key);
assert.ok(merging.memory.natural.events.some(e=>e.type==='merged'&&e.recruitedMixedOffspring.length));
assert.equal(merging.sim.animals[4].geographicPopulation.originKey,right.key,'Migration preserves origin separately from current residence');

// Actual canonical conception, newborn hooks and maternal payments connect to
// the ledger. This is a controlled integration fixture: initial adult state,
// reserves/cooldown between broods, birth timing and daily observation timing
// are staged. It is not a natural gestation/survival or ecological-days claim.
const paidSim=new Simulation('AUTONOMOUS-PAID-BIRTH',{bootstrap:false,player:false,autonomousPopulations:true,courtshipSimilarity:true});
const paidFoundingObservation=installFoundingObservation(paidSim);
const paidActor=paidSim.spawnAnimal('genvo',30,30),paidReceiver=paidSim.spawnAnimal('genvo',30.2,30);
for(const [animal,sex] of [[paidActor,'M'],[paidReceiver,'F']])Object.assign(animal,{sex,age:SPECIES.genvo.maturity+5,health:100,energy:SPECIES.genvo.maxEnergy,hydration:SPECIES.genvo.maxHydration,reproCooldown:0,parentIds:[],grandparentIds:[]});
placeSupportedBreedingPair(paidSim,paidActor,paidReceiver);
const observePaid=()=>{paidSim.populationMemory.advanceDay();paidSim.day++};observePaid();
for(let litter=0;litter<2;litter++){
 for(const animal of [paidActor,paidReceiver])Object.assign(animal,{energy:SPECIES.genvo.maxEnergy,hydration:SPECIES.genvo.maxHydration,reproCooldown:0});
 let conceived=false;
 for(let i=0;i<128&&!conceived;i++){
  paidActor.energy=SPECIES.genvo.maxEnergy;paidActor.courtshipPerformance=null;paidActor.completedCourtship=null;paidActor.queuedCourtshipSequence=['approach'];
  performCourtship(paidSim,paidActor,paidReceiver);assert.ok(paidActor.courtshipPerformance);paidSim.tickCount=paidActor.courtshipPerformance.endsAt;performCourtship(paidSim,paidActor,paidReceiver);conceived=paidSim.tryMate(paidActor,paidReceiver);
 }
 assert.ok(conceived);const before={energy:paidReceiver.energy,hydration:paidReceiver.hydration};const children=paidSim.giveBirth(paidReceiver);
 assert.ok(children.length);
 assert.ok(paidReceiver.energy<before.energy&&paidReceiver.hydration<before.hydration,
  'Actual newborn funding debits maternal energy and water');
 assert.ok(children.every(child=>paidSim.populationMemory.natural.births.has(child.id)),
  'The canonical newborn hook records each actual funded child');
 observePaid();
}
for(let day=0;day<10;day++)observePaid();
assert.equal(paidSim.populationMemory.populations().length,1);
assert.ok(paidSim.animals.every(animal=>!animal.lineage),'Paid wild offspring acquire no player ownership');
assert.ok(paidFoundingObservation.diagnostics.nearMisses.some(row=>Object.values(row.gates).every(Boolean)),
 'Passive daily diagnostics record the real canonical founding conditions');
paidFoundingObservation.remove();
assert.equal(Object.hasOwn(paidSim.populationMemory,'advanceDay'),false);
assert.equal(Object.hasOwn(paidSim.populationMemory,'supportsMaintenance'),false);
const paidSnapshot=structuredClone(createSimulationSnapshot(paidSim,{savedAt:'fixed',reason:'paid-founding'}));
const paidRestored=restoreSimulationSnapshot(structuredClone(paidSnapshot));
assert.deepEqual(structuredClone(createSimulationSnapshot(paidRestored,{savedAt:'fixed',reason:'paid-founding'})),paidSnapshot);

// Actual ordinary Simulation advances and canonical snapshot/restore, with no
// player, fabricated recruits, stock edits or manual population registration.
const sim=new Simulation('AUTONOMOUS-RESTORE',{player:false,autonomousPopulations:true});
for(let i=0;i<96;i++)sim.update(null);
assert.ok(sim.populationMemory.natural.records.size>0,'Real wildlife produces geographical candidates');
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'autonomous-founding'}));
const saved=snap(sim),restored=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(snap(restored),saved);
for(let i=0;i<48;i++){sim.update(null);restored.update(null)}
assert.deepEqual(snap(restored),snap(sim),'Evidence, IDs, resources and RNG continue exactly');
const old=new Simulation('AUTONOMOUS-LEGACY',{player:false});
assert.equal(old.autonomousPopulationRules,undefined);assert.equal(old.populationMemory.natural,undefined);
assert.equal(restoreSimulationSnapshot(snap(old)).populationMemory.natural,undefined);
const unknown=structuredClone(saved);unknown.core.autonomousPopulationRules='unknown/1';
assert.throws(()=>restoreSimulationSnapshot(unknown),/Unknown autonomous population/);
const malformed=structuredClone(saved);malformed.controllers.populationMemory.natural.records={};
assert.throws(()=>restoreSimulationSnapshot(malformed),/Invalid autonomous population evidence/);
for(const [label,mutate,expected] of [
 ['missing regional owner',state=>state.regionalMembership.set(1,'missing-root'),/Invalid regional population owner/],
 ['unknown scope',state=>[...state.records.values()].find(record=>record.scope==='local').scope='other',/Invalid population scope/],
 ['invalid source ancestry',state=>state.records.values().next().value.sourcePopulationKey='missing-root',/Invalid source population ancestry/],
 ['invalid birth provenance',state=>state.births.set(999,{id:999,day:1,tick:0,x:20,y:20,parents:[1,2],parentKeys:[null,null],residentKeys:[null,null],regionalParentKeys:[42,null]}),/Invalid regional birth provenance/]
]){
 const corrupt=structuredClone(saved);mutate(corrupt.controllers.populationMemory.natural);
 assert.throws(()=>restoreSimulationSnapshot(corrupt),expected,label);
}

// Real destination preparation carries the versioned observation policy; old
// continuations do not acquire it and cannot reuse a policy-specific cache key.
const planet=new Simulation('PLANET-B0-A',{bootstrap:false,player:false,
  worldGenerator:'planetary/1',autonomousPopulations:true});
const destinationOrigin={x:128,y:0};
const enabledKey=planetaryPreparationKey(planet,destinationOrigin);
const destination=preparePlanetaryDestination(planet,destinationOrigin);
assert.equal(destination.autonomousPopulationRules,AUTONOMOUS_POPULATIONS.policy);
assert.ok(destination.populationMemory.natural.records instanceof Map);
assert.equal(restoreSimulationSnapshot(snap(destination)).autonomousPopulationRules,
  AUTONOMOUS_POPULATIONS.policy);
const v1Planet=new Simulation('PLANET-B0-A',{bootstrap:false,player:false,
 worldGenerator:'planetary/1',autonomousPopulations:AUTONOMOUS_POPULATIONS_V1.policy});
assert.equal(preparePlanetaryDestination(v1Planet,destinationOrigin).autonomousPopulationRules,
 AUTONOMOUS_POPULATIONS_V1.policy,'Prepared historical v1 regions retain their exact recorded policy');
assert.throws(()=>new Simulation('INVALID-AUTONOMOUS',{autonomousPopulations:'unknown/1'}),
 /Unknown autonomous population policy/);
delete planet.autonomousPopulationRules;
assert.notEqual(planetaryPreparationKey(planet,destinationOrigin),enabledKey);
const legacyDestination=preparePlanetaryDestination(planet,destinationOrigin);
assert.equal(Object.hasOwn(legacyDestination,'autonomousPopulationRules'),false);
assert.equal(legacyDestination.populationMemory.natural,undefined);

console.log('Autonomous founding: no wanderer/temporary/litter/unsupported/dead-recruit shortcuts; unowned establishment, persistent identity/extinction and real canonical save continuation PASS');
