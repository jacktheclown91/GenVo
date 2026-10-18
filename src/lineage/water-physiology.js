export const WATER_AXES=Object.freeze({'water-sacs':'waterStorage','webbed-limbs':'webbing'});
export function adaptationAxis(anatomy,id,legacyAxis){
  const separate=WATER_AXES[id];return separate&&Object.hasOwn(anatomy||{},separate)?separate:legacyAxis;
}
export function waterSupport(plan){
  const nodes=plan?.nodes||[];return {storage:nodes.some(n=>n.partId==='storage-sac'),webbed:nodes.filter(n=>n.partId==='webbed-leg').length};
}
export function legacyWaterTraits(parent){
  const support=waterSupport(parent?.bodyPlan),prior=parent?.legacyWaterPhysiology||[];
  const old=!Object.hasOwn(parent?.anatomy||{},'waterStorage');
  return Object.entries(WATER_AXES).filter(([id])=>parent?.adaptations?.includes(id)&&(prior.includes(id)||old&&(id==='water-sacs'?!support.storage:support.webbed<2))).map(([id])=>id);
}
export function inheritedLegacyWaterTraits(parents,child){
  const possible=new Set((parents||[]).flatMap(legacyWaterTraits));
  return [...possible].filter(id=>child?.adaptations?.includes(id));
}
export function projectWaterPhysiology(animal,plan,{preserveLegacy=false}={}){
  const an=animal.anatomy,support=waterSupport(plan),legacy=preserveLegacy?animal.legacyWaterPhysiology||[]:[];
  for(const axis of Object.values(WATER_AXES))if(!Object.hasOwn(an,axis))an[axis]=an.waterBody||0;
  an.waterStorage=support.storage?Math.max(an.waterStorage,.65):legacy.includes('water-sacs')?an.waterStorage:Math.min(an.waterStorage,.35);
  an.webbing=support.webbed>=2?Math.max(an.webbing,.9):legacy.includes('webbed-limbs')?an.webbing:support.webbed===1?.65:Math.min(an.webbing,.65);
  // Compatibility reading for old habitat summaries; separate axes own expression.
  an.waterBody=an.waterStorage;
  animal.legacyWaterPhysiology=legacy.filter(id=>an[WATER_AXES[id]]>=(id==='water-sacs'?.5:.8));
}
