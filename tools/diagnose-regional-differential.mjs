// Read-only: how the /4 differential sees the active and one archived region's
// populations in a saved field world (resolved reference, aligned day, per-axis
// deltas and score against the unchanged gates).
// Usage: node --max-old-space-size=12000 tools/diagnose-regional-differential.mjs REPO_ROOT WORLD.v8 REGION_KEY
import fs from 'node:fs';import {deserialize} from 'node:v8';import {pathToFileURL} from 'node:url';
const [repo,file,regionKey]=process.argv.slice(2);const load=f=>import(pathToFileURL(`${repo}/src/${f}`).href);
const {restoreSimulationSnapshot,restoreDetachedSimulationSnapshot}=await load('persistence/save-manager.js');
const {regionalReferenceContextFor,setRegionalReferenceContext,alignedPressureProfiles,foreignPopulationKey}=await load('lineage/regional-reference.js');
const active=restoreSimulationSnapshot(deserialize(fs.readFileSync(file)));
const session=active.planetaryTravel.sessions.find(s=>s.key===regionKey);
const temp=restoreDetachedSimulationSnapshot(session.snapshot);setRegionalReferenceContext(temp,regionalReferenceContextFor(active,session.key));
for(const sim of [active,temp]){
 const where=sim===active?'active '+active.world.regionOrigin.x+','+active.world.regionOrigin.y:'archived '+regionKey;
 for(const pop of sim.populationMemory.populations().filter(p=>p.kind==='autonomous')){
  const cohort=sim.speciation.cohortFor(pop),ref=sim.evolutionTree.referencePopulationFor(pop,cohort),h=sim.populationMemory.histories.get(pop.key);
  const row={where,key:pop.key,status:pop.status,parents:pop.parentPopulationKeys,cohort:cohort.length,historyDays:h?.days,lastDay:h?.lastDay,observed:(h?.regionalObservations||[]).map(r=>r.day),
   reference:ref?.key||null,foreign:!!ref&&foreignPopulationKey(sim,ref.key),distance:ref?+Math.hypot(pop.x-ref.x,pop.y-ref.y).toFixed(1):null};
  if(ref?.remote){const a=alignedPressureProfiles(h,ref.history);row.remoteObserved=[...(ref.history?.regionalObservations||[]).map(r=>r.day),ref.history?.lastDay];row.alignedDay=a?.day??null;
   if(a){const theirs=Object.fromEntries(a.theirs.axes.map(x=>[x.id,x.mean]));const deltas=a.mine.axes.map(x=>({id:x.id,mine:+x.mean.toFixed(3),other:+(theirs[x.id]||0).toFixed(3),delta:+(x.mean-(theirs[x.id]||0)).toFixed(3)}));
    row.score=+(deltas.reduce((n,d)=>n+Math.abs(d.delta),0)/deltas.length).toFixed(4);row.deltas=deltas}}
  else if(ref){const p=sim.populationMemory.profile(ref.key),q=sim.populationMemory.profile(pop.key);if(p&&q){const theirs=Object.fromEntries(p.axes.map(x=>[x.id,x.mean]));row.score=+(q.axes.reduce((n,x)=>n+Math.abs(x.mean-(theirs[x.id]||0)),0)/q.axes.length).toFixed(4)}}
  row.differential=sim.protoSpeciation.differentialFor(pop.key)?.score??null;
  console.log(JSON.stringify(row));
 }}
