const restored=new WeakSet();
export const ECOLOGY_RULES=Object.freeze({schema:1,populationFeedback:'local-opportunity/1',preyOpportunity:'local-edible-biomass/1',defensiveFeeding:'carcass-only/1'});
export function ecologyRuleMigrationMessage(sim){return restored.has(sim)?'Feeding rules updated; existing organisms and stocks are preserved.':null}
export function restoreEcologyRules(sim,core={}){
  const prior=core.ecologyRules;
  if(core.ecologyRuleMigrations!==undefined&&!Array.isArray(core.ecologyRuleMigrations))throw Error('Invalid ecology rule migration history');
  if(prior!==undefined&&(!prior||prior.schema!==1||!['founder-feedback/1','local-opportunity/1'].includes(prior.populationFeedback)||(prior.preyOpportunity!==undefined&&!['global-adult-unit/1','local-edible-biomass/1'].includes(prior.preyOpportunity))||(prior.defensiveFeeding!==undefined&&prior.defensiveFeeding!=='carcass-only/1')||Object.keys(prior).some(k=>!Object.hasOwn(ECOLOGY_RULES,k))))throw Error('Unsupported ecology rules version');
  sim.ecologyRules={...ECOLOGY_RULES};
  if(prior?.populationFeedback==='local-opportunity/1'&&prior.preyOpportunity==='local-edible-biomass/1'&&prior.defensiveFeeding==='carcass-only/1')return;
  sim.ecologyRuleMigrations=[...(core.ecologyRuleMigrations||[]),{from:prior?{...prior}:'unversioned-founder-feedback',to:{...ECOLOGY_RULES},tick:sim.tickCount,scope:'Future behavior: no founder-relative reproductive boost, search-radius expansion, sibling relaxation or global-count prey refuge. Hunter resource opportunity now measures accessible local remaining edible biomass plus surveyed local usable nutrition in existing carcass-equivalent units; unchanged minPrey numerical requirements use these units instead of headcount/global-adult units. Accessible carrion is included for every mouth that can eat it; metabolic competitor weighting is unchanged. Existing organisms, ancestry, RNG, pending gestations and resource stocks unchanged; local opportunity and consent remain authoritative. Defensive counterstrike kills no longer grant an unfunded species-mass food reward alongside the remaining carcass; later meals consume finite carcass stocks. No prior kill, reserve or ancestry is rewritten.'}];
  restored.add(sim);
}
