// Versioned future-action rules; no resource, phenotype or historical-flow reconstruction.
export const CARCASS_RULES=Object.freeze({legacy:'calendar-carcass/1',finite:'existing-carrion/1'});
export function carcassRule(core){
 if(!Object.hasOwn(core,'carcassRules'))return CARCASS_RULES.legacy;
 if(!Object.values(CARCASS_RULES).includes(core.carcassRules))throw Error('Unknown carcass rules.');return core.carcassRules;
}
export function validateCarcassRules(core,timelineTick=core.tickCount){
 const rule=carcassRule(core),history=core.carcassRuleMigrations;
 if(history!==undefined&&(!Array.isArray(history)||history.length>1||history.some(r=>r?.schema!==1||r.from!==CARCASS_RULES.legacy||r.to!==CARCASS_RULES.finite||typeof r.source!=='string'||!r.source.trim()||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||!Number.isSafeInteger(r.globalTick)||r.globalTick<r.tick||r.globalTick>timelineTick)))throw Error('Invalid carcass migration history.');
 if(history?.length&&rule!==CARCASS_RULES.finite)throw Error('Carcass policy contradicts migration history.');return rule;
}
export function restoreCarcassRules(sim,core){
 if(!Object.hasOwn(core,'carcassRules'))delete sim.carcassRules;
 if(!Object.hasOwn(core,'carcassRuleMigrations'))delete sim.carcassRuleMigrations;
 const rule=validateCarcassRules(sim);
 for(const s of sim.planetaryTravel?.sessions||[])if(validateCarcassRules(s.snapshot.core,sim.tickCount)!==rule)throw Error('Inconsistent planetary carcass rules.');
 return rule;
}
export function enableFiniteCarcass(sim,{source}={}){
 if(typeof source!=='string'||!source.trim())throw Error('Carcass migration requires an explicit source.');
 const from=validateCarcassRules(sim),sessions=sim.planetaryTravel?.sessions||[];
 for(const s of sessions)if(validateCarcassRules(s.snapshot.core,sim.tickCount)!==from)throw Error('Inconsistent planetary carcass rules.');
 if(from===CARCASS_RULES.finite)return{changed:false,rule:from};
 for(const s of sessions){if(s.biologicalMode!=='canonical-ticks/1')throw Error('Environmental-only archive migration needs an explicit clock conversion.');if(s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish remote biological catchup before changing carcass rules.');}
 const record=core=>({schema:1,from,to:CARCASS_RULES.finite,tick:core.tickCount,globalTick:sim.tickCount,source:source.trim(),scope:'Future carcass discovery marks existing carrion without adding food or causing deaths. Existing organisms, food, old markers, RNG and prior rewards are preserved; no past flow is reconstructed.'});
 // Build all new records before publishing any metadata. Resource graphs stay owned.
 const planned=sessions.map(s=>({session:s,snapshot:{...s.snapshot,core:{...s.snapshot.core,carcassRules:CARCASS_RULES.finite,carcassRuleMigrations:[record(s.snapshot.core)]}}}));
 const activeRecord=record(sim);for(const p of planned)validateCarcassRules(p.snapshot.core,sim.tickCount);
 sim.carcassRules=CARCASS_RULES.finite;sim.carcassRuleMigrations=[activeRecord];for(const p of planned)p.session.snapshot=p.snapshot;return{changed:true,rule:sim.carcassRules,regions:planned.length+1};
}
export function validateCarcassSnapshot(snapshot){
 const rule=validateCarcassRules(snapshot.core||{});
 for(const s of snapshot.core?.planetaryTravel?.sessions||[])if(validateCarcassRules(s.snapshot.core,snapshot.core.tickCount)!==rule)throw Error('Inconsistent planetary carcass rules.');
}
