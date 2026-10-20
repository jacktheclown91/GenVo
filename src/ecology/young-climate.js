// Climate-driven viability for a funded young organism, live-born or hatched.
// No new juvenile resource stock or named-species fitness reward. The baby's
// inherited climate allele sets its thermal comfort; real local temperature
// and soil humidity set the cost paid from its existing energy and hydration.
import {SPECIES} from '../organisms/species.js';

export const YOUNG_CLIMATE=Object.freeze({
 policy:'inherited-young-climate/1',
 susceptibleMaturityFraction:.36,
 coldTolerance:.035,
 heatTolerance:.045,
 coldExposureScale:2.6,
 heatExposureScale:1.3,
 hotWaterPerStep:.21,
 dryWaterPerStep:.05,
 minimumHumidity:.42
});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

export function validateYoungClimatePolicy(world,environment){
 if(environment?.youngClimatePolicy===undefined)return;
 if(environment.youngClimatePolicy!==YOUNG_CLIMATE.policy||
  environment.embryoClimatePolicy!=='inherited-embryo-climate/1'||
  environment.schema!==6||world?.generator!=='planetary/1')
  throw Error('Invalid inherited young-climate policy.');
}

// Pure, deterministic observation. No second probability roll or stateful
// accumulator. The existing metabolism debits the returned water consumption
// once per normal life step and handles starvation/dehydration as before.
export function youngClimateExposure(animal,temperature,humidity){
 const spec=SPECIES[animal?.species],gene=animal?.genes?.climate;
 if(!spec||!Number.isFinite(gene)||gene<=0||
  ![temperature,humidity,animal?.age].every(Number.isFinite))
  throw Error('Invalid physical young-climate inputs.');
 const stage=clamp(animal.age/Math.max(1,spec.maturity));
 const vulnerability=clamp(1-stage/YOUNG_CLIMATE.susceptibleMaturityFraction);
 const comfort=clamp(gene*.55,.15,.85);
 const cold=Math.max(0,comfort-temperature-YOUNG_CLIMATE.coldTolerance);
 const hot=Math.max(0,temperature-comfort-YOUNG_CLIMATE.heatTolerance);
 const dry=Math.max(0,YOUNG_CLIMATE.minimumHumidity-humidity);
 return{
  comfort,cold,hot,vulnerability,
  coldMultiplier:1+cold*YOUNG_CLIMATE.coldExposureScale*vulnerability,
  heatMultiplier:1+hot*YOUNG_CLIMATE.heatExposureScale*vulnerability,
  extraWater:(hot*YOUNG_CLIMATE.hotWaterPerStep+
    dry*YOUNG_CLIMATE.dryWaterPerStep)*vulnerability
 };
}
