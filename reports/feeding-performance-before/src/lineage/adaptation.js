import {GENE_KEYS} from '../organisms/species.js';


const VISUAL_TRAITS={
  body:{up:'larger frame',down:'smaller frame'},
  motion:{up:'longer legs',down:'shorter legs'},
  metabolism:{up:'brighter mantle',down:'darker mantle'},
  digestion:{up:'stronger side markings',down:'lighter side markings'},
  senses:{up:'larger eyes and feelers',down:'smaller eyes and feelers'},
  climate:{up:'warmer coloring',down:'cooler coloring'},
  immunity:{up:'more pale spotting',down:'less pale spotting'},
  temperament:{up:'more forward stance',down:'more tucked stance'}
};

const TRAITS={
  body:{up:'larger body',down:'smaller body',noun:'Body size'},
  motion:{up:'faster movement',down:'slower movement',noun:'Movement'},
  metabolism:{up:'lower energy use',down:'higher energy use',noun:'Metabolism'},
  digestion:{up:'better digestion',down:'poorer digestion',noun:'Digestion'},
  senses:{up:'sharper senses',down:'weaker senses',noun:'Senses'},
  climate:{up:'prefers warmth',down:'prefers cool',noun:'Climate preference'},
  immunity:{up:'stronger disease resistance',down:'lower disease resistance',noun:'Immunity'},
  temperament:{up:'bolder and more social',down:'more cautious and solitary',noun:'Temperament'}
};

export function traitPhrase(key,value,{threshold=.035}={}){
  const d=(value??1)-1,meta=TRAITS[key];
  if(!meta||Math.abs(d)<threshold)return null;
  return d>0?meta.up:meta.down;
}

export function dominantTraits(animal,{limit=3,threshold=.035}={}){
  if(!animal?.genes)return[];
  return GENE_KEYS.map(key=>({key,value:animal.genes[key]??1,delta:(animal.genes[key]??1)-1,phrase:traitPhrase(key,animal.genes[key],{threshold})}))
    .filter(x=>x.phrase)
    .sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||GENE_KEYS.indexOf(a.key)-GENE_KEYS.indexOf(b.key))
    .slice(0,limit);
}

export function compareGenes(currentGenes,baselineGenes,{limit=3,threshold=.012}={}){
  if(!currentGenes||!baselineGenes)return[];
  return GENE_KEYS.map(key=>{
    const current=currentGenes[key]??1,baseline=baselineGenes[key]??1,delta=current-baseline,meta=TRAITS[key];
    const phrase=Math.abs(delta)<threshold?null:(delta>0?meta.up:meta.down);
    return{key,current,baseline,delta,phrase,noun:meta.noun};
  }).filter(x=>x.phrase)
    .sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||GENE_KEYS.indexOf(a.key)-GENE_KEYS.indexOf(b.key))
    .slice(0,limit);
}

export function traitListText(items,{empty='no strong change'}={}){
  if(!items?.length)return empty;
  return items.map(x=>x.phrase).join(' · ');
}

export function visualChanges(currentGenes,baselineGenes,{limit=3,threshold=.012}={}){
  if(!currentGenes||!baselineGenes)return[];
  return GENE_KEYS.map(key=>{
    const current=currentGenes[key]??1,baseline=baselineGenes[key]??1,delta=current-baseline,meta=VISUAL_TRAITS[key];
    if(!meta||Math.abs(delta)<threshold)return null;
    return{key,delta,phrase:delta>0?meta.up:meta.down};
  }).filter(Boolean).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||GENE_KEYS.indexOf(a.key)-GENE_KEYS.indexOf(b.key)).slice(0,limit);
}

export function visualChangeText(currentGenes,baselineGenes,{limit=3,empty='looks much like the previous generation'}={}){
  const items=visualChanges(currentGenes,baselineGenes,{limit});
  return items.length?items.map(x=>x.phrase).join(' · '):empty;
}

export function shiftSentence(items,{subject='This generation'}={}){
  if(!items?.length)return `${subject} stays close to the previous generation.`;
  return `${subject} is ${naturalJoin(items.map(x=>x.phrase))}.`;
}

export function founderShift(lineage,animal,{limit=3}={}){
  const founder=lineage?.records?.get(lineage?.founderId);
  return founder&&animal?compareGenes(animal.genes,founder.genes,{limit}):[];
}

export function parentShift(lineage,animal,{limit=3}={}){
  if(!lineage||!animal)return[];
  const rec=lineage.records.get(animal.id);
  if(!rec)return[];
  const parent=rec.parentIds.map(id=>lineage.records.get(id)).filter(Boolean).sort((a,b)=>b.generation-a.generation||a.id-b.id)[0];
  return parent?compareGenes(animal.genes,parent.genes,{limit}):[];
}

export function strongestTraitText(animal){
  return traitListText(dominantTraits(animal,{limit:3}),{empty:'no strong trait bias'});
}

function naturalJoin(values){
  if(values.length<=1)return values[0]||'';
  if(values.length===2)return `${values[0]} and ${values[1]}`;
  return `${values.slice(0,-1).join(', ')}, and ${values.at(-1)}`;
}
