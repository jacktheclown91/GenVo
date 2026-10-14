import {SPECIES} from '../organisms/species.js';

const clamp=(min,max,v)=>Math.max(min,Math.min(max,v));
const SOURCE_CODE={contact:11,mating:23,shelter:37,environment:41,carrion:53,test:97};

export const DISEASES={
  mirefever:{
    label:'Marsh fever',
    baseDuration:7,
    immunityDays:24,
    contactRadius:2.15,
    contactDose:.74,
    matingDose:.92,
    shelterDose:.34,
    shed:.34,
    environmentalDose:.52,
    carrionDose:1.1
  }
};

export class DiseaseController{
  constructor(sim){
    this.sim=sim;
    this.pathogen=new Float32Array(sim.world.len);
    this.activeCells=new Set();
    this.stats={infections:0,recoveries:0,contact:0,mating:0,shelter:0,environment:0,carrion:0};
  }
  diseaseFor(animal){return animal?.infection?DISEASES[animal.infection.id]||null:null}
  susceptibility(animal){
    const species=SPECIES[animal.species];
    const base=species?.diseaseSusceptibility??1;
    const immunity=Math.max(.72,animal.genes?.immunity??1);
    const healthPenalty=animal.health<45?1.16:animal.health<70?1.07:1;
    return clamp(.48,1.72,base*healthPenalty/immunity);
  }
  exposureChance(animal,dose){
    if(!animal?.alive||animal.infected||this.isImmune(animal))return 0;
    return clamp(0,.92,dose*.145*this.susceptibility(animal));
  }
  expose(animal,dose,source='environment',sourceId=0){
    const chance=this.exposureChance(animal,dose);if(chance<=0)return false;
    const roll=this.roll(animal,source,sourceId);
    if(roll>=chance)return false;
    return this.infect(animal,{source});
  }
  infect(animal,{source='environment',force=false}={}){
    if(!animal?.alive||animal.infected||(!force&&this.isImmune(animal)))return false;
    const disease=DISEASES.mirefever,sus=this.susceptibility(animal),immunity=Math.max(.72,animal.genes?.immunity??1);
    const duration=Math.round(clamp(4,11,disease.baseDuration*sus/immunity));
    const severity=clamp(.62,1.42,sus*(1.04/immunity));
    animal.infection={id:'mirefever',days:0,duration,severity,source,startedDay:this.sim.day,startedYear:this.sim.year};
    animal.infected=true;animal.immune=false;animal.immuneUntilDay=0;
    this.sim.illness?.onInfected?.(animal);this.sim.familyIllness?.onInfected?.(animal);
    this.stats.infections++;if(source in this.stats)this.stats[source]++;
    return true;
  }
  isImmune(animal){return !!(animal?.immuneUntilDay&&animal.immuneUntilDay>=this.absoluteDay())}
  absoluteDay(){return (this.sim.year-1)*32+this.sim.day}
  advanceDay(){
    const now=this.absoluteDay(),disease=DISEASES.mirefever;
    for(const i of [...this.activeCells]){const next=this.pathogen[i]*.72;this.pathogen[i]=next;if(next<.008){this.pathogen[i]=0;this.activeCells.delete(i)}}
    const infected=[];
    for(const a of this.sim.animals){
      if(!a.alive)continue;
      if(a.immuneUntilDay&&a.immuneUntilDay<now){a.immuneUntilDay=0;a.immune=false}
      if(a.infected&&a.infection){
        this.sim.illness?.onDiseaseDay?.(a);
        a.infection.days++;
        infected.push(a);
        this.contaminate(this.sim.world.idx(a.x,a.y),disease.shed*a.infection.severity);
        if(a.infection.days>=a.infection.duration)this.recover(a);
      }
    }
    // Close contact and contaminated-ground exposure are evaluated once per day.
    // Reuse the simulation spatial index so epidemic cost scales locally instead of infected × population.
    if(infected.length)this.sim.rebuildSpatial();
    for(const source of infected){
      if(!source.alive||!source.infected)continue;
      const r=disease.contactRadius,r2=r*r;
      this.sim.forEachNearby(source,r,target=>{
        if(!target.alive||target.id===source.id||target.infected)return;
        const dx=target.x-source.x,dy=target.y-source.y;if(dx*dx+dy*dy>r2)return;
        this.expose(target,disease.contactDose*source.infection.severity,'contact',source.id);
      });
    }
    for(const a of this.sim.animals){
      if(!a.alive||a.infected||this.isImmune(a))continue;
      const i=this.sim.world.idx(a.x,a.y),load=this.pathogen[i];if(load>.025)this.expose(a,load*disease.environmentalDose,'environment',i);
    }
    this.sharedShelterExposure();
  }
  phaseEffects(){
    for(const a of this.sim.animals){
      if(!a.alive||!a.infected||!a.infection)continue;
      const severity=a.infection.severity,immunity=Math.max(.72,a.genes.immunity||1),support=this.sim.illness?.effectMultiplier?.(a)??1;
      a.energy-=.16*severity*support;
      a.hydration-=.035*severity*support;
      a.health-=.095*severity/immunity*support;
    }
  }
  recover(animal){
    if(!animal?.infected)return false;
    const disease=this.diseaseFor(animal)||DISEASES.mirefever;
    animal.infected=false;animal.infection=null;animal.immune=true;animal.immuneUntilDay=this.absoluteDay()+disease.immunityDays;
    this.sim.illness?.onRecovered?.(animal);this.sim.familyIllness?.onRecovered?.(animal);
    this.stats.recoveries++;return true;
  }
  onMate(a,b){
    const d=DISEASES.mirefever;
    if(a?.infected&&!b?.infected)this.expose(b,d.matingDose*a.infection.severity,'mating',a.id);
    if(b?.infected&&!a?.infected)this.expose(a,d.matingDose*b.infection.severity,'mating',b.id);
  }
  onCarrionFeed(animal,index,amount){
    if(!animal?.alive||amount<=0)return false;
    const load=this.pathogen[index]||0;
    const dose=(load+.16+amount*.22)*DISEASES.mirefever.carrionDose;
    return this.expose(animal,dose,'carrion',index);
  }
  onDeath(animal){
    if(!animal)return;
    const i=this.sim.world.idx(animal.x,animal.y),mass=SPECIES[animal.species]?.mass||1;
    // All carrion carries a low background pathogen load; infected deaths amplify it.
    const load=animal.infected&&animal.infection?1.15*mass*animal.infection.severity:.42*mass;
    this.contaminate(i,load);
  }
  onBirth(child,mother){
    if(!child||!mother)return;
    if(this.isImmune(mother)){child.immune=true;child.immuneUntilDay=this.absoluteDay()+4}
  }
  sharedShelterExposure(){
    const shelter=this.sim.shelter?.active;if(!shelter)return;
    const inside=this.sim.animals.filter(a=>a.alive&&Math.hypot(a.x-shelter.x,a.y-shelter.y)<=1.6);
    const sick=inside.filter(a=>a.infected&&a.infection);if(!sick.length)return;
    const d=DISEASES.mirefever;
    for(const target of inside){if(target.infected||this.isImmune(target))continue;for(const source of sick){if(source.id===target.id)continue;if(this.expose(target,d.shelterDose*source.infection.severity,'shelter',source.id))break}}
  }
  contaminate(index,amount){if(!Number.isFinite(index)||amount<=0)return;this.pathogen[index]=Math.min(3,(this.pathogen[index]||0)+amount);this.activeCells.add(index)}
  snapshot(animal){
    if(!animal)return null;const infection=animal.infection;
    return{infected:!!animal.infected,label:infection?DISEASES[infection.id]?.label||infection.id:null,days:infection?.days||0,duration:infection?.duration||0,severity:infection?.severity||0,immune:this.isImmune(animal),immuneDays:animal.immuneUntilDay?Math.max(0,animal.immuneUntilDay-this.absoluteDay()):0};
  }
  roll(animal,source,sourceId){
    let h=2166136261>>>0;const text=`${this.sim.seed}|${this.absoluteDay()}|${animal.id}|${SOURCE_CODE[source]||7}|${sourceId}`;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
    return (h>>>0)/4294967296;
  }
}
