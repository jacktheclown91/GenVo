import {SPECIES} from '../organisms/species.js';
import {applyLineageTarget} from '../lineage/reproduction-bridge.js';
import {validateFounderDesign} from '../lineage/founder-design.js';
import {bodyMass} from '../organisms/body-mass.js';
import {canOccupy} from '../lineage/lifestyle.js';
import {isWaterDweller} from '../lineage/aquatic.js';
import {selectResidentStart} from './resident-start.js';

// Only prepare within an independent creation candidate. It is not installed
// or saved while the creator edits; cancellation discards that whole fork.
export function prepareAuthoredFounders(sim){
 let nextId=Math.max(sim.nextId,sim.planetaryTravel?.nextId||1);
 for(const a of sim.animals)nextId=Math.max(nextId,a.id+1);
 for(const session of sim.planetaryTravel?.sessions||[])for(const a of session.snapshot.animals)nextId=Math.max(nextId,a.id+1);
 sim.nextId=nextId;
 const members=[sim.spawnAnimal('genvo'),sim.spawnAnimal('genvo')];
 members[1].sex=members[0].sex==='F'?'M':'F';
 for(const a of members){a.age=SPECIES[a.species].maturity;a.reproCooldown=0;}
 return members;
}
function founderSite(sim,body,origin){
 const w=sim.world,waterRequired=isWaterDweller(body);let best=null,score=Infinity;
 for(let y=2;y<w.n-2;y++)for(let x=2;x<w.n-2;x++){
  const px=x+.5,py=y+.5,i=w.idx(px,py);
  if(waterRequired&&!w.water[i]||!canOccupy(body,w,px,py))continue;
  const d=(px-origin.x)**2+(py-origin.y)**2;
  if(d<score){best={x:px,y:py};score=d;}
 }
 return best;
}
export function installAuthoredFounders(sim,members,design){
 const plan=validateFounderDesign(design);
 if(!Array.isArray(members)||members.length!==2||members[0]===members[1]||members.some(a=>!sim.animals.includes(a)||!a.alive||a.parentIds?.length))
  throw Error('Custom starts require two independently introduced canonical founders.');
 // Validate and find a supported habitat before changing either real body.
 const probes=members.map(a=>{const probe=structuredClone(a);if(!applyLineageTarget(probe,plan))throw Error('Unsupported founder anatomy.');bodyMass(probe);return probe});
 const origin=members[0],first=founderSite(sim,probes[0],origin),sites=[first,first?founderSite(sim,probes[1],{x:first.x+1.5,y:first.y}):null];
 if(sites.some(site=>!site))throw Error('This world has no physically accessible habitat for the chosen anatomy.');
 for(let i=0;i<members.length;i++){
  const a=members[i];applyLineageTarget(a,plan);a.x=sites[i].x;a.y=sites[i].y;
  a.authoredOrigin={schema:1,mode:design.mode,introducedDay:sim.day,introducedTick:sim.tickCount,authoredAge:a.age};
 }
 selectResidentStart(sim,members[0].id);
 const companion=members[1];companion.lineage=true;sim.lineage.register(companion,[]);
 for(const a of members){const r=sim.lineage.records.get(a.id);r.authoredOrigin=structuredClone(a.authoredOrigin);r.bornDay=null;r.bornYear=null;}
 const introduced=members.map(a=>({id:a.id,mass:bodyMass(a),energy:a.energy,hydration:a.hydration,age:a.age,body:design.plan}));
 const receipt={schema:1,source:'explicit-authored-introduction',day:sim.day,tick:sim.tickCount,
  mode:design.mode,actors:introduced,design:structuredClone(design)};
 sim.authoredIntroductions=[...(sim.authoredIntroductions||[]),receipt];
 sim.creatureStart={...sim.creatureStart,kind:'authored-founder',mode:design.mode,actorIds:members.map(a=>a.id),introductionIndex:sim.authoredIntroductions.length-1};
 for(const session of sim.planetaryTravel?.sessions||[]){session.snapshot.core.creatureStart=structuredClone(sim.creatureStart);session.snapshot.core.authoredIntroductions=structuredClone(sim.authoredIntroductions);}
 sim.stats.authoredIntroductions=(sim.stats.authoredIntroductions||0)+members.length;
 sim.paused=false;sim.rebuildSpatial();sim.regionalEcology.resetPageResidency();sim.reproduction.refreshSelection();
 return{members,receipt};
}

export function validateAuthoredIntroductions(sim){
 const rows=sim.authoredIntroductions;if(rows===undefined){if(sim.creatureStart?.kind==='authored-founder')throw Error('Authored founder has no introduction receipt.');return;}
 if(!Array.isArray(rows))throw Error('Invalid authored introduction ledger.');
 const ids=new Set();
 for(const r of rows){
  if(r?.schema!==1||r.source!=='explicit-authored-introduction'||!['guided','sandbox'].includes(r.mode)||
   !Number.isSafeInteger(r.day)||r.day<1||!Number.isSafeInteger(r.tick)||r.tick<0||!Array.isArray(r.actors)||r.actors.length!==2||r.mode!==r.design?.mode)
   throw Error('Invalid authored introduction receipt.');
  validateFounderDesign(r.design);
  for(const a of r.actors){if(!Number.isSafeInteger(a.id)||a.id<1||ids.has(a.id)||a.body!==r.design.plan||
    ['mass','energy','hydration','age'].some(k=>!Number.isFinite(a[k])||a[k]<0)||a.mass===0)throw Error('Invalid authored founder resource receipt.');ids.add(a.id);}
 }
 const entry=sim.creatureStart;
 if(entry?.kind==='authored-founder'){
  const row=rows[entry.introductionIndex];
  if(!Number.isSafeInteger(entry.introductionIndex)||entry.introductionIndex<0||!row||entry.mode!==row.mode||!row.actors.some(a=>a.id===entry.actorId)||
    !Array.isArray(entry.actorIds)||entry.actorIds.length!==2||entry.actorIds.some((id,i)=>id!==row.actors[i].id))
   throw Error('Authored founder entry disagrees with its introduction receipt.');
 }
}
