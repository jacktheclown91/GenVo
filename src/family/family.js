import {learnedResourceTarget} from './learned-resource-target.js';
import {toReserve,toAbsolute,mouthScale} from '../organisms/body-size.js';
import {preyPreference,canHunt} from '../ecology/functional-diet.js';
import {isFeedingIntent} from '../ecology/feeding-intents.js';
import {SPECIES} from '../organisms/species.js';
import {CFG} from '../sim/config.js';
import {milkEligible,transferMilk,motherWarmth,MAMMAL} from '../ecology/mammalian-care.js';
import {YOUNG_CLIMATE} from '../ecology/young-climate.js';

export class FamilyController{
  constructor(sim){
    this.sim=sim;
    this.events=[];
    this.maxEvents=12;
  }
  registerBirth(child,mother,father){
    child.caregiverId=mother?.id??father?.id??null;
    // Existing care practices travel with the actual caregiving relationship,
    // rather than disappearing when a hybrid receives another founding label.
    const care=this.careProfile(mother)||this.careProfile(father);if(care)child.careProfile={...care};
    // A milk-dependent lineage needs caregiver behavior even if its founding
    // taxon previously lacked any family-care metadata.
    if(child.lactationParentId!=null)child.careProfile={...child.careProfile,lineageOnly:false,dependentUntil:.65,followDistance:2.1,nurseRadius:MAMMAL.contactDistance,parentReserve:MAMMAL.parentEnergyReserve,guardThreatRadius:5};
    child.birthTick=this.sim.tickCount;
    child.birthDay=this.sim.day;
    child.birthYear=this.sim.year;
    child.careStress=.08;
    child.careStressTotal=0;
    child.careStressSamples=0;
    child.careHighStressSamples=0;
    child.careTendedCount=0;
    child.careThreatDays=0;
    child.lastCareThreatDay=null;
    child.lastTendedDay=null;
    child.careCooldownUntil=0;
    child.learningLessons={water:0,food:0,shelter:0,danger:0};
    child.learningMemory={water:null,food:null,shelter:null,danger:null};
    child.learningLessonDays={};
    child.practiceStats={water:{attempts:0,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};
    child.practiceRun=null;
    child.practiceCooldownUntil=0;
    this.pushEvent({type:'birth',animalId:child.id,motherId:mother?.id??null,fatherId:father?.id??null,generation:child.generation});
  }
  pushEvent(event){
    this.events.unshift({...event,tick:this.sim.tickCount,day:this.sim.day,year:this.sim.year});
    if(this.events.length>this.maxEvents)this.events.length=this.maxEvents;
  }
  recentEvent(){return this.events[0]||null}
  development(animal){return developmentFor(animal)}
  careProfile(animal){
    if(!animal)return null;
    return animal.careProfile||SPECIES[animal.species]?.familyCare||
      SPECIES[this.sim.animals.find(a=>a.id===animal.caregiverId)?.species]?.familyCare||null;
  }
  isDependent(animal){
    const s=SPECIES[animal?.species];
    const care=this.careProfile(animal);
    if(!animal||!care)return false;
    if(care.lineageOnly&&!animal.lineage)return false;
    return animal.age<s.maturity*(care.dependentUntil??.6);
  }
  caregiver(animal){
    if(!animal)return null;
    let caregiver=this.sim.animals.find(a=>a.id===animal.caregiverId&&a.alive)||null;
    if(caregiver)return caregiver;
    for(const id of animal.parentIds||[]){
      caregiver=this.sim.animals.find(a=>a.id===id&&a.alive)||null;
      if(caregiver){animal.caregiverId=caregiver.id;return caregiver}
    }
    return null;
  }
  activeMembers(anchor=this.sim.player?.()){
    if(!anchor?.alive)return[];
    const all=this.sim.animals.filter(a=>a.alive),young=a=>this.isDependent(a)||(a.caregiverId!=null&&a.age<(SPECIES[a.species]?.maturity??0)),ids=new Set([anchor.id]),radius=SPECIES[anchor.species]?.social?.joinRadius??8;
    const include=a=>{if(a?.alive)ids.add(a.id)};
    for(const a of all){
      if(anchor.lastMate===a.id||a.lastMate===anchor.id)include(a);
      if(young(anchor)&&((anchor.parentIds||[]).includes(a.id)||anchor.caregiverId===a.id))include(a);
      if(young(a)&&((a.parentIds||[]).includes(anchor.id)||a.caregiverId===anchor.id)){
        include(a);for(const id of a.parentIds||[])include(all.find(v=>v.id===id));
      }
      // Grown relatives may associate locally, then disperse independently.
      // Ancestry remains recorded; lineage flags alone never grant membership.
      if(Math.hypot(a.x-anchor.x,a.y-anchor.y)<=radius&&this.sim.canReach(anchor,a.x,a.y)&&
        ((this.sim.cognition?.relation(anchor,a)||'unrelated')!=='unrelated'||this.sim.recovery.kinship(anchor,a)!=='none'))include(a);
    }
    return all.filter(a=>ids.has(a.id));
  }
  relationshipSummary(anchor=this.sim.player?.()){
    const active=this.activeMembers(anchor),children=this.livingChildren(anchor);
    return{active:active.length,dependents:active.filter(a=>this.isDependent(a)).length,livingChildren:children.length,
      lineage:this.sim.animals.filter(a=>a.alive&&a.lineage).length,social:this.sim.social?.state?.(anchor)?.size??(anchor?.alive?1:0)};
  }
  livingChildren(parent,{dependentOnly=false}={}){
    if(!parent)return[];
    return this.sim.animals.filter(a=>a.alive&&a.parentIds?.includes(parent.id)&&(!dependentOnly||this.isDependent(a)));
  }
  followTarget(animal){
    if(this.sim.isManualPlayer?.(animal))return null;
    const profile=this.learningProfile(animal),teachingDanger=this.isLearning(animal)&&profile?.next==='danger'&&!(profile?.lessons?.danger>0);
    if(!this.isDependent(animal)&&!teachingDanger)return null;
    const care=this.careProfile(animal);
    const caregiver=this.caregiver(animal);
    if(!care||!caregiver)return null;
    const d=Math.hypot(caregiver.x-animal.x,caregiver.y-animal.y);
    const scale=animal.lineage?(this.sim.cognition?.familyDistanceScale(animal)??1):1;
    const independence=profile?.independence??0;
    let followDistance=(care.followDistance??2.2)*scale*(1+independence*.85);
    // While Danger is the next family lesson, keep dependent young close enough to observe
    // a caregiver response without requiring them to enter the Stalker's immediate danger radius.
    if(teachingDanger&&caregiver.player){
      const stalker=this.sim.findNearest(caregiver,b=>b.alive&&canHunt(b)&&preyPreference(b,animal)>0,9);
      if(stalker)followDistance=Math.min(followDistance,2.15);
    }
    return d>followDistance?caregiver:null;
  }
  guardTarget(parent){
    if(!parent||this.sim.isManualPlayer?.(parent))return null;
    const care=this.careProfile(parent);
    if(!care)return null;
    const children=this.livingChildren(parent,{dependentOnly:true});
    let best=null,bestD=Infinity;
    for(const child of children){
      const sociality=parent.lineage?(this.sim.cognition?.temperament(parent).sociality??1):1;
      const radius=(care.guardThreatRadius??4.5)*sociality;
      const threat=this.sim.findNearest(child,b=>b.alive&&canHunt(b)&&preyPreference(b,child)>0,radius);
      if(!threat)continue;
      const d=Math.hypot(child.x-parent.x,child.y-parent.y);
      if(d<bestD){bestD=d;best={child,threat}}
    }
    return best;
  }
  careStatus(child,caregiver=this.caregiver(child)){
    if(!child||!this.isDependent(child))return null;
    const spec=SPECIES[child.species],care=this.careProfile(child)||{};
    const energy=Math.max(0,child.energy/spec.maxEnergy),hydration=Math.max(0,child.hydration/spec.maxHydration);
    const distance=caregiver&&!!child.underground===!!caregiver.underground?Math.hypot(child.x-caregiver.x,child.y-caregiver.y):Infinity;
    const independence=this.learningProfile(child)?.independence??0;
    const separationLimit=(care.followDistance??2.2)*(1.35+independence*.85);
    const separated=!caregiver||distance>separationLimit;
    const threat=this.sim.findNearest(child,b=>b.alive&&canHunt(b)&&preyPreference(b,child)>0,6.2);
    const threatDistance=threat?Math.hypot(child.x-threat.x,child.y-threat.y):Infinity;
    const shelter=this.sim.shelter?.nearest(child,{radius:Infinity,familyOnly:true})||null;
    const shelterDistance=shelter?Math.hypot(child.x-shelter.x,child.y-shelter.y):Infinity;
    const sheltered=!!(shelter&&shelterDistance<=1.65);
    const stress=Math.max(0,Math.min(1,child.careStress??0));
    const danger=threat&&threatDistance<4.8;
    let need='steady',label='steady',severity=stress*.42;
    if(danger){need='fear';label='frightened';severity=Math.max(severity,.82+(4.8-threatDistance)*.03)}
    else if(hydration<.36){need='water';label='thirsty';severity=Math.max(severity,.72+(.36-hydration))}
    else if(energy<.52){need='food';label='hungry';severity=Math.max(severity,.68+(.52-energy))}
    else if(separated){need='separation';label=independence>.62?'ranging farther':'separated';severity=Math.max(severity,.60+Math.min(.2,(distance-separationLimit)*.03)-independence*.18)}
    else if(stress>.52){need='stress';label='unsettled';severity=Math.max(severity,.54+stress*.28)}
    else if(sheltered){label='safe in shelter'}
    return{child,caregiver,energy,hydration,distance,separated,threat,threatDistance,shelter,shelterDistance,sheltered,stress,need,label,severity:Math.min(1,severity),urgent:severity>=.54};
  }
  priorityChild(parent,{dependentOnly=true}={}){
    const children=this.livingChildren(parent,{dependentOnly});
    let best=null;
    for(const child of children){const status=this.careStatus(child);if(!status)continue;if(!best||status.severity>best.severity||(status.severity===best.severity&&status.distance<best.distance))best=status}
    return best;
  }
  careTarget(parent,{radius=1.7,urgentOnly=true}={}){
    if(!parent)return null;
    let best=null;
    for(const child of this.livingChildren(parent,{dependentOnly:true})){
      const d=Math.hypot(child.x-parent.x,child.y-parent.y);if(d>radius)continue;
      const status=this.careStatus(child);if(!status||urgentOnly&&!status.urgent)continue;
      if(!best||status.severity>best.status.severity||(status.severity===best.status.severity&&d<best.distance))best={child,status,distance:d};
    }
    return best;
  }
  isLearning(animal){
    const spec=SPECIES[animal?.species];
    if(!animal?.lineage||!spec)return false;
    const ratio=animal.age/Math.max(1,spec.maturity);
    return ratio>=.16&&ratio<1;
  }
  learningProfile(child){
    const spec=SPECIES[child?.species];
    if(!child||!spec||!child.lineage)return null;
    const ratio=Math.max(0,child.age/Math.max(1,spec.maturity));
    const lessons=child.learningLessons||{water:0,food:0,shelter:0,danger:0};
    const domains=['water','food','shelter','danger'];
    const mastered=domains.filter(k=>(lessons[k]||0)>0).length;
    const practiced=domains.filter(k=>(lessons[k]||0)>1).length;
    const repetition=domains.reduce((n,k)=>n+Math.min(3,lessons[k]||0),0)/12;
    const ageFactor=clamp01((ratio-.16)/.84);
    const coverage=mastered/4;
    const stress=Math.max(0,Math.min(1,child.careStress??0));
    const independence=clamp01(ageFactor*.55+coverage*.28+repetition*.17-stress*.10);
    const label=ratio<.18?'newborn':independence<.28?'shadowing':independence<.55?'learning':independence<.78?'practicing':'independent';
    const next=domains.find(k=>(lessons[k]||0)===0)||domains.sort((a,b)=>(lessons[a]||0)-(lessons[b]||0))[0];
    return{ratio,lessons:{...lessons},mastered,practiced,repetition,independence,label,next,complete:mastered===4};
  }
  lessonFresh(memory,maxDays=16){
    if(!memory)return false;
    return Math.max(0,(this.sim.tickCount-(memory.lastSeenTick??0))/CFG.dayTicks)<=maxDays;
  }
  teachLesson(child,type,memory,text){
    if(!child||!this.isLearning(child))return false;
    child.learningLessons??={water:0,food:0,shelter:0,danger:0};
    child.learningMemory??={water:null,food:null,shelter:null,danger:null};
    child.learningLessonDays??={};
    const key=`${type}:${this.sim.year}:${this.sim.day}`;
    child.learningMemory[type]={...memory,lastSeenTick:this.sim.tickCount};
    const state=this.sim.cognition?.ensure?.(child);
    if(state){
      if(type==='water')state.water={...memory,lastSeenTick:this.sim.tickCount};
      else if(type==='food')state.food={...memory,lastSeenTick:this.sim.tickCount};
      else if(type==='danger')state.threat={...memory,lastSeenTick:this.sim.tickCount};
    }
    if(child.learningLessonDays[key])return false;
    child.learningLessonDays[key]=true;
    child.learningLessons[type]=Math.min(3,(child.learningLessons[type]||0)+1);
    const count=child.learningLessons[type];
    this.sim.cognition?.record(child,'family-lesson',`${text}${count>1?` · practiced ${count}×`:''}`,{lesson:type,count});
    this.pushEvent({type:'lesson',lesson:type,animalId:child.id,caregiverId:child.caregiverId,generation:child.generation});
    return true;
  }
  observeLearning(child,caregiver,status=null){
    if(!this.isLearning(child)||!caregiver?.alive)return;
    const profile=this.learningProfile(child),distance=Math.hypot(child.x-caregiver.x,child.y-caregiver.y),dangerLesson=profile?.next==='danger';
    if(distance>(dangerLesson?5.8:3.4))return;
    const action=caregiver.player&&this.sim.lastPlayerAction&&this.sim.tickCount-(this.sim.lastPlayerAction.tick||0)<=CFG.simHz*2?this.sim.lastPlayerAction:null;
    const waterDemo=(caregiver.intent==='drink'||action?.type==='drink')&&this.sim.world.isDrinkable(caregiver.x,caregiver.y);
    // v1.33: every place a caregiver uses with the young beside it is passed on (imperfectly), not only the first lesson.
    if(waterDemo){this.sim.cognition?.teachPlace?.(child,'water',caregiver.x,caregiver.y);this.teachLesson(child,'water',{x:caregiver.x,y:caregiver.y,value:1},`Learned a water place from caregiver #${caregiver.id}`)}
    let foodKind=null,foodX=caregiver.x,foodY=caregiver.y;
    if((isFeedingIntent(caregiver.intent))&&caregiver.target?.kind){foodKind=caregiver.target.kind;foodX=caregiver.target.x;foodY=caregiver.target.y}
    else if(action?.type==='eat'&&action.kind){foodKind=action.kind}
    if(foodKind){this.sim.foraging?.teachPatch?.(child,caregiver,foodKind,foodX,foodY);this.teachLesson(child,'food',{x:foodX,y:foodY,kind:foodKind,value:1},`Learned ${foodLabel(foodKind)} feeding from caregiver #${caregiver.id}`)}
    // v1.33.2: a caregiver wary near a place it fears passes the fear on.
    for(const fear of this.sim.cognition?.knownPlaces?.(caregiver,'danger')||[])if(Math.hypot(caregiver.x-fear.x,caregiver.y-fear.y)<=6)this.sim.cognition.teachPlace(child,'danger',fear.x,fear.y,{cause:fear.cause});
    const shelter=this.sim.shelter?.nearest(child,{radius:2.0,familyOnly:true})||null;
    if(shelter&&Math.hypot(caregiver.x-shelter.x,caregiver.y-shelter.y)<=2.1)this.sim.cognition?.teachPlace?.(child,'shelter',shelter.x,shelter.y,{shelterId:shelter.id});if(shelter&&Math.hypot(caregiver.x-shelter.x,caregiver.y-shelter.y)<=2.1)this.teachLesson(child,'shelter',{x:shelter.x,y:shelter.y,shelterId:shelter.id},`Learned the family shelter from caregiver #${caregiver.id}`);
    let engagedThreat=null,engagedDistance=8.5;
    if(caregiver.player){for(const b of this.sim.animals){if(!b.alive||!canHunt(b)||b.playerHunt?.targetId!==caregiver.id)continue;const d=Math.hypot(b.x-caregiver.x,b.y-caregiver.y);if(d<engagedDistance){engagedThreat=b;engagedDistance=d}}}
    const threat=engagedThreat||status?.threat||this.sim.findNearest(child,b=>b.alive&&canHunt(b)&&preyPreference(b,child)>0,6.2)||this.sim.findNearest(caregiver,b=>b.alive&&canHunt(b)&&preyPreference(b,child)>0,8.5);
    let fleeing=false;
    if(threat&&caregiver.player&&caregiver.intent==='player'&&caregiver.target){
      const {dx=0,dy=0,sprint=false}=caregiver.target,moveLen=Math.hypot(dx,dy),awayX=caregiver.x-threat.x,awayY=caregiver.y-threat.y,awayLen=Math.hypot(awayX,awayY);
      if(moveLen>.01&&awayLen>.01){const awayDot=(dx*awayX+dy*awayY)/(moveLen*awayLen),engaged=threat.playerHunt?.targetId===caregiver.id||action?.type==='danger-engaged';fleeing=awayDot>.35&&awayLen<=8.5&&(!!sprint||engaged)}
    }
    const dangerResponse=['escape','group-alarm','guard','mob','return-den'].includes(caregiver.intent)||['fight','alarm','rally'].includes(action?.type)||fleeing;
    if(threat&&dangerResponse){this.sim.habits?.reinforce?.(child,fleeing||['escape','return-den'].includes(caregiver.intent)?'caution':'boldness',.06,{scale:1});const verb=fleeing?'escape from':'respond to';this.teachLesson(child,'danger',{x:threat.x,y:threat.y,species:threat.species,id:threat.id,response:fleeing?'flee':'defend'},`Learned to ${verb} ${SPECIES[threat.species]?.label||threat.species} danger from caregiver #${caregiver.id}`)}
  }
  practiceProfile(child){
    if(!child?.lineage)return null;
    const learning=this.learningProfile(child);if(!learning)return null;
    const stats=child.practiceStats||{water:{attempts:0,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};
    const water=stats.water?.successes||0,food=stats.food?.successes||0,completed=stats.completed||0,returns=stats.returns||0,recoveries=stats.recoveries||0,aborts=stats.aborts||0;
    const routeCoverage=(Math.min(1,water)+Math.min(1,food)+Math.min(1,returns/2))/3;
    const readiness=clamp01(learning.independence*.62+routeCoverage*.38-Math.min(.12,aborts*.025));
    const ready=!!(learning.complete&&learning.independence>=.68&&water>=1&&food>=1&&returns>=2);
    const run=child.practiceRun||null;
    let label=ready?'field-ready':completed?'practicing':'unpracticed';
    if(run)label=run.phase==='return'?'returning from practice':`practicing ${run.type}`;
    return{learning,water,food,completed,returns,recoveries,aborts,readiness,ready,run,label};
  }
  practiceHome(child){
    const shelter=this.sim.shelter?.nearest(child,{radius:Infinity,familyOnly:true})||null;
    if(shelter)return{x:shelter.x,y:shelter.y,shelterId:shelter.id,kind:'shelter'};
    const caregiver=this.caregiver(child);return caregiver?{x:caregiver.x,y:caregiver.y,caregiverId:caregiver.id,kind:'caregiver'}:null;
  }
  practiceAbort(child,reason='route failed'){
    const run=child?.practiceRun;if(!run||run.phase==='return')return false;
    run.phase='return';run.aborted=true;run.abortReason=reason;
    child.practiceStats??={water:{attempts:0,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};
    child.practiceStats.aborts=(child.practiceStats.aborts||0)+1;
    this.sim.cognition?.record(child,'practice-abort',`Solo practice aborted · ${reason}`,{practice:run.type});
    return true;
  }
  notePracticeInteraction(child,type,receipt=null){
    const run=child?.practiceRun;if(!run||run.phase!=='outbound'||run.type!==type||run.outboundSuccess)return false;
    const x=receipt?.x??child.x,y=receipt?.y??child.y;
    if(type==='water'&&Math.hypot(x-run.target.x,y-run.target.y)>1.1)return false;
    if(type==='food'&&(receipt?.kind!==run.target.kind||this.sim.world.idx(x,y)!==this.sim.world.idx(run.target.foodX??run.target.x,run.target.foodY??run.target.y)))return false;
    if(!(receipt?.amount>0))return false;
    run.outboundSuccess=true;run.phase='return';run.reachedTick=this.sim.tickCount;
    child.practiceStats??={water:{attempts:0,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};
    const bucket=child.practiceStats[type]||(child.practiceStats[type]={attempts:0,successes:0});bucket.successes=(bucket.successes||0)+1;
    this.sim.cognition?.record(child,'practice-target',`Completed a solo ${type} stop · returning home`,{practice:type});
    return true;
  }
  practiceDecision(animal){
    if(!this.isLearning(animal)||this.sim.isManualPlayer?.(animal))return null;
    const learning=this.learningProfile(animal),spec=SPECIES[animal.species];if(!learning||learning.ratio<.55||!learning.complete)return null;
    animal.practiceStats??={water:{attempts:0,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};
    let run=animal.practiceRun;
    const home=this.practiceHome(animal);if(!home){animal.practiceRun=null;return null}
    if(run){
      const elapsed=this.sim.tickCount-(run.startedTick??this.sim.tickCount);
      if(run.phase==='outbound'&&elapsed>CFG.dayTicks*2)this.practiceAbort(animal,'the outing ran too long');
      run=animal.practiceRun;
      if(run.phase==='outbound'){
        const landscape=this.sim.stalkerTerritory?.landscapeAt?.(run.target.x,run.target.y,{animal})||{risk:0};
        if(landscape.risk>.62)this.practiceAbort(animal,'learned Stalker pressure made the route unsafe');
        else{const checked=learnedResourceTarget(this.sim,animal,run.type,{...run.target,x:run.target.foodX??run.target.x,y:run.target.foodY??run.target.y});if(!checked.enabled)this.practiceAbort(animal,checked.reason);else run.target={...checked.target,practice:true}}
      }
      run=animal.practiceRun;
      if(run?.phase==='return'){
        const d=Math.hypot(animal.x-home.x,animal.y-home.y);
        if(d<=1.65){
          const stats=animal.practiceStats;stats.returns=(stats.returns||0)+1;if(run.outboundSuccess)stats.completed=(stats.completed||0)+1;if(run.interrupted)stats.recoveries=(stats.recoveries||0)+1;
          const bits=[run.outboundSuccess?`${run.type} route complete`:'returned safely',run.interrupted?'recovered after danger':null,run.aborted?run.abortReason:null].filter(Boolean);
          this.sim.cognition?.record(animal,'practice-return',`Solo practice · ${bits.join(' · ')}`,{practice:run.type,recovered:!!run.interrupted});
          this.pushEvent({type:'practice',animalId:animal.id,generation:animal.generation,practice:run.type,recovered:!!run.interrupted,success:!!run.outboundSuccess});
          animal.practiceRun=null;animal.practiceCooldownUntil=this.sim.tickCount+CFG.dayTicks;return null;
        }
        return{intent:'practice-return',target:{...home,practice:true},lesson:'shelter'};
      }
      if(run?.phase==='outbound')return{intent:run.type==='water'?'drink':'feed',target:{...run.target,practice:true},lesson:run.type};
    }
    if((animal.practiceCooldownUntil||0)>this.sim.tickCount)return null;
    const e=animal.energy/spec.maxEnergy,h=animal.hydration/spec.maxHydration;if(e<.72||h<.72||(animal.careStress??0)>.42)return null;
    const threat=this.sim.findNearest(animal,b=>b.alive&&canHunt(b)&&preyPreference(b,animal)>0,8);if(threat)return null;
    const memory=animal.learningMemory||{},stats=animal.practiceStats;
    const candidates=[];
    for(const type of ['water','food'])if(this.lessonFresh(memory[type],20)){
      const checked=learnedResourceTarget(this.sim,animal,type,memory[type]);if(checked.enabled)candidates.push({type,target:checked.target});
    }
    const safe=candidates.filter(c=>(this.sim.stalkerTerritory?.landscapeAt?.(c.target.x,c.target.y,{animal})?.risk||0)<=.58);if(!safe.length)return null;
    const preference=(animal.id+this.sim.day)%2?['food','water']:['water','food'];safe.sort((a,b)=>((stats[a.type]?.successes||0)-(stats[b.type]?.successes||0))||(preference.indexOf(a.type)-preference.indexOf(b.type)));
    const pick=safe[0],bucket=stats[pick.type]||(stats[pick.type]={attempts:0,successes:0});bucket.attempts=(bucket.attempts||0)+1;
    animal.practiceRun={type:pick.type,phase:'outbound',target:{...pick.target},startedTick:this.sim.tickCount,startedDay:this.sim.day,outboundSuccess:false,interrupted:false,aborted:false};
    this.sim.cognition?.record(animal,'practice-start',`Started a solo ${pick.type} practice route`,{practice:pick.type});
    return{intent:pick.type==='water'?'drink':'feed',target:{...pick.target,practice:true},lesson:pick.type};
  }
  learningDecision(animal){
    if(!this.isLearning(animal)||this.sim.isManualPlayer?.(animal))return null;
    const profile=this.learningProfile(animal),caregiver=this.caregiver(animal),memory=animal.learningMemory||{};
    if(!profile||!caregiver)return null;
    const spec=SPECIES[animal.species],e=animal.energy/spec.maxEnergy,h=animal.hydration/spec.maxHydration;
    const d=Math.hypot(caregiver.x-animal.x,caregiver.y-animal.y),action=caregiver.player&&this.sim.lastPlayerAction&&this.sim.tickCount-(this.sim.lastPlayerAction.tick||0)<=CFG.simHz*2?this.sim.lastPlayerAction:null;
    if(d<=5.2&&profile.independence<.82){
      if((caregiver.intent==='drink'||action?.type==='drink')&&(profile.lessons.water||0)<2)return{intent:'learn-water',target:{x:caregiver.x,y:caregiver.y},lesson:'water'};
      if((isFeedingIntent(caregiver.intent)||action?.type==='eat')&&(profile.lessons.food||0)<2)return{intent:'learn-food',target:{x:caregiver.x,y:caregiver.y},lesson:'food'};
      const shelter=this.sim.shelter?.nearest(caregiver,{radius:2.0,familyOnly:true});
      if(shelter&&(profile.lessons.shelter||0)<2)return{intent:'learn-shelter',target:{x:caregiver.x,y:caregiver.y},lesson:'shelter'};
    }
    if(h<.58&&this.lessonFresh(memory.water)&&profile.independence>=.24){const checked=learnedResourceTarget(this.sim,animal,'water',memory.water);if(checked.enabled)return{intent:'drink',target:checked.target,lesson:'water'}}
    if(e<.66&&this.lessonFresh(memory.food)&&profile.independence>=.30){
      const checked=learnedResourceTarget(this.sim,animal,'food',memory.food);if(checked.enabled)return{intent:'feed',target:checked.target,lesson:'food'};
    }
    if((animal.careStress??0)>.55&&this.lessonFresh(memory.shelter,24)&&profile.independence>=.22)return{intent:'shelter',target:{x:memory.shelter.x,y:memory.shelter.y,learned:true},lesson:'shelter'};
    return null;
  }
  tendProvision(parent,child){
    const status=this.careStatus(child,parent),childSpec=SPECIES[child.species],parentSpec=SPECIES[parent.species];
    const shelter=this.sim.shelter?.nearest(child,{radius:1.8,familyOnly:true})||null;
    const mouth=mouthScale(child),fromShelter=status.energy<.78?Math.max(0,Math.min(4.2*1.08*mouth,shelter?.foodStore||0,toAbsolute(child,childSpec.maxEnergy*.80-child.energy))):0;
    const fromParent=status.energy<.78?Math.max(0,Math.min(5.2*1.34*mouth,toAbsolute(parent,parent.energy-parentSpec.maxEnergy*.46),toAbsolute(child,childSpec.maxEnergy*.74-child.energy)-fromShelter)):0;
    const water=status.hydration<.62?Math.max(0,Math.min(3.2*1.28*mouth,toAbsolute(parent,parent.hydration-parentSpec.maxHydration*.48),toAbsolute(child,childSpec.maxHydration-child.hydration))):0;
    return{shelter,fromShelter,fromParent,water};
  }
  tendAvailability(parent,child){
    if(parent?.underground||child?.underground||parent?.burrowWork||parent?.caveTransit||child?.burrowWork||child?.caveTransit||parent?.climb||child?.climb)return{enabled:false,state:'unavailable',reason:'Finish climbing before tending.'};
    if((parent?.diveDepth||0)>.03||(child?.diveDepth||0)>.03)return{enabled:false,state:'unavailable',reason:'Surface with your young before tending.'};
    if(!parent?.alive||!child?.alive||!this.careStatus(child,parent)||!child.parentIds?.includes(parent.id))return{enabled:false,state:'unavailable',reason:'Only dependent young of this caregiver can be tended.'};
    const provision=this.tendProvision(parent,child),nursing=milkEligible(parent,child),canFeed=provision.fromShelter+provision.fromParent>0,label=nursing?'Nurse':canFeed?'Feed':'Tend';
    if((child.careCooldownUntil||0)>this.sim.tickCount)return{enabled:false,state:'unavailable',label,reason:'Your young is settled for the moment.'};
    if(Math.hypot(child.x-parent.x,child.y-parent.y)>1.75)return{enabled:false,state:'approachable',label,reason:'Move closer to your young.'};
    return{enabled:true,state:'available',label,reason:nursing?'Nurse your live-born young. Milk uses food energy and water from your actual reserves.':canFeed?'Share available food and settle your young.':provision.water>0?'Share surplus water and settle your young.':'No surplus food or water to share; check and settle your young.'};
  }
  tend(parent,child=null){
    if(!parent?.alive)return{ok:false,type:'care',message:'No active caregiver.'};
    const target=child?{child,status:this.careStatus(child,parent),distance:Math.hypot(child.x-parent.x,child.y-parent.y)}:this.careTarget(parent,{radius:1.7,urgentOnly:true});
    if(!target?.child||!target.status||!target.child.parentIds?.includes(parent.id))return{ok:false,type:'care',message:'No young need tending nearby.'};
    const available=this.tendAvailability(parent,target.child);if(!available.enabled)return{ok:false,type:'care',message:available.reason};const young=target.child,status=target.status;
    const nursing=milkEligible(parent,young)?transferMilk(parent,young,{maximum:2}):null;
    if(nursing?.ok){young.lastMilkTick=this.sim.tickCount;young.careStress=Math.max(0,(young.careStress??0)-.36);young.careTendedCount=(young.careTendedCount||0)+1;young.lastTendedDay=this.sim.day;young.careCooldownUntil=this.sim.tickCount+CFG.simHz*1.5;this.pushEvent({type:'milk-fed',animalId:young.id,caregiverId:parent.id,energy:nursing.fed});return{ok:true,type:'nursing',child:young,fed:nursing.fed,shared:0,message:'Nursed your young from your food and water reserves.'}}
    // A milk-dependent infant never receives an extra generic energy handout
    // from the same mother when nursing cannot be funded. Affectionate care
    // can still soothe the child, and other caregivers may provision food.
    const provision=this.tendProvision(parent,young);if(milkEligible(parent,young)){provision.fromParent=0;provision.water=0}
    const fromShelter=provision.fromShelter,fed=fromShelter+provision.fromParent,shared=provision.water;
    if(fromShelter>0){provision.shelter.foodStore-=fromShelter;provision.shelter.lastUsedTick=this.sim.tickCount}
    parent.energy-=toReserve(parent,provision.fromParent);young.energy+=toReserve(young,fed);parent.hydration-=toReserve(parent,shared);young.hydration+=toReserve(young,shared);
    const before=young.careStress??0;young.careStress=Math.max(0,before-.36);young.careTendedCount=(young.careTendedCount||0)+1;young.lastTendedDay=this.sim.day;
    young.careCooldownUntil=this.sim.tickCount+CFG.simHz*1.5;
    parent.energy=Math.max(0,parent.energy-.55);
    const dev=developmentFor(young),bits=[];
    if(fromShelter>0)bits.push('fed from shelter');else if(fed>0)bits.push('fed');
    if(shared>0)bits.push('shared water');
    if(before-young.careStress>.08)bits.push('settled');
    if(!bits.length)bits.push('checked and reassured');
    this.sim.cognition?.recordOnce(parent,`care:${young.id}:${this.sim.day}`,`Tended G${young.generation} ${dev.stage} #${young.id}`,{childId:young.id});
    this.pushEvent({type:'care',animalId:young.id,caregiverId:parent.id,generation:young.generation});
    return{ok:true,type:'care',child:young,fed,shared,fromShelter,message:`Tended G${young.generation} ${dev.stage} · ${bits.join(' · ')}.`};
  }
  phaseCare(){
    for(const child of this.sim.animals){
      if(!child.alive)continue;
      const dependent=this.isDependent(child),learning=this.isLearning(child);
      if(!dependent&&!learning)continue;
      const care=this.careProfile(child);
      const caregiver=this.caregiver(child);
      if(child.practiceRun){const practiceThreat=this.sim.findNearest(child,b=>b.alive&&canHunt(b)&&preyPreference(b,child)>0,5.5);if(practiceThreat){child.practiceRun.interrupted=true;child.practiceRun.threatSpecies=practiceThreat.species;if(child.practiceRun.phase==='outbound')child.practiceRun.phase='return'}}
      if(!care||!caregiver)continue;
      const status=dependent?this.careStatus(child,caregiver):null;
      this.observeLearning(child,caregiver,status);
      if(!dependent)continue;
      if(status){
        let delta=0;
        if(status.threat&&status.threatDistance<4.8)delta+=.018;
        if(status.separated)delta+=.010;
        if(status.energy<.48)delta+=.007;
        if(status.hydration<.42)delta+=.007;
        if(status.sheltered)delta-=.008;
        if(status.distance<=(care.nurseRadius??1.6))delta-=.006;
        child.careStress=Math.max(0,Math.min(1,(child.careStress??0)+delta));
        child.careStressTotal=(child.careStressTotal||0)+child.careStress;
        child.careStressSamples=(child.careStressSamples||0)+1;
        if(child.careStress>.68)child.careHighStressSamples=(child.careHighStressSamples||0)+1;
        if(status.threat&&status.threatDistance<4.8&&child.lastCareThreatDay!==this.sim.day){child.lastCareThreatDay=this.sim.day;child.careThreatDays=(child.careThreatDays||0)+1}
        if(child.careStress>.84)child.health-=.025;
      }
      if(caregiver.underground||child.underground||caregiver.burrowWork||caregiver.caveTransit||child.burrowWork||child.caveTransit)continue;
      const d=Math.hypot(caregiver.x-child.x,caregiver.y-child.y);
      if(d>(care.nurseRadius??1.6))continue;
      // Mammalian newborns require the *birth parent* for milk. A nearby
      // substitute caregiver can still share ordinary food, not synthesize milk.
      const lactating=this.sim.animals.find(a=>a.id===child.lactationParentId&&a.alive)||null;
      if(child.lactationParentId!=null&&child.age< SPECIES[child.species].maturity*MAMMAL.weaningFraction){
        if(!milkEligible(lactating,child))continue;
        if(caregiver.id!==lactating.id)continue;
        const milk=transferMilk(caregiver,child);if(milk.ok)child.lastMilkTick=this.sim.tickCount;
        const cell=this.sim.world.idx(child.x,child.y),temp=this.sim.world.temperature[cell];
        const climateOption=this.sim.world.environment?.youngClimatePolicy===YOUNG_CLIMATE.policy
          ?{comfort:.55*child.genes.climate}:undefined;
        if(motherWarmth(caregiver,child,temp,climateOption))child.lastMaternalWarmthTick=this.sim.tickCount;
        continue;
      }
      const childSpec=SPECIES[child.species],parentSpec=SPECIES[caregiver.species],independence=this.learningProfile(child)?.independence??0;
      const nurseTarget=(care.nurseTarget??.78)-independence*.14;
      const need=Math.max(0,childSpec.maxEnergy*nurseTarget-child.energy);
      const waterNeed=Math.max(0,childSpec.maxHydration*nurseTarget-child.hydration);
      if(need<=0&&waterNeed<=0)continue;
      const rate=(care.nurseRate??.055)*(1-independence*.68)*Math.max(0,care.nurseEfficiency??1.35);
      if(need>0&&caregiver.energy>=parentSpec.maxEnergy*(care.parentReserve??.48)){
        const amount=Math.min(toAbsolute(child,need),rate*mouthScale(child),toAbsolute(caregiver,Math.max(0,caregiver.energy-parentSpec.maxEnergy*(care.parentReserve??.48))));
        if(amount>0){child.energy=Math.min(childSpec.maxEnergy,child.energy+toReserve(child,amount));caregiver.energy-=toReserve(caregiver,amount);}
      }
      if(waterNeed>0&&caregiver.hydration>=parentSpec.maxHydration*(care.parentReserve??.48)){
        const waterAmount=Math.min(toAbsolute(child,waterNeed),rate*mouthScale(child),toAbsolute(caregiver,Math.max(0,caregiver.hydration-parentSpec.maxHydration*(care.parentReserve??.48))));
        if(waterAmount>0){child.hydration=Math.min(childSpec.maxHydration,child.hydration+toReserve(child,waterAmount));caregiver.hydration-=toReserve(caregiver,waterAmount);}
      }
    }
  }
  upbringingSummary(child){
    if(!child)return'';
    const samples=child.careStressSamples||0,avg=samples?(child.careStressTotal||0)/samples:(child.careStress??0);
    const high=samples?(child.careHighStressSamples||0)/samples:0;
    const quality=avg<.24&&high<.08?'thriving':avg<.48&&high<.28?'steady':'strained';
    const tended=child.careTendedCount||0,threatDays=child.careThreatDays||0;
    const learning=this.learningProfile(child),learned=learning?`${learning.mastered}/4 lessons · ${Math.round(learning.independence*100)}% independent`:'';
    const practice=this.practiceProfile(child),practiced=practice&&practice.completed?`${practice.completed} solo route${practice.completed===1?'':'s'}${practice.recoveries?` · ${practice.recoveries} threat recover${practice.recoveries===1?'y':'ies'}`:''}`:practice&&practice.ready?'field-ready':'';
    const detail=[`${quality} upbringing`,tended?`tended ${tended}×`:'mostly self-settled',threatDays?`${threatDays} danger day${threatDays===1?'':'s'}`:'little direct danger',learned,practiced].filter(Boolean);
    return detail.join(' · ');
  }
  pregnancyProgress(animal){
    if(!animal?.pregnant)return null;
    const total=animal.pregnant.totalDays??SPECIES[animal.species]?.gestation??animal.pregnant.days;
    const remaining=Math.max(0,animal.pregnant.days);
    return {remaining,total,progress:Math.max(0,Math.min(1,1-remaining/Math.max(1,total)))};
  }
}

export function developmentFor(animal){
  const s=SPECIES[animal?.species];
  if(!animal||!s)return{stage:'unknown',growth:1,maturity:1};
  const maturity=Math.max(1,s.maturity),ratio=Math.max(0,animal.age/maturity);
  if(ratio<.18)return{stage:'newborn',growth:.55+.11*(ratio/.18),maturity:ratio};
  if(ratio<.55)return{stage:'juvenile',growth:.66+.18*((ratio-.18)/.37),maturity:ratio};
  if(ratio<1)return{stage:'adolescent',growth:.84+.16*((ratio-.55)/.45),maturity:ratio};
  if(animal.age>s.lifespan*.78)return{stage:'elder',growth:1,maturity:ratio};
  return{stage:'adult',growth:1,maturity:ratio};
}

function clamp01(v){return Math.max(0,Math.min(1,v))}
function foodLabel(kind){return kind==='carrion'?'carrion':({sunmoss:'Moss',bramble:'Berries',marshroot:'Reeds',rotcap:'Mushrooms',thistlepod:'Seed Pods'}[kind]||kind)}
