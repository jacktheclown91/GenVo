import {canSwim} from '../lineage/lifestyle.js';
import {plantHandlingAffordable} from './plant-handling.js';
import {plantPreference,canHunt,preyPreference,mouthOf} from './functional-diet.js';
import {FRESHWATER_FOOD,freshwaterPreference,canAccessFreshwater} from './freshwater-food.js';
import {remainingPreyBiomass} from './prey-biomass.js';
// Existing consumer-equivalent crowding units, now one shared finite-food pool.
// This is not an energy-budget recalibration or family/compatibility authority.
export function dietaryDemand(sim,a,supply,radius,{residentId=a.id}={}){
  const sources=supply.rows.filter(r=>r.preference>0).map(r=>({...r,i:sim.world.idx(r.x,r.y),weight:r.energy*r.preference}));
  if(canHunt(a))sim.forEachNearby(a,radius,b=>{
    if(!b.alive||b.id===residentId||Math.hypot(b.x-a.x,b.y-a.y)>radius||!sim.canReach(a,b.x,b.y))return;
    const preference=preyPreference(a,b),energy=remainingPreyBiomass(b)*FRESHWATER_FOOD.detritus.nutrition;
    if(preference>0&&energy>0)sources.push({prey:b,preference,energy,weight:energy*preference});
  });
  const total=sources.reduce((n,r)=>n+r.weight,0),hasPrey=sources.some(r=>r.prey),memo=new Map();
  let maxBiteCoat=0;for(const r of sources)if(!r.prey&&!r.wet&&sim.dispersal.coatReserve[r.kind]){const stock=sim.world.plants[r.kind][r.i];if(stock>0)maxBiteCoat=Math.max(maxBiteCoat,sim.dispersal.tissueView(r.kind,r.i).coat*Math.min(stock,sim.foraging.profile(r.kind).bite)/stock)}
  // The focal actor already supplied canonical edible yields for every source.
  // A funded consumer with identical mouth and traversal context has exactly
  // the same non-prey overlap; reuse that receipt rather than survey it again.
  const focalMouth=mouthOf(a),focalSwim=canSwim(a),focalRegion=sim.world.regionAt(a.x,a.y),focalFunded=plantHandlingAffordable(a,maxBiteCoat);
  let nearby=1,demand=0;
  sim.forEachNearby(a,radius,b=>{
    if(!b.alive||b.id===residentId||Math.hypot(b.x-a.x,b.y-a.y)>radius||(!sim.canReach(a,b.x,b.y)&&!sim.canReach(b,a.x,a.y)))return;
    nearby++;if(total<=0)return;
    // Canonical reach currently depends on swimming and connected land region.
    // Fully funded matching mouths share one calculation within this exact pool;
    // low reserves and live-prey hunters keep individual evaluation.
    const mouth=mouthOf(b),swimming=canSwim(b),region=sim.world.regionAt(b.x,b.y),fullyFunded=plantHandlingAffordable(b,maxBiteCoat),memoKey=mouth&&(!hasPrey||!canHunt(b))?mouth+':'+swimming+':'+region+':'+(fullyFunded?'funded':b.energy):null;
    if(!hasPrey&&mouth&&mouth===focalMouth&&swimming===focalSwim&&region===focalRegion&&fullyFunded&&focalFunded){demand++;return}
    if(memoKey&&memo.has(memoKey)){demand+=memo.get(memoKey);return}
    let shared=0;const access=new Map(),preferences=new Map();
    for(const r of sources){
      let preference=0;
      if(r.prey){if(sim.canReach(b,r.prey.x,r.prey.y))preference=preyPreference(b,r.prey)}
      else if(r.wet){const key=r.i*3+(FRESHWATER_FOOD[r.kind].surface?1:2);if(!access.has(key))access.set(key,canAccessFreshwater(sim,b,r.x,r.y,FRESHWATER_FOOD[r.kind]));if(access.get(key)){if(!preferences.has(r.kind))preferences.set(r.kind,freshwaterPreference(b,r.kind));preference=preferences.get(r.kind)}}
      else{
        const key=r.i*3;if(!access.has(key))access.set(key,sim.canReach(b,r.x,r.y));if(!access.get(key))continue;
        if(!preferences.has(r.kind))preferences.set(r.kind,plantPreference(b,r.kind));preference=preferences.get(r.kind);
        if(preference>0&&sim.dispersal.seedReserve[r.kind]){const i=sim.world.idx(r.x,r.y),nutrition=sim.dispersal.genomeAt(r.kind,i).traits.nutrition;preference=sim.dispersal.cropYield(b,r.kind,i)*nutrition/r.energy}
      }
      shared+=r.energy*Math.min(r.preference,preference);
    }
    const overlap=shared/total;if(memoKey)memo.set(memoKey,overlap);demand+=overlap;
  });
  return{nearby,demand};
}
