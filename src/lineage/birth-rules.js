const restoredMigrations=new WeakMap();
export function birthRuleMigrationMessage(sim){return restoredMigrations.has(sim)?'World restored. Future offspring use updated inheritance rules; existing organisms and ancestry are preserved.':null}
// Component versions preserve explicit future-birth migration boundaries.
export const BIRTH_RULES=Object.freeze({schema:1,inheritedVariation:'neutral-core/1',populationTraits:'neutral-parental/1',familyForms:'neutral-parental/1',anatomyProjection:'supported-water/1',bodyVariation:'neutral-head-structure/1'});
export function restoreBirthRules(sim,core={}){
  const rules=core.birthRules;
  if(rules!==undefined){
    if(!rules||rules.schema!==1||rules.inheritedVariation!=='neutral-core/1'||!['legacy-pressure/1','neutral-parental/1'].includes(rules.populationTraits)||![undefined,'legacy-behavior/1','neutral-parental/1'].includes(rules.familyForms)||!['legacy-axis/1','supported-water/1'].includes(rules.anatomyProjection)||![undefined,'add-replace/1','neutral-optional-loss/1','neutral-optional-loss/2','neutral-head-structure/1'].includes(rules.bodyVariation)||Object.keys(rules).some(k=>!Object.hasOwn(BIRTH_RULES,k)))throw Error('Unsupported birth rules version');
    if(Object.keys(BIRTH_RULES).every(k=>rules[k]===BIRTH_RULES[k])){sim.birthRules={...rules};return}
  }
  sim.birthRules={...BIRTH_RULES};
  const receipt={from:rules?structuredClone(rules):'unversioned-directed-core',to:{...BIRTH_RULES},tick:sim.tickCount,scope:'Future neutral continuous genes, parental population traits and family forms; existing organisms/history unchanged; independent supported water physiology for future bodies; neutral optional subtree deletion in future structural variation; existing event chance/symmetry share unchanged and conditional operator distribution extended; multi-occupant paired deletion matches actual part counterparts rather than socket ordinals; existing implicit head may become explicit by relocating its actual face; facial variation uses the actual host; other tissue physics remains incomplete.'};
  sim.birthRuleMigrations=[...(sim.birthRuleMigrations||[]),receipt];
  restoredMigrations.set(sim,receipt);
}
