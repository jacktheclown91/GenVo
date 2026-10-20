import {DIVING,createLocalBathymetry,validateDivingWorld} from './diving.js';
export function restoreDivingRules(sim,core){
 if(core.divingRules===undefined)delete sim.divingRules;
 else if(core.divingRules!==DIVING.policy)throw Error('Unknown saved diving rules.');
 if(!Object.hasOwn(core,'divingRuleMigrations'))delete sim.divingRuleMigrations;
 validateDivingHistory(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){validateDivingHistory(s.snapshot.core,sim.tickCount);if(s.snapshot.core.divingRules!==sim.divingRules||JSON.stringify(s.snapshot.core.divingRuleMigrations||[])!==JSON.stringify(sim.divingRuleMigrations||[]))throw Error('Inconsistent regional diving rules.');}
}
export function validateDivingHistory(core,timeline=core.tickCount){
 if(core.divingRules!==undefined&&core.divingRules!==DIVING.policy)throw Error('Unknown saved diving rules.');
 const h=core.divingRuleMigrations;if(h===undefined)return;
 if(!Array.isArray(h)||h.some(r=>r?.schema!==1||!/^world-[A-Za-z0-9-]{8,72}$/.test(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||![null,DIVING.policy].includes(r.from)||r.to!==DIVING.policy||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||r.tick>timeline)||h.length&&core.divingRules!==DIVING.policy)throw Error('Invalid diving migration history.');
 const backups=new Set();for(let i=0;i<h.length;i++){const r=h[i];if(backups.has(r.backupSlot)||i&&(r.tick<h[i-1].tick||r.from!==h[i-1].to))throw Error('Invalid diving migration chain.');backups.add(r.backupSlot)}
}
export function adoptDivingRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||!/^world-[A-Za-z0-9-]{8,72}$/.test(backupSlot))throw Error('Diving adoption requires an explicit source and backup.');
 restoreDivingRules(sim,sim);const sessions=sim.planetaryTravel?.sessions||[];
 for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional catchup before diving adoption.');
 const pairs=[{core:sim,world:sim.world},...sessions.map(s=>({core:s.snapshot.core,world:s.snapshot.world}))],prior=[];
 for(const p of pairs){
  // Archived planet worlds already own their actual water columns. Local
  // bathymetry is generated only on this explicitly backed-up continuation.
  const view=p.world===sim.world?p.world:{...p.world,n:sim.world.n,len:sim.world.len,water:p.world.surfaceWater.mask};
  validateDivingWorld(view,p.core.divingRules);
  prior.push({p,rule:p.core.divingRules,ruleOwn:Object.hasOwn(p.core,'divingRules'),history:p.core.divingRuleMigrations,historyOwn:Object.hasOwn(p.core,'divingRuleMigrations'),geometry:p.world.divingBathymetry,geometryOwn:Object.hasOwn(p.world,'divingBathymetry')});
 }
 const record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,from:sim.divingRules??null,to:DIVING.policy};
 const geometry=pairs.map(p=>p.world.environment?p.world.divingBathymetry:p.world.divingBathymetry||createLocalBathymetry(p.world===sim.world?p.world:{...p.world,n:sim.world.n,len:sim.world.len,water:p.world.surfaceWater.mask}));
 for(const {core} of pairs)validateDivingHistory({...core,divingRules:DIVING.policy,divingRuleMigrations:[...(core.divingRuleMigrations||[]),record]});
 for(let i=0;i<pairs.length;i++){const {core,world}=pairs[i];core.divingRules=DIVING.policy;core.divingRuleMigrations=[...(core.divingRuleMigrations||[]),structuredClone(record)];if(geometry[i])world.divingBathymetry=geometry[i]}
 return{record,rollback(){for(const r of prior){for(const [key,own,value] of [['divingRules',r.ruleOwn,r.rule],['divingRuleMigrations',r.historyOwn,r.history]]){if(own)r.p.core[key]=value;else delete r.p.core[key]}if(r.geometryOwn)r.p.world.divingBathymetry=r.geometry;else delete r.p.world.divingBathymetry}}};
}
