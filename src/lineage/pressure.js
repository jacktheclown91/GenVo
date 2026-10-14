import {canHunt,preyPreference} from '../ecology/functional-diet.js';
import {CFG} from '../sim/config.js';
import {SPECIES,canPreyOn} from '../organisms/species.js';

const clamp=(min,max,v)=>Math.max(min,Math.min(max,v));

// v1.32 consolidation Stage B: one lived-pressure vocabulary for the whole game.
// Per-creature lifetime exposure (this controller), population pressure memory, proto-traits,
// species evidence and adaptation emergence all use these ids. The first eight are the
// environmental axes population memory records; disease and fewMates are personal.
export const PRESSURE_AXES=Object.freeze([
  {id:'scarcity',label:'food scarcity'},
  {id:'competition',label:'competition'},
  {id:'predation',label:'predators'},
  {id:'crowding',label:'crowding'},
  {id:'dryness',label:'dry ground and low water'},
  {id:'wetness',label:'wet ground and water barriers'},
  {id:'heat',label:'heat'},
  {id:'cold',label:'cold'},
  {id:'disease',label:'disease'},
  {id:'fewMates',label:'few mates'}
]);
export const ENVIRONMENT_PRESSURES=Object.freeze(PRESSURE_AXES.slice(0,8));
export const PRESSURE_LABELS=Object.freeze(Object.fromEntries(PRESSURE_AXES.map(p=>[p.id,p.label])));
const LABELS=PRESSURE_LABELS;
// Pre-v1.32 per-creature kinds and where they now live. thermal splits by its sign; in
// saves the sign is unknown, so it is shared evenly between heat and cold.
export const LEGACY_PRESSURE_KINDS=Object.freeze({water:'dryness',bottleneck:'fewMates',thermal:['heat','cold']});

export class SelectionPressureController{
  constructor(sim){this.sim=sim;this.states=new Map()}
  ensure(animal){
    if(!animal)return null;let state=this.states.get(animal.id);
    if(!state){state={lastDay:0,exposure:{},peak:{},last:[],lastWaterBarrierTick:-999};this.states.set(animal.id,state)}
    return state;
  }
  observe(){
    // Exposure history follows the actively controlled lineage member. This keeps
    // the feature player-facing and avoids turning every descendant into another
    // full-world analysis pass.
    const animal=this.sim.player?.();
    if(!animal?.alive||animal.species!=='genvo'||!animal.lineage)return;
    const state=this.ensure(animal),pressures=this.evaluate(animal);state.last=pressures;
    if(state.lastDay===this.sim.day)return;
    state.lastDay=this.sim.day;
    for(const p of pressures){
      if(p.severity<.16)continue;
      state.exposure[p.kind]=(state.exposure[p.kind]||0)+p.severity;
      state.peak[p.kind]=Math.max(state.peak[p.kind]||0,p.severity);
    }
  }

  noteWaterBarrier(animal){
    if(!animal?.alive||animal.species!=='genvo')return false;
    const state=this.ensure(animal);if(!state||state.lastWaterBarrierTick===this.sim.tickCount)return false;
    state.lastWaterBarrierTick=this.sim.tickCount;state.exposure.wetness=(state.exposure.wetness||0)+.08;state.peak.wetness=Math.max(state.peak.wetness||0,.34);return true;
  }
  evaluate(animal){
    if(!animal?.alive)return[];
    const sim=this.sim,s=SPECIES[animal.species];if(!s)return[];
    const i=sim.world.idx(animal.x,animal.y),genes=animal.genes||{},out=[];

    const temp=sim.world.temperature[i],comfort=.55*(genes.climate||1),thermalGap=Math.abs(temp-comfort);
    const thermalSeverity=clamp(0,1,(thermalGap-.035)/.25);
    if(thermalSeverity>.08){
      const cold=temp<comfort;const climate=genes.climate??1,met=genes.metabolism??1;
      let effect='your climate trait is close to neutral';let tone='neutral';
      if(cold){if(climate<.985){effect='preferring cool helps here';tone='help'}else if(climate>1.015){effect='preferring warmth costs more here';tone='hurt'}}
      else {if(climate>1.015){effect='preferring warmth helps here';tone='help'}else if(climate<.985){effect='preferring cool costs more here';tone='hurt'}}
      if(tone!=='hurt'&&met>1.045)effect+='; lower energy use helps';
      out.push({kind:cold?'cold':'heat',label:cold?'Cold':'Heat',severity:thermalSeverity,effect,tone,detail:`Local ${Math.round(temp*100)} · comfort ${Math.round(comfort*100)}`,genes:['climate','metabolism']});
    }

    const threats=[];for(const other of sim.animals){if(!other.alive||other.id===animal.id||!canHunt(other)||preyPreference(other,animal)<=0)continue;const d=Math.hypot(other.x-animal.x,other.y-animal.y);if(d<=9)threats.push({animal:other,distance:d})}
    threats.sort((a,b)=>a.distance-b.distance);if(threats.length){
      const near=threats[0].distance,protectedOpening=sim.isOpeningProtected?.(animal),severity=protectedOpening?.12:clamp(.12,1,(1-near/10)*.78+Math.min(.28,(threats.length-1)*.09));
      const motion=(genes.motion??1)-1,senses=(genes.senses??1)-1,caution=1-(genes.temperament??1);const fit=motion*.9+senses*.65+caution*.45;
      const tone=fit>.035?'help':fit<-.035?'hurt':'neutral';
      const effect=protectedOpening?'predators cannot hurt you during the opening grace period':tone==='help'?'speed, senses, and caution help':tone==='hurt'?'your current traits make escape harder':'your traits give no clear edge';
      out.push({kind:'predation',label:protectedOpening?'Predators · protected':'Predators',severity,effect,tone,detail:`${threats.length} hunter${threats.length===1?'':'s'} nearby · nearest ${near.toFixed(1)} tiles`,genes:['motion','senses','temperament']});
    }

    const carrying=sim.carrying?.breedingState?.(animal);const energy=animal.energy/s.maxEnergy;
    if(carrying){
      const resource=clamp(0,1,carrying.resource??1),severity=clamp(0,1,Math.max((1-resource)*.82,(.62-energy)*1.45));
      if(severity>.12){
        const digestion=(genes.digestion??1)-1,met=(genes.metabolism??1)-1,fit=digestion*.8+met*.75;
        const tone=fit>.025?'help':fit<-.025?'hurt':'neutral';
        const effect=tone==='help'?'good digestion and lower energy use help':tone==='hurt'?'your food-use traits cost more here':'your food-use traits give no clear edge';
        out.push({kind:'scarcity',label:'Food shortage',severity,effect,tone,detail:`Food nearby ${Math.round(resource*100)}% · energy ${Math.round(energy*100)}%`,genes:['digestion','metabolism']});
      }
    }

    const water=animal.hydration/s.maxHydration;
    if(water<.58){
      const nearest=sim.world.nearestDrinkable?.(animal.x,animal.y,40);const dist=nearest?Math.hypot(nearest.x-animal.x,nearest.y-animal.y):40;
      const severity=clamp(.14,1,(.58-water)*1.45+Math.min(.35,dist/55));
      const motion=genes.motion??1,tone=motion>1.045?'help':motion<.955?'hurt':'neutral';
      const effect=tone==='help'?'longer stride helps reach water':tone==='hurt'?'shorter stride makes water harder to reach':'distance matters more than inherited traits here';
      out.push({kind:'dryness',label:'Low water',severity,effect,tone,detail:`Water ${Math.round(water*100)}% · nearest bank ${nearest?dist.toFixed(1):'>40'} tiles`,genes:['motion']});
    }

    if(animal.infected){
      const immunity=genes.immunity??1,tone=immunity>1.035?'help':immunity<.965?'hurt':'neutral';
      const effect=tone==='help'?'stronger resistance helps recovery':tone==='hurt'?'lower resistance makes illness harder':'resistance gives no clear edge';
      out.push({kind:'disease',label:'Disease',severity:.86,effect,tone,detail:animal.infection?`${animal.infection.id==='mirefever'?'Marsh fever':'Infection'} · day ${animal.infection.days}/${animal.infection.duration}`:'Active infection',genes:['immunity']});
    }

    const pop=sim._decisionPopulation||sim.population?.()||{},speciesCount=pop[animal.species]||0,soft=(s.density?.softCap||6)*4;
    if(speciesCount<soft){
      const severity=clamp(0,1,(soft-speciesCount)/soft*.62);if(severity>.16){const senses=genes.senses??1,tone=senses>1.035?'help':senses<.965?'hurt':'neutral';const effect=tone==='help'?'sharper senses help find mates':tone==='hurt'?'weaker senses make mates harder to find':'senses give no clear edge in finding mates';out.push({kind:'fewMates',label:'Few mates',severity,effect,tone,detail:`${speciesCount} ${s.label} alive`,genes:['senses']})}
    }

    return out.sort((a,b)=>b.severity-a.severity||a.kind.localeCompare(b.kind));
  }
  snapshot(animal){const state=this.ensure(animal);const current=this.evaluate(animal);if(state)state.last=current;return{current,exposure:{...(state?.exposure||{})},peak:{...(state?.peak||{})}}}
  strongest(animal){return this.evaluate(animal)[0]||null}
  lifetimeSummary(animalOrId,{limit=2}={}){
    const id=typeof animalOrId==='number'?animalOrId:animalOrId?.id,state=this.states.get(id);if(!state)return[];
    return Object.entries(state.exposure).map(([kind,score])=>({kind,label:LABELS[kind]||kind,score,peak:state.peak[kind]||0})).sort((a,b)=>b.score-a.score).slice(0,limit);
  }
}

export function pressureSummaryText(items,{empty='no sustained pressure dominated'}={}){
  if(!items?.length)return empty;
  return items.map(x=>x.label).join(' · ');
}
