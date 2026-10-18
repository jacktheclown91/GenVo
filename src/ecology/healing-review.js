import {SPECIES} from '../organisms/species.js';
import {preyBodyMass,regrowPreyBiomass} from './prey-biomass.js';

// Healing physiology (Phase 3I, creator decision 2026-10-15; replaces the Phase 3H flat-rate candidate).
// One rule for every animal, wild or player. Health is regained per metabolism step (8 a day) at
//   HEAL_BASE x nourishment x activity x infection x development x inherited immunity x healing adaptations
//  - nourishment: the lower of energy and water fractions; full at >= .60, .55 at >= .38, .20 at >= .20,
//    none below (a starving or parched body does not repair);
//  - activity: resting (not moved for half a second) 1.5, resting in cover 1.6, under a family shelter 1.8;
//    moving 1; straining (fleeing, chasing, sprinting) .4 — the same modes the injury model already uses;
//  - infection .5; juveniles (still growing) 1.25.
// Repair costs energy: restoring 100 health rebuilds REPAIR_SHARE of body mass at tissue energy (34 per
// unit mass, as prey and growth) over growth efficiency .75. Tissue a hunter actually ate is charged by
// regrowPreyBiomass and not again. So a severe 60-health wound heals in about 10 days resting well fed and
// about 17 active, never in a few days, and only while the body can pay. Previous rule: 0.08 per step
// (0.64 a day) above 65% energy. ?healing=0 restores it. All numbers are PROPOSALS.
export const HEALING_REVIEW={enabled:true};
export const HEAL_PER_STEP=.08,HEAL_BASE=.45,REPAIR_SHARE=.25,REPAIR_EFFICIENCY=.75,TISSUE_ENERGY=34;
export const ACTIVITY_FACTOR={'shelter-rest':1.8,'cover-rest':1.6,rest:1.5,active:1,strained:.4,none:1};
export function nourishmentFactor(a){
  const s=SPECIES[a.species];if(!s)return 0;const n=Math.min(a.energy/s.maxEnergy,a.hydration/s.maxHydration);
  return n>=.6?1:n>=.38?.55:n>=.2?.2:0;
}
// Health regained this step and its energy cost; mode comes from InjuryRecoveryController.mode().
export function healingStep(sim,a,fx,mode='none'){
  const s=SPECIES[a.species];if(!s||a.health>=100)return 0;
  if(!HEALING_REVIEW.enabled){if(a.energy/s.maxEnergy<=.65)return 0;const gain=Math.min(100-a.health,HEAL_PER_STEP*a.genes.immunity*fx.healing);a.health+=gain;regrowPreyBiomass(a,gain);return gain}
  const juvenile=a.age<s.maturity?1.25:1,rate=HEAL_BASE*nourishmentFactor(a)*(ACTIVITY_FACTOR[mode]??1)*(a.infected?.5:1)*juvenile*a.genes.immunity*fx.healing;
  if(!(rate>0))return 0;
  const gain=Math.min(100-a.health,rate),before=a.energy;a.health+=gain;regrowPreyBiomass(a,gain);
  const repair=gain/100*preyBodyMass(a)*REPAIR_SHARE*TISSUE_ENERGY/REPAIR_EFFICIENCY,already=Math.max(0,before-a.energy);
  a.energy=Math.max(0,a.energy-Math.max(0,repair-already));
  if(sim?.stats)sim.stats.healingEnergy=(sim.stats.healingEnergy||0)+Math.max(repair,already);
  return gain;
}
