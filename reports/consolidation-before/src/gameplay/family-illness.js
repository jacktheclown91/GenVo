import {SPECIES} from '../organisms/species.js';
import {CFG} from '../sim/config.js';

const REGROUP_TICKS=Math.round(CFG.dayTicks*.65);
const CONTACT_BUFFER=3.15;

// Live founder-line response to Marsh fever. This controller changes only family
// positioning/care priorities; DiseaseController remains authoritative for infection,
// transmission, pathogen load, duration and immunity. No simulation RNG is consumed.
export class FamilyIllnessController{
  constructor(sim){this.sim=sim;this.aftermath=null;this.episode=null;this._familyTick=-1;this._familySize=-1;this._familyCache=[]}
  enabled(){return !!this.sim.playerEnabled}
  family(){
    const player=this.sim.player?.();
    if(this._familyTick===this.sim.tickCount&&this._familySize===this.sim.animals.length&&this._familyPlayer===player?.id)return this._familyCache;
    this._familyCache=this.sim.family.activeMembers(player);this._familyTick=this.sim.tickCount;this._familySize=this.sim.animals.length;this._familyPlayer=player?.id;return this._familyCache;
  }
  isFamilyAnimal(animal){return !!(animal?.alive&&this.family().some(a=>a.id===animal.id))}
  sickFamily(){return this.enabled()?this.family().filter(a=>a.infected&&a.infection):[]}
  susceptible(a){return !!(a?.alive&&!a.infected&&!this.sim.disease.isImmune(a))}
  nearestSick(animal,{radius=Infinity,exclude=null}={}){
    let best=null,bestD=radius;
    for(const sick of this.sickFamily()){
      if(sick.id===animal?.id||sick.id===exclude?.id)continue;
      const d=Math.hypot(sick.x-animal.x,sick.y-animal.y);if(d<bestD){best=sick;bestD=d}
    }
    return best?{animal:best,distance:bestD}:null;
  }
  healthyCarer(child){
    if(!child?.alive)return null;const choices=[],seen=new Set(),parents=new Set(child.parentIds||[]);
    for(const id of parents){const a=this.sim.animals.find(x=>x.id===id&&x.alive);if(a&&!a.infected){choices.push(a);seen.add(a.id)}}
    for(const a of this.family())if(a.id!==child.id&&a.age>=SPECIES[a.species].maturity&&!a.infected&&!seen.has(a.id)){choices.push(a);seen.add(a.id)}
    choices.sort((a,b)=>{const ai=this.sim.disease.isImmune(a)?0:1,bi=this.sim.disease.isImmune(b)?0:1;if(ai!==bi)return ai-bi;const ap=parents.has(a.id)?0:1,bp=parents.has(b.id)?0:1;if(ap!==bp)return ap-bp;return Math.hypot(a.x-child.x,a.y-child.y)-Math.hypot(b.x-child.x,b.y-child.y)});
    return choices[0]||null;
  }
  immuneSupporterFor(sick){
    if(!sick?.alive)return null;const parents=new Set(sick.parentIds||[]),choices=this.family().filter(a=>a.id!==sick.id&&a.alive&&a.age>=SPECIES[a.species].maturity&&!a.infected&&this.sim.disease.isImmune(a));
    choices.sort((a,b)=>{const ar=parents.has(a.id)||a.lastMate===sick.id||sick.lastMate===a.id?0:1,br=parents.has(b.id)||b.lastMate===sick.id||sick.lastMate===b.id?0:1;if(ar!==br)return ar-br;return Math.hypot(a.x-sick.x,a.y-sick.y)-Math.hypot(b.x-sick.x,b.y-sick.y)});
    return choices[0]||null;
  }
  supportPoint(animal,sick){
    const d=Math.hypot(animal.x-sick.x,animal.y-sick.y);if(d<=1.8)return{x:animal.x,y:animal.y,illnessImmuneSupport:true,animalId:sick.id};
    const ang=Math.atan2(animal.y-sick.y,animal.x-sick.x)||0,x=sick.x+Math.cos(ang)*1.55,y=sick.y+Math.sin(ang)*1.55,i=this.sim.world.idx(x,y);
    return !this.sim.world.water[i]&&this.sim.world.sameLand(animal.x,animal.y,x,y)?{x,y,illnessImmuneSupport:true,animalId:sick.id}:{x:animal.x,y:animal.y,illnessImmuneSupport:true,animalId:sick.id};
  }
  soleCaregiverOfSickOrHealthyYoung(animal){
    const deps=this.sim.family.livingChildren(animal,{dependentOnly:true});
    return deps.some(child=>{const others=(child.parentIds||[]).map(id=>this.sim.animals.find(a=>a.id===id&&a.alive&&a.id!==animal.id)).filter(Boolean);return !others.length})
  }
  safePoint(animal,sick,{distance=5.0}={}){
    const base=Math.atan2(animal.y-sick.y,animal.x-sick.x)||((animal.id%8)/8*Math.PI*2),offsets=[0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,3*Math.PI/4,-3*Math.PI/4,Math.PI];
    let best=null,bestScore=-Infinity;
    for(const r of [distance,distance+1,distance+2])for(const off of offsets){const x=animal.x+Math.cos(base+off)*r,y=animal.y+Math.sin(base+off)*r;if(x<=2||y<=2||x>=CFG.worldSize-2||y>=CFG.worldSize-2)continue;const i=this.sim.world.idx(x,y);if(this.sim.world.water[i]||!this.sim.world.sameLand(animal.x,animal.y,x,y))continue;const sickD=Math.hypot(x-sick.x,y-sick.y),cover=this.sim.coverAt?.({x,y})||0;const score=sickD+cover*.7-Math.abs(r-distance)*.12;if(score>bestScore){bestScore=score;best={x,y,illnessDistance:true}}}
    return best||{x:animal.x+(animal.x-sick.x),y:animal.y+(animal.y-sick.y),illnessDistance:true};
  }
  isolationPoint(animal){
    const family=this.family().filter(a=>a.id!==animal.id),offsets=[0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,Math.PI,3*Math.PI/4,-3*Math.PI/4];let best=null,bestScore=-Infinity;
    const start=((animal.id*3)%8)/8*Math.PI*2;
    for(const r of [4.5,5.5,6.5])for(const off of offsets){const x=animal.x+Math.cos(start+off)*r,y=animal.y+Math.sin(start+off)*r;if(x<=2||y<=2||x>=CFG.worldSize-2||y>=CFG.worldSize-2)continue;const i=this.sim.world.idx(x,y);if(this.sim.world.water[i]||!this.sim.world.sameLand(animal.x,animal.y,x,y))continue;const nearest=family.length?Math.min(...family.map(a=>Math.hypot(a.x-x,a.y-y))):9,cover=this.sim.coverAt?.({x,y})||0;const score=nearest+cover*2;if(score>bestScore){bestScore=score;best={x,y,illnessIsolation:true}}}
    return best;
  }
  decision(animal){
    if(!this.enabled()||!animal?.alive||this.sim.isManualPlayer?.(animal)||!this.isFamilyAnimal(animal))return null;
    // Positioning must leave the ordinary feeding/drinking decisions available.
    // Use their existing reserve thresholds; infection remains authoritative.
    const spec=SPECIES[animal.species];
    if(animal.energy/spec.maxEnergy<.72||animal.hydration/spec.maxHydration<.58)return null;
    const sick=this.sickFamily();
    if(!sick.length){const after=this.aftermathStatus();if(!after)return null;const anchor=after.shelter||after.recovered;if(!anchor)return null;const d=Math.hypot(animal.x-anchor.x,animal.y-anchor.y);if(d>2.5&&d<=13)return{intent:'illness-regroup',target:{x:anchor.x,y:anchor.y,illnessRegroup:true},after};return null}
    if(animal.infected){
      if(this.sim.family.isDependent(animal))return null;
      if(this.soleCaregiverOfSickOrHealthyYoung(animal))return null;
      const nearRisk=this.family().filter(a=>this.susceptible(a)&&Math.hypot(a.x-animal.x,a.y-animal.y)<3.4);if(!nearRisk.length)return null;
      const target=this.isolationPoint(animal);return target?{intent:'illness-isolate',target,sick:animal}:null;
    }
    const near=this.nearestSick(animal,{radius:7.0});if(!near)return null;const sickAnimal=near.animal;
    if(this.sim.disease.isImmune(animal)){
      if(this.sim.family.isDependent(sickAnimal)){const carer=this.healthyCarer(sickAnimal);if(carer?.id===animal.id)return{intent:'illness-immune-care',target:{x:sickAnimal.x,y:sickAnimal.y,animalId:sickAnimal.id,immuneCare:true},sick:sickAnimal}}
      else if(this.immuneSupporterFor(sickAnimal)?.id===animal.id)return{intent:'illness-immune-support',target:this.supportPoint(animal,sickAnimal),sick:sickAnimal};
      return null;
    }
    if(!this.susceptible(animal))return null;
    // A sick dependent keeps one healthy caregiver nearby; everyone else can make space.
    if(this.sim.family.isDependent(sickAnimal)){
      const carer=this.healthyCarer(sickAnimal);if(carer?.id===animal.id){const intent=this.sim.disease.isImmune(animal)?'illness-immune-care':'illness-care';if(near.distance>1.75)return{intent,target:{x:sickAnimal.x,y:sickAnimal.y,animalId:sickAnimal.id},sick:sickAnimal};return null}
    }
    if(this.sim.family.isDependent(animal)){
      const carer=this.healthyCarer(animal);if(carer&&carer.id!==sickAnimal.id){const d=Math.hypot(animal.x-carer.x,animal.y-carer.y);if(d>1.9||near.distance<CONTACT_BUFFER)return{intent:'illness-buffer',target:{x:carer.x,y:carer.y,caregiverId:carer.id},sick:sickAnimal}}
    }
    const deps=this.sim.family.livingChildren(animal,{dependentOnly:true}).filter(c=>!c.infected);
    if(deps.length&&near.distance<4.2){const child=deps.sort((a,b)=>Math.hypot(a.x-sickAnimal.x,a.y-sickAnimal.y)-Math.hypot(b.x-sickAnimal.x,b.y-sickAnimal.y))[0],target=this.safePoint(animal,sickAnimal,{distance:4.8});return{intent:'illness-buffer',target:{...target,childId:child.id},sick:sickAnimal}}
    if(near.distance<CONTACT_BUFFER){const target=this.safePoint(animal,sickAnimal,{distance:4.5});return{intent:'illness-distance',target,sick:sickAnimal}}
    return null;
  }
  sickCareTarget(helper,{radius=1.8}={}){
    if(!this.enabled()||!helper?.alive||!this.isFamilyAnimal(helper))return null;const immuneHelper=!helper.infected&&helper.age>=SPECIES[helper.species].maturity&&this.sim.disease.isImmune(helper);let best=null,bestD=radius;
    for(const child of this.sickFamily()){if(!this.sim.family.isDependent(child))continue;const parent=child.parentIds?.includes(helper.id);if(!parent&&!immuneHelper)continue;const d=Math.hypot(child.x-helper.x,child.y-helper.y);if(d<=bestD){bestD=d;best=child}}
    return best?{child:best,distance:bestD,immuneHelper:immuneHelper&&!best.parentIds?.includes(helper.id)}:null;
  }
  sickYoungTarget(parent,opts={}){return this.sickCareTarget(parent,opts)}
  checkSickYoung(helper,child){
    const isParent=!!child?.parentIds?.includes(helper?.id),immuneHelper=!!(helper?.alive&&helper.age>=SPECIES[helper.species].maturity&&this.isFamilyAnimal(helper)&&!helper.infected&&this.sim.disease.isImmune(helper));
    if(!helper?.alive||!child?.alive||!child.infected||(!isParent&&!immuneHelper))return{ok:false,type:'illness-care',message:'No sick young need checking nearby.'};
    if(Math.hypot(helper.x-child.x,helper.y-child.y)>1.8)return{ok:false,type:'illness-care',message:'Move closer to the sick young.'};
    if(isParent){
      const tended=this.sim.family.tend(helper,child);if(!tended.ok)return tended;child.careStress=Math.max(0,(child.careStress||0)-.08);
      this.sim.cognition?.recordOnce?.(helper,`fever-care:${child.id}:${this.sim.year}:${this.sim.day}`,`Stayed with sick G${child.generation} young during Marsh fever`,{childId:child.id,illness:'mirefever',immune:this.sim.disease.isImmune(helper)});
      this.sim.family?.pushEvent?.({type:'illness-care',animalId:child.id,caregiverId:helper.id,generation:child.generation});
      return{...tended,type:'illness-care',message:`Checked sick G${child.generation} young · care given, fever still needs time.`};
    }
    if((child.careCooldownUntil||0)>this.sim.tickCount)return{ok:false,type:'illness-care',message:'The sick young is settled for the moment.'};
    const before=child.careStress||0;child.careStress=Math.max(0,before-.18);child.careCooldownUntil=this.sim.tickCount+CFG.simHz*1.5;helper.energy=Math.max(0,helper.energy-.35);
    this.sim.cognition?.recordOnce?.(helper,`immune-fever-care:${child.id}:${this.sim.year}:${this.sim.day}`,`Used recovered immunity to stay with sick G${child.generation} young`,{childId:child.id,illness:'mirefever',immune:true});
    this.sim.family?.pushEvent?.({type:'illness-immune-care',animalId:child.id,caregiverId:helper.id,generation:child.generation});
    return{ok:true,type:'illness-care',child,reassured:before-child.careStress,message:`Stayed with sick G${child.generation} young · recovered immunity makes close care safer.`};
  }
  onInfected(animal){
    if(!this.enabled()||!this.isFamilyAnimal(animal))return;this.aftermath=null;
    if(!this.episode)this.episode={startedTick:this.sim.tickCount,startedDay:this.sim.day,ids:new Set(),recorded:false};this.episode.ids.add(animal.id);
    const p=this.sim.player();if(p&&!this.episode.recorded){this.episode.recorded=true;this.sim.cognition?.recordOnce?.(p,`family-fever:${this.sim.year}:${this.sim.day}`,'Marsh fever reached the family; relatives began making space',{infectedId:animal.id})}
  }
  onRecovered(animal){
    if(!this.enabled()||!this.isFamilyAnimal(animal))return;
    const still=this.sickFamily().filter(a=>a.id!==animal.id);if(still.length)return;
    const shelter=this.sim.shelter?.nearest?.(animal,{radius:Infinity,familyOnly:true})||null;this.aftermath={recoveredId:animal.id,startedTick:this.sim.tickCount,untilTick:this.sim.tickCount+REGROUP_TICKS,shelterId:shelter?.id??null};this.episode=null;
    const p=this.sim.player();if(p)this.sim.cognition?.recordOnce?.(p,`family-fever-cleared:${this.sim.year}:${this.sim.day}`,'Marsh fever cleared from the family; relatives regrouped',{recoveredId:animal.id});
  }
  aftermathStatus(){
    if(!this.enabled()||!this.aftermath)return null;if(this.sim.tickCount>this.aftermath.untilTick){this.aftermath=null;return null}
    const recovered=this.sim.animals.find(a=>a.id===this.aftermath.recoveredId&&a.alive)||null,shelter=this.sim.shelter?.shelters?.find?.(s=>s.id===this.aftermath.shelterId)||null;
    return{active:true,recovered,shelter,remainingTicks:this.aftermath.untilTick-this.sim.tickCount};
  }
  phase(){if(!this.enabled()){this.aftermath=null;this.episode=null;return}this.aftermathStatus()}
  snapshot(animal=this.sim.player()){
    if(!this.enabled()||!animal)return null;const sick=this.sickFamily(),after=!sick.length?this.aftermathStatus():null;if(!sick.length&&!after)return null;
    const family=this.family(),susceptible=family.filter(a=>this.susceptible(a)),immune=family.filter(a=>!a.infected&&this.sim.disease.isImmune(a)),distancing=family.filter(a=>['illness-distance','illness-buffer','illness-isolate'].includes(a.intent)),immuneCarers=family.filter(a=>['illness-immune-care','illness-immune-support'].includes(a.intent));
    const dependents=family.filter(a=>this.sim.family.isDependent(a)),healthyYoung=dependents.filter(a=>!a.infected),protectedYoung=healthyYoung.filter(c=>{const near=this.nearestSick(c,{radius:CONTACT_BUFFER});return !near||['illness-buffer','illness-distance'].includes(c.intent)});
    const sickYoung=sick.filter(a=>this.sim.family.isDependent(a)),nearest=sick.length?[...sick].sort((a,b)=>Math.hypot(a.x-animal.x,a.y-animal.y)-Math.hypot(b.x-animal.x,b.y-animal.y))[0]:null;
    return{active:!!sick.length,sick,infectedCount:sick.length,nearestSick:nearest,nearestDistance:nearest?Math.hypot(nearest.x-animal.x,nearest.y-animal.y):Infinity,susceptibleCount:susceptible.length,immuneCount:immune.length,immuneCarerCount:immuneCarers.length,distancingCount:distancing.length,dependentCount:dependents.length,healthyYoungCount:healthyYoung.length,protectedYoungCount:protectedYoung.length,sickYoung,after};
  }
}
