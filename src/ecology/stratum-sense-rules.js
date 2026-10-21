import {STRATUM_SENSES} from './stratum-senses.js';
const validBackup=id=>typeof id==='string'&&/^world-[A-Za-z0-9-]{8,72}$/.test(id);
export function validateStratumSenseRules(core,timeline=core.tickCount){
 if(core.stratumSenseRules!==undefined&&core.stratumSenseRules!==STRATUM_SENSES.policy)throw Error('Unknown stratum sensory rules.');
 const h=core.stratumSenseRuleMigrations;if(h===undefined)return;if(!Array.isArray(h))throw Error('Invalid stratum sensory migration history.');
 const seen=new Set();let previous=null;for(const r of h){if(r?.schema!==1||!validBackup(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||r.source.length>512||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||r.tick>timeline||![null,STRATUM_SENSES.policy].includes(r.from)||r.to!==STRATUM_SENSES.policy||seen.has(r.backupSlot)||previous&&(r.tick<previous.tick||r.from!==previous.to))throw Error('Invalid stratum sensory migration history.');seen.add(r.backupSlot);previous=r}
 if(h.length&&core.stratumSenseRules!==STRATUM_SENSES.policy)throw Error('StratumSense rules contradict migration history.');
}
export function restoreStratumSenseRules(sim,core){
 if(core.stratumSenseRules===undefined)delete sim.stratumSenseRules;if(!Object.hasOwn(core,'stratumSenseRuleMigrations'))delete sim.stratumSenseRuleMigrations;validateStratumSenseRules(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){validateStratumSenseRules(s.snapshot.core,sim.tickCount);if(s.snapshot.core.stratumSenseRules!==sim.stratumSenseRules||JSON.stringify(s.snapshot.core.stratumSenseRuleMigrations||[])!==JSON.stringify(sim.stratumSenseRuleMigrations||[]))throw Error('Inconsistent regional stratum sensory rules.');}
}
export function adoptStratumSenseRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||source.length>512||!validBackup(backupSlot))throw Error('StratumSense adoption requires a source and backup.');
 restoreStratumSenseRules(sim,sim);const sessions=sim.planetaryTravel?.sessions||[];
 for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional catchup before stratum sensory adoption.');
 const cores=[sim,...sessions.map(s=>s.snapshot.core)],record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,from:sim.stratumSenseRules??null,to:STRATUM_SENSES.policy};
 const plans=cores.map(core=>{const history=[...(core.stratumSenseRuleMigrations||[]),structuredClone(record)];validateStratumSenseRules({...core,stratumSenseRules:STRATUM_SENSES.policy,stratumSenseRuleMigrations:history});return{core,history,rule:core.stratumSenseRules,ruleOwn:Object.hasOwn(core,'stratumSenseRules'),prior:core.stratumSenseRuleMigrations,priorOwn:Object.hasOwn(core,'stratumSenseRuleMigrations'),fog:core.sensoryFogEnabled,fogOwn:Object.hasOwn(core,'sensoryFogEnabled')}});
 for(const p of plans){p.core.stratumSenseRules=STRATUM_SENSES.policy;p.core.sensoryFogEnabled=true;p.core.stratumSenseRuleMigrations=p.history}
 return{record,rollback(){for(const p of plans){if(p.fogOwn)p.core.sensoryFogEnabled=p.fog;else delete p.core.sensoryFogEnabled;if(p.ruleOwn)p.core.stratumSenseRules=p.rule;else delete p.core.stratumSenseRules;if(p.priorOwn)p.core.stratumSenseRuleMigrations=p.prior;else delete p.core.stratumSenseRuleMigrations}}};
}
