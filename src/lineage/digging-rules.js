// Versioned future-action rules; no resource, phenotype or historical-flow reconstruction.
export const DIGGING_RULES=Object.freeze({legacy:'legacy-patch-reward/1',finite:'finite-local-root-food/1'});
export function diggingRule(core){
 if(!Object.hasOwn(core,'diggingRules'))return DIGGING_RULES.legacy;
 if(!Object.values(DIGGING_RULES).includes(core.diggingRules))throw Error('Unknown digging rules.');return core.diggingRules;
}
export function validateDiggingRules(core,timelineTick=core.tickCount){
 const rule=diggingRule(core),history=core.diggingRuleMigrations;
 if(history!==undefined&&(!Array.isArray(history)||history.length>1||history.some(r=>r?.schema!==1||r.from!==DIGGING_RULES.legacy||r.to!==DIGGING_RULES.finite||typeof r.source!=='string'||!r.source.trim()||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||!Number.isSafeInteger(r.globalTick)||r.globalTick<r.tick||r.globalTick>timelineTick)))throw Error('Invalid digging migration history.');
 if(history?.length&&rule!==DIGGING_RULES.finite)throw Error('Digging policy contradicts migration history.');return rule;
}
export function restoreDiggingRules(sim,core){
 if(!Object.hasOwn(core,'diggingRules'))delete sim.diggingRules;
 if(!Object.hasOwn(core,'diggingRuleMigrations'))delete sim.diggingRuleMigrations;
 const rule=validateDiggingRules(sim);
 for(const s of sim.planetaryTravel?.sessions||[])if(validateDiggingRules(s.snapshot.core,sim.tickCount)!==rule)throw Error('Inconsistent planetary digging rules.');
 return rule;
}
export function enableFiniteDigging(sim,{source}={}){
 if(typeof source!=='string'||!source.trim())throw Error('Digging migration requires an explicit source.');
 const from=validateDiggingRules(sim),sessions=sim.planetaryTravel?.sessions||[];
 validateDiggingSites(sim.discovery.sites,sim.day);for(const s of sessions)validateDiggingSites(s.snapshot.controllers?.discovery?.sites,s.snapshot.core.day);
 
 for(const s of sessions)if(validateDiggingRules(s.snapshot.core,sim.tickCount)!==from)throw Error('Inconsistent planetary digging rules.');
 if(from===DIGGING_RULES.finite)return{changed:false,rule:from};
 for(const s of sessions){if(s.biologicalMode!=='canonical-ticks/1')throw Error('Environmental-only archive migration needs an explicit clock conversion.');if(s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish remote biological catchup before changing digging rules.');}
 const record=core=>({schema:1,from,to:DIGGING_RULES.finite,tick:core.tickCount,globalTick:sim.tickCount,source:source.trim(),scope:'Future root meals consume existing producer tissue through normal feeding. Existing organisms, genomes, stocks, RNG, pending births, prior rewards and old mound counts are preserved; no past flow is reconstructed.'});
 // Build all new records before publishing any metadata. Resource graphs stay owned.
 const planned=sessions.map(s=>({session:s,snapshot:{...s.snapshot,core:{...s.snapshot.core,diggingRules:DIGGING_RULES.finite,diggingRuleMigrations:[record(s.snapshot.core)]}}}));
 const activeRecord=record(sim);for(const p of planned)validateDiggingRules(p.snapshot.core,sim.tickCount);
 sim.diggingRules=DIGGING_RULES.finite;sim.diggingRuleMigrations=[activeRecord];for(const p of planned)p.session.snapshot=p.snapshot;return{changed:true,rule:sim.diggingRules,regions:planned.length+1};
}
export function validateDiggingSites(sites,day){
 if(sites!==undefined&&!Array.isArray(sites))throw Error('Invalid discovery sites.');
 for(const site of sites||[])if(site.finiteHarvests!==undefined&&(!Number.isSafeInteger(site.finiteHarvests)||site.finiteHarvests<0)||site.lastFiniteHarvestDay!==undefined&&(!Number.isSafeInteger(site.lastFiniteHarvestDay)||site.lastFiniteHarvestDay<1||site.lastFiniteHarvestDay>day||!site.finiteHarvests))throw Error('Invalid saved finite mound visit.');
}
export function validateDiggingSnapshot(snapshot){
 const rule=validateDiggingRules(snapshot.core||{});
 validateDiggingSites(snapshot.controllers?.discovery?.sites,snapshot.core?.day);
 for(const s of snapshot.core?.planetaryTravel?.sessions||[]){
  if(validateDiggingRules(s.snapshot.core,snapshot.core.tickCount)!==rule)throw Error('Inconsistent planetary digging rules.');
  validateDiggingSites(s.snapshot.controllers?.discovery?.sites,s.snapshot.core.day);
 }
}
