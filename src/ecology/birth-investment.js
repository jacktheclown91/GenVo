// Pregnancy remembers only reserves actually paid. An exhausted parent cannot
// lend negative energy to an offspring. Existing gestation/litter rules remain.
export function debitReserve(animal,requested){
  const paid=Math.min(Math.max(0,animal.energy),Math.max(0,requested));
  animal.energy-=paid;return paid;
}
import {toAbsolute} from '../organisms/body-size.js';
// Budgets are absolute food and water; each parent pays in its own reserve units.
export function birthFunding(mother,species,pregnancy){
  const payment=Math.min(Math.max(0,mother.energy),pregnancy?.birthCost??species.reproCost);
  // Older current-schema pregnancies have no recorded investment. Preserve
  // gestation/inheritance, but do not invent or charge conception money again.
  return{payment,budget:toAbsolute(mother,payment)+Math.max(0,pregnancy?.reserveInvestment||0),hydrationBudget:toAbsolute(mother,Math.max(0,mother.hydration))};
}

// A configured brood is committed at conception. The legacy litter rule remains
// available for older pregnancies and species without a brood profile.
import {DUAL_MATERNAL_COST,DUAL_PATERNAL_COST} from '../reproduction/reproductive-anatomy.js';

export function conceptionFunding(rng,mother,father,species,mode='live',{dual=false}={}){
  // Dual-bearing anatomy carries an extra fixed reproductive switching cost,
  // spent by parents and never recycled into hatchling/newborn budgets.
  const dualCostPaid=dual?{mother:debitReserve(mother,DUAL_MATERNAL_COST),father:debitReserve(father,DUAL_PATERNAL_COST)}:null;
  const profile=species.brood;
  // Eggs gain a possible clutch-size advantage but spread a finite, larger
  // total parental investment over more young. Neither mode creates reserves.
  const plannedLitterSize=mode==='egg'?rng.int(3,5):profile?rng.int(profile.min,profile.max):null;
  const cost=mode==='egg'?plannedLitterSize*(profile?.perOffspringCost??17):profile?profile.perOffspringCost*plannedLitterSize:species.reproCost;
  const reserveInvestment=toAbsolute(mother,debitReserve(mother,cost*.35))+toAbsolute(father,debitReserve(father,cost*.12));
  return profile?{plannedLitterSize,birthCost:cost,reserveInvestment,dualCostPaid}:{reserveInvestment,dualCostPaid};
}
