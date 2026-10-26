import {initializeAutonomousFounding,advanceAutonomousFounding,naturalPopulations,naturalPopulationFor,recordPopulationBirth,recordPopulationDeath} from './autonomous-founding.js';
import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {ENVIRONMENT_PRESSURES} from '../lineage/pressure.js';
import {BREEDING_SUPPORT,breedingSupport} from './breeding-support.js';

const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
// Same vocabulary as per-creature lifetime pressure (lineage/pressure.js).
const PRESSURES=ENVIRONMENT_PRESSURES;
const LABELS=Object.fromEntries(PRESSURES.map(p=>[p.id,p.label]));

// Population-scale lived memory. This controller does not alter ecology or genes.
// It records the conditions actually experienced around the original home and each
// established G3 population center, plus where individual lineage members spend
// their days. v1.12 can consume this history when populations begin diverging.
export class PopulationPressureMemoryController{
  constructor(sim){this.sim=sim;this.histories=new Map();this.residence=new Map();this.lastDay=0;this.notice=null;this.noticed=new Set();initializeAutonomousFounding(this)}
  primaryAnchor(){
    const shelter=(this.sim.shelter?.activeShelters?.()||[]).filter(s=>s.kind!=='satellite').sort((a,b)=>(a.constructedDay??0)-(b.constructedDay??0)||a.id-b.id)[0];
    if(shelter)return{key:'home',id:'home',kind:'home',label:'Home Range',x:shelter.x,y:shelter.y,primary:true,shelterId:shelter.id};
    const p=this.sim.player?.(),home=p?this.sim.territory?.state?.(p)?.home:null;
    if(home)return{key:'home',id:'home',kind:'home',label:'Home Range',x:home.x,y:home.y,primary:true};
    if(p)return{key:'home',id:'home',kind:'home',label:'Home Range',x:p.x,y:p.y,primary:true};
    return null;
  }
  populations(){
    const out=[],home=this.primaryAnchor();if(home)out.push(home);
    for(const center of this.sim.generationProgress?.centers?.()||[])out.push({...center,key:`center:${center.id}`,primary:false});
    out.push(...naturalPopulations(this));
    return out;
  }
  populationByKey(key){return this.populations().find(p=>p.key===key)||null}
  habitatAt(pop){
    const w=this.sim.world,r=4;let moisture=0,temp=0,land=0,waterEdge=0;
    for(let oy=-r;oy<=r;oy+=2)for(let ox=-r;ox<=r;ox+=2){
      const x=Math.max(1,Math.min(CFG.worldSize-2,pop.x+ox)),y=Math.max(1,Math.min(CFG.worldSize-2,pop.y+oy)),i=w.idx(x,y);
      if(w.water[i]){waterEdge++;continue}land++;moisture+=w.moisture[i]||0;temp+=w.temperature[i]||0;if((w.waterDistance?.[i]||99)<=2)waterEdge+=.45;
    }
    return{moisture:land?moisture/land:1,temperature:land?temp/land:.58,waterEdge:clamp01(waterEdge/Math.max(1,land*.45))};
  }
  assessment(pop){
    if(!pop)return null;
    const center=pop.primary?null:pop;
    const eco=center?this.sim.populationEcology?.centerState?.(center,{force:true}):this.sim.populationEcology?.siteAssessment?.(pop,{force:true});
    if(!eco)return null;
    const habitat=this.habitatAt(pop),moist=habitat.moisture,temp=habitat.temperature;
    const pressure={
      scarcity:clamp01(1-eco.food),competition:clamp01(eco.competition),predation:clamp01(eco.danger),crowding:clamp01(eco.overload),
      dryness:clamp01((.46-moist)/.38),wetness:clamp01(Math.max((moist-.54)/.38,habitat.waterEdge*.82)),heat:clamp01((temp-.67)/.24),cold:clamp01((.49-temp)/.24)
    };
    return{...eco,...habitat,pressure};
  }
  ensure(pop){
    let h=this.histories.get(pop.key);if(!h){h={key:pop.key,label:pop.label||pop.kind,kind:pop.kind,centerId:pop.primary?null:pop.id,days:0,firstDay:this.sim.day,lastDay:0,exposure:{},peak:{},recent:{},last:{},lastAssessment:null};this.histories.set(pop.key,h)}return h;
  }
  assignedCenter(animal){
    if(!animal?.alive||animal.species!=='genvo'||!animal.lineage)return null;const form=this.sim.divergence?.formFor?.(animal)?.kind;if(!form)return null;
    return this.sim.generationProgress?.populationAssignment?.(animal,form)||null;
  }
  populationForAnimal(animal,pops=this.populations()){
    const natural=naturalPopulationFor(this,animal);if(natural)return natural;
    const legacyPops=pops.filter(p=>p.kind!=='autonomous');
    if(!animal?.alive||animal.species!=='genvo'||!animal.lineage||!legacyPops.length)return null;
    const assigned=this.assignedCenter(animal);if(assigned){const found=legacyPops.find(p=>p.id===assigned.id&&!p.primary);if(found)return found}
    const secondaries=legacyPops.filter(p=>!p.primary),nearest=secondaries.map(p=>({p,d:Math.hypot(animal.x-p.x,animal.y-p.y)})).sort((a,b)=>a.d-b.d)[0];
    if(nearest&&nearest.d<=Math.max(5.5,this.sim.territory.cellSize*.9))return nearest.p;
    return legacyPops.find(p=>p.primary)||legacyPops[0];
  }
  noteResidence(animal,pop){
    if(!animal||!pop)return;let r=this.residence.get(animal.id);if(!r){r={days:{},lastKey:null,lastDay:0};this.residence.set(animal.id,r)}
    if(r.lastDay===this.sim.day)return;r.lastDay=this.sim.day;r.lastKey=pop.key;r.days[pop.key]=(r.days[pop.key]||0)+1;
  }
  affinityFor(animalOrId){
    const id=typeof animalOrId==='number'?animalOrId:animalOrId?.id,r=this.residence.get(id);if(!r)return null;
    const ranked=Object.entries(r.days).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));if(!ranked.length)return null;
    const [key,days]=ranked[0],total=ranked.reduce((n,[,v])=>n+v,0),pop=this.populationByKey(key);
    return{key,days,total,share:total?days/total:0,population:pop,label:pop?.label||key,lastKey:r.lastKey};
  }
  advanceDay(){
    if(this.lastDay===this.sim.day)return;this.lastDay=this.sim.day;
    advanceAutonomousFounding(this,{maturityFor:a=>SPECIES[a.species].maturity,supportsMaintenance:a=>this.supportsMaintenance(a)});
    const pops=this.populations();if(!pops.length)return;
    for(const pop of pops){
      if(pop.kind==='autonomous'&&!pop.memberIds.size)continue;
      const a=this.assessment(pop);if(!a)continue;const h=this.ensure(pop);h.days++;h.lastDay=this.sim.day;h.lastAssessment=a;h.last={...a.pressure};
      for(const def of PRESSURES){const value=a.pressure[def.id]||0;h.exposure[def.id]=(h.exposure[def.id]||0)+value;h.peak[def.id]=Math.max(h.peak[def.id]||0,value);h.recent[def.id]=(h.recent[def.id]||0)*.76+value*.24}
    }
    for(const a of this.sim.animals){if(!a.alive||!a.lineage||a.species!=='genvo')continue;const pop=this.populationForAnimal(a,pops);if(pop)this.noteResidence(a,pop)}
    this.maybeNotice();
  }
  noteBirth(child,parents){recordPopulationBirth(this,child,parents)}
  noteDeath(animal,cause){recordPopulationDeath(this,animal,cause)}
  supportsMaintenance(animal){
    // Establishment observes maintenance, not spare capacity for another brood.
    // No cross-body survey memo: different inherited mouths need different food.
    const state=this.sim.carrying.breedingState(animal);
    const support=state.support||breedingSupport(this.sim,animal,this.sim.carrying.surveyAt(animal),state.competitors);
    return support.share>=support.need/BREEDING_SUPPORT.reproductiveMargin;
  }
  profile(keyOrPop){
    const key=typeof keyOrPop==='string'?keyOrPop:keyOrPop?.key,h=this.histories.get(key);if(!h)return null;
    const axes=PRESSURES.map(def=>({id:def.id,label:def.label,mean:h.days?clamp01((h.exposure[def.id]||0)/h.days):0,recent:clamp01(h.recent[def.id]||0),peak:clamp01(h.peak[def.id]||0)})).sort((a,b)=>b.mean-a.mean||a.id.localeCompare(b.id));
    return{...h,axes,dominant:axes[0]||null,secondary:axes[1]||null};
  }
  snapshots(){return this.populations().map(pop=>({population:pop,profile:this.profile(pop)})).filter(x=>x.profile)}
  divergence(){
    const home=this.profile('home');if(!home||home.days<3)return[];const homeBy=Object.fromEntries(home.axes.map(a=>[a.id,a.mean])),out=[];
    for(const {population,profile} of this.snapshots()){
      if(population.primary||profile.days<3)continue;const deltas=profile.axes.map(axis=>({id:axis.id,label:axis.label,delta:axis.mean-(homeBy[axis.id]||0),magnitude:Math.abs(axis.mean-(homeBy[axis.id]||0)),there:axis.mean,home:homeBy[axis.id]||0})).sort((a,b)=>b.magnitude-a.magnitude||a.id.localeCompare(b.id));
      const score=deltas.reduce((n,d)=>n+d.magnitude,0)/PRESSURES.length;out.push({key:population.key,population,profile,home,score,dominantDifference:deltas[0]||null,deltas});
    }
    return out.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
  }
  maybeNotice(){
    for(const d of this.divergence()){
      if(d.score<.105||!d.dominantDifference||d.dominantDifference.magnitude<.22)continue;const key=`${d.key}:${d.dominantDifference.id}`;if(this.noticed.has(key))continue;this.noticed.add(key);
      const dir=d.dominantDifference.delta>0?'more':'less';this.notice={message:`${d.population.label} is building a different pressure history · ${dir} ${d.dominantDifference.label} than home.`,tone:'safe'};break;
    }
  }
  consumeNotice(){const n=this.notice;this.notice=null;return n}
  summaryLine(){
    const snaps=this.snapshots();if(!snaps.length)return'Population pressure memory NOT YET ESTABLISHED';
    const divergence=this.divergence()[0],parts=snaps.slice(0,3).map(({population,profile})=>`${population.primary?'HOME':population.label.toUpperCase()} ${profile.days}d · ${profile.dominant?.label||'settling'}`);
    return`Pressure memory ${parts.join(' · ')}${divergence?` · separation ${Math.round(divergence.score*100)}%`:''}`;
  }
  lines(){
    return this.snapshots().map(({population,profile})=>{const top=profile.axes.slice(0,2).filter(a=>a.mean>=.05).map(a=>`${a.label} ${Math.round(a.mean*100)}%`).join(' · ')||'no sustained pressure';return`${population.primary?'HOME':`#${population.id}`} ${population.label} · ${profile.days}d · ${top}`});
  }
}

export {PRESSURES as POPULATION_PRESSURE_AXES,LABELS as POPULATION_PRESSURE_LABELS};
