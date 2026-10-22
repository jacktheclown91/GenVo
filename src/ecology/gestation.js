// Preserve parental inheritance without retaining a live animal/target graph.
// Used for both parents; the export name remains compatible with existing callers.
// The father need not survive gestation for an already conceived litter to be born.
export function paternalInheritance(father){
  const fields=['id','species','sex','generation','parentIds','grandparentIds','genes','pigmentGenome','reproductiveGenome','matePreferences','adaptations',
    'massPolicy','anatomy','legacyWaterPhysiology','bodyPlan','elder','lineage','x','y','protoHistory','formHistory',
    // Recorded founding provenance, so offspring know which founders they descend from.
    'foundingOrigin','foundingLineage'];
  const record={alive:false,player:false};
  for(const key of fields)if(father[key]!==undefined)record[key]=structuredClone(father[key]);
  return record;
}
