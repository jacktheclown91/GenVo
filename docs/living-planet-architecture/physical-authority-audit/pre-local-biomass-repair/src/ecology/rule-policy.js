const restored=new WeakSet();
export const ECOLOGY_RULES=Object.freeze({schema:1,populationFeedback:'local-opportunity/1'});
export function ecologyRuleMigrationMessage(sim){return restored.has(sim)?'Population behavior updated: startup counts no longer boost breeding, expand mate searches or relax kinship. Existing organisms and resources are preserved.':null}
export function restoreEcologyRules(sim,core={}){
  const prior=core.ecologyRules;
  if(core.ecologyRuleMigrations!==undefined&&!Array.isArray(core.ecologyRuleMigrations))throw Error('Invalid ecology rule migration history');
  if(prior!==undefined&&(!prior||prior.schema!==1||!['founder-feedback/1','local-opportunity/1'].includes(prior.populationFeedback)||Object.keys(prior).some(k=>!Object.hasOwn(ECOLOGY_RULES,k))))throw Error('Unsupported ecology rules version');
  sim.ecologyRules={...ECOLOGY_RULES};
  if(prior?.populationFeedback==='local-opportunity/1')return;
  sim.ecologyRuleMigrations=[...(core.ecologyRuleMigrations||[]),{from:prior?{...prior}:'unversioned-founder-feedback',to:{...ECOLOGY_RULES},tick:sim.tickCount,scope:'Future behavior: no founder-relative reproductive boost, search-radius expansion, sibling relaxation or global-count prey refuge. Existing organisms, ancestry, RNG, pending gestations and resource stocks unchanged; local opportunity and consent remain authoritative.'}];
  restored.add(sim);
}
