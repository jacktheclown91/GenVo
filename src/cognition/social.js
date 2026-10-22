import {CFG} from '../sim/config.js';
import {SPECIES,canPreyOn} from '../organisms/species.js';
import {isWaterDweller} from '../lineage/aquatic.js';

export class SocialController{
  constructor(sim){this.sim=sim;this.states=new Map();this.contacts=new Map();this.lastContactDay=-Infinity;this.lastObserveTick=-Infinity;this.stats={alarms:0,cohesionMoves:0,spacingMoves:0}}
  contactKey(a,b){return a<b?`${a}:${b}`:`${b}:${a}`}
  familiarity(a,b){return this.contacts?.get(this.contactKey(a.id,b.id))||null}
  // Pair history is actual repeated contact, not a universal affection score.
  // Forgotten acquaintances cannot accumulate without bound in mature worlds.
  rememberContacts(encounters){
    this.contacts??=new Map();this.lastContactDay??=-Infinity;
    const day=this.sim.day;
    if(day!==this.lastContactDay){
      this.lastContactDay=day;
      const alive=new Set(this.sim.animals.filter(a=>a.alive).map(a=>a.id));
      for(const [key,c] of this.contacts){
        if(day-c.day>16||!alive.has(c.a)||!alive.has(c.b))this.contacts.delete(key);
      }
    }
    for(const [key,encounter] of encounters){
      const old=this.contacts.get(key);
      // Contacts can begin at any time of day. Repeated physics samples of
      // the same pair do not create extra experience in that calendar day.
      if(old?.day===day)continue;
      this.contacts.set(key,{a:encounter.a,b:encounter.b,day,observations:Math.min(16,(old?.observations||0)+1),
        sharedDanger:Math.min(8,(old?.sharedDanger||0)+(encounter.sharedDanger?1:0))});
    }
  }
  profile(animal){return SPECIES[animal?.species]?.social||null}
  enabled(animal){const p=this.profile(animal);return !!(animal?.alive&&p&&p.mode!=='solitary')}
  behaviorEnabled(animal){
    // Shared social behavior is not restricted to the player camera.
    // Archived biological simulations have no active player but still
    // require actual herding, spacing, and predator alarm perception.
    return this.enabled(animal);
  }
  observe({force=false}={}){
    const interval=CFG.lifeStride*2;
    if(!force&&this.states.size&&this.sim.tickCount-this.lastObserveTick<interval)return;
    this.lastObserveTick=this.sim.tickCount;this.states.clear();
    const directAlarms=new Map(),socialAnimals=[],encounters=new Map();
    // Compute each animal's own alarm once; group members can then relay it without repeating predator searches.
    for(const animal of this.sim.animals){
      if(!this.enabled(animal))continue;socialAnimals.push(animal);const profile=this.profile(animal);
      const threat=this.sim.findNearest(animal,b=>this.sim.isPredatorTo?.(b,animal)??(b.alive&&SPECIES[b.species]?.hunter&&canPreyOn(b.species,animal.species)),profile.alarmRadius||6);
      if(threat)directAlarms.set(animal.id,{threat,distance:Math.hypot(threat.x-animal.x,threat.y-animal.y),sourceId:animal.id});
    }
    for(const animal of socialAnimals){
      const profile=this.profile(animal),members=[animal],candidates=[];
      this.sim.forEachNearby(animal,profile.joinRadius,b=>{
        if(!b.alive||b.id===animal.id||!this.associates(animal,b)||!this.sim.canReach(animal,b.x,b.y))return;
        const d=Math.hypot(b.x-animal.x,b.y-animal.y);if(d>profile.joinRadius)return;const affinity=this.affinity(animal,b,profile);
        candidates.push({animal:b,distance:d,affinity});
      });
      candidates.sort((a,b)=>b.affinity-a.affinity||a.distance-b.distance||a.animal.id-b.animal.id);
      for(const c of candidates.slice(0,Math.max(0,(profile.maxGroup||8)-1)))members.push(c.animal);
      // Collect observations before publishing any new memories. The candidate
      // ranking for this pass must not depend on animal iteration order.
      if(!force)for(const other of members){
        if(other.id===animal.id)continue;
        const key=this.contactKey(animal.id,other.id),a=Math.min(animal.id,other.id),b=Math.max(animal.id,other.id);
        const sharedDanger=!!(directAlarms.get(animal.id)||directAlarms.get(other.id));
        const previous=encounters.get(key);
        encounters.set(key,{a,b,sharedDanger:sharedDanger||!!previous?.sharedDanger});
      }
      const center={x:members.reduce((n,m)=>n+m.x,0)/members.length,y:members.reduce((n,m)=>n+m.y,0)/members.length};
      const guide=this.currentGuide(members);
      let nearest=null,nearestD=Infinity,alarm=null;
      for(const m of members){
        if(m.id!==animal.id){const d=Math.hypot(m.x-animal.x,m.y-animal.y);if(d<nearestD){nearestD=d;nearest=m}}
        const signal=directAlarms.get(m.id);if(signal&&(!alarm||signal.distance<alarm.distance))alarm=signal;
      }
      this.states.set(animal.id,{mode:profile.mode,label:profile.label||profile.mode,members:members.map(m=>m.id),size:members.length,center,nearestId:nearest?.id??null,nearestDistance:nearestD,alarm,guideId:guide?.id??null});
    }
    if(!force)this.rememberContacts(encounters);
  }
  associates(a,b){
    // Temporary local social membership is neither genealogy nor food demand.
    // Real relatives/caregivers/partners may associate across inherited builds
    // and founding labels. Existing founding social profiles remain defaults.
    return a.species===b.species||a.caregiverId===b.id||b.caregiverId===a.id||
      (this.sim.cognition?.relation(a,b)||'unrelated')!=='unrelated'||(this.sim.recovery?.kinship(a,b)||'none')!=='none';
  }
  affinity(a,b,profile){
    let score=1;
    if(profile.kinBias){
      const rel=this.sim.cognition?.relation(a,b)||'unrelated';
      if(rel!=='unrelated')score*=profile.kinBias;

    }
    const previous=this.familiarity(a,b);
    if(previous)score*=1+Math.min(.25,previous.observations*.016)+Math.min(.12,previous.sharedDanger*.015);
    return score;
  }
  currentGuide(members){
    if(members.length<3)return null;
    const traveling=new Set(['drink','to-water','feed','migrate','family-scout','hunt','explore','player']);
    let best=null,bestSupport=1;
    for(const candidate of members){
      if(!candidate.alive||!traveling.has(candidate.intent))continue;
      const goal=candidate.target;
      const hasPlace=Number.isFinite(goal?.x)&&Number.isFinite(goal?.y);
      const hasManualDirection=candidate.intent==='player'&&
        Number.isFinite(goal?.dx)&&Number.isFinite(goal?.dy)&&(goal.dx||goal.dy);
      if(!hasPlace&&!hasManualDirection)continue;
      if(hasPlace&&Math.hypot(goal.x-candidate.x,goal.y-candidate.y)<1)continue;
      // A guide needs at least two independently familiar companions.
      // No species tag, rank, combat strength or fixed alpha grants obedience.
      let support=0;
      for(const other of members){
        if(other.id===candidate.id)continue;
        if((this.familiarity(candidate,other)?.observations||0)>=2)support++;
      }
      if(support>bestSupport||(support===bestSupport&&best&&candidate.id<best.id)){
        best=candidate;bestSupport=support;
      }
    }
    return best;
  }
  state(animal){return this.states.get(animal?.id)||null}
  snapshot(animal){
    const s=this.state(animal),p=this.profile(animal);if(!s||!p)return null;
    return{...s,preferredSpacing:p.separation||1,cohesionRadius:this.cohesionRadius(animal,p),alarmSpecies:s.alarm?.threat?.species||null};
  }
  visualState(animal){
    const s=this.state(animal);if(!s)return null;
    const ids=[...s.members].sort((a,b)=>a-b),memberIndex=Math.max(0,ids.indexOf(animal.id)),threat=s.alarm?.threat||null;
    const caregiver=animal?.caregiverId?this.sim.animals.find(a=>a.id===animal.caregiverId&&a.alive)||null:null;
    return{mode:s.mode,size:s.size,groupKey:ids[0]??animal.id,memberIndex,center:s.center,guideId:s.guideId??null,alarm:!!threat,sharedAlarm:!!threat&&s.alarm.sourceId!==animal.id,threatX:threat?.x??null,threatY:threat?.y??null,caregiverX:caregiver?.x??null,caregiverY:caregiver?.y??null};
  }
  cohesionRadius(animal,profile=this.profile(animal)){
    let r=profile?.cohesionRadius||4;
    if(animal?.species==='genvo'&&(animal.lineage||animal.player))r*=this.sim.cognition?.familyDistanceScale(animal)??1;
    return r;
  }
  alarmResponse(animal){
    if(this.sim.isManualPlayer?.(animal)||!this.behaviorEnabled(animal))return null;const s=this.state(animal);if(!s?.alarm?.threat)return null;
    const threat=s.alarm.threat,profile=this.profile(animal),dx=animal.x-threat.x,dy=animal.y-threat.y,len=Math.hypot(dx,dy)||1;
    if(len>(profile.alarmRadius||6)*1.15)return null;
    const spec=SPECIES[animal.species],energy=animal.energy/Math.max(1,spec.maxEnergy);if(energy<.28)return null;
    const cx=s.center.x-animal.x,cy=s.center.y-animal.y;
    return{x:animal.x+dx/len*2.6+cx*.12,y:animal.y+dy/len*2.6+cy*.12,threat,shared:s.alarm.sourceId!==animal.id};
  }
  spacingTarget(animal){
    if(this.sim.isManualPlayer?.(animal)||!this.behaviorEnabled(animal))return null;const s=this.state(animal),p=this.profile(animal);if(!s||s.size<2||!Number.isFinite(s.nearestDistance)||s.nearestDistance>=(p.separation||1))return null;
    const other=this.sim.animals.find(a=>a.id===s.nearestId&&a.alive);if(!other)return null;
    const dx=animal.x-other.x,dy=animal.y-other.y,len=Math.hypot(dx,dy)||1,target={x:animal.x+dx/len*1.8,y:animal.y+dy/len*1.8};
    if(!this.reachableHabitat(animal,target))return null;this.stats.spacingMoves++;
    return target;
  }
  // Group movement never draws a water dweller ashore: a gilled body keeps to
  // water rather than following land-living group mates onto the bank.
  reachableHabitat(animal,p){if(!isWaterDweller(animal))return true;const w=this.sim.world;return w.isPlayable(p.x,p.y)&&!!w.water[w.idx(p.x,p.y)]}
  cohesionTarget(animal){
    if(this.sim.isManualPlayer?.(animal)||!this.behaviorEnabled(animal))return null;const s=this.state(animal),p=this.profile(animal);if(!s||s.size<3)return null;
    const spec=SPECIES[animal.species];if(animal.energy/spec.maxEnergy<.58||animal.hydration/spec.maxHydration<.58)return null;
    const guide=s.guideId!=null&&s.guideId!==animal.id&&s.members.includes(s.guideId)
      ?this.sim.animals.find(a=>a.id===s.guideId&&a.alive):null;
    const destination=guide||s.center;
    const d=Math.hypot(destination.x-animal.x,destination.y-animal.y),limit=this.cohesionRadius(animal,p);
    if(d<=limit||!this.reachableHabitat(animal,destination))return null;this.stats.cohesionMoves++;
    return{x:destination.x,y:destination.y};
  }
  noteAlarm(animal){const s=this.state(animal);if(s?.alarm)this.stats.alarms++}
}
