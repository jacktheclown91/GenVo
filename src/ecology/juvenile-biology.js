import {bodyMass} from '../organisms/body-mass.js';
import {SPECIES} from '../organisms/species.js';
import {developmentFor} from '../family/family.js';
import {partEffectFactors} from '../lineage/part-abilities.js';
import {wildTraits} from '../organisms/wild-bodies.js';
import {preyBodyMass} from './prey-biomass.js';
import {FRESHWATER_FOOD} from './freshwater-food.js';

// Milestone A (creator decision 2026-10-15): juvenile development costs real resources, and hunters
// appraise prey realistically. Provisional development defaults; ?juvenileBiology=0 disables both.
//
// Funded growth. A juvenile's body grows on the shared developmental curve (developmentFor). Each day it
// must pay for the tissue it adds: cost = added mass x tissue energy / growth efficiency / inherited
// metabolism. Tissue energy is the same energy per unit body mass that predators obtain from prey
// biomass, so energy is neither invented nor lost between growth and predation. The newborn's starting
// reserves (birth investment) are not charged again: only post-natal mass gain is paid. If paying would
// drop reserves below the growth floor, the juvenile does not grow that day: its developmental clock
// (age) waits. Maintenance metabolism and starvation are unchanged.
//
// Prey appraisal. A hunter weighs a candidate's reward by its capture likelihood (the same speed, legs,
// body-ratio and vulnerability terms the real bite uses, without situational modifiers) and by its
// defensive danger (repel, armour, and relative size). Small prey is easier and safer but smaller; a large
// adult offers more food at more risk. Bite resolution itself (Simulation.tryKill) is unchanged.
// All numbers are PROPOSALS for creator review.
export const JUVENILE_SWITCH={growthCost:true,preyAppraisal:true};
export const GROWTH_EFFICIENCY=.75,GROWTH_RESERVE_FLOOR=.25,TISSUE_ENERGY_PER_MASS=FRESHWATER_FOOD.detritus.nutrition;

const massAt=(animal,age)=>bodyMass({...animal,age});
export function growthCostForDay(animal){
  const s=SPECIES[animal?.species];if(!s||animal.age>=s.maturity)return 0;
  const gain=Math.max(0,massAt(animal,animal.age+1)-massAt(animal,animal.age));
  return gain*TISSUE_ENERGY_PER_MASS/GROWTH_EFFICIENCY/Math.max(.5,animal.genes?.metabolism??1);
}
// Called once per animal at each day boundary in place of a plain age++.
export function advanceAgeDay(animal,stats=null){
  const s=SPECIES[animal.species];
  if(!JUVENILE_SWITCH.growthCost||!s||animal.age>=s.maturity){animal.age++;return}
  const cost=growthCostForDay(animal),floor=s.maxEnergy*GROWTH_RESERVE_FLOOR;
  if(animal.energy-cost>=floor){animal.energy-=cost;animal.age++;animal.growthPaid=(animal.growthPaid||0)+cost;if(stats)stats.growthEnergy=(stats.growthEnergy||0)+cost}
  else{animal.growthDelayDays=(animal.growthDelayDays||0)+1;if(stats)stats.growthDelays=(stats.growthDelays||0)+1}
}
export function captureLikelihood(pred,prey){
  const ps=SPECIES[pred.species],qs=SPECIES[prey.species];if(!ps||!qs)return 0;
  const legs=(wildTraits(pred).chaseSpeed||1)/Math.max(.5,partEffectFactors(prey)?.landSpeed??1);
  const bodyRatio=preyBodyMass(pred)/Math.max(.001,preyBodyMass(prey));
  return Math.min(.9,(.18+.18*((pred.genes?.motion??1)/(prey.genes?.motion??1))*legs+.10*bodyRatio)*(qs.predationVulnerability??1));
}
export function defensiveDanger(pred,prey){
  const f=partEffectFactors(prey)||{},size=preyBodyMass(prey)/Math.max(.001,preyBodyMass(pred));
  return Math.max(0,Math.min(.8,(f.repel||0)+.5*(1-(f.damageTaken??1))+.25*Math.max(0,size-.5)));
}
// Multiplier applied to a candidate's reward in wild prey choice.
export function preyAppraisal(pred,prey){
  if(!JUVENILE_SWITCH.preyAppraisal)return 1;
  return captureLikelihood(pred,prey)*(1-defensiveDanger(pred,prey));
}
