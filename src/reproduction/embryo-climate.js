// Heritable embryo climate fitness is evaluated from the parents' EXISTING
// frozen conception-time genes. Eggs pay for humidity loss from their actual
// finite hydration. No new gene, random mutation, food reserve, or species gate.
export const EMBRYO_CLIMATE=Object.freeze({
 policy:'inherited-embryo-climate/1',
 coldTolerance:.095,
 heatTolerance:.115,
 temperatureDamage:1.85,
 hydrationLoss:.035,
 hotEvaporation:.055,
 dryEvaporation:.085,
 nestEvaporationReduction:.55
});
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

export function validateEmbryoClimatePolicy(world,environment){
 if(environment?.embryoClimatePolicy===undefined)return;
 if(world?.generator!=='planetary/1'||environment.schema!==6||
    environment.embryoClimatePolicy!==EMBRYO_CLIMATE.policy)
  throw Error('Invalid inherited embryo-climate policy.');
}
export function validateEmbryoClimate(egg){
 if(egg?.climateWaterSpent!==undefined&&
   (!Number.isFinite(egg.climateWaterSpent)||egg.climateWaterSpent<0))
  throw Error('Invalid saved embryo climate water expenditure.');
 if(egg?.climateDays!==undefined&&
   (!Number.isSafeInteger(egg.climateDays)||egg.climateDays<0))
  throw Error('Invalid saved embryo climate days.');
 return true;
}
export function embryoThermalPreference(egg){
 const mother=egg?.maternalInheritance?.genes?.climate;
 const father=egg?.paternalInheritance?.genes?.climate;
 // Older complete inheritance snapshots contain these genes. A missing
 // ancestral allele falls back to the historical neutral temperature, not a
 // fabricated mutation or a living parent's later edited body.
 if(mother!==undefined&&(!Number.isFinite(mother)||mother<=0))throw Error('Invalid maternal embryo climate inheritance.');
 if(father!==undefined&&(!Number.isFinite(father)||father<=0))throw Error('Invalid paternal embryo climate inheritance.');
 if(mother===undefined&&father===undefined)return .55;
 const average=(mother??father)+(father??mother);
 return clamp(.55*average*.5,.15,.85);
}
export function embryoClimateReading(world,egg,nest=null){
 const i=world.idx(egg.x,egg.y);
 if(world.water[i])return{quality:0,waterLoss:0,comfort:embryoThermalPreference(egg),flooded:true};
 const temperature=world.temperature[i],moisture=world.moisture[i];
 if(!Number.isFinite(temperature)||!Number.isFinite(moisture))
  throw Error('Invalid actual embryo incubation climate.');
 const target=embryoThermalPreference(egg);
 const colder=Math.max(0,target-temperature-EMBRYO_CLIMATE.coldTolerance);
 const hotter=Math.max(0,temperature-target-EMBRYO_CLIMATE.heatTolerance);
 const atmosphericDry=Math.max(0,.42-moisture);
 const raw=clamp(1-(colder+hotter)*EMBRYO_CLIMATE.temperatureDamage-
   atmosphericDry*.6);
 // A supported constructed nest protects eggs but never creates water or
 // overrides flooding. Its current integrity is paid for by plant materials
 // and parental nest care in the existing nest ecology.
 const integrity=clamp(nest?.integrity||0);
 const quality=clamp(raw+(1-raw)*integrity*.48);
 const waterLoss=EMBRYO_CLIMATE.hydrationLoss+
  hotter*EMBRYO_CLIMATE.hotEvaporation+
  atmosphericDry*EMBRYO_CLIMATE.dryEvaporation;
 return{quality,waterLoss:waterLoss*(1-integrity*EMBRYO_CLIMATE.nestEvaporationReduction),
  comfort:target,flooded:false};
}
export function advanceEmbryoClimate(world,egg,nest=null){
 validateEmbryoClimate(egg);
 const climate=embryoClimateReading(world,egg,nest);
 if(climate.flooded)return{...climate,conditionLoss:1,waterSpent:0};
 const available=egg.hydration??0;
 if(!Number.isFinite(available)||available<0)
  throw Error('Invalid funded embryo hydration.');
 const spent=Math.min(available,climate.waterLoss);
 egg.hydration=available-spent;
 egg.climateWaterSpent=(egg.climateWaterSpent||0)+spent;
 egg.climateDays=(egg.climateDays||0)+1;
 // Finite reserves determine whether the embryo can continue incubating.
 // Even the best genotype cannot create hydration, and parental care does
 // not guarantee survival of a clutch laid into unsuitable conditions.
 const conditionLoss=(climate.quality>=.75?0:(1-climate.quality)*.18+.015)+
   (egg.hydration<=1e-10?.22:0);
 return{...climate,conditionLoss,waterSpent:spent};
}
