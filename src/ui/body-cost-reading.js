import {bodyMass,adultBodyMass,massPolicy,ANATOMICAL_MASS} from '../organisms/body-mass.js';
import {growthCostForDay,GROWTH_RESERVE_FLOOR,JUVENILE_SWITCH} from '../ecology/juvenile-biology.js';
import {SPECIES} from '../organisms/species.js';

// Read the living animal's own authority. Never reconstruct missing historical
// tissue or treat the family's next-generation design as already grown mass.
export function bodyCostReading(animal){
  if(!animal?.alive)return null;
  const currentMass=bodyMass(animal),adultMass=adultBodyMass(animal),cost=growthCostForDay(animal),floor=SPECIES[animal.species].maxEnergy*GROWTH_RESERVE_FLOOR;
  const growing=animal.age<SPECIES[animal.species].maturity,paidGrowth=JUVENILE_SWITCH.growthCost;
  const canPay=growing&&paidGrowth&&animal.energy-cost>=floor;
  const next=growing?(paidGrowth?`Next growth needs ${cost.toFixed(2)} energy. ${canPay?'Reserves can cover it.':'Growth waits until enough energy remains after payment.'}`:'Growth payment is disabled.'): 'Fully grown.';
  const basis=massPolicy(animal)===ANATOMICAL_MASS?'Anatomy sets this body load. More load costs energy to grow and move.':'This older world retains its original body-load rules.';
  return{currentMass,adultMass,nextGrowthEnergy:cost,growing,paidGrowth,canPay,text:`Body mass ${currentMass.toFixed(2)} / ${adultMass.toFixed(2)} adult (relative units). ${next} ${basis}`};
}
