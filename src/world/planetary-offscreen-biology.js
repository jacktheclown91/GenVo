// E18: incremental offscreen organism ecology. Each step is an ORIGINAL
// Simulation.update tick, never synthetic population or food growth.
// Region snapshots remain the single organism/resource owner. No world is
// silently accelerated by a UI call; remote work is bounded by the active
// life stride and return trips refuse excessive time debt.
import {CFG} from '../sim/config.js';
import {markRegionalOwnerDirty} from './regional-revision.js';
import {REGIONAL_REPLAY,regionalBiologyOrder} from './regional-replay-order.js';
export {REGIONAL_REPLAY} from './regional-replay-order.js';
import {createSimulationSnapshot,restoreDetachedSimulationSnapshot} from '../persistence/save-manager.js';
import {OFFSCREEN_ENVIRONMENT,validateRemoteEnvironmentalLedger} from './planetary-offscreen-environment.js';
import {validatePlanetAnimalOwnership} from './planet-regions.js';

export const OFFSCREEN_BIOLOGY=Object.freeze({
 schema:1,ticksPerPass:CFG.lifeStride,regionsPerPass:1,
 maxEntryTicks:CFG.dayTicks,maxAnimals:600
});
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const round=v=>Number.isFinite(v)?v:0;
function remoteState(session){
 const core=session?.snapshot?.core;
 if(!safe(core?.tickCount)||!safe(core?.day)||core.day<1)
  throw Error('Archived ecology lacks a valid biological clock.');
 return core;
}
export function validateRemoteBiologyLedger(session){
 const state=session?.biologicalLedger;
 if(state===undefined)return;
 const core=remoteState(session);
 if(state?.schema!==1||!safe(state.firstTick)||!safe(state.lastTick)||
   !safe(state.ticks)||state.ticks<1||
   state.firstTick+state.ticks!==state.lastTick||
   state.lastTick!==core.tickCount||!safe(state.fullDays)||
   !safe(state.births)||!safe(state.deaths)||
   !safe(state.lastDay)||state.lastDay!==core.day||
   !safe(state.lastPopulation)||state.lastPopulation!==session.snapshot.animals?.length)
   throw Error('Invalid archived biological replay ledger.');
}
export function remoteBiologicalDebt(active,session){
 const c=remoteState(session);
 if(!safe(active?.tickCount)||c.tickCount>active.tickCount)
  throw Error('Archived ecological clock is ahead of the player timeline.');
 return active.tickCount-c.tickCount;
}
const environmentalLedger=(session,day)=>{
 return session.environmentalLedger
  ? {...session.environmentalLedger}
  : {schema:1,firstDay:day,lastDay:day-1,days:0,
    rain:0,saltInput:0,saltOutput:0,soilMaxAbsClosure:0,saltMaxAbsClosure:0,
    lastSoilClosure:0,lastSaltClosure:0};
};
function recordPhysicalDay(ledger,sim,day){
 const soil=sim.world.soilWater?.lastDay,salt=sim.world.environment?.lastDay;
 if(!soil||soil.day!==day||!salt||salt.day!==day||
    !Number.isFinite(soil.closure)||Math.abs(soil.closure)>1||
    !Number.isFinite(salt.closure)||Math.abs(salt.closure)>1e-5)
  throw Error('Real offscreen daily life step lacks conserved rain/snow/salt receipts.');
 ledger.days++;ledger.lastDay=day;ledger.rain+=soil.rain;
 ledger.saltInput+=salt.input;ledger.saltOutput+=salt.output;
 ledger.lastSoilClosure=soil.closure;ledger.lastSaltClosure=salt.closure;
 ledger.soilMaxAbsClosure=Math.max(ledger.soilMaxAbsClosure,Math.abs(soil.closure));
 ledger.saltMaxAbsClosure=Math.max(ledger.saltMaxAbsClosure,Math.abs(salt.closure));
}
function highId(sim){
 let highest=sim.nextId-1;
 for(const a of sim.animals)highest=Math.max(highest,a.id);
 for(const session of sim.planetaryTravel?.sessions||[]){
  highest=Math.max(highest,session.snapshot.core?.nextId-1||0);
  for(const a of session.snapshot.animals||[])highest=Math.max(highest,a.id);
 }
 return Math.max(highest+1,sim.planetaryTravel?.nextId||1);
}
// A transactional offscreen stride: if canonical simulation or conservation
// fails, no archived organism or plant/food array is changed.
export function stageRemoteBiology(session,{tickCount,reservedNextId,maxTicks=OFFSCREEN_BIOLOGY.ticksPerPass}={}){
 const active={tickCount};
 if(!Number.isSafeInteger(reservedNextId)||reservedNextId<1)throw Error('Invalid reserved regional identity watermark.');
 if(!safe(maxTicks)||maxTicks>OFFSCREEN_BIOLOGY.maxEntryTicks)
  throw Error('Unbounded remote biological work.');
 if(session?.biologicalMode!=='canonical-ticks/1')throw Error('Archived region has no biological replay authority.');
 const debt=remoteBiologicalDebt(active,session),steps=Math.min(debt,maxTicks);
 if(!steps)return{candidate:null,nextId:reservedNextId,result:{ticks:0,remaining:debt,key:session.key}};
 validateRemoteBiologyLedger(session);
 validateRemoteEnvironmentalLedger(session);
 const temp=restoreDetachedSimulationSnapshot(session.snapshot);
 if(temp.planetaryTravel)throw Error('Recursive dormant ecology authority.');
 if(temp.animals.length>OFFSCREEN_BIOLOGY.maxAnimals)
  throw Error('Too many archived creatures for bounded biological replay.');
 const before=temp.stats;
 const startTick=temp.tickCount,initialDay=temp.day;
 // Always reserve an identity watermark above every regional animal. A new
 // offspring in a remote region may not reuse any living or archived ID.
 temp.nextId=Math.max(temp.nextId,reservedNextId);
 const ledger=session.biologicalLedger
  ? {...session.biologicalLedger}
  : {schema:1,firstTick:startTick,lastTick:startTick,ticks:0,
    fullDays:0,births:0,deaths:0,lastDay:initialDay,
    lastPopulation:temp.animals.length};
 const physical=environmentalLedger(session,temp.day);
 const atBirths=temp.stats.births||0,atDeaths=temp.stats.deaths||0;
 for(let tick=0;tick<steps;tick++){
  const beforeDay=temp.day;
  temp.update(null,{externalPlayerControl:true});
  if(temp.day!==beforeDay){
   if(temp.day!==beforeDay+1)throw Error('Remote calendar advanced without a real ecological day.');
   recordPhysicalDay(physical,temp,beforeDay);
   ledger.fullDays++;
  }
  if(temp.animals.length>OFFSCREEN_BIOLOGY.maxAnimals)
   throw Error('Offscreen fauna exceeded bounded population size; stop instead of synthesizing a cull.');
 }
 if(temp.tickCount!==startTick+steps)
  throw Error('Offscreen biology must consume exactly the recorded real ticks.');
 ledger.ticks+=steps;
 ledger.lastTick=temp.tickCount;
 ledger.lastDay=temp.day;
 ledger.births+=Math.max(0,(temp.stats.births||0)-atBirths);
 ledger.deaths+=Math.max(0,(temp.stats.deaths||0)-atDeaths);
 ledger.lastPopulation=temp.animals.length;
 // The snapshot builder owns food/seed/soil/genomes; never synthesize a copy
 // of one selected field and discard its corresponding conservation account.
 const copy=createSimulationSnapshot(temp,{
  reason:session.snapshot.reason,savedAt:session.snapshot.savedAt,
  // The restored region is exclusively owned and discarded after publication.
  // Transfer immutable checkpoint metadata instead of cloning all cohort
  // arrays/objects yet again. Ordinary saves retain protective deep copies.
  ownedRegionalSeedMetadata:true});
 copy.meta=session.snapshot.meta;
 delete copy.regionalWorlds;
 const candidate={...session,snapshot:copy,biologicalLedger:ledger,
  ...(physical.days?{environmentalLedger:physical}:{})};
 validateRemoteBiologyLedger(candidate);
 validateRemoteEnvironmentalLedger(candidate);
 validatePlanetAnimalOwnership([],{schema:1,nextId:Math.max(reservedNextId,temp.nextId),sessions:[candidate]});
 return{candidate,nextId:temp.nextId,result:{ticks:steps,remaining:remoteBiologicalDebt(active,candidate),key:session.key,
  births:(temp.stats.births||0)-atBirths,deaths:(temp.stats.deaths||0)-atDeaths,
  fullDays:temp.day-initialDay,organisms:temp.animals.length}};
}
export function advanceRemoteBiology(active,session,{maxTicks=OFFSCREEN_BIOLOGY.ticksPerPass}={}){
 const reservedNextId=highId(active),staged=stageRemoteBiology(session,{tickCount:active.tickCount,reservedNextId,maxTicks});
 if(!staged.candidate)return staged.result;
 const nextSessions=active.planetaryTravel.sessions.map(s=>s===session?staged.candidate:s);
 validatePlanetAnimalOwnership(active.animals,{schema:1,nextId:Math.max(reservedNextId,staged.nextId),sessions:nextSessions});
 // Publish only after the shared staged tick/material/ownership checks pass.
 markRegionalOwnerDirty(session);Object.assign(session,staged.candidate);
 active.nextId=Math.max(active.nextId,staged.nextId);
 active.planetaryTravel.nextId=Math.max(active.planetaryTravel.nextId,active.nextId);
 return staged.result;
}
export function advanceOffscreenBiology(sim,{
 regionsPerPass=OFFSCREEN_BIOLOGY.regionsPerPass,ticksPerPass=OFFSCREEN_BIOLOGY.ticksPerPass
}={}){
 if(!sim?.planetaryTravel?.sessions?.length)return[];
 if(!safe(regionsPerPass)||regionsPerPass>1||
   !safe(ticksPerPass)||ticksPerPass>CFG.lifeStride)
  throw Error('Invalid bounded dormant biology scheduler.');
 const due=sim.planetaryTravel.sessions.filter(s=>s.biologicalMode==='canonical-ticks/1'&&remoteBiologicalDebt(sim,s)>0)
  .sort((a,b)=>a.snapshot.core.tickCount-b.snapshot.core.tickCount||a.key.localeCompare(b.key));
 return due.slice(0,regionsPerPass).map(s=>advanceRemoteBiology(sim,s,{maxTicks:ticksPerPass}));
}

// Saved policy: historic worlds retain the E18 single-region stride schedule.
export function regionalReplayPolicy(sim){
 const policy=sim.regionalReplayPolicy===undefined?REGIONAL_REPLAY.legacy:sim.regionalReplayPolicy;
 if(!Object.values(REGIONAL_REPLAY).includes(policy))throw Error('Unknown regional replay policy.');
 return policy;
}
export function pendingRegionalBiology(sim){
 const policy=regionalReplayPolicy(sim);if(policy!==REGIONAL_REPLAY.synchronized||sim.tickCount%CFG.lifeStride!==0)return[];
 return regionalBiologyOrder(sim.tickCount,(sim.planetaryTravel?.sessions||[]).map(session=>({key:session.key,mode:session.biologicalMode,tick:session.biologicalMode==='canonical-ticks/1'?remoteState(session).tickCount:undefined,session})),policy).map(row=>row.session);
}
// One transaction per caller admission. Browser callers yield after each job;
// direct simulation callers complete the same ordered jobs before their next tick.
export function prepareRegionalBiology(sim){
 const due=pendingRegionalBiology(sim);
 if(!due.length)return null;
 return advanceRemoteBiology(sim,due[0],{maxTicks:OFFSCREEN_BIOLOGY.ticksPerPass});
}
