import {CFG} from '../sim/config.js';
import {advanceRemoteBiology,remoteBiologicalDebt,OFFSCREEN_BIOLOGY} from './planetary-offscreen-biology.js';
import {POPULATION_MODE} from './regional-replay-order.js';
import {markRegionalOwnerDirty} from './regional-revision.js';
import {planetRegionOrigin,PLANET_REGION_SIZE} from './planet-regions.js';

// Near/far biological modes for visited planetary regions (creator direction
// 2026-10-21). Regions within `nearRadius` regions of the active one run full
// individual canonical ticks in lockstep (synchronized-strides/1). Farther
// regions run regional-demography/1: the same staged kernel, real ticks and
// ledgers, with per-individual perception/decision/movement replaced by the
// population-level behavior in ecology/regional-demography.js. Individuals,
// genomes, families and recorded history are never aggregated, regenerated
// or reset; switching mode changes only how their next ticks are computed.
// Paired seam exchange runs between canonical neighbors only; an edge facing
// a population-model region uses that region's planetary boundary reservoir,
// as unpaired edges already do.
export const REGIONAL_DEMOGRAPHY=Object.freeze({policy:'regional-demography/1',mode:POPULATION_MODE,nearRadius:1,
 // One life stride per due region per active stride keeps every far region
 // level with the player's clock without unbounded backlog.
 ticksPerPass:CFG.lifeStride});
const CANONICAL='canonical-ticks/1';
export function regionDistance(a,b){
 const p=planetRegionOrigin(a),q=planetRegionOrigin(b);
 return Math.max(Math.abs(p.x-q.x),Math.abs(p.y-q.y))/PLANET_REGION_SIZE;
}
const enabled=sim=>sim?.regionalDemographyRules===REGIONAL_DEMOGRAPHY.policy;
export function validateRegionalDemographyRules(sim){
 if(sim.regionalDemographyRules!==undefined&&!enabled(sim))throw Error('Unknown regional demography policy.');
 for(const s of sim.planetaryTravel?.sessions||[])if(s.biologicalMode===POPULATION_MODE&&!enabled(sim))throw Error('Population-model region without its recorded policy.');
}
// Advance every far region with tick debt by one bounded life stride. Called
// by Simulation.update at stride boundaries, after the synchronized near set.
export function advanceDemographicRegions(sim,{ticks=REGIONAL_DEMOGRAPHY.ticksPerPass}={}){
 if(!enabled(sim)||!sim.planetaryTravel?.sessions?.length)return[];
 const due=sim.planetaryTravel.sessions.filter(s=>s.biologicalMode===POPULATION_MODE&&!s.parked&&remoteBiologicalDebt(sim,s)>0)
  .sort((a,b)=>a.snapshot.core.tickCount-b.snapshot.core.tickCount||a.key.localeCompare(b.key));
 return due.map(s=>advanceRemoteBiology(sim,s,{maxTicks:Math.min(ticks,OFFSCREEN_BIOLOGY.maxEntryTicks)}));
}
// Browser runtime: far regions advance in idle time instead of inside the
// player's frame. One genuine life stride of the most-lagging due region per
// call; its clock may trail the player and catches up on later calls, during
// residency maintenance, or before it is needed nearby.
export function advanceNextDemographicRegion(sim){
 if(!enabled(sim)||!sim.planetaryTravel?.sessions?.length)return null;
 // Whole strides only: a region trails the player by at most one stride.
 const due=sim.planetaryTravel.sessions.filter(s=>s.biologicalMode===POPULATION_MODE&&!s.parked&&remoteBiologicalDebt(sim,s)>=REGIONAL_DEMOGRAPHY.ticksPerPass)
  .sort((a,b)=>a.snapshot.core.tickCount-b.snapshot.core.tickCount||a.key.localeCompare(b.key))[0];
 return due?advanceRemoteBiology(sim,due,{maxTicks:REGIONAL_DEMOGRAPHY.ticksPerPass}):null;
}
// Brings a far region level with the active clock, then hands it back to full
// individual simulation. The work is the region's genuine elapsed ticks.
function promote(sim,session){
 let guard=0;
 while(remoteBiologicalDebt(sim,session)>0){if(guard++>1e4)throw Error('Population-model catch-up did not converge.');advanceRemoteBiology(sim,session,{maxTicks:OFFSCREEN_BIOLOGY.maxEntryTicks})}
 markRegionalOwnerDirty(session);session.biologicalMode=CANONICAL;
}
// Reassigns modes around the active region. Only biological regions change;
// environment-only (historical) sessions keep their recorded schedule. Both
// modes share one uninterrupted tick and ledger history; a demoted region's
// remaining ticks simply run under the population model.
export function assignRegionalBiologyModes(sim){
 if(!enabled(sim)||!sim.planetaryTravel?.sessions?.length)return{near:0,far:0,changed:[]};
 const here=sim.world.regionOrigin,changed=[];let near=0,far=0;
 for(const s of sim.planetaryTravel.sessions){
  if(s.biologicalMode!==CANONICAL&&s.biologicalMode!==POPULATION_MODE)continue;
  const close=regionDistance(here,s.snapshot.world.regionOrigin)<=REGIONAL_DEMOGRAPHY.nearRadius;
  if(close){near++;if(s.biologicalMode===POPULATION_MODE){delete s.parked;promote(sim,s);changed.push({key:s.key,mode:CANONICAL})}}
  else{far++;if(s.biologicalMode===CANONICAL){markRegionalOwnerDirty(s);s.biologicalMode=POPULATION_MODE;changed.push({key:s.key,mode:POPULATION_MODE})}}
 }
 return{near,far,changed};
}
