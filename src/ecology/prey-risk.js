// Prey risk and bite-back (Phase 3K Priority 4, creator decision 2026-10-16: keep cannibalism, but make it
// consequential and risky; no unconditional same-species protection). Before this, a bite on any prey was
// free to the hunter unless the prey carried a repel part: a Stalker attacking another Stalker, with the
// same jaws and the same size, risked nothing. Now one rule applies to every predator and prey, whatever
// the species:
//  - Bite-back. Prey with real attack anatomy (huntingAbility > 0) that survives a contact - hit or miss -
//    may bite the attacker: chance BITE_BACK x its attack ability x relative size (capped at 1.5) x its
//    remaining health; damage BITE_BACK_SHARE of the bite it would deal as a hunter. The wound heals,
//    infects and kills like any other (injury, healing physiology). A hand-steered player is never bitten
//    back automatically when it is the prey: its defence is the player's (brace, strike, flee).
//  - Appraisal. A hunter's prey choice (Simulation.bestPrey) weighs the expected bite-back injury against
//    its own health. The weight falls with hunger (a starving hunter accepts more risk) and with inherited
//    boldness (genes.temperament). Relationship: immediate kin remain excluded by preyPreference
//    (functional-diet.js); a recent mate (lastMate, or the father of the pregnancy) keeps MATE_RESTRAINT of
//    its value, never zero.
// Energy return (biomass), capture likelihood and defensive danger (juvenile-biology.js) are unchanged.
// ?preyRisk=0 restores free contact. All numbers are PROPOSALS for creator review.
import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {wildTraits} from '../organisms/wild-bodies.js';
import {preyBodyMass} from './prey-biomass.js';
import {huntingAbility} from './functional-diet.js';
export const PREY_RISK={enabled:true};
export const BITE_BACK=.45,BITE_BACK_SHARE=.4,MATE_RESTRAINT=.35,RISK_WEIGHT=1.5;
const clamp=(lo,hi,v)=>Math.max(lo,Math.min(hi,v));
const size=(pred,prey)=>preyBodyMass(prey)/Math.max(.001,preyBodyMass(pred));
export function biteBackChance(pred,prey){const atk=huntingAbility(prey);if(!atk)return 0;return clamp(0,.8,BITE_BACK*atk*Math.min(1.5,size(pred,prey))*clamp(0,1,(prey.health??100)/100))}
export function biteBackDamage(pred,prey){return Math.min(CFG.wildHunt.maxBite,55*size(pred,prey))*(wildTraits(prey).damage||1)*BITE_BACK_SHARE}
export function relationshipFactor(pred,prey){return pred.lastMate===prey.id||prey.lastMate===pred.id||prey.pregnant?.fatherId===pred.id||pred.pregnant?.fatherId===prey.id?MATE_RESTRAINT:1}
// Multiplier on a candidate's reward in prey choice (1 = no extra risk).
export function riskFactor(pred,prey){
  const rel=relationshipFactor(pred,prey),chance=biteBackChance(pred,prey);if(!chance)return rel;
  const s=SPECIES[pred.species],fed=s?clamp(0,1,pred.energy/s.maxEnergy):1,bold=clamp(.6,1.5,pred.genes?.temperament??1);
  const expected=chance*biteBackDamage(pred,prey)/Math.max(1,pred.health??100);
  return rel*Math.max(.05,1-RISK_WEIGHT*(.4+.6*fed)/bold*expected);
}
// Resolve a possible bite-back after a contact the prey survived. Returns the damage dealt (0 if none).
export function biteBack(sim,pred,prey){
  const chance=biteBackChance(pred,prey);if(!chance||!sim.rng.chance(chance))return 0;
  const damage=Math.min(biteBackDamage(pred,prey),Math.max(0,pred.health));if(!(damage>0))return 0;
  pred.health-=damage;if(pred.health>0)sim.injury?.onDamage?.(pred,{damage,attacker:prey});
  const st=sim.stats.preyRisk??={biteBacks:0,damage:0,sameSpecies:0};st.biteBacks++;st.damage+=damage;if(pred.species===prey.species)st.sameSpecies++;
  if(pred.player)sim.lastPlayerDamage={tick:sim.tickCount,amount:damage,rawAmount:damage,mantleReduction:0,coordinatedReduction:0,braceReduction:0,brace:null,attackerId:prey.id,species:prey.species,biteBack:true};
  return damage;
}
