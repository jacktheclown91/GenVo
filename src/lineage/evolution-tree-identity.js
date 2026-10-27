// Pure identity reads borrowed by the existing evolutionary-tree authority and
// its persisted regional census. Membership is assigned only by Speciation.
export const ROOT_TAXON_ID='genvo8-root';
export const foundingRootId=species=>species==='genvo'?ROOT_TAXON_ID:'founding:'+species;
export function recordedBranchFor(nodes,animal){
  const branch=animal?.speciesBranch;
  if(!branch?.id)return null;
  const node=nodes.get(branch.id);
  // A remote population's ended boundary cannot erase this unchanged carrier.
  // Actual local rejoining clears its assigned branch through Speciation.
  return node?.memberIds.has(animal.id)?branch:null;
}
export function recordedTaxonFor(nodes,animal){
  return recordedBranchFor(nodes,animal)?.id||animal?.evolutionaryAncestry?.rootId||
    foundingRootId(animal?.species||'genvo');
}
