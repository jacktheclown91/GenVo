// One anatomical authority: installed organs, not creature names, determine birth capability.
// Older bodies lacking specialized organs remain live-bearing for save compatibility.
import {SPECIES} from '../organisms/species.js';
export const EGG_PART='egg-chamber';
export const LIVE_PART='live-womb';
export const DUAL_MATERNAL_COST=6;
export const DUAL_PATERNAL_COST=2;
// Actual ongoing physiological cost, distinct from registry design metadata.
// Assessed once per simulation metabolism tick while both organs are mounted.
export const DUAL_ENERGY_UPKEEP=0.022;
export const DUAL_WATER_UPKEEP=0.008;
const has=(animal,id)=>!!animal?.bodyPlan?.nodes?.some(node=>node.partId===id);
export function reproductiveMode(animal){
  const egg=has(animal,EGG_PART),live=has(animal,LIVE_PART);
  return egg&&live?'dual':egg?'egg':'live';
}
// Player choice is stored on the mother. Wild dual-capable organisms select their mode
// from current conditions; selection consumes no extra randomness and remains optional.
export function conceptionMode(mother,world=null){
  const ability=reproductiveMode(mother);
  if(ability!=='dual')return ability;
  if(mother.reproductiveStrategy==='egg'||mother.reproductiveStrategy==='live')return mother.reproductiveStrategy;
  const energy=mother.energy??0,hydration=mother.hydration??0;
  const safe=world&&Number.isFinite(mother.x)&&Number.isFinite(mother.y)?eggSiteQuality(world,mother.x,mother.y):0;
  // Rich, safe surface sites can favor larger egg clutches; elsewhere retain young.
  const species=SPECIES[mother.species];
  return safe>=.83&&energy>=(species?.maxEnergy||124)*.76&&hydration>=(species?.maxHydration||114)*.62?'egg':'live';
}
// Freeze mode at conception. Updating a parent's anatomy or later strategic choice
// must never convert an already funded pregnancy from one route into the other.
export const INCUBATION_DAYS=9;
// Historical capacity reference for diagnostics; not a biological laying limit.
export const MAX_WORLD_EGGS=128;
export function eggSiteQuality(world,x,y){
  if(!world||!Number.isFinite(x)||!Number.isFinite(y))return 0;
  const i=world.idx(x,y);if(world.water[i])return 0;
  const temp=world.temperature[i],moisture=world.moisture[i];
  return Math.max(0,Math.min(1,1-Math.max(0,Math.abs(temp-.55)-.27)*1.8-Math.max(0,.20-moisture)*.9));
}
