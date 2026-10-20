import {emptySubsurface,validateSubsurface} from '../world/subsurface.js';
import {BURROWING} from './burrowing.js';
const validId=id=>typeof id==='string'&&/^world-[A-Za-z0-9-]{8,72}$/.test(id);
export function validateBurrowingHistory(core,timeline=core.tickCount){
 if(core.burrowingRules!==undefined&&core.burrowingRules!==BURROWING.policy)throw Error('Unknown saved burrowing rules.');
 const h=core.burrowingRuleMigrations;if(h===undefined)return;
 if(!Array.isArray(h))throw Error('Invalid burrowing migration history.');
 const seen=new Set();let previous=null;for(const r of h){if(r?.schema!==1||!validId(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||r.source.length>512||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||r.tick>timeline||![null,BURROWING.policy].includes(r.from)||r.to!==BURROWING.policy||seen.has(r.backupSlot)||previous&&(r.tick<previous.tick||r.from!==previous.to))throw Error('Invalid burrowing migration history.');seen.add(r.backupSlot);previous=r}
 if(h.length&&core.burrowingRules!==BURROWING.policy)throw Error('Burrowing rules contradict migration history.');
}
export function restoreBurrowingRules(sim,core){
 if(core.burrowingRules===undefined)delete sim.burrowingRules;
 if(!Object.hasOwn(core,'burrowingRuleMigrations'))delete sim.burrowingRuleMigrations;
 validateBurrowingHistory(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){validateBurrowingHistory(s.snapshot.core,sim.tickCount);if(s.snapshot.core.burrowingRules!==sim.burrowingRules||JSON.stringify(s.snapshot.core.burrowingRuleMigrations||[])!==JSON.stringify(sim.burrowingRuleMigrations||[]))throw Error('Inconsistent regional burrowing rules.');}
}
export function adoptBurrowingRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||source.length>512||!validId(backupSlot))throw Error('Burrowing adoption requires a source and backup.');
 restoreBurrowingRules(sim,sim);const sessions=sim.planetaryTravel?.sessions||[];
 for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional catchup before burrowing adoption.');
 const worlds=[sim.world,...sessions.map(s=>s.snapshot.world)],priorWorlds=worlds.map(w=>({w,own:Object.hasOwn(w,'subsurface'),value:w.subsurface}));
 for(const w of worlds)validateSubsurface({subsurface:w.subsurface,len:sim.world.len},sim.burrowingRules===BURROWING.policy);
 const cores=[sim,...sessions.map(s=>s.snapshot.core)],record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,from:sim.burrowingRules??null,to:BURROWING.policy};
 const plans=cores.map(core=>{const history=[...(core.burrowingRuleMigrations||[]),structuredClone(record)];validateBurrowingHistory({...core,burrowingRules:BURROWING.policy,burrowingRuleMigrations:history});return{core,history,rule:core.burrowingRules,ruleOwn:Object.hasOwn(core,'burrowingRules'),prior:core.burrowingRuleMigrations,priorOwn:Object.hasOwn(core,'burrowingRuleMigrations')}});
 for(const w of worlds)w.subsurface??=emptySubsurface();
 for(const p of plans){p.core.burrowingRules=BURROWING.policy;p.core.burrowingRuleMigrations=p.history}
 return{record,rollback(){for(const r of priorWorlds){if(r.own)r.w.subsurface=r.value;else delete r.w.subsurface}for(const p of plans){if(p.ruleOwn)p.core.burrowingRules=p.rule;else delete p.core.burrowingRules;if(p.priorOwn)p.core.burrowingRuleMigrations=p.prior;else delete p.core.burrowingRuleMigrations}}};
}
