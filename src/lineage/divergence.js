import {chooseParentalReading} from './parental-reading.js';
// First true family-scale lineage divergence. Behavioral tendency remains a reversible
// family culture; a lineage form is set on the body at birth and stays with the descendant.
// This lets sustained lived behavior become inherited morphology and mechanics without
// turning the system into a menu-selected class.
// v1.32 Stage E/G: form strength lives on the body (anatomy reach or compact frame); the form
// label is read from whichever is developed, and its history sits on `formHistory`.
import {formReading,writeForm} from './readings.js';

const FORMS={
  forager:{
    id:'forager',label:'Forager form',short:'Forager',
    summary:'A leaner, longer-limbed descendant built to range farther and find food at distance.',
    cause:'Sustained forage, scouting, and wide family ranging shaped this descendant.',
    opportunity:'Faster travel and wider food sensing make distant resource patches more practical.'
  },
  colony:{
    id:'colony',label:'Colony form',short:'Colony',
    summary:'A compact, shelter-oriented descendant built around food sharing and group protection.',
    cause:'Sustained regrouping, shelter use, nesting, and close family living shaped this descendant.',
    opportunity:'Shelter stores become more efficient and family cover is safer near home.'
  }
};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const roundPct=v=>Math.round((v-1)*100);

export class LineageDivergenceController{
  constructor(sim){this.sim=sim}
  definitions(){return FORMS}
  formFor(animal){
    const form=formReading(animal);if(!form||!FORMS[form.kind])return null;
    return{...FORMS[form.kind],kind:form.kind,strength:clamp(Number(form.strength)||0,0,1),sourceGeneration:form.sourceGeneration||animal.generation||1};
  }
  onBirth(child,parents=[]){
    if(!child)return null;
    const chosen=chooseParentalReading(this.sim.rng,parents,p=>this.formFor(p));
    if(!chosen)return null;
    const source=chosen.reading;
    writeForm(child,source.kind,source.strength,{...source,sourceParentId:chosen.sourceParentId,
      bornDay:this.sim.day,inheritanceRules:'neutral-parental/1'});
    return this.formFor(child);
  }
  movementMultiplier(animal){const p=this.formFor(animal);if(!p)return 1;return p.kind==='forager'?1+.075*p.strength:1-.018*p.strength}
  sensoryMultiplier(animal){const p=this.formFor(animal);if(!p)return 1;return p.kind==='forager'?1+.24*p.strength:1+.035*p.strength}
  forageRangeMultiplier(animal){const p=this.formFor(animal);if(!p)return 1;return p.kind==='forager'?1+.34*p.strength:1}
  cacheMultiplier(animal){const p=this.formFor(animal);if(!p)return 1;return p.kind==='colony'?1+.24*p.strength:1}
  shelterProtectionMultiplier(animal){const p=this.formFor(animal);if(!p)return 1;return p.kind==='colony'?1-.14*p.strength:1}
  visualProfile(animal){
    const p=this.formFor(animal);if(!p)return{kind:null,strength:0,body:1,limb:1,sensory:1,width:1,height:1};
    const s=p.strength;
    if(p.kind==='forager')return{kind:p.kind,strength:s,body:1-.065*s,limb:1+.15*s,sensory:1+.15*s,width:1-.10*s,height:1-.02*s};
    return{kind:p.kind,strength:s,body:1+.065*s,limb:1-.14*s,sensory:1-.04*s,width:1+.15*s,height:1+.04*s};
  }
  mechanicsText(animal){
    const p=this.formFor(animal);if(!p)return'';
    if(p.kind==='forager')return`${p.label} · +${roundPct(this.movementMultiplier(animal))}% travel · +${roundPct(this.forageRangeMultiplier(animal))}% forage reach`;
    return`${p.label} · +${roundPct(this.cacheMultiplier(animal))}% shelter storage · ${Math.abs(roundPct(this.shelterProtectionMultiplier(animal)))}% less shelter danger`;
  }
  revealText(animal){
    const p=this.formFor(animal);if(!p)return'';
    return p.inheritanceRules==='neutral-parental/1'?`${this.mechanicsText(animal)}. Inherited from parent ${p.sourceParentId}. ${p.opportunity}`:`${this.mechanicsText(animal)}. ${p.cause} ${p.opportunity}`;
  }
  chipText(animal,previous=null){const p=this.formFor(animal);if(!p)return'';const before=this.formFor(previous);if(!before||before.kind!==p.kind)return`${p.label} emerged`;if(p.strength>before.strength+.08)return`${p.label} deepened`;return`${p.label} inherited`}
}

export function lineageFormMeta(id){return FORMS[id]||null}
