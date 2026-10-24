import {DIVING,submerged,waterColumn,divingAvailability} from '../lineage/diving.js';
import {swimsByBody,hasGills,isWaterDweller} from '../lineage/aquatic.js';
import {surfaceIceCovered} from '../world/surface-ice.js';
import {FRESHWATER_FOOD} from './freshwater-food.js';
import {CFG} from '../sim/config.js';

// Aquatic foraging (aquatic-foraging/1, creator direction 2026-10-22), from the
// bankjaw/rillsifter extinction diagnosis. New planetary worlds only.
// 1. Foraging dives: a wild swimmer that reaches underwater food keeps that
//    meal while the shared diving authority carries it down (finite air or
//    gills, paid descent), instead of abandoning it at the surface.
// 2. Life under ice: when ice covers the water a gilled water dweller is in,
//    it stays submerged beneath the sheet in its own water column, so it can
//    move and reach underwater food. Surface food stays sealed; air-breathers
//    are unchanged.
// 3. Water-dweller forage: breeding forage for a water dweller is scored over
//    the water cells it can use, not diluted by land it cannot (carrying.js).
export const AQUATIC_FORAGING=Object.freeze({policy:'aquatic-foraging/1',patienceSeconds:4,underIceDepth:.06});
export const aquaticForagingEnabled=sim=>sim?.aquaticForagingRules===AQUATIC_FORAGING.policy;
export const scoresWaterOnly=(sim,a)=>aquaticForagingEnabled(sim)&&isWaterDweller(a);
// On arrival at an underwater meal that is not yet reachable: true keeps the
// target while a dive toward it is under way or can start, for bounded time.
export function holdUnderwaterMeal(sim,a,kind){
 const food=FRESHWATER_FOOD[kind];
 if(!aquaticForagingEnabled(sim)||a.player&&!sim.playerAutonomy||!food||food.surface||!swimsByBody(a))return false;
 const diving=(a.diveTarget||0)>0||submerged(a)||divingAvailability(sim,a).enabled;
 if(!diving){delete a.forageDiveSince;return false}
 a.forageDiveSince??=sim.tickCount;
 if(sim.tickCount-a.forageDiveSince>AQUATIC_FORAGING.patienceSeconds*CFG.simHz){delete a.forageDiveSince;return false}
 return true;
}
export function endForagingDive(a){delete a.forageDiveSince}
// Called each tick for wildlife before the diving step.
export function submergeUnderIce(sim,a){
 if(!aquaticForagingEnabled(sim)||!a?.alive||a.player&&!sim.playerAutonomy||a.underground||a.airborne||submerged(a)||!hasGills(a)||!swimsByBody(a))return false;
 const w=sim.world,i=w.idx(a.x,a.y);if(!w.water[i]||!surfaceIceCovered(w.environment,i))return false;
 const column=waterColumn(w,a.x,a.y);if(column<=.031)return false;
 a.diveAir??=DIVING.airSeconds;a.diveDepth=Math.min(column>.04?column-DIVING.clearance:.031,AQUATIC_FORAGING.underIceDepth);a.diveTarget=a.diveDepth;a.hidden=false;
 return true;
}
export function validateAquaticForagingRules(core){
 if(core.aquaticForagingRules!==undefined&&core.aquaticForagingRules!==AQUATIC_FORAGING.policy)throw Error('Unknown aquatic foraging policy.');
}
