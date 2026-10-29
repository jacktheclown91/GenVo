// arid-physiology/1 (morphology S4, extreme survival biology).
//
// Heat costs water. Above its comfort temperature a body must shed its heat
// load, and much of that is evaporative (panting, sweating, wet surfaces). The
// heat-side thermal load already used for the energy cost (thermal-demand.js:
// local or burrow temperature, shelter, fur's heat cost, the heat frill's
// dissipation, wax plates' heat retention, torpor exposure) therefore also
// drives evaporative water loss, scaled by the body's own surface-scaled
// resting water cost. Anchor: an exposed founder in an equatorial summer
// (0.43 above comfort, thermal load 0.052) about triples its water turnover,
// the range desert mammals show (2-4x); the temperate home summer adds about a
// fifth. Nothing here creates water.
//
// Aestivation: drought dormancy on the existing torpor machinery (the same
// predator wake-ups and vulnerability). An adult with fat stores (fat pad or
// fat tail) that is hot or on dry soil, short of water, with no drinking water
// within reach, can shut down in a burrow or in cover: energy use about halves,
// water use falls to about a third and the heat load halves, but reserves still
// drain and predators find it easier to catch. It wakes when conditions ease or
// reserves run low.
import {SPECIES} from '../organisms/species.js';
import {winterFatAnatomy} from './cold-wildlife.js';
import {planPartCounts} from '../lineage/part-abilities.js';

export const ARID_PHYSIOLOGY=Object.freeze({policy:'arid-physiology/1',evaporativeWater:40,
 aestivation:Object.freeze({heatMargin:.1,drySoil:.2,maximumHydration:.55,minimumEnergy:.45,waterReach:12,cover:.32,minimumHealth:68,
  energyRate:.55,waterRate:.35,heatExposure:.5,wakeHydration:.2,wakeEnergy:.27,wakeMoisture:.3})});
export const aridPhysiologyEnabled=sim=>sim?.aridPhysiologyRules===ARID_PHYSIOLOGY.policy;
const A=ARID_PHYSIOLOGY.aestivation;
const ratio=(value,maximum)=>Math.max(0,value/Math.max(1,maximum));

// Extra water per life step for evaporative cooling of a heat-side thermal load.
// `restingWater` is the body's own resting water cost for the step (reserve units).
export function evaporativeCooling(restingWater,heatLoad){
 return heatLoad>0&&restingWater>0?restingWater*ARID_PHYSIOLOGY.evaporativeWater*heatLoad:0;
}
export const aestivating=animal=>!!animal?.torpor&&animal.torporKind==='aestivation';
function sheltered(sim,a){return !!a.underground||(sim.coverAt?.(a)??0)>=A.cover}
function hotOrDry(sim,a){
 const w=sim.world,i=w.idx(a.x,a.y),comfort=.55*(a.genes?.climate??1);
 return w.temperature[i]>comfort+A.heatMargin||(w.moisture[i]??1)<A.drySoil;
}
export function aestivationStatus(sim,a){
 const fail=reason=>({enabled:false,reason});
 if(!aridPhysiologyEnabled(sim))return fail('This world keeps its recorded dormancy rules.');
 if(!a?.alive)return fail('No living creature.');
 if(aestivating(a))return{enabled:true,active:true,reason:'Rouse from aestivation.'};
 if(a.torpor)return fail('Already in cold-season torpor.');
 if(!winterFatAnatomy(a))return fail('Evolve a fat pad or fat tail to fuel drought dormancy.');
 if(a.airborne||a.perched||a.burrowWork||a.caveTransit)return fail('Settle on the ground or in a burrow first.');
 const s=SPECIES[a.species];if(!s)return fail('Unknown physiology.');
 if(a.age<s.maturity)return fail('Young creatures must keep feeding and growing.');
 if(a.pregnant)return fail('Pregnant creatures must remain metabolically active.');
 if(a.health<A.minimumHealth||a.infected)return fail('Too sick or injured for dormancy.');
 if(sim.family?.livingChildren?.(a,{dependentOnly:true})?.length)return fail('Dependent young still need care.');
 if(!hotOrDry(sim,a))return fail('Only heat or parched ground calls for drought dormancy.');
 if(ratio(a.hydration,s.maxHydration)>A.maximumHydration)return fail('Not short enough of water to need dormancy.');
 if(ratio(a.energy,s.maxEnergy)<A.minimumEnergy)return fail('Too little stored food to fuel dormancy.');
 const w=sim.world;if((w.waterDistance?.[w.idx(a.x,a.y)]??Infinity)<=A.waterReach)return fail('Drinking water is within reach.');
 if(!sheltered(sim,a))return fail('Find a burrow or dense cover to wait out the drought.');
 if(sim.findNearest?.(a,o=>o.alive&&sim.isPredatorTo(o,a),5))return fail('A nearby predator makes dormancy too dangerous.');
 return{enabled:true,active:false,reason:'Aestivate: wait out heat and drought on stored fat. Reserves still drain and predators remain a danger.'};
}
export function enterAestivation(sim,a){
 const status=aestivationStatus(sim,a);if(!status.enabled||status.active)return{ok:false,type:'aestivation',message:status.reason};
 a.torpor=true;a.torporKind='aestivation';a.torporStartedDay=sim.day;a.intent='torpor';a.target=null;a.navigationRoute=null;
 return{ok:true,type:'aestivation',message:'Aestivating. Food and water use slow; heat, drought and predators remain dangers.'};
}
// Called before the step's metabolism. Returns false when the body has woken.
export function maintainAestivation(sim,a){
 if(!aestivating(a))return false;const s=SPECIES[a.species];
 if(!s||a.airborne||a.perched||a.pregnant||a.health<A.minimumHealth||a.infected||!hotOrDry(sim,a)&&(sim.world.moisture[sim.world.idx(a.x,a.y)]??0)>=A.wakeMoisture||
  ratio(a.hydration,s.maxHydration)<A.wakeHydration||ratio(a.energy,s.maxEnergy)<A.wakeEnergy){
  a.torpor=false;delete a.torporKind;a.intent='idle';a.target=null;return false;
 }
 return true;
}
export function aestivationMetabolism(){return{energy:A.energyRate,water:A.waterRate,heat:1,coldExposure:A.heatExposure}}
export function decideAestivation(sim,a){
 if(!aridPhysiologyEnabled(sim)||a?.torpor||!a?.alive||a.player&&!sim.playerAutonomy)return null;
 const s=SPECIES[a.species];if(!s||ratio(a.hydration,s.maxHydration)>A.maximumHydration)return null;
 if(!aestivationStatus(sim,a).enabled)return null;
 enterAestivation(sim,a);return{intent:'torpor',target:null};
}
// Read-only expression state (Codex): what the body is doing with its inherited
// arid anatomy right now. Presentation never writes it.
export function aridExpressionOf(sim,a){
 if(!a)return null;const w=sim.world,i=w.idx(a.x,a.y),comfort=.55*(a.genes?.climate??1),parts=planPartCounts(a);
 const temp=w.temperature[i],moisture=w.moisture[i]??1;
 return Object.freeze({policy:aridPhysiologyEnabled(sim)?ARID_PHYSIOLOGY.policy:null,heat:Math.max(0,temp-comfort),
  frillFlushed:!!parts['heat-frill']&&temp>comfort,waxSealed:!!parts['wax-plates']&&moisture<.48,aestivating:aestivating(a)});
}
export function restoreAridPhysiologyRules(sim,core){
 if(core.aridPhysiologyRules===undefined)delete sim.aridPhysiologyRules;
 else if(core.aridPhysiologyRules!==ARID_PHYSIOLOGY.policy)throw Error('Unknown saved arid physiology rules.');
 const enabled=aridPhysiologyEnabled(sim);
 for(const a of sim.animals){if(a.torporKind===undefined)continue;
  if(!enabled)throw Error('Saved dormancy kind without its recorded arid physiology rule.');
  if(a.torporKind!=='aestivation'||!a.torpor)throw Error('Invalid saved dormancy kind.')}
}
