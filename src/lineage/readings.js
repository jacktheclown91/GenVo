import {syncAnatomy} from './evolution.js';

// v1.32 consolidation: forms and proto-traits are readings of inherited anatomy.
// A lineage form is how far a body has developed long reach or a compact frame; a
// proto-trait is how far one population-shaped body part has developed. Their strengths
// live only on `animal.anatomy`, next to the Stage D body parts, and their labels are read
// from whichever axis is developed. What is not anatomy (the generation a form appeared,
// the population a trait came from, how long it was reinforced, gene flow) is history and
// lives on `animal.formHistory` and `animal.protoHistory`.
// Stage G removed the Stage E `lineageForm` / `populationTrait` caches; saves convert them.

export const FORM_AXES=Object.freeze({forager:'reach',colony:'compact'});
export const PROTO_AXES=Object.freeze({
  'frugal-frame':'thrift','range-sense':'searchSense','watch-crest':'watchCrest','close-brood':'broodFrame',
  'dryland-skin':'dryMantle',splayfoot:'splayfoot','heat-shed-mantle':'heatMantle','cold-mantle':'coldMantle'
});
export const READING_AXES=Object.freeze({
  reach:'long limbs and reach',compact:'compact frame',
  thrift:'thrifty frame',searchSense:'searching senses',watchCrest:'watch crest',broodFrame:'close-brood frame',
  dryMantle:'dry mantle',splayfoot:'splayed feet',heatMantle:'heat-shedding mantle',coldMantle:'full cold mantle'
});
const FORM_KINDS=Object.keys(FORM_AXES),PROTO_IDS=Object.keys(PROTO_AXES);
const unit=v=>Math.max(0,Math.min(1,Number(v)||0));

// The most developed axis of a group, or null when none is developed.
function strongest(anatomy,keys,axisOf){
  if(!anatomy)return null;let best=null;
  for(const key of keys){const v=anatomy[axisOf[key]]||0;if(v>0&&(!best||v>best.strength))best={key,strength:v}}
  return best;
}
export function formFromAnatomy(anatomy){const b=strongest(anatomy,FORM_KINDS,FORM_AXES);return b?{kind:b.key,strength:b.strength}:null}
export function protoFromAnatomy(anatomy){const b=strongest(anatomy,PROTO_IDS,PROTO_AXES);return b?{id:b.key,strength:b.strength}:null}

function setGroup(anatomy,axes,axis,strength){for(const ax of Object.values(axes))anatomy[ax]=0;if(axis)anatomy[axis]=unit(strength)}

// Readings: what the body expresses, with its history. Pure; never changes the animal.
export function formReading(animal){const r=formFromAnatomy(animal?.anatomy);return r?{...(animal.formHistory||{}),kind:r.kind,strength:r.strength}:null}
export function protoReading(animal){const r=protoFromAnatomy(animal?.anatomy);return r?{...(animal.protoHistory||{}),id:r.id,strength:r.strength}:null}

// Writers: strength goes onto the body, history alongside it. kind/id null clears.
export function writeForm(animal,kind,strength=0,history={}){
  if(!animal)return null;const anatomy=animal.anatomy||syncAnatomy(animal),axis=FORM_AXES[kind]||null;
  setGroup(anatomy,FORM_AXES,axis,strength);
  if(axis){const {kind:_k,strength:_s,...rest}=history||{};animal.formHistory=rest}else delete animal.formHistory;
  return formReading(animal);
}
export function writeProto(animal,id,strength=0,history={}){
  if(!animal)return null;const anatomy=animal.anatomy||syncAnatomy(animal),axis=PROTO_AXES[id]||null;
  setGroup(anatomy,PROTO_AXES,axis,strength);
  if(axis){const {id:_i,strength:_s,...rest}=history||{};animal.protoHistory=rest}else delete animal.protoHistory;
  return protoReading(animal);
}

// Saves from before Stage G (and lineage records) carry `lineageForm` / `populationTrait`
// objects. Move their strength onto the body and the rest into history, then drop them.
export function migrateLegacyReadings(animal){
  if(!animal)return animal;
  if('lineageForm' in animal){const f=animal.lineageForm;if(FORM_AXES[f?.kind])writeForm(animal,f.kind,f.strength,f);delete animal.lineageForm}
  if('populationTrait' in animal){const t=animal.populationTrait;if(PROTO_AXES[t?.id])writeProto(animal,t.id,t.strength,t);delete animal.populationTrait}
  return animal;
}

// Convenience for tests, probes and tools that describe a form or trait as one object
// ({kind|id, strength, ...history}); null clears it.
export function setForm(animal,form){return writeForm(animal,form?.kind||null,form?.strength,form||{})}
export function setProto(animal,trait){return writeProto(animal,trait?.id||null,trait?.strength,trait||{})}
