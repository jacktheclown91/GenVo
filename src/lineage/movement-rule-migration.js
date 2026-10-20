import {GLIDING} from './gliding.js';
import {JUMP} from './jumping.js';

const versions=Object.freeze({glidingRules:GLIDING.policy,jumpingRules:JUMP.policy});
const profile=core=>Object.fromEntries(Object.keys(versions).map(key=>[key,core[key]??null]));
const validBackup=id=>typeof id==='string'&&/^world-[A-Za-z0-9-]{8,72}$/.test(id);
export function validateMovementRuleHistory(core,timeline=core.tickCount){
 for(const [key,version] of Object.entries(versions))if(core[key]!==undefined&&core[key]!==version)throw Error('Unknown movement adoption policy.');
 const history=core.movementRuleMigrations;if(history===undefined)return;
 if(!Array.isArray(history))throw Error('Invalid movement adoption history.');
 let previous=null;const backups=new Set();for(const r of history){
  if(r?.schema!==1||!validBackup(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||r.source.length>512||
   !Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||!Number.isSafeInteger(r.globalTick)||r.globalTick<r.tick||r.globalTick>timeline||
   typeof r.changed!=='boolean'||!r.from||!r.to||Object.entries(versions).some(([key,version])=>(r.from[key]!==null&&r.from[key]!==version)||r.to[key]!==version)||
   r.changed!==Object.keys(versions).some(key=>r.from[key]!==r.to[key]))throw Error('Invalid movement adoption record.');
  if(backups.has(r.backupSlot)||previous&&(r.globalTick<previous.globalTick||Object.keys(versions).some(key=>r.from[key]!==previous.to[key])))throw Error('Disconnected movement adoption history.');
  backups.add(r.backupSlot);previous=r;
 }
 if(history.length&&Object.keys(versions).some(key=>core[key]!==history.at(-1).to[key]))throw Error('Movement rules contradict adoption history.');
}
export function restoreMovementRuleHistory(sim,core){
 if(!Object.hasOwn(core,'movementRuleMigrations'))delete sim.movementRuleMigrations;
 validateMovementRuleHistory(sim);
 const current=profile(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){
  validateMovementRuleHistory(s.snapshot.core,sim.tickCount);
  if(JSON.stringify(profile(s.snapshot.core))!==JSON.stringify(current))throw Error('Inconsistent regional movement adoption policies.');
  if(JSON.stringify(s.snapshot.core.movementRuleMigrations||[])!==JSON.stringify(sim.movementRuleMigrations||[]))throw Error('Inconsistent regional movement adoption history.');
 }
}
// Called only on the isolated candidate for a new, backed-up continuation.
// This changes future rules and records provenance, never bodies or past flows.
export function adoptMovementRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||source.length>512||!validBackup(backupSlot))throw Error('Movement adoption needs an explicit source and backup slot.');
 restoreMovementRuleHistory(sim,sim);
 const sessions=sim.planetaryTravel?.sessions||[],cores=[sim,...sessions.map(s=>s.snapshot.core)],from=profile(sim),to={...versions};
 for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional biology catchup before adopting movement rules. Environmental-only archives need a separate clock conversion.');
 for(const a of [...sim.animals,...sessions.flatMap(s=>s.snapshot.animals)])if(a.attackAction?.pounce&&['windup','leap'].includes(a.attackAction.phase))throw Error('Finish the pending pounce before adopting movement rules.');
 const record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,globalTick:sim.tickCount,from,to,
  changed:Object.keys(versions).some(key=>from[key]!==to[key])};
 const histories=cores.map(core=>[...(core.movementRuleMigrations||[]),structuredClone(record)]);
 for(let i=0;i<cores.length;i++)validateMovementRuleHistory({...cores[i],...versions,movementRuleMigrations:histories[i]},sim.tickCount);
 const keys=[...Object.keys(versions),'movementRuleMigrations'],prior=cores.map(core=>keys.map(key=>({key,present:Object.hasOwn(core,key),value:core[key]})));
 for(let i=0;i<cores.length;i++)Object.assign(cores[i],versions,{movementRuleMigrations:histories[i]});
 return{changed:record.changed,regions:cores.length,record,rollback(){for(let i=0;i<cores.length;i++)for(const item of prior[i]){if(item.present)cores[i][item.key]=item.value;else delete cores[i][item.key]}}};
}
