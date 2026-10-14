import {bodyMass} from '../organisms/body-mass.js';
import {CFG} from '../sim/config.js';

// The renderer's shared linear growth determines body volume. An immature
// creature cannot supply an adult carcass simply because its species is large.
export function preyBodyMass(animal){
  return bodyMass(animal);
}

// Wound meals, the final kill meal and deposited carrion share one body budget.
// This is persistent animal state, not a population recovery rule.
export function remainingPreyBiomass(animal){
  const mass=preyBodyMass(animal);
  return Math.max(0,mass-Math.max(0,animal.predationConsumedMass||0));
}
export function consumePreyBiomass(animal,requested){
  const got=Math.min(remainingPreyBiomass(animal),Math.max(0,requested));
  animal.predationConsumedMass=(animal.predationConsumedMass||0)+got;
  return got;
}
// Regrown edible tissue is funded by the animal's food-energy reserves.
export function regrowPreyBiomass(animal,healthGain){
  const missing=Math.max(0,animal.predationConsumedMass||0);
  const mass=preyBodyMass(animal);
  const got=Math.min(missing,mass*Math.max(0,healthGain)/100*CFG.wildHunt.biteMeal,Math.max(0,animal.energy)/34);
  if(got){animal.predationConsumedMass=missing-got;animal.energy-=got*34}
  return got;
}
