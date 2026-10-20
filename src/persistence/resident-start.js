import {SPECIES} from '../organisms/species.js';
import {validatePlan} from '../lineage/body-plan.js';

export function residentStartCandidates(sim){
 return sim.animals.filter(a=>a.alive&&a.health>0&&SPECIES[a.species]&&a.bodyPlan&&validatePlan(a.bodyPlan).ok)
  .sort((a,b)=>Number(b.id===sim.playerId)-Number(a.id===sim.playerId)||b.generation-a.generation||a.id-b.id);
}

// Apply only to an independently restored or newly created world before it
// is installed. The organism already exists: no spawn, body edit, nutrition,
// generation promotion, biological RNG draw or replacement history.
export function selectResidentStart(sim,id){
 const selected=residentStartCandidates(sim).find(a=>a.id===id);
 if(!selected)throw Error('The selected resident is no longer a living playable creature.');
 const previous=sim.playerId,tracker=sim.lineage,priorFounderId=tracker.founderId;
 const archived=sim.planetaryTravel?.sessions||[],allAnimals=[...sim.animals,...archived.flatMap(s=>s.snapshot.animals)];
 for(const session of archived)for(const [key,record] of session.snapshot.controllers?.lineage?.records||[])if(!tracker.records.has(key))tracker.records.set(key,structuredClone(record));
 const known=new Map([...tracker.records].map(([key,r])=>[key,r]));
 for(const animal of allAnimals)known.set(animal.id,animal);
 const descendants=new Set([id]);let changed=true;
 while(changed){changed=false;for(const [key,r] of known)if(!descendants.has(key)&&r.parentIds?.some(p=>descendants.has(p))){descendants.add(key);changed=true}}
 // Preserve real retained ancestors, including their original parent IDs.
 // Absent ancestors remain unknown; they are never synthesized as founders.
 const ancestors=new Set(),pending=[id];
 while(pending.length){const key=pending.pop();if(ancestors.has(key))continue;ancestors.add(key);pending.push(...(known.get(key)?.parentIds||[]))}
 for(const animal of allAnimals){
  animal.lineage=descendants.has(animal.id);
  if((animal.lineage||ancestors.has(animal.id))&&!tracker.records.has(animal.id)){
   animal.lineage=true;const record=tracker.register(animal,animal.parentIds||[]);
   record.bornDay=animal.birthDay??null;record.bornYear=animal.birthYear??null;
   record.alive=animal.alive;animal.lineage=descendants.has(animal.id);
  }
  if(animal.player)sim.playerCombat?.clearFor?.(animal);
  animal.player=animal.id===id;
 }
 sim.playerId=id;sim.playerEnabled=true;sim.playerAutonomy=false;
 selected.target=null;selected.intent='idle';
 tracker.founderId=id;tracker.activeId=id;tracker.selectedHeirId=null;tracker.succession=null;
 tracker.highestGeneration=Math.max(...sim.animals.filter(a=>a.alive&&a.lineage).map(a=>a.generation||1));
 tracker.established=false;tracker.establishedTick=null;tracker.establishmentAnnounced=false;
 // The previous player's unspent rewards and pending editor opportunity are
 // not achievements of this newly chosen resident. Keep historical logs.
 sim.evolutionBudget.sinceHandoff=0;sim.evolutionEditor.offer=null;
 sim.creatureStart={schema:1,kind:'existing-resident',actorId:id,previousPlayerId:previous,
  priorFounderId,day:sim.day,tick:sim.tickCount,generation:selected.generation,parentIds:[...(selected.parentIds||[])]};
 for(const session of archived){
  session.snapshot.core.creatureStart=structuredClone(sim.creatureStart);
  const lineage=session.snapshot.controllers?.lineage;
  if(lineage){lineage.records=new Map([...lineage.records,...structuredClone(tracker.records)]);lineage.founderId=id;lineage.activeId=id;lineage.selectedHeirId=null;lineage.succession=null;}
 }
 tracker.refreshSelection();sim.reproduction.onActiveChanged();sim.foraging.observeNearby?.(selected);
 return selected;
}

export function validateResidentStart(sim){
 const entry=sim.creatureStart;if(entry===undefined)return;
 if(entry?.schema!==1||entry.kind!=='existing-resident'||!Number.isSafeInteger(entry.actorId)||entry.actorId<1||
  !Number.isSafeInteger(entry.day)||entry.day<1||!Number.isSafeInteger(entry.tick)||entry.tick<0||(sim.playerEnabled!==false&&entry.tick>sim.tickCount)||
  !Number.isSafeInteger(entry.generation)||entry.generation<1||!Array.isArray(entry.parentIds)||entry.parentIds.some(id=>!Number.isSafeInteger(id)||id<1))
  throw Error('Invalid existing-resident start provenance.');
}
