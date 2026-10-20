// Temperature-driven reversible coat growth for evolved anatomical covering.
// A creature cannot grow a winter coat without a mounted inherited precursor,
// and growing material consumes its EXISTING food energy. No new food reserve,
// species switch, random draw, or adult genome/body-plan edit occurs.
import {planPartCounts} from './part-abilities.js';
import {coatType} from './coat-moisture.js';

export const SEASONAL_COAT=Object.freeze({
 policy:'funded-seasonal-coat/1',
 defaultDensity:.52,
 // Density affects heat retention, never inherited part count or adult mass.
 growthPerStep:.012,
 sheddingPerStep:.026,
 energyPerDensity:2.4,
 minimumEnergyShare:.16,
 types:Object.freeze({
  'filament-tuft':Object.freeze({minimum:.30,maximum:.74,coldTarget:.72,warmTarget:.32}),
  'fur-mantle':Object.freeze({minimum:.22,maximum:1,coldTarget:1,warmTarget:.25}),
  'feather-mantle':Object.freeze({minimum:.38,maximum:1,coldTarget:.96,warmTarget:.42}),
  'proto-wing':Object.freeze({minimum:.64,maximum:1,coldTarget:.92,warmTarget:.68}),
  'flight-wing':Object.freeze({minimum:.78,maximum:1,coldTarget:1,warmTarget:.82})
 })
});
const clamp=x=>Math.max(0,Math.min(1,x));

export function validateSeasonalCoat(animal){
 const density=animal?.coatDensity;
 if(density!==undefined&&(!Number.isFinite(density)||density<0||density>1))
  throw Error('Invalid saved seasonal-coat density.');
 return true;
}

export function seasonalCoatProfile(animal){
 const kind=coatType(animal);
 const density=kind?(animal?.coatDensity??SEASONAL_COAT.defaultDensity):0;
 validateSeasonalCoat(animal);
 const wax=(planPartCounts(animal)['wax-plates']||0);
 // A prior armor-plate ancestor is required by wax-plates in the existing
 // canonical part registry. Wax coating only improves ACTUAL insulating covers;
 // its part upkeep and hot-weather cost already occur in body physiology.
 const waterResistance=kind&&wax?Math.min(.48,.28+.10*Math.min(2,wax-1)):0;
 return {kind,density,waterResistance,
  label:!kind?'no insulating coat':density>=.79?'dense '+kind.replaceAll('-',' '):
    density<=.4?'thin '+kind.replaceAll('-',' '):'growing '+kind.replaceAll('-',' ')};
}

export function advanceSeasonalCoat(animal,{
 temperature=.55,comfort=.55,maximumEnergy=100,seasonTemperature=temperature
}={}){
 if(![temperature,comfort,maximumEnergy,seasonTemperature].every(Number.isFinite)||
     maximumEnergy<=0)throw Error('Invalid physical seasonal-coat environment.');
 const rule=SEASONAL_COAT,profile=seasonalCoatProfile(animal),kind=profile.kind;
 if(!kind){
  if(animal?.coatDensity!==undefined)animal.coatDensity=0;
  return{...profile,density:0,target:0,energyCost:0,grown:0,shed:0};
 }
 const body=rule.types[kind];
 const current=animal.coatDensity===undefined
   ?Math.max(body.minimum,Math.min(body.maximum,rule.defaultDensity))
   :animal.coatDensity;
 // Weather changes are filtered by the region's actual seasonal mean so one
 // brief cold rain does not grow a full winter mantle.
 const effectiveTemp=temperature*.65+seasonTemperature*.35;
 const cold=clamp((comfort+.12-effectiveTemp)/.42);
 const target=Math.max(body.minimum,Math.min(body.maximum,
  body.warmTarget+(body.coldTarget-body.warmTarget)*cold));
 let grown=0,shed=0,energyCost=0;
 if(target>current){
  const reserve=maximumEnergy*rule.minimumEnergyShare;
  const available=Math.max(0,(Number.isFinite(animal.energy)?animal.energy:0)-reserve);
  grown=Math.min(target-current,rule.growthPerStep,available/rule.energyPerDensity);
  energyCost=grown*rule.energyPerDensity;
  if(energyCost>0)animal.energy-=energyCost;
 }else if(target<current){
  shed=Math.min(current-target,rule.sheddingPerStep);
 }
 const density=Math.max(body.minimum,Math.min(body.maximum,current+grown-shed));
 animal.coatDensity=density;
 return{...profile,density,target,grown,shed,energyCost};
}
