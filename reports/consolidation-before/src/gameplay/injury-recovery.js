import {SPECIES} from '../organisms/species.js';

const clamp=(min,max,v)=>Math.max(min,Math.min(max,v));

// Player-facing wound/recovery authority. It reacts only to real damage already
// applied by canonical combat and never rolls damage, infection, or recovery RNG.
export class InjuryRecoveryController{
  constructor(sim){this.sim=sim}
  enabled(animal){return !!(this.sim.playerEnabled&&animal?.alive&&animal.player&&animal.lineage)}
  ensure(animal){
    if(!this.enabled(animal))return null;
    if(!animal.injuryCare)animal.injuryCare={active:false,level:'none',label:'',remaining:0,initial:0,restToday:0,strainToday:0,lastMode:'none',lastHitTick:-Infinity,recoveredDay:0,attackerSpecies:null};
    return animal.injuryCare;
  }
  onDamage(animal,{damage=0,attacker=null}={}){
    if(!this.enabled(animal)||damage<=0||animal.health<=0)return null;
    const s=this.ensure(animal),score=damage+Math.max(0,60-animal.health)*.55;
    let level='sore',label='Sore',days=1.6;
    if(score>=62||animal.health<36){level='severe';label='Badly wounded';days=5.5}
    else if(score>=30||animal.health<68){level='wounded';label='Wounded';days=3.4}
    const rank={none:0,sore:1,wounded:2,severe:3};
    if(!s.active||rank[level]>=rank[s.level]){s.level=level;s.label=label;s.initial=Math.max(days,s.initial||0);s.remaining=Math.max(days,s.remaining||0)}
    else s.remaining=Math.min(Math.max(s.initial,days)+1.25,s.remaining+Math.max(.45,damage/55));
    s.active=true;s.restToday=0;s.strainToday=Math.min(1.2,s.strainToday+.12);s.lastHitTick=this.sim.tickCount;s.attackerSpecies=attacker?.species||s.attackerSpecies||null;s.recoveredDay=0;
    this.sim.cognition?.recordOnce?.(animal,`wounded:${this.sim.year}:${this.sim.day}:${animal.id}`,`${label} after a predator attack`,{damage:Math.round(damage),health:Math.round(animal.health),attacker:s.attackerSpecies});
    return this.snapshot(animal);
  }
  mode(animal){
    const s=this.ensure(animal);if(!s?.active)return{mode:'none',label:'',resting:false,sheltered:false,cover:0,strained:false};
    const moving=animal.intent==='player'&&!!animal.target&&(Math.abs(animal.target.dx||0)+Math.abs(animal.target.dy||0)>.01),sprinting=!!(moving&&animal.target?.sprint);
    const shelter=this.sim.shelter?.nearest?.(animal,{radius:1.6,familyOnly:true})||null,cover=this.sim.coverAt?.(animal)||0;
    let mode='active',label='Moving while wounded';
    if(sprinting){mode='strained';label='Straining the wound'}
    else if(!moving&&shelter){mode='shelter-rest';label='Resting under shelter'}
    else if(!moving&&cover>=.38){mode='cover-rest';label='Resting in cover'}
    else if(!moving){mode='rest';label='Resting'}
    return{mode,label,resting:!moving,sheltered:!!shelter,cover,strained:sprinting,shelter};
  }
  phase(){
    const animal=this.sim.player();if(!this.enabled(animal))return null;const s=this.ensure(animal);if(!s.active)return null;
    const m=this.mode(animal);s.lastMode=m.mode;
    if(m.mode==='shelter-rest')s.restToday=clamp(0,1.5,s.restToday+.15);
    else if(m.mode==='cover-rest')s.restToday=clamp(0,1.5,s.restToday+.085);
    else if(m.mode==='rest')s.restToday=clamp(0,1.5,s.restToday+.04);
    else if(m.mode==='strained')s.strainToday=clamp(0,1.5,s.strainToday+.085);
    return this.snapshot(animal);
  }
  advanceDay(){
    const animal=this.sim.player();if(!this.enabled(animal))return null;const s=this.ensure(animal);if(!s.active)return null;
    const spec=SPECIES[animal.species],fed=animal.energy/spec.maxEnergy,water=animal.hydration/spec.maxHydration,nourished=Math.min(fed,water);
    const supply=nourished>=.60?1.08:nourished>=.38?.88:.58;
    const base=.58*supply,rest=Math.min(.82,s.restToday*.68)*supply,strain=Math.min(.32,s.strainToday*.20);
    s.remaining=Math.max(0,s.remaining-Math.max(.22,base+rest-strain));
    s.restToday=0;s.strainToday=0;
    if(s.remaining<=0){const prior=s.label;s.active=false;s.level='none';s.label='';s.remaining=0;s.initial=0;s.lastMode='recovered';s.recoveredDay=(this.sim.year-1)*32+this.sim.day;this.sim.cognition?.recordOnce?.(animal,`wound-recovered:${this.sim.year}:${this.sim.day}:${animal.id}`,`Recovered from ${prior.toLowerCase()}`,{});}
    return this.snapshot(animal);
  }
  movementMultiplier(animal){const s=this.ensure(animal);if(!s?.active)return 1;return s.level==='severe'?.78:s.level==='wounded'?.88:.95}
  movementCostMultiplier(animal,{sprint=false}={}){const s=this.ensure(animal);if(!s?.active)return 1;const base=s.level==='severe'?1.28:s.level==='wounded'?1.16:1.07;return sprint?base*(s.level==='severe'?1.34:1.22):base}
  snapshot(animal=this.sim.player()){
    if(!this.enabled(animal))return null;const s=this.ensure(animal);if(!s.active)return{active:false,recoveredDay:s.recoveredDay||0};
    const m=this.mode(animal),progress=s.initial>0?clamp(0,1,1-s.remaining/s.initial):0;
    return{active:true,level:s.level,label:s.label,remaining:s.remaining,remainingDays:Math.max(1,Math.ceil(s.remaining)),progress,mode:m.mode,modeLabel:m.label,sheltered:m.sheltered,cover:m.cover,strained:m.strained,movementMultiplier:this.movementMultiplier(animal),attackerSpecies:s.attackerSpecies};
  }
}
