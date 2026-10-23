import {SPECIES} from '../organisms/species.js';
import {REFERENCE_MASS,massPolicy,ANATOMICAL_MASS} from '../organisms/body-mass.js';
import {BIO_STEPS_PER_DAY} from '../sim/day-clock.js';

// Real daily needs (creator decision 2026-10-23, GenVo v1 survival rebalance). Before this policy a
// resting adult lost about 0.34% of its energy and water a day and could fast for its whole life.
// Now, for every organism alike, the resting costs of a species' reference adult are calibrated so
// that full reserves last about RESERVE_DAYS of food and of water at rest in a comfortable place.
// Everything that already modified resting costs still does: body size and anatomy, inherited
// metabolism, cold and heat, aridity, sleep and torpor, young exposure. Exertion, travel,
// reproduction and healing keep their own real costs on top. Once reserves are gone the body
// fails within days (food) or a day (water), so a healthy resting adult starting from typical
// reserves starves in about 14 to 21 days and dies of thirst in about 3 to 5. Penalties start
// well before death: below WEAK reserves an animal moves more slowly, and below TIRED reserves the
// controlled creature's breath recovers more slowly; healing already slows with poor nourishment
// and breeding is already gated by condition. Worlds recorded before this policy are unchanged.
export const METABOLISM=Object.freeze({policy:'metabolism/fasting-1',
 reserveDaysFood:15,reserveDaysWater:3.5,starveDays:3,thirstDays:1,
 weakEnergy:.25,weakWater:.2,weakSpeed:.8,tiredEnergy:.4,tiredWater:.35,tiredRecovery:.5});
export function metabolismActive(sim){return sim?.metabolismRules===METABOLISM.policy}
// Resting cost per biological step of a species' reference adult under the recorded rules.
function referenceBasal(a){
 const s=SPECIES[a.species],anatomical=massPolicy(a)===ANATOMICAL_MASS;
 return anatomical?{energy:.052/REFERENCE_MASS*s.mass,water:.044/REFERENCE_MASS*s.mass}:{energy:s.baseMetabolism,water:s.waterUse};
}
// Multipliers on basalResourceCosts(a): exactly 1 on recorded worlds.
export function basalScale(sim,a){
 if(!metabolismActive(sim))return ONE;const s=SPECIES[a.species],ref=referenceBasal(a);
 return{energy:s.maxEnergy/(METABOLISM.reserveDaysFood*BIO_STEPS_PER_DAY*ref.energy),water:s.maxHydration/(METABOLISM.reserveDaysWater*BIO_STEPS_PER_DAY*ref.water)};
}
const ONE=Object.freeze({energy:1,water:1});
// Health lost per biological step with no energy, or no water, left.
export function starvationDamage(sim){return metabolismActive(sim)?100/(METABOLISM.starveDays*BIO_STEPS_PER_DAY):1.1}
export function thirstDamage(sim){return metabolismActive(sim)?100/(METABOLISM.thirstDays*BIO_STEPS_PER_DAY):1.55}
const clamp01=v=>Math.max(0,Math.min(1,v));
function reserves(a){const s=SPECIES[a.species];return s?{e:a.energy/s.maxEnergy,w:a.hydration/s.maxHydration}:{e:1,w:1}}
// Movement speed factor from body condition: 1 above the weak thresholds, down to weakSpeed when empty.
export function conditionSpeed(sim,a){
 if(!metabolismActive(sim))return 1;const r=reserves(a),M=METABOLISM,f=Math.min(clamp01(r.e/M.weakEnergy),clamp01(r.w/M.weakWater));
 return M.weakSpeed+(1-M.weakSpeed)*f;
}
// Breath-recovery factor from body condition for the controlled creature's exertion.
export function conditionRecovery(sim,a){
 if(!metabolismActive(sim))return 1;const r=reserves(a),M=METABOLISM,f=Math.min(clamp01(r.e/M.tiredEnergy),clamp01(r.w/M.tiredWater));
 return M.tiredRecovery+(1-M.tiredRecovery)*f;
}
export function restoreMetabolismRules(sim,core){
 if(core.metabolismRules!==undefined&&core.metabolismRules!==METABOLISM.policy)throw Error('Unknown saved metabolism rules.');
 if(core.metabolismRules===undefined)delete sim.metabolismRules;
}
