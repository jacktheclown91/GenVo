// Preserve parental inheritance without retaining a live animal/target graph.
// Used for both parents; the export name remains compatible with existing callers.
// The father need not survive gestation for an already conceived litter to be born.
export function paternalInheritance(father){
  const fields=['id','species','sex','generation','parentIds','grandparentIds','genes','reproductiveGenome','matePreferences','adaptations',
    'anatomy','bodyPlan','elder','lineage','x','y','protoHistory','formHistory'];
  const record={alive:false,player:false};
  for(const key of fields)if(father[key]!==undefined)record[key]=structuredClone(father[key]);
  return record;
}
