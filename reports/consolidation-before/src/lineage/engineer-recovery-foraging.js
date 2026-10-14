// Pass ER: injured animals with functional digging limbs may protect their
// recovery energy reserve before resuming optional roaming and reproduction.
// The ordinary hunger threshold is unchanged for healthy animals. Food, water,
// anatomy, hazard, root cooldown and all consumption costs remain authoritative.
import {SPECIES} from '../organisms/species.js';
import {hasPart} from './part-abilities.js';
export const ENGINEER_RECOVERY=Object.freeze({maxHealth:65,energyReserve:.78});
export function needsRecoveryForage(animal){
  const spec=SPECIES[animal?.species];
  return !!(animal?.alive&&!animal.player&&!animal.lineage&&spec&&
    hasPart(animal,'digging-forelimb')&&animal.health<ENGINEER_RECOVERY.maxHealth&&
    animal.energy/spec.maxEnergy<ENGINEER_RECOVERY.energyReserve);
}
