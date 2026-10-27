// Borrowed demographic bookkeeping for population memory. A paid, locally
// recruited child can show that two overlapping census candidates were one
// breeding neighbourhood. This never merges established population boundaries.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function candidateContainsKey(record,key){
 return record.key===key||!!record.candidateKeys?.has(key);
}
export function joinRecruitedCandidates(memory,living,rules){
 const {sim,natural:state}=memory,byId=new Map(living.map(a=>[a.id,a]));
 const resolve=key=>{
  let record=state.records.get(key);const seen=new Set();
  while(record?.status==='merged'&&record.establishedDay===null&&!seen.has(record.key)){
   seen.add(record.key);record=state.records.get(record.mergedInto);
  }
  return record;
 };
 for(const birth of state.births.values()){
  const child=byId.get(birth.id);if(!child||sim.day-birth.day<rules.recruitedDays)continue;
  const records=birth.residentKeys.map(resolve);
  if(records.some(p=>!p||p.status!=='candidate'||p.establishedDay!==null)||
     records[0]===records[1]||records[0].species!==records[1].species)continue;
  // Actual birth and surviving residence must be local to BOTH candidates.
  // Their original radius is unchanged: contact cannot create a long bridge.
  if(records.some(p=>distance(p,birth)>rules.radius||distance(p,child)>rules.radius||
     !sim.canReach(child,p.x,p.y)))continue;
  const resident=records.find(p=>p.memberIds.has(child.id));
  if(!resident||resident.members.get(child.id)?.lastDay!==sim.day-1||
     resident.members.get(child.id)?.days<rules.recruitedDays)continue;
  const parents=birth.parents.map(id=>byId.get(id));
  if(parents.some((parent,index)=>!parent||
     !records[index].memberIds.has(parent.id)||
     records[index].members.get(parent.id)?.lastDay!==sim.day-1||
     records[index].members.get(parent.id)?.days<rules.recruitedDays||
     distance(records[index],parent)>rules.radius||
     !sim.canReach(parent,records[index].x,records[index].y)))continue;
  const [target,source]=records.slice().sort((a,b)=>a.firstDay-b.firstDay||a.key.localeCompare(b.key));
  target.candidateKeys??=new Set([target.key]);
  for(const key of source.candidateKeys||[source.key])target.candidateKeys.add(key);
  for(const [id,residence] of source.members){
   const previous=target.members.get(id);
   if(!previous||residence.lastDay>previous.lastDay)target.members.set(id,{...residence});
  }
  for(const field of ['memberIds','everMembers','recruits','litters'])
   for(const value of source[field])target[field].add(value);
  // Do not add residence-day or resource totals together. The retained
  // candidate must independently satisfy all existing establishment gates.
  for(const [id,key] of state.membership)if(key===source.key)state.membership.set(id,target.key);
  source.status='merged';source.mergedInto=target.key;source.endedDay=sim.day;
  source.memberIds=new Set();
  state.events.push({type:'candidate-joined',key:source.key,into:target.key,day:sim.day,
   childId:child.id,bornDay:birth.day,parentIds:[...birth.parents],
   scope:'Overlapping candidates joined through actual surviving local recruitment'});
 }
}
