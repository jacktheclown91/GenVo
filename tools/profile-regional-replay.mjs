// Controlled border placement profiles existing replay; no staged births/resources.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import {serialize,deserialize} from 'node:v8';
import {isDeepStrictEqual} from 'node:util';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {WORLD_RESTORE_CACHE,restorationWorldCacheStats} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {remoteBiologicalDebt,validateRemoteBiologyLedger,prepareRegionalBiology} from '../src/world/planetary-offscreen-biology.js';
import {validateRemoteEnvironmentalLedger} from '../src/world/planetary-offscreen-environment.js';
import {observeNaturalWorld} from './ecological-observation.mjs';
const runtimeFingerprint=()=>{const h=createHash('sha256');const walk=dir=>{for(const item of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(file.endsWith('.js')){h.update(file.replaceAll('\\','/'));h.update(fs.readFileSync(file))}}};walk('src');return h.digest('hex')};
const runtimeStart=runtimeFingerprint();
const out=process.argv[2],days=Number(process.argv[3]||5);assert.ok(out&&!fs.existsSync(out));assert.ok(Number.isSafeInteger(days)&&days>0&&days<=100);
const opt=flag=>{const i=process.argv.indexOf(flag);return i<0?null:process.argv[i+1]};
if(process.argv.includes('--uncached'))WORLD_RESTORE_CACHE.enabled=false;
const snapshotOut=opt('--snapshot'),reference=opt('--reference');if(snapshotOut)assert.ok(!fs.existsSync(snapshotOut));
const source=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'}),player=source.player();let frontier=null;
for(let y=8.5;y<118.5;y++){player.x=125.2;player.y=y;const candidate=planetaryTravelAvailability(source);if(candidate.enabled){frontier=candidate;break}}
assert.ok(frontier,'Real traversable frontier required');const trip=crossPlanetaryBorder(source);assert.equal(trip.ok,true,trip.message);
let active=trip.simulation;
const archives=Number(opt('--archives')||1);assert.ok(Number.isSafeInteger(archives)&&archives>=1&&archives<=3);
const visited=new Set(['0,0',active.world.regionOrigin.x+','+active.world.regionOrigin.y]);
for(let hop=1;hop<archives;hop++){
 let found=false;const a=active.player();
 for(const direction of ['east','south','north','west']){
  for(let c=8.5;c<118.5;c++){
   a.x=direction==='east'?125.2:direction==='west'?2.5:c;
   a.y=direction==='south'?125.2:direction==='north'?2.5:c;
   const z=planetaryTravelAvailability(active);
   if(!z.enabled||visited.has(z.to.x+','+z.to.y))continue;
   const next=crossPlanetaryBorder(active);assert.equal(next.ok,true,next.message);active=next.simulation;
   visited.add(z.to.x+','+z.to.y);found=true;break;
  }
  if(found)break;
 }
 assert.ok(found,'Real frontier to another unvisited region required');
}
const autonomous=process.argv.includes('--autonomous');
if(autonomous){active.playerEnabled=false;active.playerId=null;for(const a of active.animals)a.player=false;}
const checkpointDir=opt('--checkpoint-dir');if(checkpointDir){assert.ok(!fs.existsSync(checkpointDir));fs.mkdirSync(checkpointDir,{recursive:true})}
const region=active.planetaryTravel.sessions[0],remoteInitial=region.snapshot.animals.filter(a=>a.alive).length;
const tickDurations=[],originalUpdate=active.update;
active.update=function(...args){const at=performance.now();try{return originalUpdate.apply(this,args)}finally{tickDurations.push(performance.now()-at)}};

const result=await observeNaturalWorld({sim:active,days,checkpoints:days<=10?Array.from({length:days},(_,i)=>i+1):[1,10,30,60,100].filter(n=>n<=days),onDay(day){console.log('DAY '+JSON.stringify({completedDays:day-1,tick:active.tickCount,remote:active.planetaryTravel.sessions.map(s=>({key:s.key,tick:s.snapshot.core.tickCount,population:s.snapshot.animals.length}))}))},profilePhases:true,collectGc:true,onSample(row){console.log('REGIONAL '+JSON.stringify({completedDays:row.completedDays,seconds:row.seconds,heap:row.memory.heapUsed,remoteTick:region.snapshot.core.tickCount,debt:remoteBiologicalDebt(active,region)}));if(checkpointDir){const file=checkpointDir+'/day'+row.completedDays+'.snapshot.bin';assert.ok(!fs.existsSync(file));fs.writeFileSync(file,serialize(createSimulationSnapshot(active,{savedAt:'fixed',reason:'regional-progress'})))}}});
delete active.update;
const flushAt=performance.now();if(process.argv.includes('--flush-remote'))while(prepareRegionalBiology(active)){}const finalRemoteFlushMs=performance.now()-flushAt;
const regions=active.planetaryTravel.sessions.map(s=>{validateRemoteBiologyLedger(s);validateRemoteEnvironmentalLedger(s);assert.equal(s.biologicalMode,'canonical-ticks/1');return{key:s.key,tick:s.snapshot.core.tickCount,debt:remoteBiologicalDebt(active,s),organisms:s.snapshot.animals.length,biologicalLedger:s.biologicalLedger,environmentalLedger:s.environmentalLedger}});
tickDurations.sort((a,b)=>a-b);
const tickTiming={count:tickDurations.length,p50:tickDurations[Math.floor(tickDurations.length*.5)],p95:tickDurations[Math.floor(tickDurations.length*.95)],max:tickDurations.at(-1),over50ms:tickDurations.filter(ms=>ms>50).length};
const phases=result.final.phases,activePhaseMs=Object.values(phases).reduce((n,p)=>n+p.ms,0);
const state=createSimulationSnapshot(active,{savedAt:'fixed',reason:'regional-profile-parity'});
if(snapshotOut)fs.writeFileSync(snapshotOut,serialize(state));
const observedRemote={remoteFinal:region.snapshot.animals.filter(a=>a.alive).length,remoteLedger:structuredClone(region.biologicalLedger),environmentalLedger:structuredClone(region.environmentalLedger),remoteDebt:remoteBiologicalDebt(active,region)};
let persistence=null;if(process.argv.includes('--verify-save')){const bytes=serialize(state),at=performance.now(),restored=restoreSimulationSnapshot(deserialize(Buffer.from(bytes)));const restoreMs=performance.now()-at;const canonical=s=>createSimulationSnapshot(s,{savedAt:'fixed',reason:'regional-profile-parity'});assert.ok(isDeepStrictEqual(canonical(restored),state),'Full multi-region checkpoint roundtrip');const day=active.day;while(active.day===day){active.update(null);restored.update(null)}assert.ok(isDeepStrictEqual(canonical(active),canonical(restored)),'Full multi-region next day differs after restore');persistence={bytes:bytes.length,restoreMs,exactRoundTrip:true,exactNextDay:true}}
if(reference)assert.ok(isDeepStrictEqual(state,deserialize(fs.readFileSync(reference))),'Entire active/archived saved state differs from uncached replay');
const runtimeEnd=runtimeFingerprint();assert.equal(runtimeEnd,runtimeStart,'Runtime inputs changed during regional observation');
const receipt={runtimeInputs:{start:runtimeStart,end:runtimeEnd,inputDrift:runtimeStart!==runtimeEnd},autonomous,checkpointDir,finalRemoteFlushMs,persistence,archives,regions,tickTiming,cacheEnabled:WORLD_RESTORE_CACHE.enabled,cache:restorationWorldCacheStats(),reference:reference||null,exactReferenceState:reference?true:null,snapshotArtifact:snapshotOut||null,schema:'genvo.regional-replay-profile/1',scope:'Actual border crossings after controlled legal frontier placement, default founded organisms, ordinary canonical ticks; not natural navigation, autonomous continental migration or a long-run scale verdict',days,frontier:{direction:frontier.direction},remoteInitial,...observedRemote,elapsedMs:result.seconds*1000,activePhaseMs,outsideActivePhasesMs:result.seconds*1000-activePhaseMs,overheadScope:'Includes offscreen replay plus integrity/readouts/GC/yields; CPU profile is needed to attribute it',result};
fs.writeFileSync(out,JSON.stringify(receipt,null,2));console.log(JSON.stringify({receipt:out,elapsedMs:receipt.elapsedMs,activePhaseMs,outsideActivePhasesMs:receipt.outsideActivePhasesMs,remoteDebt:receipt.remoteDebt},null,2));
