import {validatePlan} from './body-plan.js';
import {hasAdaptation} from './evolution.js';
import {canSwim} from './lifestyle.js';

// Read-only migration assessment. Not a competing live traversal predicate.
// Future functional propulsion implementations may add assessed mechanisms here
// after their own biology is implemented; fins, gills and tails do not grant it.
export function reviewSwimming(animal,world=null){
  const bodyless=!animal?.bodyPlan,validation=bodyless?null:validatePlan(animal.bodyPlan);
  const webbed=validation?.ok?animal.bodyPlan.nodes.filter(n=>n.parent==='root'&&/^limb\.\d+$/.test(n.socket||'')&&n.partId==='webbed-leg').length:0;
  const legacy=hasAdaptation(animal,'webbed-limbs')||animal?.ecoLifestyle?.id==='aquatic';
  const designedEligible=!!validation?.ok&&webbed>=2;
  const proposedEligible=animal?.alive!==false&&(bodyless?!!legacy:designedEligible);
  const currentEligible=canSwim(animal),onWater=!!world?.water?.[world.idx(animal.x,animal.y)];
  return{currentEligible,proposedEligible,bodyless,validBody:bodyless?null:validation.ok,webbedPropulsors:webbed,legacyFallback:bodyless&&!!legacy,accessWouldChange:currentEligible!==proposedEligible,strandingRisk:currentEligible&&!proposedEligible&&onWater,reason:bodyless?'bodyless legacy fallback':!validation.ok?'invalid mounted body':designedEligible?'two functional mounted webbed propulsors':webbed===1?'partial webbing; no open-water propulsion':'no implemented open-water propulsion'};
}
export function auditSwimmingPopulation(animals,world=null){
  const records=animals.filter(a=>a.alive!==false).map(a=>({id:a.id,...reviewSwimming(a,world)}));
  return{scope:'read-only; current access unchanged',living:records.length,affected:records.filter(r=>r.accessWouldChange),stranding:records.filter(r=>r.strandingRisk),bodyless:records.filter(r=>r.bodyless).length,invalidBodies:records.filter(r=>r.validBody===false).length,records};
}
