import {initializeCaves,validateCaves} from '../world/natural-caves.js';
import {CAVES} from '../world/cave-policy.js';
import {SUBSURFACE} from '../world/subsurface.js';
const validId=id=>typeof id==='string'&&/^world-[A-Za-z0-9-]{8,72}$/.test(id);
export function validateCaveHistory(core,timeline=core.tickCount){
 if(core.caveRules!==undefined&&core.burrowingRules!==SUBSURFACE.policy)throw Error('Cave rules require the shared underground traversal policy.');
 if(core.caveRules!==undefined&&core.caveRules!==CAVES.policy)throw Error('Unknown saved cave rules.');
 const h=core.caveRuleMigrations;if(h===undefined)return;
 if(!Array.isArray(h))throw Error('Invalid cave migration history.');
 const seen=new Set();let previous=null;for(const r of h){if(r?.schema!==1||!validId(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||r.source.length>512||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||r.tick>timeline||![null,CAVES.policy].includes(r.from)||r.to!==CAVES.policy||seen.has(r.backupSlot)||previous&&(r.tick<previous.tick||r.from!==previous.to))throw Error('Invalid cave migration history.');seen.add(r.backupSlot);previous=r}
 if(h.length&&core.caveRules!==CAVES.policy)throw Error('Cave rules contradict migration history.');
}
export function restoreCaveRules(sim,core){
 if(core.caveRules===undefined)delete sim.caveRules;
 if(!Object.hasOwn(core,'caveRuleMigrations'))delete sim.caveRuleMigrations;
 validateCaveHistory(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){validateCaveHistory(s.snapshot.core,sim.tickCount);if(s.snapshot.core.caveRules!==sim.caveRules||JSON.stringify(s.snapshot.core.caveRuleMigrations||[])!==JSON.stringify(sim.caveRuleMigrations||[]))throw Error('Inconsistent regional cave rules.');}
}
export function adoptCaveRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||source.length>512||!validId(backupSlot))throw Error('Cave adoption requires a source and backup.');
 restoreCaveRules(sim,sim);const sessions=sim.planetaryTravel?.sessions||[];
 for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional catchup before cave adoption.');
 const worlds=[sim.world,...sessions.map(s=>s.snapshot.world)],prior=worlds.map(w=>({w,value:w.subsurface}));for(const w of worlds)validateCaves({...w,water:w.water||w.surfaceWater?.mask,len:sim.world.len},sim.caveRules);
 const cores=[sim,...sessions.map(s=>s.snapshot.core)],record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,from:sim.caveRules??null,to:CAVES.policy};
 const plans=cores.map(core=>{const history=[...(core.caveRuleMigrations||[]),structuredClone(record)];validateCaveHistory({...core,caveRules:CAVES.policy,caveRuleMigrations:history});return{core,history,rule:core.caveRules,ruleOwn:Object.hasOwn(core,'caveRules'),prior:core.caveRuleMigrations,priorOwn:Object.hasOwn(core,'caveRuleMigrations')}});
 for(const w of worlds)if(w.subsurface?.cavePolicy!==CAVES.policy)initializeCaves(w);
 for(const p of plans){p.core.caveRules=CAVES.policy;p.core.caveRuleMigrations=p.history}
 return{record,rollback(){for(const r of prior)r.w.subsurface=r.value;for(const p of plans){if(p.ruleOwn)p.core.caveRules=p.rule;else delete p.core.caveRules;if(p.priorOwn)p.core.caveRuleMigrations=p.prior;else delete p.core.caveRuleMigrations}}};
}
