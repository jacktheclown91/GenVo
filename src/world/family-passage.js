// E16: an explicit player-approved family cohort must remain physically nearby.
// No species-name perks, remote summons, synthetic babies, or automatic wildlife
// teleports. Caregiver/milk dependencies are closed before travel is authorized.
import {SPECIES} from '../organisms/species.js';

export const FAMILY_PASSAGE=Object.freeze({
 maxMembers:8,escortRadius:5.5,dependentRadius:4.5,
 adultMaturityFraction:1,energyCost:.035
});
const near=(a,b,range)=>Math.hypot(a.x-b.x,a.y-b.y)<=range;
const dependent=(sim,child)=>{
 if(!child?.alive)return false;
 if(sim.family?.isDependent?.(child))return true;
 const maturity=SPECIES[child.species]?.maturity||10;
 return child.age<maturity*.8&&(child.caregiverId!=null||child.lactationParentId!=null);
};
const restricted=a=>a.perched||a.torpor||a.pregnant||a.courtshipPerformance||a.courtshipSession||a.pursuitEngaged;
const abort=(reason)=>({ok:false,reason,members:[]});

export function familyTravelCohort(sim,{withFamily=!!sim?.travelFamilyGroup}={}){
 const player=sim?.player?.();
 if(!player?.alive)return abort('There is no active living creature.');
 if(!withFamily){
  if(sim.animals.some(a=>a.id!==player.id&&dependent(sim,a)&&
    (a.caregiverId===player.id||a.lactationParentId===player.id)))
   return abort('Dependent young are waiting. Enable Family Crossing and gather them nearby.');
  return{ok:true,members:[player],adultCount:1,dependentCount:0,withFamily:false};
 }
 const members=[player],ids=new Set([player.id]);
 const familyIds=new Set(sim.family?.activeMembers?.(player)?.map(a=>a.id)||[]);
 // Adult escorts must be actually present and lineage-related. Never follow
 // a species label or assume every nearby animal is part of the family.
 for(const adult of sim.animals){
  if(!adult.alive||adult.id===player.id||!familyIds.has(adult.id)||
    adult.age<(SPECIES[adult.species]?.maturity||10)*FAMILY_PASSAGE.adultMaturityFraction||
    !near(adult,player,FAMILY_PASSAGE.escortRadius))continue;
  members.push(adult);ids.add(adult.id);
 }
 if(members.length>FAMILY_PASSAGE.maxMembers)
  return abort('Too many relatives gathered for one regional crossing. Divide into smaller groups.');
 // Include all true nursing / care dependents of selected adults. Distance
 // must already have been achieved through ordinary walking or follow AI.
 for(const child of sim.animals){
  if(!dependent(sim,child)||ids.has(child.id))continue;
  if(!members.some(a=>a.id===child.caregiverId||a.id===child.lactationParentId))continue;
  if(!near(child,player,FAMILY_PASSAGE.dependentRadius))
   return abort('A dependent young creature is too far away. Gather the family before traveling.');
  members.push(child);ids.add(child.id);
 }
 if(members.length>FAMILY_PASSAGE.maxMembers)
  return abort('This family cohort exceeds the safe crossing size. Wait until some offspring mature.');
 const membersById=new Map(members.map(a=>[a.id,a]));
 for(const a of members){
  if(a!==player&&(restricted(a)||a.energy<1||a.hydration<1))
   return abort('A relative is sleeping, fighting, pregnant or too exhausted to travel.');
  if(!near(a,player,FAMILY_PASSAGE.escortRadius))
   return abort('A family member must be physically nearby to cross.');
  if(!dependent(sim,a))continue;
  // Milk parent and current caregiver must travel together if alive. The
  // infant cannot be separated from active feeding or nursing relationships.
  for(const id of [a.caregiverId,a.lactationParentId]){
   if(id==null||membersById.has(id))continue;
   if(sim.animals.some(parent=>parent.id===id&&parent.alive))
    return abort('A dependent would lose its living caregiver. Bring that caregiver closer.');
  }
 }
 return{ok:true,members,adultCount:members.filter(a=>!dependent(sim,a)).length,
  dependentCount:members.filter(a=>dependent(sim,a)).length,withFamily:true};
}
export function familyArrivalPoint(leadFrom,leadTo,member,direction,index=0){
 if(member===leadFrom)return{...leadTo};
 const cx=Math.max(-3.5,Math.min(3.5,member.x-leadFrom.x)),
       cy=Math.max(-3.5,Math.min(3.5,member.y-leadFrom.y));
 // Keep the real front-to-back order; no organism can spawn in the border
 // margin or beyond the local 128-tile world.
 const clamp=v=>Math.max(2.5,Math.min(125.5,v));
 let x=leadTo.x,y=leadTo.y;
 if(direction==='east')x+=Math.max(0,-cx)*.65+.22*(index%3);
 else if(direction==='west')x-=Math.max(0,cx)*.65+.22*(index%3);
 else x+=cx*.6;
 if(direction==='south')y+=Math.max(0,-cy)*.65+.22*(index%3);
 else if(direction==='north')y-=Math.max(0,cy)*.65+.22*(index%3);
 else y+=cy*.6;
 return{x:clamp(x),y:clamp(y)};
}
