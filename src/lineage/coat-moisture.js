// Persistent wetness of inherited physical coats. A wet fur or feather
// mantle is not a new water/energy reserve: moisture is an observable
// condition of mounted anatomy, whose effects are paid in existing basal
// energy. All creatures use the same rule. No taxonomy, owner or AI switch.
import {planPartCounts} from './part-abilities.js';

export const COAT_MOISTURE=Object.freeze({
 policy:'inherited-coat-moisture/1',
 schema:1,
 // Fractional saturation per metabolism step. Immersion wets all coats but
 // feather structure sheds intermittent rain better than thick mammal fur.
 types:Object.freeze({
  'filament-tuft':Object.freeze({rain:.10,immersion:.45,dry:.17}),
  'fur-mantle':Object.freeze({rain:.17,immersion:.58,dry:.075}),
  'feather-mantle':Object.freeze({rain:.055,immersion:.34,dry:.16}),
  'proto-wing':Object.freeze({rain:.08,immersion:.39,dry:.13}),
  'flight-wing':Object.freeze({rain:.09,immersion:.42,dry:.12})
 })
});

const clamp=x=>Math.max(0,Math.min(1,x));
export function coatType(animal){
 const parts=planPartCounts(animal);
 for(const id of ['flight-wing','proto-wing','fur-mantle','feather-mantle','filament-tuft'])
  if(parts[id]>0)return id;
 return null;
}
export function validateCoatMoisture(animal){
 const v=animal?.coatWetness;
 if(v!==undefined&&(!Number.isFinite(v)||v<0||v>1))
  throw Error('Invalid saved coat moisture.');
 return true;
}
export function coatMoistureStatus(animal){
 const kind=coatType(animal),wetness=kind?(animal?.coatWetness??0):0;
 validateCoatMoisture(animal);
 const state=wetness>=.73?'soaked':wetness>=.25?'damp':'dry';
 return{kind,wetness,state,label:kind?state+' '+kind.replaceAll('-',' '):'no insulating coat'};
}

// A life-step evolution, not a per-frame process. Wetness can persist across
// swimming, rain, shelter and a saved World transition. Old worlds without
// the saved policy retain the exact original instantaneous-wetness formula.
export function advanceCoatMoisture(animal,{rain=0,temperature=.55,moisture=0,immersed=false,sheltered=false,waterResistance=0}={}){
 const kind=coatType(animal);
 if(!kind){
  if(animal?.coatWetness!==undefined)animal.coatWetness=0;
  return 0;
 }
 validateCoatMoisture(animal);
 if(![rain,temperature,moisture,waterResistance].every(Number.isFinite)||waterResistance<0||waterResistance>.8)
  throw Error('Invalid climate exposure at coat.');
 const coat=COAT_MOISTURE.types[kind],previous=animal.coatWetness??0;
 const precipitation=clamp((rain-.48)/.55)*clamp((moisture-.35)/.4);
 const rainfall=sheltered?precipitation*.12:precipitation;
 // Humid cold climates retard drying. Sun/warm air speeds it; a sheltered
 // resting site offers protection without magically removing stored wetness.
 const drying=coat.dry*(.42+clamp((temperature+.05)/.9)*.9)*
  (1-.25*clamp(moisture));
 // Hydrophobic wax must be present as a physical inherited organ. The
 // originating seasonal-coat authority supplies resistance; this controller
 // cannot invent it from weather, rendered colors or a species label.
 const exposure=(immersed?coat.immersion:coat.rain*rainfall)*(1-waterResistance);

 const next=clamp(previous+(1-previous)*exposure-(immersed?0:drying*previous));
 const result=next<1e-6?0:next;
 animal.coatWetness=result;
 return result;
}
