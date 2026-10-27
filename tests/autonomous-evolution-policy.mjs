import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {PopulationPressureMemoryController} from '../src/ecology/population-memory.js';
import {AUTONOMOUS_POPULATIONS} from '../src/ecology/autonomous-founding.js';
import {AUTONOMOUS_EVOLUTION,validateAutonomousEvolutionPolicy} from '../src/lineage/autonomous-evolution.js';
import {BREEDING_SUPPORT} from '../src/ecology/breeding-support.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {preparePlanetaryDestination,planetaryPreparationKey} from '../src/world/planetary-travel.js';

// Controlled observations, not a natural founding/recognition claim. Each
// body's actual-food assessment is supplied by the existing carrying authority.
const a={id:1,alive:true,species:'genvo',age:100,x:0,y:0};
const b={id:2,alive:true,species:'genvo',age:100,x:1,y:0};
const predator={id:3,alive:true,species:'genvo',x:0,y:3};
let oldCentreCalls=0;
const sim={autonomousEvolutionRules:AUTONOMOUS_EVOLUTION.policy,
 autonomousPopulationRules:AUTONOMOUS_POPULATIONS.policy,animals:[a,b,predator],
 world:{idx:x=>x<1?0:1,water:[0,1],moisture:[.1,.2],temperature:[.9,.1],waterDistance:[5,0]},
 carrying:{breedingState:animal=>({local:100,crowd:1,competitors:animal.id===1?2:0,
  support:{need:10*BREEDING_SUPPORT.reproductiveMargin,share:animal.id===1?0:10}})},
 forEachNearby:(animal,radius,fn)=>[a,b,predator].forEach(fn),
 isPredatorTo:hunter=>hunter.id===3,canReach:(hunter,x)=>x<1,
 populationEcology:{centerState:()=>{oldCentreCalls++;return{food:.5,competition:.2,danger:0,overload:0}}}};
const memory=new PopulationPressureMemoryController(sim),pop={key:'source',id:'source',kind:'autonomous',memberIds:new Set([1,2])};
const observation=memory.assessment(pop);
assert.equal(oldCentreCalls,0,'Wildlife does not borrow the player G3/GenVo grazing assessment');
assert.equal(observation.sampledMembers,2);assert.equal(observation.localAdults,2);
assert.equal(observation.food,.5,'An inedible survey cannot borrow food from another mouth');
assert.equal(observation.pressure.scarcity,.5,'Maintenance support, not spare capacity for another brood');
assert.equal(observation.pressure.competition,1/3);
assert.equal(observation.pressure.crowding,0,'A large supported population does not acquire an obsolete headcount-cap pressure');
assert.equal(observation.pressure.predation,.25,'Only a predator that can physically reach this resident counts');
assert.equal(observation.pressure.wetness,.5,'An occupied water cell remains wet even when its soil buffer is dry');
assert.equal(observation.moisture,.55);assert.equal(observation.temperature,.5);
assert.equal(memory.assessment({...pop,memberIds:new Set()}),null,'No invented history for an unoccupied population');
delete sim.autonomousEvolutionRules;memory.assessment(pop);
assert.equal(oldCentreCalls,1,'Historical population observations retain the old path');

const opts={player:false,worldGenerator:'planetary/1',autonomousPopulations:true,autonomousEvolution:true};
const actual=new Simulation('AUTONOMOUS-EVOLUTION-POLICY',opts);
assert.ok(actual.evolutionTree.livingTaxa().length>1);
assert.equal(actual.evolutionTree.leadershipTaxa().length,0);
assert.equal(actual.familyDirectives.multipleTaxa(),false,'Unowned wildlife cannot unlock species guidance');
assert.match(actual.evolutionTree.summaryLine(),/0 descendant branches/,'Founding animal kinds are not falsely reported as newly recognized species');
for(let tick=0;tick<96;tick++)actual.update(null);
const candidate=[...actual.populationMemory.natural.records.values()].find(r=>r.memberIds.size>0);
assert.ok(candidate);
const rng=actual.rng.state,food=actual.world.plants.sunmoss.slice();
const actualObservation=actual.populationMemory.assessment(candidate);
assert.equal(actualObservation.sampledMembers,candidate.memberIds.size);
assert.ok(Object.values(actualObservation.pressure).every(v=>Number.isFinite(v)&&v>=0&&v<=1));
assert.equal(actual.rng.state,rng);assert.deepEqual(actual.world.plants.sunmoss,food,'Observation supplies no food');
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'autonomous-evolution-policy'}));
const saved=snapshot(actual),restored=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(snapshot(restored),saved);
for(let tick=0;tick<12;tick++){actual.update(null);restored.update(null)}
assert.deepEqual(snapshot(restored),snapshot(actual),'New observations and historical biology restore exactly');
const destinationOrigin={x:128,y:0},prepared=preparePlanetaryDestination(actual,destinationOrigin);
assert.equal(prepared.autonomousEvolutionRules,AUTONOMOUS_EVOLUTION.policy);
assert.equal(restoreSimulationSnapshot(snapshot(prepared)).autonomousEvolutionRules,AUTONOMOUS_EVOLUTION.policy);
const key=planetaryPreparationKey(actual,destinationOrigin);delete actual.autonomousEvolutionRules;
assert.notEqual(planetaryPreparationKey(actual,destinationOrigin),key,'Prepared caches cannot cross recognition policies');
const historical=preparePlanetaryDestination(actual,destinationOrigin);
assert.equal(Object.hasOwn(historical,'autonomousEvolutionRules'),false,'Historical founding does not silently adopt recognition');
const unknown=structuredClone(saved);unknown.core.autonomousEvolutionRules='unknown/1';
assert.throws(()=>restoreSimulationSnapshot(unknown),/Unknown autonomous evolution policy/);
const incompatible=structuredClone(saved);incompatible.core.autonomousPopulationRules='autonomous-populations/1';
assert.throws(()=>restoreSimulationSnapshot(incompatible),/requires its recorded regional population/);
assert.throws(()=>new Simulation('INVALID-EVOLUTION',{autonomousEvolution:true}),/requires its recorded regional population/);
assert.throws(()=>new Simulation('INVALID-EVOLUTION',{...opts,autonomousEvolution:'unknown/1'}),/Unknown autonomous evolution policy/);
assert.throws(()=>validateAutonomousEvolutionPolicy({autonomousPopulationRules:AUTONOMOUS_POPULATIONS.policy,
 autonomousEvolutionRules:AUTONOMOUS_EVOLUTION.policy,planetaryTravel:{sessions:[{snapshot:{core:{}}}]}}),/Inconsistent regional autonomous evolution policy/);
console.log('Autonomous evolution policy foundation PASS: body-specific maintenance/competition/threat/habitat observations, old path retained, exact save continuation and isolated regional policy. Recognition integration remains in progress.');
