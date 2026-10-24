import {SPECIES} from '../organisms/species.js';
import {REFERENCE_MASS,massPolicy,ANATOMICAL_MASS,basalResourceCosts} from '../organisms/body-mass.js';
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
// fasting-2 (creator decision 2026-10-23, option (b) of docs/YIELDS-2026-10-23.md): each animal's
// resting cost is calibrated to its own body, so every organism's full reserves last reserveDaysFood
// of food and reserveDaysWater of water at rest whatever its size or anatomy. fasting-1 calibrated the
// species' reference body, and founding wild bodies weigh 1.3-1.6 times that, so their reserves lasted
// about 9 days. Worlds saved under fasting-1 keep it.
export const METABOLISM_REFERENCE_BODY='metabolism/fasting-1';
export const METABOLISM=Object.freeze({policy:'metabolism/fasting-2',
 reserveDaysFood:15,reserveDaysWater:3.5,starveDays:3,thirstDays:1,
 weakEnergy:.25,weakWater:.2,weakSpeed:.8,tiredEnergy:.4,tiredWater:.35,tiredRecovery:.5,
 // Behaviour under real needs: seek water with this many days of it left at the animal's own resting
 // rate (body size, anatomy, heat), and top up at drinkable water below this share.
 seekWaterDays:2,topUpWater:.9,
 // A sip is a share of the body's water capacity, so a day's water takes minutes, not most of the day.
 sipShare:.1});
export function metabolismActive(sim){return sim?.metabolismRules===METABOLISM.policy||sim?.metabolismRules===METABOLISM_REFERENCE_BODY}
// Resting cost per biological step of a species' reference adult under the recorded rules.
export function referenceBasal(a){
 const s=SPECIES[a.species],anatomical=massPolicy(a)===ANATOMICAL_MASS;
 return anatomical?{energy:.052/REFERENCE_MASS*s.mass,water:.044/REFERENCE_MASS*s.mass}:{energy:s.baseMetabolism,water:s.waterUse};
}
// Multipliers on basalResourceCosts(a): exactly 1 on recorded worlds.
export function basalScale(sim,a){
 if(!metabolismActive(sim))return ONE;const s=SPECIES[a.species],own=sim.metabolismRules===METABOLISM.policy?basalResourceCosts(a):null,ref=own&&own.energy>0&&own.water>0?own:referenceBasal(a);
 // sim.metabolismExperiment (development measurement only, never set by the game) can vary the
 // water reserve for comparison runs.
 const waterDays=sim.metabolismExperiment?.waterDays??METABOLISM.reserveDaysWater;
 return{energy:s.maxEnergy/(METABOLISM.reserveDaysFood*BIO_STEPS_PER_DAY*ref.energy),water:s.maxHydration/(waterDays*BIO_STEPS_PER_DAY*ref.water)};
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
 if(core.metabolismRules!==undefined&&core.metabolismRules!==METABOLISM.policy&&core.metabolismRules!==METABOLISM_REFERENCE_BODY)throw Error('Unknown saved metabolism rules.');
 if(core.metabolismRules===undefined)delete sim.metabolismRules;
}
// Share of maximum water at which an animal starts to seek water: METABOLISM.seekWaterDays of its own
// resting water use in the present heat. Recorded worlds keep the fixed 0.58.
export function waterSeekShare(sim,a){
 if(!metabolismActive(sim))return .58;const s=SPECIES[a.species],temp=sim.climate?.temp??.5;
 const daily=basalResourceCosts(a).water*basalScale(sim,a).water*BIO_STEPS_PER_DAY*(1+temp*.3);
 return Math.min(.9,METABOLISM.seekWaterDays*daily/s.maxHydration);
}
// An animal standing at drinkable water tops up instead of walking away thirsty.
export function topUpHere(sim,a,share){return metabolismActive(sim)&&share<METABOLISM.topUpWater&&!!sim.world?.isDrinkable?.(a.x,a.y)}
// Water taken in one drinking action. Recorded worlds keep the fixed 5.2.
export function sipFor(sim,a){return metabolismActive(sim)?(SPECIES[a.species]?.maxHydration||100)*METABOLISM.sipShare:5.2}
