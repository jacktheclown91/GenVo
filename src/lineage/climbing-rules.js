import {CLIMBING} from './climbing.js';
const validId=id=>typeof id==='string'&&/^world-[A-Za-z0-9-]{8,72}$/.test(id);
export function validateClimbingHistory(core,timeline=core.tickCount){
 if(core.climbingRules!==undefined&&core.climbingRules!==CLIMBING.policy)throw Error('Unknown saved climbing rules.');
 const h=core.climbingRuleMigrations;if(h===undefined)return;
 if(!Array.isArray(h))throw Error('Invalid climbing migration history.');
 const seen=new Set();let previous=null;for(const r of h){if(r?.schema!==1||!validId(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||r.source.length>512||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||r.tick>timeline||![null,CLIMBING.policy].includes(r.from)||r.to!==CLIMBING.policy||seen.has(r.backupSlot)||previous&&(r.tick<previous.tick||r.from!==previous.to))throw Error('Invalid climbing migration history.');seen.add(r.backupSlot);previous=r}
 if(h.length&&core.climbingRules!==CLIMBING.policy)throw Error('Climbing rules contradict migration history.');
}
export function restoreClimbingRules(sim,core){
 if(core.climbingRules===undefined)delete sim.climbingRules;
 if(!Object.hasOwn(core,'climbingRuleMigrations'))delete sim.climbingRuleMigrations;
 validateClimbingHistory(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){validateClimbingHistory(s.snapshot.core,sim.tickCount);if(s.snapshot.core.climbingRules!==sim.climbingRules||JSON.stringify(s.snapshot.core.climbingRuleMigrations||[])!==JSON.stringify(sim.climbingRuleMigrations||[]))throw Error('Inconsistent regional climbing rules.');}
}
export function adoptClimbingRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||source.length>512||!validId(backupSlot))throw Error('Climbing adoption requires a source and backup.');
 restoreClimbingRules(sim,sim);const sessions=sim.planetaryTravel?.sessions||[];
 for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional catchup before climbing adoption.');
 const cores=[sim,...sessions.map(s=>s.snapshot.core)],record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,from:sim.climbingRules??null,to:CLIMBING.policy};
 const plans=cores.map(core=>{const history=[...(core.climbingRuleMigrations||[]),structuredClone(record)];validateClimbingHistory({...core,climbingRules:CLIMBING.policy,climbingRuleMigrations:history});return{core,history,rule:core.climbingRules,ruleOwn:Object.hasOwn(core,'climbingRules'),prior:core.climbingRuleMigrations,priorOwn:Object.hasOwn(core,'climbingRuleMigrations')}});
 for(const p of plans){p.core.climbingRules=CLIMBING.policy;p.core.climbingRuleMigrations=p.history}
 return{record,rollback(){for(const p of plans){if(p.ruleOwn)p.core.climbingRules=p.rule;else delete p.core.climbingRules;if(p.priorOwn)p.core.climbingRuleMigrations=p.prior;else delete p.core.climbingRuleMigrations}}};
}
