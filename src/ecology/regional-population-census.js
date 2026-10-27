// Borrowed by population memory, not a second population or species registry.
// Regional source populations represent ordinary wildlife across a physically
// connected region; local communities remain their geographically distinct demes.
// Both levels use the same paid-recruitment and resource evaluator.
export function regionalPopulationCensus(memory,living,{find,create}){
 const groups=new Map(),assigned=new Set();
 for(const animal of living){
  const record=find(animal);if(!record)continue;
  if(!groups.has(record.key))groups.set(record.key,[]);
  groups.get(record.key).push(animal);assigned.add(animal.id);
 }
 for(const seed of living){
  if(assigned.has(seed.id))continue;
  const members=living.filter(animal=>!assigned.has(animal.id)&&animal.species===seed.species&&
   memory.sim.canReach(animal,seed.x,seed.y)&&memory.sim.canReach(seed,animal.x,animal.y));
  if(members.length<2)continue;
  const record=create(members);groups.set(record.key,members);
  for(const animal of members)assigned.add(animal.id);
 }
 const membership=new Map();
 for(const [key,members] of groups)for(const animal of members)membership.set(animal.id,key);
 memory.natural.regionalMembership=membership;
 return groups;
}
