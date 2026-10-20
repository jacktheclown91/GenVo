import {THERMAL_WEATHER,createThermalWeather,validateThermalWeather} from './thermal-weather.js';
import {CFG} from '../sim/config.js';
const validBackup=id=>typeof id==='string'&&/^world-[A-Za-z0-9-]{8,72}$/.test(id);
export function validateThermalRules(core,timeline=core.tickCount){
 if(core.thermalRules!==undefined&&core.thermalRules!==THERMAL_WEATHER.policy)throw Error('Unknown thermal weather rules.');
 if(core.thermalRules===undefined){if(core.thermalPattern!==undefined)throw Error('Temperature state requires its recorded rules.');}
 else validateThermalWeather(core.thermalPattern,Math.floor(core.tickCount/CFG.dayTicks));
 const h=core.thermalRuleMigrations;if(h===undefined)return;if(!Array.isArray(h))throw Error('Invalid thermal migration history.');
 const seen=new Set();let previous=null;for(const r of h){if(r?.schema!==1||!validBackup(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||r.source.length>512||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||r.tick>timeline||![null,THERMAL_WEATHER.policy].includes(r.from)||r.to!==THERMAL_WEATHER.policy||seen.has(r.backupSlot)||previous&&(r.tick<previous.tick||r.from!==previous.to))throw Error('Invalid thermal migration history.');seen.add(r.backupSlot);previous=r}
 if(h.length&&core.thermalRules!==THERMAL_WEATHER.policy)throw Error('Thermal rules contradict migration history.');
}
export function restoreThermalRules(sim,core){
 for(const key of ['thermalRules','thermalPattern','thermalRuleMigrations'])if(!Object.hasOwn(core,key))delete sim[key];validateThermalRules(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){validateThermalRules(s.snapshot.core,sim.tickCount);if(s.snapshot.core.thermalRules!==sim.thermalRules||JSON.stringify(s.snapshot.core.thermalRuleMigrations||[])!==JSON.stringify(sim.thermalRuleMigrations||[]))throw Error('Inconsistent regional thermal weather rules.');}
}
export function adoptThermalRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||source.length>512||!validBackup(backupSlot))throw Error('Thermal adoption requires a source and backup.');
 restoreThermalRules(sim,sim);const sessions=sim.planetaryTravel?.sessions||[];
 for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional catchup before thermal adoption.');
 const cores=[sim,...sessions.map(s=>s.snapshot.core)],record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,from:sim.thermalRules??null,to:THERMAL_WEATHER.policy};
 const plans=cores.map(core=>{const history=[...(core.thermalRuleMigrations||[]),structuredClone(record)],pattern=core.thermalPattern??createThermalWeather(sim.seed,Math.floor(sim.tickCount/CFG.dayTicks));validateThermalRules({...core,thermalRules:THERMAL_WEATHER.policy,thermalPattern:pattern,thermalRuleMigrations:history});return{core,history,pattern,prior:Object.fromEntries(['thermalRules','thermalPattern','thermalRuleMigrations'].map(k=>[k,{own:Object.hasOwn(core,k),value:core[k]}]))}});
 for(const p of plans){p.core.thermalRules=THERMAL_WEATHER.policy;p.core.thermalPattern=p.pattern;p.core.thermalRuleMigrations=p.history}
 return{record,rollback(){for(const p of plans)for(const [k,v] of Object.entries(p.prior)){if(v.own)p.core[k]=v.value;else delete p.core[k]}}};
}
