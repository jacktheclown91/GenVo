import {SURFACE_ICE,initializeSurfaceIce,validateSurfaceIce} from './surface-ice.js';
const validBackup=id=>typeof id==='string'&&/^world-[A-Za-z0-9-]{8,72}$/.test(id);
const view=(w,len)=>({...w,len,water:w.water??w.surfaceWater?.mask});
export function validateIceWorld(w,rule){
 if(rule!==undefined&&rule!==SURFACE_ICE.policy)throw Error('Unknown surface-ice rules.');validateSurfaceIce(w);
 const eligible=w.generator==='planetary/1'&&w.environment?.schema>=3;
 if(rule===undefined&&w.environment?.icePolicy!==undefined||rule===SURFACE_ICE.policy&&(!eligible||w.environment.icePolicy!==SURFACE_ICE.policy))throw Error('Surface-ice state contradicts recorded rules.');
}
export function validateIceHistory(core,timeline=core.tickCount){
 if(core.surfaceIceRules!==undefined&&core.surfaceIceRules!==SURFACE_ICE.policy)throw Error('Unknown surface-ice rules.');
 const h=core.surfaceIceRuleMigrations;if(h===undefined)return;if(!Array.isArray(h))throw Error('Invalid surface-ice migration history.');
 const seen=new Set();let previous=null;for(const r of h){if(r?.schema!==1||!validBackup(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||r.source.length>512||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||r.tick>timeline||![null,SURFACE_ICE.policy].includes(r.from)||r.to!==SURFACE_ICE.policy||seen.has(r.backupSlot)||previous&&(r.tick<previous.tick||r.from!==previous.to))throw Error('Invalid surface-ice migration history.');seen.add(r.backupSlot);previous=r}
 if(h.length&&core.surfaceIceRules!==SURFACE_ICE.policy)throw Error('Ice rules contradict migration history.');
}
export function restoreSurfaceIceRules(sim,core){
 for(const key of ['surfaceIceRules','surfaceIceRuleMigrations'])if(!Object.hasOwn(core,key))delete sim[key];validateIceHistory(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){validateIceHistory(s.snapshot.core,sim.tickCount);if(s.snapshot.core.surfaceIceRules!==sim.surfaceIceRules||JSON.stringify(s.snapshot.core.surfaceIceRuleMigrations||[])!==JSON.stringify(sim.surfaceIceRuleMigrations||[]))throw Error('Inconsistent regional surface-ice rules.');}
}
export function adoptSurfaceIceRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||source.length>512||!validBackup(backupSlot))throw Error('Ice adoption requires a source and backup.');restoreSurfaceIceRules(sim,sim);
 if(sim.world.generator!=='planetary/1')return{changed:false,rollback(){}};
 if(!(sim.world.environment?.volume instanceof Float64Array)||sim.world.environment.schema<3)throw Error('Surface ice requires finite owned planetary water.');
 const sessions=sim.planetaryTravel?.sessions||[];for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional catchup before ice adoption.');
 const worlds=[sim.world,...sessions.map(s=>s.snapshot.world)];for(const w of worlds)validateIceWorld(view(w,sim.world.len),sim.surfaceIceRules);
 const record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,from:sim.surfaceIceRules??null,to:SURFACE_ICE.policy},cores=[sim,...sessions.map(s=>s.snapshot.core)];
 const plans=cores.map(core=>{const history=[...(core.surfaceIceRuleMigrations||[]),structuredClone(record)];validateIceHistory({...core,surfaceIceRules:SURFACE_ICE.policy,surfaceIceRuleMigrations:history});return{core,history,prior:Object.fromEntries(['surfaceIceRules','surfaceIceRuleMigrations'].map(k=>[k,{own:Object.hasOwn(core,k),value:core[k]}]))}});
 const geometry=worlds.map(w=>{const prior=w.environment,candidate={...view(w,sim.world.len),environment:prior?{...prior}:undefined};initializeSurfaceIce(candidate);return{w,prior,next:candidate.environment}});
 for(const g of geometry)if(g.next!==undefined)g.w.environment=g.next;
 for(const p of plans){p.core.surfaceIceRules=SURFACE_ICE.policy;p.core.surfaceIceRuleMigrations=p.history}
 return{record,rollback(){for(const g of geometry)if(g.prior!==undefined)g.w.environment=g.prior;for(const p of plans)for(const [k,v] of Object.entries(p.prior)){if(v.own)p.core[k]=v.value;else delete p.core[k]}}};
}
