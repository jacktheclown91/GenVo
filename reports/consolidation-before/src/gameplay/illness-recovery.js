import {SPECIES} from '../organisms/species.js';

const clamp=(min,max,v)=>Math.max(min,Math.min(max,v));

export class IllnessRecoveryController{
  constructor(sim){this.sim=sim}
  enabled(animal){return !!(this.sim.playerEnabled&&animal?.alive&&animal.player&&animal.lineage)}
  ensure(animal){
    if(!this.enabled(animal))return null;
    if(!animal.illnessCare)animal.illnessCare={restToday:0,totalRest:0,supportedDays:0,bonusDays:0,lastMode:'none',lastSupportedDay:0,recoveredDay:0};
    return animal.illnessCare;
  }
  reset(animal){if(animal?.illnessCare){animal.illnessCare.restToday=0;animal.illnessCare.lastMode='none'}}
  mode(animal){
    if(!this.enabled(animal)||!animal.infected)return{mode:'none',label:'',resting:false,sheltered:false,isolating:false,strained:false,cover:0,familyNear:0,familyAtRisk:0};
    const spec=SPECIES[animal.species],moving=animal.intent==='player'&&!!animal.target&&(Math.abs(animal.target.dx||0)+Math.abs(animal.target.dy||0)>.01),sprinting=!!(moving&&animal.target?.sprint);
    const shelter=this.sim.shelter?.nearest?.(animal,{radius:1.55,familyOnly:true})||null,cover=this.sim.coverAt?.(animal)||0;
    const lowActivity=!moving&&!['mate','hunt','mob','charge-player'].includes(animal.intent);
    let familyNear=0,familyAtRisk=0;
    for(const other of this.sim.animals){
      if(!other.alive||other.id===animal.id||other.species!=='genvo')continue;
      const d=Math.hypot(other.x-animal.x,other.y-animal.y);if(d<=3.2){familyNear++;if(!other.infected&&!this.sim.disease.isImmune(other))familyAtRisk++}
    }
    const isolating=lowActivity&&!shelter&&cover>=.40&&familyNear===0;
    let mode='active',label='Pushing through';
    if(sprinting){mode='strained';label='Straining while feverish'}
    else if(shelter&&lowActivity){mode='shelter-rest';label='Resting under shelter'}
    else if(isolating){mode='isolation-rest';label='Resting apart in dense cover'}
    else if(lowActivity&&cover>=.28){mode='cover-rest';label='Resting in cover'}
    else if(lowActivity){mode='rest';label='Resting exposed'}
    return{mode,label,resting:lowActivity,sheltered:!!shelter,isolating,strained:sprinting,cover,familyNear,familyAtRisk,shelter,energyRatio:animal.energy/spec.maxEnergy,waterRatio:animal.hydration/spec.maxHydration};
  }
  phase(){
    const animal=this.sim.player();if(!this.enabled(animal))return;
    const care=this.ensure(animal);if(!animal.infected){if(care.lastMode!=='none')care.lastMode='none';return}
    const status=this.mode(animal);care.lastMode=status.mode;
    const nourished=Math.min(status.energyRatio,status.waterRatio);
    const supply=nourished>=.55?1:nourished>=.36?.68:.30;
    let gain=0;
    if(status.mode==='shelter-rest')gain=.115* supply;
    else if(status.mode==='isolation-rest')gain=.082*supply;
    else if(status.mode==='cover-rest')gain=.050*supply;
    else if(status.mode==='rest')gain=.026*supply;
    if(gain>0){care.restToday=clamp(0,1.35,care.restToday+gain);care.totalRest+=gain}
  }
  effectMultiplier(animal){
    if(!this.enabled(animal)||!animal.infected)return 1;
    const status=this.mode(animal);
    if(status.mode==='shelter-rest')return .55;
    if(status.mode==='isolation-rest')return .72;
    if(status.mode==='cover-rest')return .84;
    if(status.mode==='rest')return .94;
    if(status.mode==='strained')return 1.24;
    return 1.06;
  }
  onDiseaseDay(animal){
    if(!this.enabled(animal)||!animal.infected||!animal.infection)return null;
    const care=this.ensure(animal),spec=SPECIES[animal.species],fed=animal.energy/spec.maxEnergy>=.38,watered=animal.hydration/spec.maxHydration>=.38;
    const supported=care.restToday>=.52&&fed&&watered;
    if(supported){
      care.supportedDays++;care.lastSupportedDay=this.sim.disease.absoluteDay();
      const allowed=Math.min(2,Math.floor(care.supportedDays/2));
      if(allowed>care.bonusDays&&animal.infection.duration>4){animal.infection.duration=Math.max(4,animal.infection.duration-1);care.bonusDays=allowed}
    }
    care.restToday=0;
    return{supported,supportedDays:care.supportedDays,bonusDays:care.bonusDays};
  }
  onInfected(animal){if(!this.enabled(animal))return;const care=this.ensure(animal);care.restToday=0;care.supportedDays=0;care.bonusDays=0;care.lastMode='active';care.recoveredDay=0}
  onRecovered(animal){if(!this.enabled(animal))return;const care=this.ensure(animal);care.recoveredDay=this.sim.disease.absoluteDay();care.lastMode='recovered';this.sim.cognition?.recordOnce?.(animal,`fever-recovered:${this.sim.year}:${this.sim.day}`,'Recovered from Marsh fever',{illness:'mirefever',supportedDays:care.supportedDays,shortenedBy:care.bonusDays})}
  convalescent(animal){const care=animal?.illnessCare;if(!care?.recoveredDay)return false;return this.sim.disease.absoluteDay()-care.recoveredDay<=1}
  snapshot(animal){
    if(!this.enabled(animal))return null;const care=this.ensure(animal),d=this.sim.disease.snapshot(animal),status=d.infected?this.mode(animal):null;
    if(!d.infected){const spec=SPECIES[animal.species],energyRatio=animal.energy/spec.maxEnergy,waterRatio=animal.hydration/spec.maxHydration;return{infected:false,recovering:this.convalescent(animal),immune:d.immune,immuneDays:d.immuneDays,supportedDays:care.supportedDays,bonusDays:care.bonusDays,energyRatio,waterRatio,replenish:Math.min(energyRatio,waterRatio)<.68}};
    const rest=Math.min(1,care.restToday/.72);
    return{...d,...status,restProgress:rest,supportedDays:care.supportedDays,bonusDays:care.bonusDays,effectMultiplier:this.effectMultiplier(animal)};
  }
}
