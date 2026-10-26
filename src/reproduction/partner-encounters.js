import {reproductiveCompatibility} from './reproductive-compatibility.js';
import {breedingEnergyGate} from '../ecology/breeding-calibration.js';
// Pass EP: explainable, reciprocal partner encounters for autonomous engineering
// colonies. This code neither grants consent nor conceives animals. It only
// evaluates whether two physically present adults can pursue each other;
// tryMate remains the final authority for reproduction and carrying capacity.
import {SPECIES} from '../organisms/species.js';
import {hasPart,partEffectFactors} from '../lineage/part-abilities.js';

export const PARTNER_ENCOUNTER=Object.freeze({responseRadius:3.5,minResponseDrive:.60,minHydration:.65,minHealth:65});
// Ordinary displays retain their established health and anatomy-derived energy gates.
// A positive water reserve is required; the colony profile above remains unchanged.
export const COURTSHIP_READINESS=Object.freeze({minHealth:55,minHydration:0});

export function engineeringCourtshipSpecies(a){
  return !!a&&!a.player&&!a.lineage&&SPECIES[a.species]?.social?.mode==='colony'&&hasPart(a,'digging-forelimb');
}

// Reason codes are stable enough for tests and eventual player-facing behavior
// explanations. Assess current state rather than treating it as inherited genes.
export function partnerAvailability(sim,a,b,readiness=PARTNER_ENCOUNTER){
  if(!a?.alive||!b?.alive||a.id===b.id)return {available:false,reason:'absent'};
  if(!reproductiveCompatibility(a,b).enabled||a.sex===b.sex)return {available:false,reason:'incompatible'};
  const species=SPECIES[a.species],partnerSpec=SPECIES[b.species];
  if(!species||!partnerSpec||a.age<species.maturity||b.age<partnerSpec.maturity)return {available:false,reason:'immature'};
  if(a.pregnant||b.pregnant||a.reproCooldown>0||b.reproCooldown>0)return {available:false,reason:'occupied'};
  // Colony physiology follows anatomy/species, never who currently controls it.
  const colonyAnatomy=animal=>SPECIES[animal.species]?.social?.mode==='colony'&&hasPart(animal,'digging-forelimb');
  const ordinaryCourtship=readiness===COURTSHIP_READINESS&&!colonyAnatomy(a)&&!colonyAnatomy(b);
  const profile=ordinaryCourtship?COURTSHIP_READINESS:PARTNER_ENCOUNTER;
  if(a.infected||b.infected||a.health<profile.minHealth||b.health<profile.minHealth)return {available:false,reason:'unwell'};
  const energyReady=(animal,spec)=>ordinaryCourtship
    ?animal.energy/spec.maxEnergy >= (partEffectFactors(animal)?.courtship??.62)
    :animal.energy/spec.maxEnergy > breedingEnergyGate(animal.species);
  if(!energyReady(a,species)||!energyReady(b,partnerSpec)||!(a.hydration>0)||!(b.hydration>0)||
     a.hydration/species.maxHydration<profile.minHydration||b.hydration/partnerSpec.maxHydration<profile.minHydration)return {available:false,reason:'survival-priority'};
  const kin=sim.recovery.kinship(a,b);
  if(kin!=='none'&&!(kin==='sibling'&&sim.recovery.mayRelaxSibling(a)))return {available:false,reason:'kinship'};
  return {available:true,reason:'available'};
}

export function respondingPartner(sim,a){
  if(!engineeringCourtshipSpecies(a)||a.reproDrive<PARTNER_ENCOUNTER.minResponseDrive||sim.migration.isAway(a))return null;
  const r=PARTNER_ENCOUNTER.responseRadius;
  // Respond only to an *actual* approaching animal with the same anatomy-gated
  // social behavior. No reserved partner, no forced movement and no roll.
  const candidate=sim.findNearest(a,b=>engineeringCourtshipSpecies(b)&&b.intent==='mate'&&b.target?.id===a.id&&
    b.reproDrive>=1&&partnerAvailability(sim,a,b).available,r);
  if(!candidate||!sim.canReach(a,candidate.x,candidate.y))return null;
  return candidate;
}

// EQ: prefer an independently receptive local partner over an unreceptive
// nearest neighbor. Distant exploratory search remains governed by the
// existing species, taxon and kinship search, not this close encounter rule.
// Refusing an approach is not an infertility verdict: both can try again when
// their real physiological state improves. No rolls, mate reservations,
// forced pair bonds, resource grants or cooldowns are introduced.
export function localReceptivePartner(sim,a,preferred){
  if(!engineeringCourtshipSpecies(a))return preferred;
  const s=SPECIES[a.species];
  if(a.infected||a.health<PARTNER_ENCOUNTER.minHealth||
    a.hydration/s.maxHydration<PARTNER_ENCOUNTER.minHydration)return null;
  if(!preferred)return null;
  const radius=PARTNER_ENCOUNTER.responseRadius;
  if(Math.hypot(a.x-preferred.x,a.y-preferred.y)>radius)return preferred;
  if(partnerAvailability(sim,a,preferred).available)return preferred;
  // A different nearby compatible individual can choose to receive courtship.
  // Names do not add a preference that the individual did not inherit.
  const candidates=[];
  sim.forEachNearby(a,radius,b=>{
    if(!engineeringCourtshipSpecies(b)||!partnerAvailability(sim,a,b).available||
      !sim.canReach(a,b.x,b.y))return;
    candidates.push(b);
  });
  candidates.sort((b,c)=>{
    return Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(a.x-c.x,a.y-c.y)||b.id-c.id;
  });
  return candidates[0]||null;
}
