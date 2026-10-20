// One source of truth for test fixtures, shared mature worlds and the New
// World menu. Scenarios are COMPLETE canonical save snapshots, never seeds
// dressed up as evolved populations. Every start decodes its own independent
// graph and uses the existing authoritative save restoration.
import {encodeSnapshotGraph,decodeSnapshotGraph} from './scenario-codec.js';

export const SCENARIO_FORMAT='genvo.world-scenario/1';
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
 if(alive<1)throw Error('Scenario has no surviving ecosystem animals.');
 const m=snapshot.meta||{};
 return{
  id,label:label.trim(),description:description.trim(),
  seed:snapshot.seed,saveSchema:snapshot.schema,
  generator:snapshot.world.generator,day:snapshot.core.day,
  year:snapshot.core.year,generation:m.generation||1,
  tickCount:snapshot.core.tickCount,
  liveAnimals:alive,source:'recorded-simulation'
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
 for(const k of ['seed','saveSchema','generator','day','year','generation','tickCount','liveAnimals','source']){
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
    typeof s.file!=='string'||!/^assets\/scenarios\/[a-z0-9-]+\.json$/.test(s.file)||
    !/^[a-f0-9]{64}$/.test(s.sha256||''))
   throw Error('Invalid catalog scenario entry.');
  ids.add(s.id);
 }
 return catalog.scenarios;
}
export async function loadBundledScenario(entry,{fetchFile=fetch,digest=null}={}){
 if(!entry||typeof entry.file!=='string'||!/^assets\/scenarios\/[a-z0-9-]+\.json$/.test(entry.file))
  throw Error('Invalid scenario path.');
 const response=await fetchFile('./'+entry.file);
 if(!response.ok)throw Error('Scenario package is missing from this build.');
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength>160*1024*1024)throw Error('Scenario exceeds the supported size.');
 if(digest){
  const actual=await digest(bytes);
  if(actual!==entry.sha256)throw Error('Scenario file integrity check failed.');
 }
 const bundle=JSON.parse(new TextDecoder().decode(bytes));
 if(bundle.metadata?.id!==entry.id||bundle.metadata?.day!==entry.day)
  throw Error('Catalog does not match scenario history.');
 return openScenarioSnapshot(bundle);
}
export async function sha256Hex(buffer){
 if(!globalThis.crypto?.subtle)throw Error('This browser cannot verify bundled scenario integrity.');
 const hash=await globalThis.crypto.subtle.digest('SHA-256',buffer);
 return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
}
