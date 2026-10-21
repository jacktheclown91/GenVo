// Physical storage only. World, Simulation and the existing snapshot codec
// retain all biological/resource ownership. No regeneration or catch-up here.
import {planetRegionOrigin,regionKey} from '../world/planet-regions.js';
import {REGIONAL_IDENTITIES,regionalIdentity,verifyRegionalIdentity,regionalIdentityWatermark} from '../world/regional-identities.js';
import {REGIONAL_REPLAY,POPULATION_MODE} from '../world/regional-replay-order.js';
export const REGION_STORE='regions';
export const LEGACY_REGIONAL_STORAGE='indexed-regions/1';
export const REGIONAL_STORAGE='indexed-regions/2';
export const STAGED_REGIONAL_STORAGE='indexed-regions/3';
const captureFor=(index,entry)=>index.schema===LEGACY_REGIONAL_STORAGE?index.capture:entry.capture;
const slotOK=id=>typeof id==='string'&&(id==='autosave'||/^world-[A-Za-z0-9-]{8,72}$/.test(id));
const recordID=(slot,kind,key)=>slot+'|'+kind+'|'+key;
const stagedID=(slot,kind,key,capture)=>recordID(slot,kind,key)+'|'+capture;
const validReference=(index,entry,slot)=>entry?.storage===undefined?entry?.id===recordID(slot,entry?.kind,entry?.key):index.schema===STAGED_REGIONAL_STORAGE&&entry.storage==='capture-key/1'&&entry.id===stagedID(slot,entry.kind,entry.key,entry.capture);
const replayPolicyOf=core=>core.regionalReplayPolicy===undefined?REGIONAL_REPLAY.legacy:core.regionalReplayPolicy;
let captureSerial=0;
const stageLockName=(db,slot,capture)=>'genvo-regional-stage|'+db.name+'|'+slot+'|'+capture;
function identity(kind,payload){
 const world=kind==='session'?payload?.snapshot?.world:payload?.world;
 if(world?.generator!=='planetary/1')throw Error('Regional record lacks its planetary World.');
 const origin=planetRegionOrigin(world.regionOrigin),key=regionKey(origin);
 if(kind==='session'&&payload.key!==key||kind==='survey'&&regionKey(planetRegionOrigin(payload.origin))!==key)throw Error('Regional record has conflicting coordinates.');
 return{key,origin};
}
export function validateRegionalIndex(root,slot){
 const index=root?.regionalPersistence;if(index===undefined)return null;
 if(!slotOK(slot)||![LEGACY_REGIONAL_STORAGE,REGIONAL_STORAGE,STAGED_REGIONAL_STORAGE].includes(index?.schema)||index.slot!==slot||typeof index.capture!=='string'||!index.capture||!Array.isArray(index.entries)||typeof index.hadSurvey!=='boolean')throw Error('Invalid regional persistence index.');
 for(const entry of [...index.entries,index.active])if(!entry||(index.schema!==LEGACY_REGIONAL_STORAGE?(typeof entry.capture!=='string'||!entry.capture):(entry.capture!==undefined&&entry.capture!==index.capture)))throw Error('Invalid regional record capture reference.');
 const seen=new Set(),active=root.world?.generator==='planetary/1'?regionKey(planetRegionOrigin(root.world.regionOrigin)):null;
 if(!active||root.core?.planetaryTravel?.sessions?.length||root.regionalWorlds!==undefined||root.animals!==undefined||root.controllers!==undefined)throw Error('Indexed root contains duplicate regional payloads.');
 if(index.active?.kind!=='active'||index.active.key!==active||!validReference(index,index.active,slot)||regionKey(planetRegionOrigin(index.active.origin))!==active)throw Error('Invalid active regional record.');
 for(const e of index.entries){
  if(!['session','survey'].includes(e?.kind)||e.key!==regionKey(planetRegionOrigin(e.origin))||!validReference(index,e,slot)||seen.has(e.key)||e.key===active)throw Error('Invalid or duplicate regional persistence entry.');
  if(e.unloaded!==undefined&&(e.unloaded!==true||e.kind!=='session'||!index.identityPolicy||e.life?.mode!==POPULATION_MODE))throw Error('Invalid unloaded regional entry.');
  seen.add(e.key);
 }
 if(index.entries.some(e=>e.kind==='session')&&!Array.isArray(root.core?.planetaryTravel?.sessions)||index.entries.some(e=>e.kind==='survey')&&!index.hadSurvey)throw Error('Regional index has no owning collection.');
 if(index.identityPolicy!==undefined){
  if(index.identityPolicy!==REGIONAL_IDENTITIES||!Object.values(REGIONAL_REPLAY).includes(index.replayPolicy))throw Error('Invalid regional directory policy.');
  const owners=[...index.entries.filter(e=>e.kind==='session'),index.active];
  const watermark=regionalIdentityWatermark(owners.map(e=>e.life));
  if(!Number.isSafeInteger(index.nextId)||index.nextId<watermark||index.active.life.mode!==null||index.active.life.tick!==root.core.tickCount||owners.some(e=>e.life.tick>root.core.tickCount)||index.entries.some(e=>e.kind==='survey'&&e.life!==undefined))throw Error('Invalid regional directory clock or identity watermark.');
 }else if(index.nextId!==undefined||index.replayPolicy!==undefined||[...index.entries,index.active].some(e=>e.life!==undefined))throw Error('Regional directory metadata lacks its policy.');
 return index;
}
export function partitionRegionalSnapshot(snapshot,slot){
 if(!slotOK(slot)||snapshot.world?.generator!=='planetary/1'||snapshot.regionalPersistence!==undefined)throw Error('A complete planetary checkpoint and valid slot are required.');
 const active={...snapshot,core:{...snapshot.core}},capture=globalThis.crypto?.randomUUID?.()||String(snapshot.savedAt)+'@'+snapshot.core.tickCount+'@'+(++captureSerial);
 const root={key:snapshot.key,schema:snapshot.schema,gameVersion:snapshot.gameVersion,savedAt:snapshot.savedAt,reason:snapshot.reason,seed:snapshot.seed,rngState:snapshot.rngState,meta:snapshot.meta,world:{generator:'planetary/1',regionOrigin:snapshot.world.regionOrigin},core:{tickCount:snapshot.core.tickCount}};
 const entries=[],records=[];
 const add=(kind,payload)=>{const {key,origin}=identity(kind,payload),id=recordID(slot,kind,key);entries.push({kind,key,origin,id,capture,...(kind==='session'?{life:regionalIdentity(payload.snapshot,{mode:payload.biologicalMode??null})}:{})});records.push({id,value:{schema:1,slot,capture,kind,key,payload}})};
 if(snapshot.core.planetaryTravel){
  active.core.planetaryTravel={...snapshot.core.planetaryTravel,sessions:[]};delete active.core.planetaryTravel.unloaded;root.core.planetaryTravel={sessions:[]};
  for(const session of snapshot.core.planetaryTravel.sessions)add('session',session);
  // Unloaded regions keep the exact committed record they were released from.
  for(const stub of snapshot.core.planetaryTravel.unloaded||[])entries.push(retainedEntry(stub));
 }
 for(const survey of snapshot.regionalWorlds||[])add('survey',survey);
 const current=identity('active',snapshot),id=recordID(slot,'active',current.key);delete active.regionalWorlds;
 records.push({id,value:{schema:1,slot,capture,kind:'active',key:current.key,payload:active}});
 const life=regionalIdentity(snapshot),nextId=Math.max(snapshot.core.planetaryTravel?.nextId||1,regionalIdentityWatermark([...entries.filter(e=>e.kind==='session').map(e=>e.life),life]));
 root.regionalPersistence={schema:entries.some(e=>e.storage)?STAGED_REGIONAL_STORAGE:REGIONAL_STORAGE,slot,capture,hadSurvey:Object.hasOwn(snapshot,'regionalWorlds'),active:{kind:'active',...current,id,life,capture},entries,identityPolicy:REGIONAL_IDENTITIES,nextId,replayPolicy:replayPolicyOf(snapshot.core)};
 validateRegionalIndex(root,slot);return{root,records};
}
const retainedEntry=e=>{
 if(e?.kind!=='session'||e.unloaded!==true||typeof e.id!=='string'||typeof e.capture!=='string')throw Error('Invalid unloaded regional reference.');
 return{kind:'session',key:e.key,origin:planetRegionOrigin(e.origin),id:e.id,capture:e.capture,...(e.storage?{storage:e.storage}:{}),life:structuredClone(e.life),unloaded:true};
};
const sameReference=(a,b)=>a&&b&&a.kind===b.kind&&a.key===b.key&&a.id===b.id&&a.capture===b.capture&&(a.storage??null)===(b.storage??null)&&JSON.stringify(a.life??null)===JSON.stringify(b.life??null);
// General owner journal (regional-residency/1). `owners` lists every resident
// session, unloaded session and survey in simulation order; each is either
// written from its payload or retained by reference to the identical entry of
// the previous committed root. Membership and the active region may change.
export function partitionRegionalJournal(active,slot,previous,owners){
 const old=validateRegionalIndex(previous,slot);
 if(!old?.identityPolicy)throw Error('Journal updates require an indexed identity directory.');
 if(active.seed!==previous.seed||active.core?.planetaryTravel?.sessions?.length||active.regionalWorlds!==undefined)throw Error('Journal update requires an active record without nested regional payloads.');
 const base={...active,core:{...active.core}};if(base.core.planetaryTravel){base.core.planetaryTravel={...base.core.planetaryTravel};delete base.core.planetaryTravel.unloaded}
 if(owners.some(o=>o.kind==='survey'))base.regionalWorlds=[];
 const plan=partitionRegionalSnapshot(base,slot),index=plan.root.regionalPersistence,capture=index.capture,seen=new Set();
 index.schema=STAGED_REGIONAL_STORAGE;index.entries=[];
 for(const o of owners){
  if(!['session','survey'].includes(o?.kind)||seen.has(o.key))throw Error('Invalid or duplicate journal owner.');seen.add(o.key);
  if(o.retain){
   const prior=[...old.entries].find(e=>e.kind===o.kind&&e.key===o.key);
   if(!prior)throw Error('Retained regional owner is missing from the previous checkpoint: '+o.key);
   if(o.unloaded?!sameReference({...prior,capture:captureFor(old,prior)},o.retain):prior.unloaded)throw Error('Retained regional owner differs from the previous checkpoint: '+o.key);
   const entry={...structuredClone(prior),capture:captureFor(old,prior)};if(o.unloaded)entry.unloaded=true;else delete entry.unloaded;index.entries.push(entry);continue;
  }
  if(o.unloaded)throw Error('An unloaded region cannot be written without its payload.');
  const {key,origin}=identity(o.kind,o.payload),id=recordID(slot,o.kind,key);if(key!==o.key)throw Error('Journal owner has conflicting coordinates.');
  index.entries.push({kind:o.kind,key,origin,id,capture,...(o.kind==='session'?{life:regionalIdentity(o.payload.snapshot,{mode:o.payload.biologicalMode??null})}:{})});
  plan.records.unshift({id,value:{schema:1,slot,capture,kind:o.kind,key,payload:o.payload}});
 }
 index.hadSurvey=owners.some(o=>o.kind==='survey');
 if(index.entries.some(e=>e.kind==='session'))plan.root.core.planetaryTravel={sessions:[]};
 index.nextId=Math.max(active.core.planetaryTravel?.nextId||1,regionalIdentityWatermark([...index.entries.filter(e=>e.kind==='session').map(e=>e.life),index.active.life]));
 if(active.core.nextId<index.nextId||index.entries.some(e=>e.kind==='session')&&!(active.core.planetaryTravel?.nextId>=index.nextId))throw Error('Active allocator does not cover retained regional identities.');
 if(active.core.tickCount<previous.core.tickCount)throw Error('Regional update cannot rewind the active checkpoint.');
 validateRegionalIndex(plan.root,slot);return plan;
}
export async function commitRegionalJournal(db,active,slot,previous,owners){
 return commitRegionalPlan(db,partitionRegionalJournal(active,slot,previous,owners),slot,previous);
}
function verifyDirectoryPayload(index,entry,payload){
 if(!index.identityPolicy||entry.kind==='survey')return;
 if(entry.kind==='active'&&index.entries.some(e=>e.kind==='session')&&!Array.isArray(payload.core?.planetaryTravel?.sessions))throw Error('Active record lacks its regional owning collection.');
 verifyRegionalIdentity(entry.life,entry.kind==='session'?payload.snapshot:payload,entry.kind==='session'?{mode:payload.biologicalMode??null}:undefined);
 if(entry.kind==='active'&&(index.replayPolicy!==replayPolicyOf(payload.core)||index.nextId!==Math.max(payload.core.planetaryTravel?.nextId||1,regionalIdentityWatermark([...index.entries.filter(e=>e.kind==='session').map(e=>e.life),index.active.life]))))throw Error('Regional directory does not match its active authority.');
}
// `residentOnly` leaves unloaded sessions on disk and returns their exact
// directory entries in core.planetaryTravel.unloaded; complete reads (export,
// fork, backup) hydrate every record.
export function assembleRegionalSnapshot(root,slot,records,{residentOnly=false}={}){
 const index=validateRegionalIndex(root,slot);if(!index)return root;
 const kept=residentOnly?index.entries.filter(e=>!e.unloaded):index.entries,skipped=residentOnly?index.entries.filter(e=>e.unloaded):[];
 if(records.length!==kept.length+1)throw Error('Incomplete regional checkpoint.');
 const active=records.at(-1);if(active?.schema!==1||active.slot!==slot||active.capture!==captureFor(index,index.active)||active.kind!=='active'||active.key!==index.active.key||identity('active',active.payload).key!==index.active.key||active.payload.core?.tickCount!==root.core.tickCount||active.payload.seed!==root.seed||active.payload.core?.planetaryTravel?.sessions?.length||active.payload.regionalWorlds!==undefined)throw Error('Missing or stale active regional record.');
 verifyDirectoryPayload(index,index.active,active.payload);
 const result={...active.payload,core:{...active.payload.core}},sessions=[],survey=[];
 for(let n=0;n<kept.length;n++){
  const e=kept[n],r=records[n];if(r?.schema!==1||r.slot!==slot||r.capture!==captureFor(index,e)||r.kind!==e.kind||r.key!==e.key)throw Error('Missing or stale regional record: '+e.key);
  if(identity(e.kind,r.payload).key!==e.key)throw Error('Regional record identity mismatch.');
  verifyDirectoryPayload(index,e,r.payload);
  (e.kind==='session'?sessions:survey).push(r.payload);
 }
 if(result.core.planetaryTravel){result.core.planetaryTravel={...result.core.planetaryTravel,sessions};if(skipped.length)result.core.planetaryTravel.unloaded=skipped.map(e=>({kind:'session',key:e.key,origin:{x:e.origin.x,y:e.origin.y},id:e.id,capture:captureFor(index,e),...(e.storage?{storage:e.storage}:{}),life:structuredClone(e.life),unloaded:true}))}
 if(index.hadSurvey)result.regionalWorlds=survey;delete result.regionalPersistence;return result;
}
// Queue all dependent reads within the root request callback. One readonly
// transaction prevents a concurrent save from mixing two committed captures.
export function readRegionalCheckpoint(db,slot,{region=null,kind='session',manifestOnly=false,expectedCapture=null,residentOnly=false}={}){
 if(!slotOK(slot))return Promise.reject(Error('Invalid world slot.'));
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['saves',REGION_STORE],'readonly'),saves=tx.objectStore('saves'),regions=tx.objectStore(REGION_STORE);let root,result,problem;
  tx.onabort=()=>reject(problem||tx.error||Error('Regional read aborted.'));tx.onerror=()=>reject(tx.error||Error('Regional read failed.'));
  tx.oncomplete=()=>{if(problem){reject(problem);return}try{resolve(result===undefined?root:result)}catch(error){reject(error)}};
  const fail=error=>{problem=error;try{tx.abort()}catch{reject(error)}};
  const request=saves.get(slot);request.onerror=()=>fail(request.error||Error('Checkpoint read failed.'));
  request.onsuccess=()=>{try{
   root=request.result||null;if(!root){if(expectedCapture!==null)throw Error('Regional checkpoint changed; reopen the reader.');result=null;return}const index=validateRegionalIndex(root,slot);
   if(expectedCapture!==null&&index?.capture!==expectedCapture)throw Error('Regional checkpoint changed; reopen the reader.');
   if(manifestOnly){result=root;return}
   if(region!==null){
    if(!['session','survey','active'].includes(kind))throw Error('Invalid region record kind.');
    if(!index){if(kind==='active'){result=identity('active',root).key===region?root:null;return}const rows=kind==='session'?root.core?.planetaryTravel?.sessions:root.regionalWorlds;result=rows?.find(row=>identity(kind,row).key===region)||null;return}
    const entry=[...index.entries,index.active].find(e=>e.kind===kind&&e.key===region);if(!entry){result=null;return}
    const req=regions.get(entry.id);req.onerror=()=>fail(req.error||Error('Region read failed.'));req.onsuccess=()=>{try{const r=req.result;if(r?.schema!==1||r.capture!==captureFor(index,entry)||r.slot!==slot||r.kind!==kind||r.key!==entry.key||identity(kind,r.payload).key!==entry.key)throw Error('Missing or stale regional record: '+entry.key);verifyDirectoryPayload(index,entry,r.payload);result=r.payload}catch(error){fail(error)}};return;
   }
   if(!index){result=root;return}const entries=[...(residentOnly?index.entries.filter(e=>!e.unloaded):index.entries),index.active],records=new Array(entries.length);let pending=records.length;
   // Keep one payload request in flight. Queue the next inside onsuccess so
   // IndexedDB keeps this SAME snapshot transaction alive between pages.
   // Compatibility full loads still retain all returned payloads for restore.
   const next=n=>{const entry=entries[n],req=regions.get(entry.id);req.onerror=()=>fail(req.error||Error('Region read failed.'));req.onsuccess=()=>{try{records[n]=req.result;if(--pending===0)result=assembleRegionalSnapshot(root,slot,records,{residentOnly});else next(n+1)}catch(error){fail(error)}}};next(0);
  }catch(error){fail(error)}};
 });
}
const completed=tx=>new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||Error('Regional transaction aborted.'));tx.onerror=()=>reject(tx.error||Error('Regional transaction failed.'))});
const checkpointStamp=root=>root?[root.savedAt,root.core?.tickCount,root.regionalPersistence?.capture||'legacy'].join('|'):null;
// An update may replace existing owners only. Region discovery/travel changes
// still use the complete checkpoint path until their role-transfer journal is wired.
export function partitionRegionalUpdate(active,slot,previous,changes=[]){
 const old=validateRegionalIndex(previous,slot);
 if(!old?.identityPolicy)throw Error('Regional updates require an indexed identity directory.');
 if(active.seed!==previous.seed||identity('active',active).key!==old.active.key||active.core?.planetaryTravel?.sessions?.length||active.regionalWorlds!==undefined)throw Error('Regional update requires the same active owner without nested regional payloads.');
 if(old.entries.some(e=>e.kind==='session')&&!Array.isArray(active.core?.planetaryTravel?.sessions))throw Error('Active record lacks its regional owning collection.');
 const plan=partitionRegionalSnapshot(active,slot),index=plan.root.regionalPersistence;
 if(old.schema===STAGED_REGIONAL_STORAGE)index.schema=STAGED_REGIONAL_STORAGE;
 index.entries=old.entries.map(entry=>({...structuredClone(entry),capture:captureFor(old,entry)}));index.hadSurvey=old.hadSurvey;
 const replaced=new Set();
 for(const change of changes){
  if(!['session','survey'].includes(change?.kind))throw Error('Invalid changed regional owner.');
  const {key}=identity(change.kind,change.payload),entry=index.entries.find(e=>e.kind===change.kind&&e.key===key);
  if(!entry||replaced.has(change.kind+'|'+key))throw Error('Missing or duplicate changed regional owner.');replaced.add(change.kind+'|'+key);
  entry.capture=index.capture;entry.id=recordID(slot,change.kind,key);delete entry.storage;
  if(change.kind==='session')entry.life=regionalIdentity(change.payload.snapshot,{mode:change.payload.biologicalMode??null});
  plan.records.unshift({id:entry.id,value:{schema:1,slot,capture:index.capture,kind:change.kind,key,payload:change.payload}});
 }
 if(index.entries.some(e=>e.kind==='session'))plan.root.core.planetaryTravel={sessions:[]};
 index.nextId=Math.max(active.core.planetaryTravel?.nextId||1,regionalIdentityWatermark([...index.entries.filter(e=>e.kind==='session').map(e=>e.life),index.active.life]));
 if(active.core.nextId<index.nextId||index.entries.some(e=>e.kind==='session')&&!(active.core.planetaryTravel?.nextId>=index.nextId))throw Error('Active allocator does not cover retained regional identities.');
 if(active.core.tickCount<previous.core.tickCount)throw Error('Regional update cannot rewind the active checkpoint.');
 validateRegionalIndex(plan.root,slot);return plan;
}
export async function commitRegionalUpdate(db,active,slot,previous,changes=[]){
 return commitRegionalPlan(db,partitionRegionalUpdate(active,slot,previous,changes),slot,previous);
}
export async function commitRegionalCheckpoint(db,snapshot,slot,previous){
 return commitRegionalPlan(db,partitionRegionalSnapshot(snapshot,slot),slot,previous);
}
async function commitRegionalPlan(db,{root,records},slot,previous){
 const old=validateRegionalIndex(previous,slot),index=validateRegionalIndex(root,slot),keep=new Set([...index.entries,index.active].map(e=>e.id));
 for(const e of index.entries)if(e.unloaded){const prior=old?.entries.find(p=>p.kind==='session'&&p.key===e.key);if(!prior||!sameReference({...prior,capture:captureFor(old,prior),unloaded:true},e))throw Error('Unloaded regional record is missing from the previous checkpoint: '+e.key)}
 const tx=db.transaction(['saves','meta',REGION_STORE],'readwrite'),done=completed(tx);let conflict;
 try{
  const metadata=tx.objectStore('meta'),regions=tx.objectStore(REGION_STORE),saves=tx.objectStore('saves');
  // The first queued read sees the prior committed root under this write lock.
  // All puts still clone synchronously in this capture turn; a stale writer
  // aborts those queued operations before any can become visible.
  const guard=saves.get(slot);guard.onsuccess=()=>{if(checkpointStamp(guard.result)!==checkpointStamp(previous)){conflict=Error('World slot changed during regional save; reload before retrying.');tx.abort()}};
  metadata.put(root.meta,slot);
  for(const r of records)regions.put(r.value,r.id);for(const e of old?[...old.entries,old.active]:[])if(!keep.has(e.id))regions.delete(e.id);
  saves.put(root,slot);await done;return{root,written:records.length,retained:keep.size-records.length};
 }catch(error){try{tx.abort()}catch{}await done.catch(()=>{});throw conflict||error}
}
// Unpublished capture keys permit one-page-at-a-time staging without touching
// any record referenced by the old root. This object retains metadata only.
export class RegionalCheckpointStage{
 #db;#slot;#previous;#root;#entries;#capture;#activeInfo=null;#ids=new Set();#busy=false;#state='open';#releaseLock=null;
 constructor(db,slot,previous){
  const index=validateRegionalIndex(previous,slot);if(!index?.identityPolicy)throw Error('Regional staging requires an indexed identity directory.');
  this.#db=db;this.#slot=slot;this.#previous=structuredClone(previous);
  this.#capture=(globalThis.navigator?.locks?'locked@':'')+(globalThis.crypto?.randomUUID?.()||'stage@'+Date.now()+'@'+Math.random()+'@'+(++captureSerial));
  this.#entries=index.entries.map(e=>({...structuredClone(e),capture:captureFor(index,e)}));
 }
 async #protect(){
  if(this.#releaseLock||!this.#capture.startsWith('locked@'))return;
  await new Promise((resolve,reject)=>{navigator.locks.request(stageLockName(this.#db,this.#slot,this.#capture),async()=>{const held=new Promise(release=>{this.#releaseLock=release});resolve();await held}).catch(reject)});
 }
 #unlock(){this.#releaseLock?.();this.#releaseLock=null}
 get state(){return this.#state}
 get pendingRecords(){return this.#ids.size}
 #admit(){if(this.#state!=='open'||this.#busy)throw Error('Regional stage is closed or busy.');}
 async stage(kind,payload){
  this.#admit();if(!['active','session','survey'].includes(kind))throw Error('Invalid staged regional kind.');
  const {key,origin}=identity(kind,payload),old=this.#previous.regionalPersistence;
  const prior=kind==='active'?old.active:this.#entries.find(e=>e.kind===kind&&e.key===key);
  if(!prior||prior.key!==key)throw Error('Staged page does not belong to this checkpoint.');
  let activePlan,info;
  if(kind==='active'){
   if(payload.seed!==this.#previous.seed||payload.core?.planetaryTravel?.sessions?.length||payload.regionalWorlds!==undefined)throw Error('Staged active record contains foreign or nested regional ownership.');
   if(old.entries.some(e=>e.kind==='session')&&!Array.isArray(payload.core?.planetaryTravel?.sessions))throw Error('Active record lacks its regional owning collection.');
   activePlan=partitionRegionalSnapshot(payload,this.#slot);
   info={nextId:payload.core.nextId,travelNextId:payload.core.planetaryTravel?.nextId||1};
  }
  const entry={kind,key,origin,id:stagedID(this.#slot,kind,key,this.#capture),capture:this.#capture,storage:'capture-key/1',...(kind==='survey'?{}:{life:regionalIdentity(kind==='active'?payload:payload.snapshot,{mode:kind==='session'?payload.biologicalMode??null:null})})};
  const record={schema:1,slot:this.#slot,capture:this.#capture,kind,key,payload};
  let tx,done;this.#busy=true;
  try{
   await this.#protect();tx=this.#db.transaction(REGION_STORE,'readwrite');done=completed(tx);
   tx.objectStore(REGION_STORE).put(record,entry.id);await done;
   this.#ids.add(entry.id);
   if(kind==='active'){
    this.#root=activePlan.root;this.#activeInfo=info;
    this.#root.regionalPersistence={...this.#root.regionalPersistence,schema:STAGED_REGIONAL_STORAGE,capture:this.#capture,active:entry};
   }else this.#entries[this.#entries.findIndex(e=>e.kind===kind&&e.key===key)]=entry;
   return structuredClone(entry);
  }catch(error){try{tx?.abort()}catch{}await done?.catch(()=>{});throw error}
  finally{this.#busy=false}
 }
 async publish(){
  this.#admit();if(!this.#root||!this.#activeInfo)throw Error('Stage the active allocation/transaction record before publishing.');
  const root=structuredClone(this.#root),index=root.regionalPersistence,old=validateRegionalIndex(this.#previous,this.#slot);
  index.entries=structuredClone(this.#entries);index.hadSurvey=old.hadSurvey;
  if(index.entries.some(e=>e.kind==='session'))root.core.planetaryTravel={sessions:[]};
  index.nextId=Math.max(this.#activeInfo.travelNextId,regionalIdentityWatermark([...index.entries.filter(e=>e.kind==='session').map(e=>e.life),index.active.life]));
  if(this.#activeInfo.nextId<index.nextId||index.entries.some(e=>e.kind==='session')&&this.#activeInfo.travelNextId<index.nextId)throw Error('Staged active allocator does not cover regional identities.');
  if(root.core.tickCount<this.#previous.core.tickCount)throw Error('Staged checkpoint cannot rewind active time.');
  validateRegionalIndex(root,this.#slot);
  const keep=new Set([...index.entries,index.active].map(e=>e.id));
  const tx=this.#db.transaction(['saves','meta',REGION_STORE],'readwrite'),done=completed(tx);this.#busy=true;let problem;
  try{
   const saves=tx.objectStore('saves'),regions=tx.objectStore(REGION_STORE),meta=tx.objectStore('meta'),guard=saves.get(this.#slot);
   guard.onsuccess=()=>{if(checkpointStamp(guard.result)!==checkpointStamp(this.#previous)){problem=Error('World slot changed during staged publication; reopen the checkpoint.');tx.abort()}};
   for(const id of this.#ids){const request=regions.getKey(id);request.onsuccess=()=>{if(request.result===undefined){problem=Error('Missing staged regional record.');tx.abort()}};}
   meta.put(root.meta,this.#slot);saves.put(root,this.#slot);
   for(const entry of [...old.entries,old.active])if(!keep.has(entry.id))regions.delete(entry.id);
   await done;this.#state='published';this.#unlock();return{root,written:this.#ids.size,retained:keep.size-this.#ids.size};
  }catch(error){try{tx.abort()}catch{}await done.catch(()=>{});throw problem||error}
  finally{this.#busy=false}
 }
 async abort(){
  if(this.#state==='published'||this.#state==='aborted')return{deleted:0};this.#admit();
  if(!this.#ids.size){this.#state='aborted';this.#unlock();return{deleted:0}}
  const tx=this.#db.transaction(REGION_STORE,'readwrite'),done=completed(tx);this.#busy=true;
  try{const store=tx.objectStore(REGION_STORE);for(const id of this.#ids)store.delete(id);await done;const deleted=this.#ids.size;this.#ids.clear();this.#state='aborted';this.#unlock();return{deleted}}
  catch(error){try{tx.abort()}catch{}await done.catch(()=>{});throw error}
  finally{this.#busy=false}
 }
}
// Review only: an unreferenced candidate can still belong to a live stage.
// One readonly transaction observes roots and keys consistently without
// decoding any regional payload or authorizing reclamation.
export async function inspectRegionalStorage(db){
 const tx=db.transaction(['saves',REGION_STORE],'readonly'),done=completed(tx),owned=new Map(),missing=new Set(),unreferenced=[],unrecognized=[];
 let roots=0,records=0,referenced=0,problem;
 const fail=error=>{problem=error;tx.abort()},request=tx.objectStore('saves').openCursor();
 request.onsuccess=()=>{try{const cursor=request.result;if(cursor){const index=validateRegionalIndex(cursor.value,cursor.key);roots++;for(const e of index?[...index.entries,index.active]:[]){owned.set(e.id,{slot:cursor.key,kind:e.kind,key:e.key});missing.add(e.id)}cursor.continue();return}
  const keys=tx.objectStore(REGION_STORE).openKeyCursor();keys.onsuccess=()=>{try{const row=keys.result;if(!row)return;const id=row.key;records++;if(owned.has(id)){referenced++;missing.delete(id)}else if(typeof id==='string'){const parts=id.split('|');if((parts.length===3||parts.length===4)&&slotOK(parts[0])&&['active','session','survey'].includes(parts[1]))unreferenced.push({id,slot:parts[0],kind:parts[1],key:parts[2],capture:parts[3]??null,storage:parts.length===4?'capture-key/1':'fixed-key/1'});else unrecognized.push(id)}else unrecognized.push(id);row.continue()}catch(error){fail(error)}};
 }catch(error){fail(error)}};
 try{await done}catch(error){throw problem||error}
 return{schema:'regional-storage-inventory/1',roots,records,referenced,unreferenced,unrecognized,missing:[...missing].map(id=>({id,...owned.get(id)})),reclamationAuthorized:false};
}
export async function deleteRegionalCheckpoint(db,slot){
 if(!slotOK(slot))throw Error('Invalid world slot.');
 const tx=db.transaction(['saves','meta',REGION_STORE],'readwrite'),done=completed(tx),saves=tx.objectStore('saves'),regions=tx.objectStore(REGION_STORE),metadata=tx.objectStore('meta');let problem;
 const req=saves.get(slot);req.onsuccess=()=>{try{const index=validateRegionalIndex(req.result,slot);for(const e of index?[...index.entries,index.active]:[])regions.delete(e.id);saves.delete(slot);metadata.delete(slot)}catch(error){problem=error;tx.abort()}};
 try{await done}catch(error){throw problem||error}
}

// Older captures lack cross-tab lifetime protection and remain untouched.
// New lock-marked stages are reclaimable only after their owner releases or
// its browser context dies. Root ownership is rechecked under the write lock.
export async function recoverRegionalStages(db){
 if(!globalThis.navigator?.locks)return{deleted:0,live:0,unsupported:true};
 const scan=db.transaction(REGION_STORE,'readonly'),scanned=completed(scan),groups=new Map(),request=scan.objectStore(REGION_STORE).openKeyCursor();
 request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const id=cursor.key;if(typeof id==='string'){const parts=id.split('|');if(parts.length===4&&slotOK(parts[0])&&['active','session','survey'].includes(parts[1])&&parts[3].startsWith('locked@')){const key=parts[0]+'|'+parts[3];if(!groups.has(key))groups.set(key,{slot:parts[0],capture:parts[3],ids:[]});groups.get(key).ids.push(id)}}cursor.continue()};await scanned;
 let deleted=0,live=0;
 for(const group of groups.values())await navigator.locks.request(stageLockName(db,group.slot,group.capture),{ifAvailable:true},async lock=>{
  if(!lock){live++;return}
  const tx=db.transaction(['saves',REGION_STORE],'readwrite'),done=completed(tx),store=tx.objectStore(REGION_STORE);let problem,count=0;
  const guard=tx.objectStore('saves').get(group.slot);guard.onsuccess=()=>{try{const index=validateRegionalIndex(guard.result,group.slot),keep=new Set(index?[...index.entries,index.active].map(e=>e.id):[]);for(const id of group.ids)if(!keep.has(id)){const found=store.getKey(id);found.onsuccess=()=>{try{if(found.result!==undefined){store.delete(id);count++}}catch(error){problem=error;tx.abort()}}}}catch(error){problem=error;tx.abort()}};
  try{await done;deleted+=count}catch(error){throw problem||error}
 });
 return{deleted,live,unsupported:false};
}
