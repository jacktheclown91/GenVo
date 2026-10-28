// autonomous-evolution/4: a recorded related population in another region is the
// comparison reference, read from that region's own evidence on a commonly
// observed day. Unavailable evidence is unknown, never a local stand-in. The
// population records and pressure histories below are controlled fixtures that
// test reference resolution only, never natural recognition qualification.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {AUTONOMOUS_EVOLUTION} from '../src/lineage/autonomous-evolution.js';
import {populationRegion,foreignPopulationKey,foreignReference,alignedPressureProfiles,
  regionalReferenceContextFor,setRegionalReferenceContext} from '../src/lineage/regional-reference.js';
import {recordRegionalPressureObservation} from '../src/ecology/population-profile.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {createRegionalHistoryWorld} from './helpers/regional-evolution-world.mjs';

// Keys name their region; only another region's natural keys are foreign.
assert.deepEqual(populationRegion('natural:-128,256:7'),{x:-128,y:256});
for(const key of ['home','center:3','natural:0,0','natural:a,b:1',null])assert.equal(populationRegion(key),null);
const here={world:{regionOrigin:{x:128,y:0}}};
assert.equal(foreignPopulationKey(here,'natural:0,0:4'),true);assert.equal(foreignPopulationKey(here,'natural:128,0:4'),false);assert.equal(foreignPopulationKey(here,'home'),false);

// Real observation records; alignment uses the latest day both actually observed.
// Each day's value applies to the cold, dryness and scarcity axes alike.
const AXES=['cold','dryness','scarcity'];
const history=(key,days)=>{const h={key,days:0,firstDay:1,lastDay:0,exposure:{},recent:{},peak:{}};
  for(const [day,value] of days){h.days++;h.lastDay=day;for(const axis of AXES){h.exposure[axis]=(h.exposure[axis]||0)+value;h.recent[axis]=value;h.peak[axis]=Math.max(h.peak[axis]||0,value)}recordRegionalPressureObservation(h)}return h};
const local=history('natural:128,0:1',[[1,.9],[2,.9],[3,.9],[4,.9],[5,.9],[6,.9]]);
const lagging=history('natural:0,0:1',[[1,.1],[2,.1],[3,.1],[4,.1],[5,.1]]);
const aligned=alignedPressureProfiles(local,lagging);
assert.equal(aligned.day,5,'a remote region one day behind compares the shared day');
assert.equal(aligned.mine.lastDay,5);assert.equal(aligned.theirs.lastDay,5);
assert.equal(alignedPressureProfiles(local,history('natural:0,0:2',[[1,.1],[2,.1],[3,.1]])),null,'no commonly observed day is unknown');
assert.equal(alignedPressureProfiles(local,null),null);

// A real two-region /4 world: the active region is 128,0, its archive is 0,0.
const sim=createRegionalHistoryWorld();
assert.equal(sim.autonomousEvolutionRules,AUTONOMOUS_EVOLUTION.policy);assert.equal(AUTONOMOUS_EVOLUTION.policy,'autonomous-evolution/4');
assert.equal(restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'x'}))).autonomousEvolutionRules,'autonomous-evolution/4');
const archive=sim.planetaryTravel.sessions[0],archived=archive.snapshot.controllers.populationMemory;
assert.deepEqual(sim.world.regionOrigin,{x:128,y:0});assert.equal(archive.key,'0,0');
const species=sim.player().species;
// The fields of an actual founding record (autonomous-founding newCandidate), established on day 1.
const record=(key,fields)=>({key,id:key,kind:'autonomous',primary:false,label:key,species,x:0,y:0,regionOrigin:populationRegion(key),firstDay:1,lastOccupiedDay:1,
  establishedDay:1,endedDay:null,status:'established',continuityDays:0,supportedDays:0,members:new Map(),memberIds:new Set(),everMembers:new Set(),
  recruits:new Set(),litters:new Set(),parentPopulationKeys:[],trajectory:[],supportHistory:[],...fields});
const remoteKey='natural:0,0:9001',remote=record(remoteKey,{label:'Controlled remote source',x:120,y:40});
archived.natural.records.set(remoteKey,remote);archived.histories.set(remoteKey,lagging);
const reference=foreignReference(sim,remoteKey);
assert.equal(reference.remote,true);assert.equal(reference.history,lagging);
assert.deepEqual([reference.x,reference.y],[120-128,40],'placed in this region\'s frame through both origins');
archived.natural.records.set('natural:0,0:9002',record('natural:0,0:9002',{establishedDay:null,status:'candidate',x:1,y:1}));
assert.equal(foreignReference(sim,'natural:0,0:9002'),null,'unestablished remote populations are not references');
assert.equal(foreignReference(sim,'natural:0,0:9999'),null);

// The live population's recorded parent lives in the other region.
const memory=sim.populationMemory,localKey='natural:128,0:9101',stand='natural:128,0:9102';
const own=record(localKey,{label:'Controlled local deme',x:10,y:40,parentPopulationKeys:[remoteKey]});
memory.natural.records.set(localKey,own);memory.histories.set(localKey,local);
memory.natural.records.set(stand,record(stand,{label:'Unrelated local population',x:12,y:40}));
const pop=memory.populationByKey(localKey);assert.ok(pop,'controlled local record is an established population');
const found=sim.evolutionTree.referencePopulationFor(pop,[]);
assert.equal(found.key,remoteKey,'the recorded remote parent is the reference, not the nearer unrelated population');
assert.equal(sim.speciation.physicalSeparation(pop,[]),Math.hypot(10-(120-128),0),'separation is measured across the actual border');
const diff=sim.protoSpeciation.differentialFor(localKey);
assert.ok(diff,'aligned remote evidence yields a differential');assert.equal(diff.peer.key,remoteKey);assert.equal(diff.profile.lastDay,5);
assert.ok(diff.deltas.find(d=>d.id==='cold').delta>0,'the population that met more cold reads it on the shared day');

// The same world under /3 keeps its recorded behaviour: no foreign resolution.
sim.autonomousEvolutionRules=AUTONOMOUS_EVOLUTION.observed;
assert.equal(sim.evolutionTree.referencePopulationFor(pop,[]).key,stand,'/3 still falls back to the nearest related local population');
sim.autonomousEvolutionRules=AUTONOMOUS_EVOLUTION.policy;

// Unavailable evidence is unknown, never replaced by the local stand-in.
archived.natural.records.delete(remoteKey);
assert.equal(sim.evolutionTree.referencePopulationFor(pop,[]),null,'missing remote evidence is unknown');
assert.equal(sim.protoSpeciation.differentialFor(localKey),null);assert.equal(sim.speciation.physicalSeparation(pop,[]),0);
archived.natural.records.set(remoteKey,remote);archived.histories.set(remoteKey,history(remoteKey,[[1,.1],[2,.1],[3,.1]]));
assert.equal(sim.protoSpeciation.differentialFor(localKey),null,'a remote history without a shared day gives no differential');
archived.histories.set(remoteKey,lagging);

// Archived replay reads the active world and every other resident region, never itself.
const context=regionalReferenceContextFor(sim,archive.key);
assert.equal(context.owners.length,sim.planetaryTravel.sessions.length,'active plus the other resident regions');
assert.equal(context.owners[0].records,memory.natural.records);assert.ok(Object.isFrozen(context)&&Object.isFrozen(context.owners));
const replaying=new Simulation('CONTEXT-PROBE',{player:false,bootstrap:false,worldGenerator:'planetary/1',autonomousPopulations:true,autonomousEvolution:true});
replaying.world.regionOrigin={x:0,y:0};
assert.equal(foreignReference(replaying,localKey),null,'without a context another region is unknown');
setRegionalReferenceContext(replaying,context);
const seen=foreignReference(replaying,localKey);assert.deepEqual([seen.x,seen.y],[138,40],'the replaying region sees the active population in its own frame');
assert.equal(Object.keys(replaying).includes('regionalReferenceContext'),false,'context is never saved');
setRegionalReferenceContext(replaying,null);assert.equal(foreignReference(replaying,localKey),null);
console.log('Cross-region reference /4 PASS: signed keys, aligned observed days, recorded remote parent across the border, /3 unchanged, unknown without evidence, replay context');
