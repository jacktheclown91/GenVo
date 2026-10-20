import {THERMAL_REFUGE} from './thermal-refuge.js';
const validBackup=id=>typeof id==='string'&&/^world-[A-Za-z0-9-]{8,72}$/.test(id);
export function validateThermalRefugeRules(core,timeline=core.tickCount){
 if(core.thermalRefugeRules!==undefined&&core.thermalRefugeRules!==THERMAL_REFUGE.policy)throw Error('Unknown atmospheric thermal refuge rules.');
 const h=core.thermalRefugeRuleMigrations;if(h===undefined)return;if(!Array.isArray(h))throw Error('Invalid thermal refuge migration history.');
 const seen=new Set();let previous=null;for(const r of h){if(r?.schema!==1||!validBackup(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||r.source.length>512||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||r.tick>timeline||![null,THERMAL_REFUGE.policy].includes(r.from)||r.to!==THERMAL_REFUGE.policy||seen.has(r.backupSlot)||previous&&(r.tick<previous.tick||r.from!==previous.to))throw Error('Invalid thermal refuge migration history.');seen.add(r.backupSlot);previous=r}
 if(h.length&&core.thermalRefugeRules!==THERMAL_REFUGE.policy)throw Error('ThermalRefuge rules contradict migration history.');
}
export function restoreThermalRefugeRules(sim,core){
 if(core.thermalRefugeRules===undefined)delete sim.thermalRefugeRules;if(!Object.hasOwn(core,'thermalRefugeRuleMigrations'))delete sim.thermalRefugeRuleMigrations;validateThermalRefugeRules(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){validateThermalRefugeRules(s.snapshot.core,sim.tickCount);if(s.snapshot.core.thermalRefugeRules!==sim.thermalRefugeRules||JSON.stringify(s.snapshot.core.thermalRefugeRuleMigrations||[])!==JSON.stringify(sim.thermalRefugeRuleMigrations||[]))throw Error('Inconsistent regional atmospheric thermal refuge rules.');}
}
export function adoptThermalRefugeRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||source.length>512||!validBackup(backupSlot))throw Error('ThermalRefuge adoption requires a source and backup.');
 restoreThermalRefugeRules(sim,sim);const sessions=sim.planetaryTravel?.sessions||[];
 for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional catchup before thermal refuge adoption.');
 const cores=[sim,...sessions.map(s=>s.snapshot.core)],record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,from:sim.thermalRefugeRules??null,to:THERMAL_REFUGE.policy};
 const plans=cores.map(core=>{const history=[...(core.thermalRefugeRuleMigrations||[]),structuredClone(record)];validateThermalRefugeRules({...core,thermalRefugeRules:THERMAL_REFUGE.policy,thermalRefugeRuleMigrations:history});return{core,history,rule:core.thermalRefugeRules,ruleOwn:Object.hasOwn(core,'thermalRefugeRules'),prior:core.thermalRefugeRuleMigrations,priorOwn:Object.hasOwn(core,'thermalRefugeRuleMigrations')}});
 for(const p of plans){p.core.thermalRefugeRules=THERMAL_REFUGE.policy;p.core.thermalRefugeRuleMigrations=p.history}
 return{record,rollback(){for(const p of plans){if(p.ruleOwn)p.core.thermalRefugeRules=p.rule;else delete p.core.thermalRefugeRules;if(p.priorOwn)p.core.thermalRefugeRuleMigrations=p.prior;else delete p.core.thermalRefugeRuleMigrations}}};
}
