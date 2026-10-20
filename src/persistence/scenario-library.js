// One source of truth for test fixtures, shared mature worlds and the New
// World menu. Scenarios are COMPLETE canonical save snapshots, never seeds
// dressed up as evolved populations. Every start decodes its own independent
// graph and uses the existing authoritative save restoration.
import {encodeSnapshotGraph,decodeSnapshotGraph} from './scenario-codec.js';

export const SCENARIO_FORMAT='genvo.world-scenario/1';
const MAX_PACKED_SCENARIO_BYTES=160*1024*1024;
const MAX_EXPANDED_SCENARIO_BYTES=512*1024*1024;
function validContinuation(c){
 return c&&typeof c==='object'&&/^[a-z0-9][a-z0-9-]{1,63}$/.test(c.fromId||'')&&
  Number.isSafeInteger(c.fromDay)&&c.fromDay>=1&&
  Number.isSafeInteger(c.fromTick)&&c.fromTick>=0&&
  Number.isSafeInteger(c.fromRng)&&c.fromRng>=0&&c.fromRng<=4294967295&&
  /^[a-f0-9]{64}$/.test(c.fromSha256||'')&&
  Number.isSafeInteger(c.continuedDays)&&c.continuedDays>0&&
  Number.isSafeInteger(c.toDay)&&c.toDay===c.fromDay+c.continuedDays&&
  Number.isSafeInteger(c.toTick)&&c.toTick>c.fromTick;
}

const validId=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{1,63}$/.test(s);
export function scenarioMetadata(snapshot,{id,label,description=''}={}){
 if(!snapshot||typeof snapshot!=='object'||!snapshot.world||!snapshot.core||
  !Array.isArray(snapshot.animals)||!snapshot.seed||
  !Number.isSafeInteger(snapshot.core.day)||snapshot.core.day<1||
  !Number.isSafeInteger(snapshot.core.tickCount)||snapshot.core.tickCount<0||
  !Number.isSafeInteger(snapshot.schema))
  throw Error('A scenario requires a complete canonical simulation checkpoint.');
 if(!validId(id)||typeof label!=='string'||!label.trim()||label.length>80||
    typeof description!=='string'||description.length>360)
  throw Error('Invalid scenario identity or description.');
 const alive=snapshot.animals.filter(a=>a?.alive).length;
 const playable=snapshot.core.playerEnabled!==false&&snapshot.animals.some(a=>a?.alive&&a.id===snapshot.core.playerId);
 // Even total extinction is meaningful for developer replay; only living
 // player-controlled lineages can be offered as gameplay quick starts.
 const m=snapshot.meta||{};
 return{
  id,label:label.trim(),description:description.trim(),
  seed:snapshot.seed,saveSchema:snapshot.schema,
  generator:snapshot.world.generator,day:snapshot.core.day,
  year:snapshot.core.year,generation:m.generation||1,
  tickCount:snapshot.core.tickCount,
  liveAnimals:alive,playable,source:'recorded-simulation'
 };
}
export function packageScenarioSnapshot(snapshot,{id,label,description=''}){
 const metadata=scenarioMetadata(snapshot,{id,label,description});
 return{format:SCENARIO_FORMAT,metadata,graph:encodeSnapshotGraph(snapshot)};
}
export function openScenarioSnapshot(bundle){
 if(!bundle||bundle.format!==SCENARIO_FORMAT||!bundle.metadata||!bundle.graph)
  throw Error('Unsupported world scenario package.');
 const m=bundle.metadata;
 if(!validId(m.id)||m.source!=='recorded-simulation')
  throw Error('Invalid world scenario provenance.');
 const snapshot=decodeSnapshotGraph(bundle.graph);
 const expected=scenarioMetadata(snapshot,{id:m.id,label:m.label,description:m.description});
 if(m.continuedFrom!==undefined&&
   (!validContinuation(m.continuedFrom)||m.continuedFrom.toDay!==snapshot.core.day||
    m.continuedFrom.toTick!==snapshot.core.tickCount))
  throw Error('Invalid continued-scenario provenance.');
 for(const k of ['seed','saveSchema','generator','day','year','generation','tickCount','liveAnimals','playable','source']){
  if(m[k]!==expected[k])throw Error('Scenario metadata disagrees with its real simulation state: '+k);
 }
 return snapshot;
}
export function validateScenarioCatalog(catalog){
 if(!catalog||catalog.schema!==1||!Array.isArray(catalog.scenarios)||catalog.scenarios.length>20)
  throw Error('Invalid scenario catalog.');
 const ids=new Set();
 for(const s of catalog.scenarios){
  if(!validId(s?.id)||ids.has(s.id)||typeof s.label!=='string'||!s.label.trim()||
    !Number.isSafeInteger(s.day)||s.day<1||
    (s.continuedFrom!==undefined&&(!validContinuation(s.continuedFrom)||s.continuedFrom.toDay!==s.day))||
    typeof s.playable!=='boolean'||
    typeof s.file!=='string'||!/^assets\/scenarios\/[a-z0-9-]+\.json(?:\.gz)?$/.test(s.file)||
    !/^[a-f0-9]{64}$/.test(s.sha256||''))
   throw Error('Invalid catalog scenario entry.');
  ids.add(s.id);
 }
 return catalog.scenarios;
}
// The canonical graph is JSON, but mature planets are kept as gzip assets
// for player loading. DecompressionStream is supported in modern Chromium
// and is shared by the browser import and integrity-checked bundled loader.
export async function parseScenarioDocument(buffer,{name='scenario.json'}={}){
 const bytes=new Uint8Array(buffer);
 if(bytes.byteLength>MAX_EXPANDED_SCENARIO_BYTES)throw Error('Scenario package exceeds the supported input size.');
 const packed=bytes.length>=2&&bytes[0]===0x1f&&bytes[1]===0x8b;
 if(packed&&bytes.byteLength>MAX_PACKED_SCENARIO_BYTES)throw Error('Compressed scenario exceeds the supported download size.');
 if(name.endsWith('.gz')&&!packed)throw Error('Scenario declares gzip but has no gzip header.');
 let data=buffer;
 if(packed){
  if(typeof DecompressionStream!=='function')throw Error('This browser cannot decompress advanced-world scenarios.');
  const stream=new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  data=await new Response(stream).arrayBuffer();
 }
 if(data.byteLength>MAX_EXPANDED_SCENARIO_BYTES)throw Error('Expanded scenario exceeds supported size.');
 return JSON.parse(new TextDecoder().decode(data));
}
export async function loadBundledScenario(entry,{fetchFile=fetch,digest=null}={}){
 if(!entry||typeof entry.file!=='string'||!/^assets\/scenarios\/[a-z0-9-]+\.json(?:\.gz)?$/.test(entry.file))
  throw Error('Invalid scenario path.');
 const response=await fetchFile('./'+entry.file);
 if(!response.ok)throw Error('Scenario package is missing from this build.');
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength>MAX_PACKED_SCENARIO_BYTES)throw Error('Scenario exceeds the supported download size.');
 if(digest){
  const actual=await digest(bytes);
  if(actual!==entry.sha256)throw Error('Scenario file integrity check failed.');
 }
 const bundle=await parseScenarioDocument(bytes,{name:entry.file});
 if(bundle.metadata?.id!==entry.id||bundle.metadata?.day!==entry.day||
  bundle.metadata?.playable!==entry.playable||
  JSON.stringify(bundle.metadata?.continuedFrom??null)!==JSON.stringify(entry.continuedFrom??null))
  throw Error('Catalog does not match scenario history.');
 return openScenarioSnapshot(bundle);
}
export async function sha256Hex(buffer){
 if(!globalThis.crypto?.subtle)throw Error('This browser cannot verify bundled scenario integrity.');
 const hash=await globalThis.crypto.subtle.digest('SHA-256',buffer);
 return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
}
