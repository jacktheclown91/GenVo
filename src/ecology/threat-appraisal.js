// Threat appraisal by behaviour (decision-coordination audit, sections 2 and 3). Previously an animal fled
// the nearest animal able to prey on it within its flight radius, whatever that animal was doing: 289 of 290
// mosskip water trips abandoned for a Stalker were for one that was exploring, drinking or hunting
// something else, and Stalkers fled the very partner they were approaching to court (unrelated
// cannibalism makes conspecifics "predators"). Now a would-be predator inside the flight radius is treated as
// a threat only when the animal can perceive that it is a threat:
//  - it is in a hunting posture (hunting, stalking, chasing, winding up or charging) and facing this animal
//    (within FACING_CONE of the direction to it), or
//  - it is within CLOSE_ALARM tiles and not itself visibly fleeing (too close to judge intent safely),
// and never when it is a member of the same species courting this animal (intent 'mate' aimed at it).
// Shared alarms (social.alarmResponse) are unchanged. Hunting itself, capture odds and cannibalism are
// unchanged. ?threatAppraisal=0 restores presence-based flight. CLOSE_ALARM and FACING_CONE are PROPOSALS.
export const THREAT_APPRAISAL={enabled:true};
export const CLOSE_ALARM=1.6,FACING_CONE=.5;// cone: cosine 0.5, i.e. within 60 degrees of facing
const FACE=[[0,-1],[.7071,-.7071],[1,0],[.7071,.7071],[0,1],[-.7071,.7071],[-1,0],[-.7071,-.7071]];
export const FLEEING=new Set(['escape','refuge','shelter','group-alarm','wary']);// 'wary': staged alarm retreat (threat-perception.js)
export const HUNTING=new Set(['hunt','stalk-player','chase-player','hunt-windup','charge-player','hunt-recover','mob']);
export function courtingMe(b,a){return b.species===a.species&&b.intent==='mate'&&b.target?.id===a.id}
export function facing(b,a){const f=FACE[(b.dir??0)&7],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1;return (f[0]*dx+f[1]*dy)/d>=FACING_CONE}
// Whether `a` perceives predator-capable `b`, at distance d, as a threat now.
export function appearsThreatening(b,a,d){
  if(!THREAT_APPRAISAL.enabled)return true;
  if(courtingMe(b,a)||courtingMe(a,b)&&b.species===a.species)return false;
  // A visibly fleeing animal is not attacking: no close alarm for it (measured: 32 of 34 remaining Stalker
  // mate-search escapes were from a partner that was itself escaping, within close range).
  if(d<=CLOSE_ALARM&&!FLEEING.has(b.intent))return true;
  return HUNTING.has(b.intent)&&facing(b,a);
}
