import {PARTS} from '../lineage/part-registry.js';
// v1.63: the live organism's mounted mouth controls feeding and hunting.
// Founding labels are ancestry/save/UI identifiers, never the authority for food.
// These matrices describe WHAT A MOUTH CAN DO, not what a named species may eat.
// The plant/resource registry is the source of available food; ancestry can change
// without changing the physical capabilities of a creature.
import {PLANTS} from '../sim/config.js';
import {bodyMass} from '../organisms/body-mass.js';
import {SPECIES} from '../organisms/species.js';

const MOUTHS=Object.freeze({
  'grazing-mouth':{ground_producer:1,fruiting_shrub:.75,wetland_producer:.40,seed_producer:.60,woody_producer:.04,decomposer:.08},
  'nibbler-mouth':{ground_producer:.72,fruiting_shrub:.95,wetland_producer:1,seed_producer:.65,woody_producer:.20,decomposer:.70},
  'beak-mouth':{ground_producer:.35,fruiting_shrub:.75,wetland_producer:.25,seed_producer:1.20,woody_producer:.28,decomposer:.12},
  'kernel-beak':{ground_producer:.32,fruiting_shrub:.58,wetland_producer:.12,seed_producer:1.38,woody_producer:.32,decomposer:.02},
  'sucker-mouth':{ground_producer:.16,fruiting_shrub:.22,wetland_producer:.42,seed_producer:.18,decomposer:1.18,carrion:1.0},
  'filter-mouth':{ground_producer:.16,wetland_producer:.62,decomposer:.08,carrion:.10},
  'reed-sieve-mouth':{ground_producer:.10,wetland_producer:.82,decomposer:.08,carrion:.12},
  'tearing-jaw':{carrion:.90},'gape-mouth':{carrion:.65},
  'crushing-jaw':{carrion:.9,seed_producer:.30},'tusk-jaw':{carrion:.7,seed_producer:.25}
});
const HUNTING=Object.freeze({'tearing-jaw':1,'gape-mouth':.92,'crushing-jaw':.88,'tusk-jaw':.90});
const EMPTY=Object.freeze({});
const clamp=(lo,hi,x)=>Math.max(lo,Math.min(hi,x));
export function mouthOf(animal){return animal?.bodyPlan?.nodes?.find(n=>n.socket==='mouth')?.partId||null}
export function feedingProfile(animal){return MOUTHS[mouthOf(animal)]||EMPTY}
const legacyOnly=a=>!a?.bodyPlan?.nodes?.length; // old saves and explicit bodyless fixtures
export function plantPreference(animal,kind){
  if(legacyOnly(animal))return SPECIES[animal?.species]?.diets?.[kind]||0;
  if(kind==='carrion')return feedingProfile(animal).carrion||0;
  const plant=PLANTS[kind];if(!plant)return 0;
  const profile=feedingProfile(animal),whole=profile[plant.guild]||0,cracks=PARTS[mouthOf(animal)]?.actionCapabilities.includes('crush');return plant.dispersal?.animal&&cracks?Math.max(whole,profile.seed_producer||0):whole;
}
export function groundDiet(animal){
  if(legacyOnly(animal))return {...(SPECIES[animal?.species]?.diets||{})};
  const out={};for(const key of Object.keys(PLANTS)){const preference=plantPreference(animal,key);if(preference>0)out[key]=preference}
  const carrion=plantPreference(animal,'carrion');if(carrion>0)out.carrion=carrion;
  return out;
}
export function huntingAbility(animal){
  // Mouth installation/removal changes the capacity immediately; inheritance has
  // no separate species switch. Metabolic genes modulate efficacy, not eligibility.
  const jaw=legacyOnly(animal)?(SPECIES[animal?.species]?.hunter?1:0):(HUNTING[mouthOf(animal)]||0);
  return jaw?jaw*clamp(.72,1.28,animal?.genes?.digestion??1):0;
}
export function canHunt(animal){return huntingAbility(animal)>0}
// Effective predation stops at prey 2.1x the hunter's mass. A hunter with real attack anatomy may
// still ATTEMPT a weak bite on non-kin prey beyond that, up to 4x (creator-approved behaviour; the 4x
// and 0.35 values are provisional pending review: a newborn Stalker vs an adult rootling is 3.72x).
// Simulation.tryKill resolves such attempts as non-subduing and yields no meal.
export const EFFECTIVE_PREY_RATIO=2.1,WEAK_ATTEMPT_RATIO=4,WEAK_BITE_DAMAGE=.35;
export function weakBiteAttempt(pred,prey){
  if(!pred?.alive||!prey?.alive||pred===prey||(pred.id!=null&&pred.id===prey.id))return false;
  if(!huntingAbility(pred)||preyPreference(pred,prey)>0)return false;
  const family=new Set([pred.id,...(pred.parentIds||[])]);
  if(family.has(prey.id)||(prey.parentIds||[]).includes(pred.id)||(pred.parentIds?.length&&prey.parentIds?.some(id=>family.has(id))))return false;
  const ratio=bodyMass(prey)/Math.max(.1,bodyMass(pred));
  return ratio>EFFECTIVE_PREY_RATIO&&ratio<=WEAK_ATTEMPT_RATIO;
}
export function preyPreference(pred,prey){
  if(!pred?.alive||!prey?.alive||pred===prey||(pred.id!=null&&pred.id===prey.id))return 0;
  const attack=huntingAbility(pred);if(!attack)return 0;
  // Respect immediate relatives, not a forever-immutable species label.
  const family=new Set([pred.id,...(pred.parentIds||[])]);
  if(family.has(prey.id)||(prey.parentIds||[]).includes(pred.id)||
    (pred.parentIds?.length&&prey.parentIds?.some(id=>family.has(id))))return 0;
  const ratio=bodyMass(prey)/Math.max(.1,bodyMass(pred));
  // A powerful jaw can tackle comparable-sized prey; juveniles are edible and
  // independently smaller. No named predator/prey whitelist exists.
  if(ratio>EFFECTIVE_PREY_RATIO)return 0;
  return attack*clamp(.25,1.5,1.15-.25*ratio);
}
export function ecologicalCapabilities(animal){
  const mouth=mouthOf(animal),diet=groundDiet(animal);
  return {mouth,forage:diet,hunter:canHunt(animal),carrion:plantPreference(animal,'carrion')>0,
    seedCarrier:Object.keys(diet).some(kind=>PLANTS[kind]?.dispersal?.animal),
    filterFeeder:mouth==='reed-sieve-mouth'||mouth==='filter-mouth'};
}
