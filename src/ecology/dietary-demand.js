import {canSwim} from '../lineage/lifestyle.js';
import {plantHandlingAffordable} from './plant-handling.js';
import {plantPreference,canHunt,preyPreference,mouthOf} from './functional-diet.js';
import {FRESHWATER_FOOD,freshwaterPreference,canAccessFreshwater} from './freshwater-food.js';
import {remainingPreyBiomass} from './prey-biomass.js';
import {DEMAND_REVIEW,appetite} from './demand-review.js';
// Existing consumer-equivalent crowding units, now one shared finite-food pool.
// This is not an energy-budget recalibration or family/compatibility authority.
// overlapMemo (optional, Map): reuse a neighbour's overlap with THIS supply across candidate
// positions of one scan. The overlap depends only on the supply's sources, the neighbour, and the
// focal mouth/swim/region/funding; positions only decide WHICH neighbours count (checked per call).
// Prey sources depend on position, so hunter supplies are never memoised.
// Private receipt lives only as long as one caller-owned, read-only candidate scan.
// Never reuse across stock/reserve changes, actors, ticks, or hunter prey searches.
const scanReceipts=new WeakMap();
export function dietaryDemand(sim,a,supply,radius,{residentId=a.id,overlapMemo=null}={}){
  const hunter=canHunt(a),previous=!hunter&&overlapMemo?scanReceipts.get(overlapMemo):null,receipt=previous?.sim===sim&&previous.supply===supply&&previous.actorId===a.id&&previous.energy===a.energy&&previous.tick===sim.tickCount?previous:null;
  if(previous&&!receipt)overlapMemo=null;
  const sources=receipt?receipt.sources:supply.rows.filter(r=>r.preference>0).map(r=>({...r,i:sim.world.idx(r.x,r.y),weight:r.energy*r.preference}));
  if(hunter)sim.forEachNearby(a,radius,b=>{
    if(!b.alive||b.id===residentId||Math.hypot(b.x-a.x,b.y-a.y)>radius||!sim.canReach(a,b.x,b.y))return;
    const preference=preyPreference(a,b),energy=remainingPreyBiomass(b)*FRESHWATER_FOOD.detritus.nutrition;
    if(preference>0&&energy>0)sources.push({prey:b,preference,energy,weight:energy*preference});
  });
  const total=receipt?receipt.total:sources.reduce((n,r)=>n+r.weight,0),hasPrey=sources.some(r=>r.prey),memo=receipt?receipt.memo:new Map();
  let maxBiteCoat=receipt?.maxBiteCoat??0;if(!receipt)for(const r of sources)if(!r.prey&&!r.wet&&sim.dispersal.coatReserve[r.kind]){const stock=sim.world.plants[r.kind][r.i];if(stock>0)maxBiteCoat=Math.max(maxBiteCoat,sim.dispersal.tissueView(r.kind,r.i).coat*Math.min(stock,sim.foraging.profile(r.kind).bite)/stock)}
  if(!hunter&&overlapMemo&&!receipt)scanReceipts.set(overlapMemo,{sim,supply,actorId:a.id,energy:a.energy,tick:sim.tickCount,sources,total,maxBiteCoat,memo});
  // The focal actor already supplied canonical edible yields for every source.
  // A funded consumer with identical mouth and traversal context has exactly
  // the same non-prey overlap; reuse that receipt rather than survey it again.
  const focalMouth=mouthOf(a),focalSwim=canSwim(a),focalRegion=sim.world.regionAt(a.x,a.y),focalFunded=plantHandlingAffordable(a,maxBiteCoat);
  let nearby=1,demand=0;const focalAppetite=DEMAND_REVIEW.enabled?appetite(a):0;const shared=!hasPrey&&overlapMemo?overlapMemo:null,focalKey=focalMouth+':'+focalSwim+':'+focalRegion+':'+focalFunded+':';
  sim.forEachNearby(a,radius,b=>{
    if(!b.alive||b.id===residentId||Math.hypot(b.x-a.x,b.y-a.y)>radius||(!sim.canReach(a,b.x,b.y)&&!sim.canReach(b,a.x,a.y)))return;
    nearby++;if(total<=0)return;
    const weight=DEMAND_REVIEW.enabled?appetite(b)/Math.max(1e-9,focalAppetite):1;
    if(shared){const k=focalKey+b.id;let v=shared.get(k);if(v===undefined){v=overlapOf(b);shared.set(k,v)}demand+=v*weight;return}
    demand+=overlapOf(b)*weight;
  });
  return{nearby,demand};
  function overlapOf(b){
    // Canonical reach currently depends on swimming and connected land region.
    // Fully funded matching mouths share one calculation within this exact pool;
    // low reserves and live-prey hunters keep individual evaluation.
    const mouth=mouthOf(b),swimming=canSwim(b),region=sim.world.regionAt(b.x,b.y),fullyFunded=plantHandlingAffordable(b,maxBiteCoat),memoKey=mouth&&(!hasPrey||!canHunt(b))?mouth+':'+swimming+':'+region+':'+(fullyFunded?'funded':b.energy):null;
    if(!hasPrey&&mouth&&mouth===focalMouth&&swimming===focalSwim&&region===focalRegion&&fullyFunded&&focalFunded)return 1;
    if(memoKey&&memo.has(memoKey))return memo.get(memoKey);
    let shared=0;const access=new Map(),preferences=new Map();
    for(const r of sources){
      let preference=0;
      if(r.prey){if(sim.canReach(b,r.prey.x,r.prey.y))preference=preyPreference(b,r.prey)}
      else if(r.wet){const key=r.i*3+(FRESHWATER_FOOD[r.kind].surface?1:2);if(!access.has(key))access.set(key,canAccessFreshwater(sim,b,r.x,r.y,FRESHWATER_FOOD[r.kind]));if(access.get(key)){if(!preferences.has(r.kind))preferences.set(r.kind,freshwaterPreference(b,r.kind));preference=preferences.get(r.kind)}}
      else{
        const key=r.i*3;// Land meal rows were already verified as playable by the source
        // survey. For the neighbour, canonical canReach is just swimming or
        // matching nonzero land-region labels. Region was read once above.
        if(!access.has(key))access.set(key,swimming||(region!==0&&sim.world.landRegion[r.i]===region));if(!access.get(key))continue;
        if(!preferences.has(r.kind))preferences.set(r.kind,plantPreference(b,r.kind));preference=preferences.get(r.kind);
        if(preference>0&&sim.dispersal.seedReserve[r.kind]){const i=r.i,nutrition=sim.dispersal.genomeAt(r.kind,i).traits.nutrition;preference=sim.dispersal.cropYield(b,r.kind,i)*nutrition/r.energy}
      }
      shared+=r.energy*Math.min(r.preference,preference);
    }
    const overlap=shared/total;if(memoKey)memo.set(memoKey,overlap);return overlap;
  }
}
