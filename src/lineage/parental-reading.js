// Inherited legacy physiological determinants only. Need, location, learned behavior
// and player identity are not inputs to parental choice or inherited strength.
export function chooseParentalReading(rng,parents,read){
  const available=(parents||[]).map(parent=>({parent,reading:read(parent)})).filter(x=>x.reading);
  if(!available.length)return null;
  const chosen=available.length===1?available[0]:available[rng.int(0,available.length-1)];
  return {sourceParentId:chosen.parent.id,reading:structuredClone(chosen.reading)};
}
