import {SPECIES} from '../organisms/species.js';
import {CFG} from '../sim/config.js';

const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
const AFTERMATH_TICKS=CFG.dayTicks*1.5;

// Founder-line family weather behavior. This controller reads the already-authoritative
// climate + shelter state and only alters live player-run family decisions. It never
// rolls weather, consumes simulation RNG, or creates background-ecology exposure state.
export class FamilyWeatherController{
  constructor(sim){this.sim=sim;this.episode=null;this.lastRefuge=null;this.aftermath=null;this.interrupted=new Map()}
  enabled(){return !!this.sim.playerEnabled}
  conditions(){
    const climate=this.sim.climate||{temp:.55,rain:0},rainRaw=clamp01(climate.rain),temp=clamp01(climate.temp);
    const rain=clamp01((rainRaw-.42)/.38),cold=clamp01((.48-temp)/.22),heat=clamp01((temp-.75)/.16);
    const storm=clamp01(rain*(.58+.42*Math.max(cold,heat)));
    const thermal=Math.max(cold*.58,heat*.66),pressure=Math.max(storm,thermal);
    const active=pressure>=.48&&(rainRaw>=.58||heat>=.62||cold>=.70);
    const severe=pressure>=.66;
    const label=heat>=.58?'heat':cold>=.46&&rainRaw>=.58?'cold rain':rainRaw>=.72?'heavy rain':cold>=.64?'cold':'rough weather';
    return{temp,rainRaw,rain,cold,heat,storm,pressure,active,severe,label};
  }
  shelterFor(animal,{radius=22}={}){
    if(!animal?.alive||!animal.lineage)return null;
    return this.sim.shelter?.nearest?.(animal,{radius,familyOnly:true})||null;
  }
  familyAt(shelter,{radius=18}={}){
    if(!this.enabled()||!shelter)return[];
    return this.sim.animals.filter(a=>a.alive&&a.species==='genvo'&&a.lineage&&this.sim.shelter.familyCanUse(a,shelter)&&Math.hypot(a.x-shelter.x,a.y-shelter.y)<=radius);
  }
  shouldRefuge(animal,shelter,conditions=this.conditions()){
    if(!this.enabled()||!conditions.active||!animal?.alive||this.sim.isManualPlayer?.(animal)||!animal.lineage||animal.species!=='genvo'||!shelter)return false;
    const spec=SPECIES[animal.species],e=animal.energy/spec.maxEnergy,h=animal.hydration/spec.maxHydration,d=Math.hypot(animal.x-shelter.x,animal.y-shelter.y);
    if(d>22)return false;
    // Immediate hydration remains more important than weather refuge unless the animal
    // is dependent and already close enough to the family shelter to regroup safely.
    if(h<.34&&!this.sim.family.isDependent(animal))return false;
    if(e<.27&&shelter.foodStore<=.2&&!this.sim.family.isDependent(animal))return false;
    const dependent=this.sim.family.isDependent(animal),learning=this.sim.family.isLearning(animal);
    const hasDependent=this.sim.family.livingChildren(animal,{dependentOnly:true}).some(c=>Math.hypot(c.x-shelter.x,c.y-shelter.y)<=22);
    if(dependent||learning||hasDependent)return true;
    return conditions.severe&&d<=15;
  }
  rememberInterrupted(animal){
    if(!animal?.alive||this.interrupted.has(animal.id))return;
    if(animal.practiceRun?.phase==='outbound'){
      this.interrupted.set(animal.id,{kind:'practice',run:{...animal.practiceRun,target:animal.practiceRun.target?{...animal.practiceRun.target}:null},recordedTick:this.sim.tickCount});
      return;
    }
    const resumable=new Set(['learn-water','learn-food','learn-shelter','provision-food','migrate','social','follow']);
    if(resumable.has(animal.intent)&&animal.target?.x!=null&&animal.target?.y!=null)this.interrupted.set(animal.id,{kind:'intent',intent:animal.intent,target:{...animal.target},recordedTick:this.sim.tickCount});
  }
  decision(animal){
    if(!this.enabled()||!animal?.lineage||this.sim.isManualPlayer?.(animal))return null;
    const conditions=this.conditions();
    if(!conditions.active){this.resumeInterrupted(animal);return null}
    const shelter=this.shelterFor(animal,{radius:22});if(!shelter||!this.shouldRefuge(animal,shelter,conditions))return null;
    this.rememberInterrupted(animal);
    if(animal.practiceRun?.phase==='outbound')this.sim.family.practiceAbort(animal,'rough weather ended the outing');
    const d=Math.hypot(animal.x-shelter.x,animal.y-shelter.y),inside=d<=1.6;
    return{intent:inside?'storm-refuge':'storm-shelter',target:{x:shelter.x,y:shelter.y,shelterId:shelter.id,weatherRefuge:true},shelter,conditions,inside};
  }
  resumeInterrupted(animal){
    const aftermath=this.aftermathStatus();if(!aftermath)return false;
    const saved=this.interrupted.get(animal.id);if(!saved)return false;
    if(saved.kind==='practice'){
      const run=saved.run;if(!run?.target){this.interrupted.delete(animal.id);return false}
      animal.practiceRun={...run,target:{...run.target},phase:'outbound',startedTick:this.sim.tickCount,startedDay:this.sim.day,outboundSuccess:false,interrupted:false,aborted:false,abortReason:null,resumedAfterStorm:true};
      animal.practiceCooldownUntil=0;this.interrupted.delete(animal.id);this.aftermath.resumedIds.add(animal.id);
      this.sim.cognition?.recordOnce?.(animal,`storm-resume:${this.sim.year}:${this.sim.day}:${run.type}`,`Resumed a solo ${run.type} route after sheltering`,{practice:run.type});
      return true;
    }
    // Other low-priority behavior is allowed to be recalculated naturally after the storm.
    // Retaining the record is useful for the aftermath summary, but do not force a stale target.
    this.interrupted.delete(animal.id);this.aftermath.resumedIds.add(animal.id);return true;
  }
  beginAftermath(episode){
    const shelter=this.sim.shelter?.shelters?.find?.(s=>s.id===episode.shelterId)||null;
    const family=shelter?this.familyAt(shelter):[];
    const checkIds=family.filter(a=>this.sim.family.isDependent(a)).map(a=>a.id);
    this.aftermath={shelterId:episode.shelterId,startedTick:this.sim.tickCount,endedTick:this.sim.tickCount,untilTick:this.sim.tickCount+AFTERMATH_TICKS,peakRain:episode.peakRain||0,peakPressure:episode.peakPressure||0,label:episode.label||'rough weather',checkIds:new Set(checkIds),checkedIds:new Set(),resumedIds:new Set(),familyIds:new Set(family.map(a=>a.id)),recorded:false};
    if(checkIds.length||this.interrupted.size){const p=this.sim.player();if(p)this.sim.cognition?.recordOnce?.(p,`storm-passed:${episode.shelterId}:${this.sim.year}:${this.sim.day}`,'Storm passed; family regrouped before ranging out again',{shelterId:episode.shelterId,young:checkIds.length,interrupted:this.interrupted.size})}
  }
  aftermathStatus(animal=this.sim.player()){
    if(!this.enabled()||!this.aftermath)return null;
    if(this.sim.tickCount>this.aftermath.untilTick){this.aftermath=null;this.interrupted.clear();return null}
    const a=this.aftermath,shelter=this.sim.shelter?.shelters?.find?.(s=>s.id===a.shelterId)||null;if(!shelter)return null;
    const pending=[...a.checkIds].map(id=>this.sim.animals.find(x=>x.id===id&&x.alive)).filter(Boolean).filter(x=>!a.checkedIds.has(x.id));
    const family=this.familyAt(shelter),resumed=family.filter(x=>a.resumedIds.has(x.id));
    return{active:true,shelter,pending,pendingCount:pending.length,checkedCount:a.checkedIds.size,resumed,resumedCount:resumed.length,peakRain:a.peakRain,peakPressure:a.peakPressure,label:a.label,ageTicks:this.sim.tickCount-a.startedTick,remainingTicks:a.untilTick-this.sim.tickCount,recentRain:a.peakRain>=.58,animalDistance:animal?Math.hypot(animal.x-shelter.x,animal.y-shelter.y):Infinity};
  }
  aftercareTarget(parent,{radius=1.8}={}){
    const a=this.aftermathStatus(parent);if(!a||!parent)return null;let best=null,bestD=Infinity;
    for(const child of a.pending){if(!child.parentIds?.includes(parent.id)&&child.caregiverId!==parent.id)continue;const d=Math.hypot(child.x-parent.x,child.y-parent.y);if(d<=radius&&d<bestD){bestD=d;best=child}}
    return best?{child:best,distance:bestD}:null;
  }
  checkAfterStorm(parent,child){
    const view=this.aftermathStatus(parent),a=this.aftermath;if(!view||!a||!child?.alive||!a.checkIds.has(child.id)||a.checkedIds.has(child.id))return{ok:false,type:'storm-check',message:'No young need a post-storm check.'};
    if(Math.hypot(parent.x-child.x,parent.y-child.y)>1.8)return{ok:false,type:'storm-check',message:'Move closer to your young.'};
    const before=child.careStress??0;child.careStress=Math.max(0,before-.14);a.checkedIds.add(child.id);this.sim.cognition?.record(parent,'storm-aftercare',`Checked G${child.generation} young after the storm`,{childId:child.id});this.sim.family?.pushEvent?.({type:'weather-aftercare',animalId:child.id,caregiverId:parent.id,shelterId:view.shelter.id});
    return{ok:true,type:'storm-check',child,message:`Checked G${child.generation} young after the storm · settled.`};
  }
  postRainBoost(kind){
    const a=this.aftermathStatus();if(!a?.recentRain)return 0;
    const age=clamp01(1-a.ageTicks/AFTERMATH_TICKS),base=kind==='marshroot'?.24:kind==='rotcap'?.18:kind==='bramble'?.07:kind==='sunmoss'?.05:0;
    return base*age;
  }
  phase(){
    if(!this.enabled()){this.episode=null;this.aftermath=null;this.interrupted.clear();return null}
    const conditions=this.conditions(),player=this.sim.player();
    if(!player||!conditions.active){
      if(this.episode){this.lastRefuge={...this.episode,endedTick:this.sim.tickCount};this.beginAftermath(this.episode);this.episode=null}
      else this.aftermathStatus(player);
      return null
    }
    this.aftermath=null;
    const shelter=this.sim.shelter?.nearest?.(player,{radius:Infinity,familyOnly:true})||null;if(!shelter)return null;
    const family=this.familyAt(shelter),inside=family.filter(a=>Math.hypot(a.x-shelter.x,a.y-shelter.y)<=1.7),youngInside=inside.filter(a=>this.sim.family.isDependent(a));
    if(!this.episode||this.episode.shelterId!==shelter.id){this.episode={shelterId:shelter.id,startedTick:this.sim.tickCount,startedDay:this.sim.day,recorded:false,peakInside:0,peakFamily:family.length,peakRain:0,peakPressure:0,label:conditions.label}}
    this.episode.peakInside=Math.max(this.episode.peakInside,inside.length);this.episode.peakFamily=Math.max(this.episode.peakFamily,family.length);this.episode.peakRain=Math.max(this.episode.peakRain,conditions.rainRaw);this.episode.peakPressure=Math.max(this.episode.peakPressure,conditions.pressure);this.episode.label=conditions.label;
    const gathered=inside.length>=Math.min(family.length,Math.max(2,youngInside.length?2:3));
    if(gathered&&!this.episode.recorded){
      this.episode.recorded=true;this.episode.gatheredTick=this.sim.tickCount;
      this.sim.cognition?.recordOnce?.(player,`storm-refuge:${shelter.id}:${this.sim.year}:${this.sim.day}`,'Family gathered at shelter during rough weather',{shelterId:shelter.id,family:family.length,inside:inside.length,label:conditions.label});
      this.sim.family?.pushEvent?.({type:'weather-refuge',animalId:player.id,shelterId:shelter.id,familyCount:family.length,insideCount:inside.length});
    }
    return this.snapshot(player,{conditions,shelter,family,inside});
  }
  snapshot(animal=this.sim.player(),preset=null){
    if(!this.enabled()||!animal)return null;
    const conditions=preset?.conditions||this.conditions();if(!conditions.active)return null;
    const shelter=preset?.shelter||this.sim.shelter?.nearest?.(animal,{radius:Infinity,familyOnly:true})||null;if(!shelter)return null;
    const family=preset?.family||this.familyAt(shelter),inside=preset?.inside||family.filter(a=>Math.hypot(a.x-shelter.x,a.y-shelter.y)<=1.7);
    const dependents=family.filter(a=>this.sim.family.isDependent(a)),dependentsInside=dependents.filter(a=>Math.hypot(a.x-shelter.x,a.y-shelter.y)<=1.7);
    const quality=this.sim.shelter.weatherQuality(shelter),label=this.sim.shelter.weatherLabel(shelter),distance=Math.hypot(animal.x-shelter.x,animal.y-shelter.y);
    const gathering=inside.length<family.length&&family.some(a=>a.id!==animal.id&&this.shouldRefuge(a,shelter,conditions)&&Math.hypot(a.x-shelter.x,a.y-shelter.y)>1.7);
    return{active:true,conditions,shelter,distance,quality,weatherLabel:label,familyCount:family.length,insideCount:inside.length,dependentCount:dependents.length,dependentInside:dependentsInside.length,gathering,gathered:family.length>0&&inside.length===family.length,episode:this.episode};
  }
}
