// Physical storage only. World, Simulation and the existing snapshot codec
// retain all biological/resource ownership. No regeneration or catch-up here.
import {planetRegionOrigin,regionKey} from '../world/planet-regions.js';
import {REGIONAL_IDENTITIES,regionalIdentity,verifyRegionalIdentity,regionalIdentityWatermark} from '../world/regional-identities.js';
import {REGIONAL_REPLAY} from '../world/regional-replay-order.js';
export const REGION_STORE='regions';
export const LEGACY_REGIONAL_STORAGE='indexed-regions/1';
export const REGIONAL_STORAGE='indexed-regions/2';
const captureFor=(index,entry)=>index.schema===REGIONAL_STORAGE?entry.capture:index.capture;
const slotOK=id=>typeof id==='string'&&(id==='autosave'||/^world-[A-Za-z0-9-]{8,72}$/.test(id));
const recordID=(slot,kind,key)=>slot+'|'+kind+'|'+key;
const replayPolicyOf=core=>core.regionalReplayPolicy===undefined?REGIONAL_REPLAY.legacy:core.regionalReplayPolicy;
let captureSerial=0;
function identity(kind,payload){
 const world=kind==='session'?payload?.snapshot?.world:payload?.world;
 if(world?.generator!=='planetary/1')throw Error('Regional record lacks its planetary World.');
 const origin=planetRegionOrigin(world.regionOrigin),key=regionKey(origin);
 if(kind==='session'&&payload.key!==key||kind==='survey'&&regionKey(planetRegionOrigin(payload.origin))!==key)throw Error('Regional record has conflicting coordinates.');
 return{key,origin};
}
export function validateRegionalIndex(root,slot){
 const index=root?.regionalPersistence;if(index===undefined)return null;
 if(!slotOK(slot)||![LEGACY_REGIONAL_STORAGE,REGIONAL_STORAGE].includes(index?.schema)||index.slot!==slot||typeof index.capture!=='string'||!index.capture||!Array.isArray(index.entries)||typeof index.hadSurvey!=='boolean')throw Error('Invalid regional persistence index.');
 for(const entry of [...index.entries,index.active])if(!entry||(index.schema===REGIONAL_STORAGE?(typeof entry.capture!=='string'||!entry.capture):(entry.capture!==undefined&&entry.capture!==index.capture)))throw Error('Invalid regional record capture reference.');
 const seen=new Set(),active=root.world?.generator==='planetary/1'?regionKey(planetRegionOrigin(root.world.regionOrigin)):null;
 if(!active||root.core?.planetaryTravel?.sessions?.length||root.regionalWorlds!==undefined||root.animals!==undefined||root.controllers!==undefined)throw Error('Indexed root contains duplicate regional payloads.');
 if(index.active?.kind!=='active'||index.active.key!==active||index.active.id!==recordID(slot,'active',active)||regionKey(planetRegionOrigin(index.active.origin))!==active)throw Error('Invalid active regional record.');
 for(const e of index.entries){
  if(!['session','survey'].includes(e?.kind)||e.key!==regionKey(planetRegionOrigin(e.origin))||e.id!==recordID(slot,e.kind,e.key)||seen.has(e.key)||e.key===active)throw Error('Invalid or duplicate regional persistence entry.');
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
 if(snapshot.core.planetaryTravel){active.core.planetaryTravel={...snapshot.core.planetaryTravel,sessions:[]};root.core.planetaryTravel={sessions:[]};for(const session of snapshot.core.planetaryTravel.sessions)add('session',session)}
 for(const survey of snapshot.regionalWorlds||[])add('survey',survey);
 const current=identity('active',snapshot),id=recordID(slot,'active',current.key);delete active.regionalWorlds;
 records.push({id,value:{schema:1,slot,capture,kind:'active',key:current.key,payload:active}});
 const life=regionalIdentity(snapshot),nextId=Math.max(snapshot.core.planetaryTravel?.nextId||1,regionalIdentityWatermark([...entries.filter(e=>e.kind==='session').map(e=>e.life),life]));
 root.regionalPersistence={schema:REGIONAL_STORAGE,slot,capture,hadSurvey:Object.hasOwn(snapshot,'regionalWorlds'),active:{kind:'active',...current,id,life,capture},entries,identityPolicy:REGIONAL_IDENTITIES,nextId,replayPolicy:replayPolicyOf(snapshot.core)};
 validateRegionalIndex(root,slot);return{root,records};
}
function verifyDirectoryPayload(index,entry,payload){
 if(!index.identityPolicy||entry.kind==='survey')return;
 verifyRegionalIdentity(entry.life,entry.kind==='session'?payload.snapshot:payload,entry.kind==='session'?{mode:payload.biologicalMode??null}:undefined);
 if(entry.kind==='active'&&(index.replayPolicy!==replayPolicyOf(payload.core)||index.nextId!==Math.max(payload.core.planetaryTravel?.nextId||1,regionalIdentityWatermark([...index.entries.filter(e=>e.kind==='session').map(e=>e.life),index.active.life]))))throw Error('Regional directory does not match its active authority.');
}
export function assembleRegionalSnapshot(root,slot,records){
 const index=validateRegionalIndex(root,slot);if(!index)return root;
 if(records.length!==index.entries.length+1)throw Error('Incomplete regional checkpoint.');
 const active=records.at(-1);if(active?.schema!==1||active.slot!==slot||active.capture!==captureFor(index,index.active)||active.kind!=='active'||active.key!==index.active.key||identity('active',active.payload).key!==index.active.key||active.payload.core?.tickCount!==root.core.tickCount||active.payload.seed!==root.seed||active.payload.core?.planetaryTravel?.sessions?.length||active.payload.regionalWorlds!==undefined)throw Error('Missing or stale active regional record.');
 verifyDirectoryPayload(index,index.active,active.payload);
 const result={...active.payload,core:{...active.payload.core}},sessions=[],survey=[];
 for(let n=0;n<index.entries.length;n++){
  const e=index.entries[n],r=records[n];if(r?.schema!==1||r.slot!==slot||r.capture!==captureFor(index,e)||r.kind!==e.kind||r.key!==e.key)throw Error('Missing or stale regional record: '+e.key);
  if(identity(e.kind,r.payload).key!==e.key)throw Error('Regional record identity mismatch.');
  verifyDirectoryPayload(index,e,r.payload);
  (e.kind==='session'?sessions:survey).push(r.payload);
 }
 if(result.core.planetaryTravel)result.core.planetaryTravel={...result.core.planetaryTravel,sessions};
 if(index.hadSurvey)result.regionalWorlds=survey;delete result.regionalPersistence;return result;
}
// Queue all dependent reads within the root request callback. One readonly
// transaction prevents a concurrent save from mixing two committed captures.
export function readRegionalCheckpoint(db,slot,{region=null,kind='session',manifestOnly=false,expectedCapture=null}={}){
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
   if(!index){result=root;return}const entries=[...index.entries,index.active],records=new Array(entries.length);let pending=records.length;
   // Keep one payload request in flight. Queue the next inside onsuccess so
   // IndexedDB keeps this SAME snapshot transaction alive between pages.
   // Compatibility full loads still retain all returned payloads for restore.
   const next=n=>{const entry=entries[n],req=regions.get(entry.id);req.onerror=()=>fail(req.error||Error('Region read failed.'));req.onsuccess=()=>{try{records[n]=req.result;if(--pending===0)result=assembleRegionalSnapshot(root,slot,records);else next(n+1)}catch(error){fail(error)}}};next(0);
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
 const plan=partitionRegionalSnapshot(active,slot),index=plan.root.regionalPersistence;
 index.entries=old.entries.map(entry=>({...structuredClone(entry),capture:captureFor(old,entry)}));index.hadSurvey=old.hadSurvey;
 const replaced=new Set();
 for(const change of changes){
  if(!['session','survey'].includes(change?.kind))throw Error('Invalid changed regional owner.');
  const {key}=identity(change.kind,change.payload),entry=index.entries.find(e=>e.kind===change.kind&&e.key===key);
  if(!entry||replaced.has(entry.id))throw Error('Missing or duplicate changed regional owner.');replaced.add(entry.id);
  entry.capture=index.capture;
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
export async function deleteRegionalCheckpoint(db,slot){
 if(!slotOK(slot))throw Error('Invalid world slot.');
 const tx=db.transaction(['saves','meta',REGION_STORE],'readwrite'),done=completed(tx),saves=tx.objectStore('saves'),regions=tx.objectStore(REGION_STORE),metadata=tx.objectStore('meta');let problem;
 const req=saves.get(slot);req.onsuccess=()=>{try{const index=validateRegionalIndex(req.result,slot);for(const e of index?[...index.entries,index.active]:[])regions.delete(e.id);saves.delete(slot);metadata.delete(slot)}catch(error){problem=error;tx.abort()}};
 try{await done}catch(error){throw problem||error}
}
