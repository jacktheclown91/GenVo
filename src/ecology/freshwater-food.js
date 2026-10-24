import {aquaticFoodAccessible} from '../lineage/diving.js';
import {salinityAt} from '../world/environment.js';
import {fundAquaticGrowth,mineralizeOrganic,exportAquaticReserve} from './organic-resource-cycle.js';
import {coordNoise} from '../core/rng.js';
import {TISSUE_ENERGY,meatEnergy} from './tissue-energy.js';

// Animal-tissue foods (larvae, fry, carcass detritus and their marine counterparts) count their energy
// in carcass units, 34 per unit; with tissue energy (ecology/tissue-energy.js) they hold what animal
// tissue holds for the eater. Plant-like foods are unchanged.
function eaterNutrition(sim,animal,kind,p){return p.source||kind==='detritus'?p.nutrition*meatEnergy(sim,animal)/TISSUE_ENERGY.recorded:p.nutrition}

// Biomass fields, not additional animal agents. Consumers transfer existing biomass.
export const FRESHWATER_FOOD=Object.freeze({
  algae:{label:'Algae / biofilm',carry:1,nutrition:8,growth:.08,surface:true},
  duckweed:{label:'Duckweed',carry:.6,nutrition:14,growth:.025,minPatch:.55,surface:true},
  waterweed:{label:'Waterweed',carry:.9,nutrition:11,growth:.018,minPatch:.35,surface:false},
  larvae:{label:'Aquatic larvae',carry:.4,nutrition:28,growth:.025,source:'algae',otherSources:['detritus'],upkeep:.008,efficiency:.2,surface:false},
  fry:{label:'Small aquatic prey',carry:.35,nutrition:34,growth:.012,source:'larvae',upkeep:.004,efficiency:.2,surface:false},
  detritus:{label:'Aquatic carrion / detritus',nutrition:34,surface:false},
  // Marine web (marine-food-web/1). Same biomass-field mechanics; these fields
  // live in world.marineFood and exist only in worlds recording the policy.
  phytoplankton:{label:'Phytoplankton',carry:1,nutrition:8,growth:.09,surface:true,marine:true},
  kelp:{label:'Kelp and seagrass',carry:1.2,nutrition:12,growth:.02,minPatch:.45,surface:false,marine:true},
  zooplankton:{label:'Zooplankton',carry:.5,nutrition:26,growth:.03,source:'phytoplankton',otherSources:['detritus'],upkeep:.008,efficiency:.2,surface:false,marine:true},
  shellfish:{label:'Shellfish beds',carry:.6,nutrition:30,growth:.012,source:'phytoplankton',otherSources:['detritus'],upkeep:.003,efficiency:.2,surface:false,marine:true},
  'forage-fish':{label:'Small marine fish',carry:.4,nutrition:36,growth:.02,source:'zooplankton',upkeep:.004,efficiency:.2,surface:false,marine:true}
});
const KEYS=Object.keys(FRESHWATER_FOOD).filter(k=>k!=='detritus'&&!FRESHWATER_FOOD[k].marine);
// Aquatic food-web corrections (Phase 3F diagnosis).
// Diagnosis (docs/GenVo-Phase3F-Report.md): consumer tiers grow only in proportion to their own
// biomass, founded at 2% of their source. Fry's best net rate is ~0.8%/day (growth .012, upkeep .004),
// so from 0.0002 per cell fry need roughly two game years to become food, and Bankjaw has none.
//  fryGrowth: fry growth matches larvae (.025). Energy still comes only from larvae at efficiency .2.
//  founding: initial larvae/fry stocks are 10% (not 2%) of their source, still funded from producer
//    biomass at that efficiency during world generation. No food is added after the world begins.
// PROVISIONAL DEVELOPMENT DEFAULTS (creator decision 2026-10-15); ?aquaticReview=0 restores the previous values.
export const AQUATIC_REVIEW={fryGrowth:true,founding:true,crowding:true};
// crowding: interference competition. A consumer tier's upkeep rises with its own density relative to
// habitat capacity (x(1+CROWDING_STRENGTH*density/carry)); losses become aquatic carrion as before.
// A self-limiting mechanism, not a cap. CROWDING_STRENGTH is a PROPOSAL.
export const CROWDING_STRENGTH=1;
const REVIEW_FRY_GROWTH=.025,REVIEW_FOUNDING=.10;
export const growthOf=(kind,p)=>kind==='fry'&&AQUATIC_REVIEW.fryGrowth?REVIEW_FRY_GROWTH:p.growth;
export function initializeFreshwater(world){
  world.freshwaterProducerKinds=KEYS.filter(k=>!FRESHWATER_FOOD[k].source);
  world.freshwaterFood=Object.fromEntries(KEYS.map(k=>[k,new Float32Array(world.len)]));
  for(let i=0;i<world.len;i++){
    if(!world.water[i]||!world.isPlayable(i%world.n+.5,(i/world.n|0)+.5))continue;
    const x=i%world.n,y=i/world.n|0,patch=coordNoise(world.seedHash^0x741ac,x,y),f=world.fertility[i];
    const fields=world.freshwaterFood;const fresh=Math.max(0,1-salinityAt(world,i)*10);
    fields.algae[i]=(.25+.35*f)*fresh;
    fields.duckweed[i]=patch>.55?(.12+.14*f)*fresh:0;
    fields.waterweed[i]=patch>.35?(.15+.2*f)*fresh:0;
    // Initial lower trophic organisms are funded from standing producer biomass.
    const share=AQUATIC_REVIEW.founding?REVIEW_FOUNDING:.02;
    const larvae=fields.algae[i]*share;fields.algae[i]-=larvae/.2;fields.larvae[i]=larvae;
    const fry=larvae*share;fields.larvae[i]-=fry/.2;fields.fry[i]=fry;
  }
}
export function freshwaterField(world,kind){return kind==='detritus'?world.carrion:FRESHWATER_FOOD[kind]?.marine?world.marineFood?.[kind]:world.freshwaterFood?.[kind]}
// A resource survey may count floating food from a reachable bank, without
// granting underwater occupation or access to submerged prey.
// planning: whether this body could reach the food (capacity, demand and
// remembered targets), rather than whether it can eat it at its current depth.
export function canAccessFreshwater(sim,animal,x,y,food,{planning=false}={}){
  if(!aquaticFoodAccessible(sim,animal,x,y,food,{planning}))return false;
  if(sim.canOccupy(animal,x,y)&&sim.canReach(animal,x,y))return true;
  return !!food.surface&&[[0,-1],[-1,0],[1,0],[0,1]].some(([dx,dy])=>sim.canOccupy(animal,x+dx,y+dy)&&sim.canReach(animal,x+dx,y+dy));
}
export function advanceFreshwater(world){
  for(let i=0;i<world.len;i++){
    if(!world.water[i]||!world.isPlayable(i%world.n+.5,(i/world.n|0)+.5))continue;
    const fresh=Math.max(0,1-salinityAt(world,i)*10),light=Math.max(.15,1-Math.abs(world.temperature[i]-.58)*1.7),nutrients=Math.max(0,Math.min(1,world.fertility[i]));
    const requests=world.freshwaterProducerKinds.map(kind=>{const p=FRESHWATER_FOOD[kind],field=freshwaterField(world,kind),eligible=!p.minPatch||coordNoise(world.seedHash^0x741ac,i%world.n,i/world.n|0)>p.minPatch;return{kind,field,wanted:eligible&&fresh>0?fresh*Math.min(Math.max(0,p.carry-field[i]),p.growth*light*nutrients*(.1+field[i]/p.carry)):0}});fundAquaticGrowth(world,i,requests,light);
    for(const kind of KEYS){const p=FRESHWATER_FOOD[kind],field=freshwaterField(world,kind);
      if(p.minPatch&&coordNoise(world.seedHash^0x741ac,i%world.n,i/world.n|0)<=p.minPatch)continue;
      if(p.source){
        const before=field[i],maintenance=before*p.upkeep*(AQUATIC_REVIEW.crowding?1+CROWDING_STRENGTH*before/(p.carry||1):1);
        const growth=Math.min(growthOf(kind,p)*before*light,Math.max(0,p.carry-before));
        let needed=maintenance+growth,assimilated=0,consumed=0;
        // Feeding at capacity still pays upkeep; without food, existing tissue
        // is lost rather than becoming immortal standing prey biomass.
        for(const kind of [p.source,...(p.otherSources||[])]){
          const source=freshwaterField(world,kind);
          // Encounters decline with source density. Half of nominal source
          // capacity gives half a ration; zero prey supplies nothing. This
          // neither restores depleted organisms nor reserves a hidden floor.
          const halfSaturation=(FRESHWATER_FOOD[kind].carry||1)*.5;
          const encountered=source[i]/(source[i]+halfSaturation);
          const gain=Math.min(needed*encountered,source[i]*p.efficiency);
          const sourceBefore=source[i];source[i]=Math.max(0,source[i]-gain/p.efficiency);consumed+=sourceBefore-source[i];exportAquaticReserve(world,kind,i,sourceBefore-source[i],sourceBefore);assimilated+=gain;needed-=gain;
        }
        const loss=Math.max(0,maintenance-assimilated);
        field[i]=Math.max(0,Math.min(p.carry,before+assimilated-maintenance));
        // Convert nutritional value to the shared carcass units. Do not
        // turn low-energy consumer tissue into richer carrion for free.
        const carcassBefore=world.carrion[i];world.carrion[i]+=loss*p.nutrition/FRESHWATER_FOOD.detritus.nutrition;const waste=Math.max(0,consumed-(field[i]-before)-(world.carrion[i]-carcassBefore));world.organicResources.litter[i]+=waste;world.organicResources.totals.aquaticWaste+=waste;
      }
      
    }
    if(fresh<1)for(const kind of KEYS){const field=freshwaterField(world,kind),before=field[i],loss=before*(1-fresh)*.1;field[i]-=loss;exportAquaticReserve(world,kind,i,loss,before);world.organicResources.litter[i]+=loss;world.organicResources.totals.aquaticWaste+=loss;}
    const decay=Math.min(world.carrion[i],.03*light);const beforeCarrion=world.carrion[i];world.carrion[i]-=decay;mineralizeOrganic(world,i,beforeCarrion-world.carrion[i]);const organic=world.organicResources,spent=Math.min(organic.litter[i],.03*light);organic.litter[i]-=spent;mineralizeOrganic(world,i,spent);world.fertility[i]=Math.min(1,world.fertility[i]+decay*.018);
  }
}
export function freshwaterPreference(animal,kind){
  const mouth=animal?.bodyPlan?.nodes?.find(n=>n.socket==='mouth')?.partId;
  // Marine kinds follow the same mouth functions: sieves strain plankton,
  // grazers crop kelp, crushing jaws open shellfish and jaws take fish.
  if(mouth==='reed-sieve-mouth')return ({algae:.8,larvae:1.25,detritus:.75,phytoplankton:.7,zooplankton:1.25})[kind]||0;
  if(mouth==='filter-mouth')return ({algae:1,larvae:.8,detritus:.35,phytoplankton:1,zooplankton:.8})[kind]||0;
  if(['grazing-mouth','nibbler-mouth','beak-mouth'].includes(mouth))return ['algae','duckweed','waterweed','kelp'].includes(kind)?1:0;
  if(mouth==='sucker-mouth')return kind==='detritus'?1:kind==='larvae'||kind==='zooplankton'?.8:0;
  if(mouth==='crushing-jaw'&&kind==='shellfish')return 1.2;
  if(['tearing-jaw','crushing-jaw','gape-mouth','tusk-jaw'].includes(mouth))return kind==='fry'||kind==='forage-fish'?1:kind==='detritus'?.8:0;
  return 0;
}
export function freshwaterHarvestCandidate(sim,animal,energyLimit,target=null){
  const world=sim.world;if(!animal?.alive||!(energyLimit>0))return null;
  let best=null;
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const x=Math.floor(animal.x)+ox+.5,y=Math.floor(animal.y)+oy+.5,i=world.idx(x,y);
    if(!world.isPlayable(x,y)||!world.water[i]||Math.hypot(x-animal.x,y-animal.y)>1.5)continue;
    for(const [kind,p] of Object.entries(FRESHWATER_FOOD)){
      if(target&&(target.kind==='water'?i!==target.i:kind!==target.kind||i!==world.idx(target.foodX??target.x,target.foodY??target.y)))continue;
      if(!p.surface&&(!sim.canOccupy(animal,x,y)||!sim.canReach(animal,x,y)))continue;
      if(!aquaticFoodAccessible(sim,animal,x,y,p))continue;
      const preference=freshwaterPreference(animal,kind),field=freshwaterField(world,kind),available=field?.[i]||0;
      const nutrition=eaterNutrition(sim,animal,kind,p),potential=available*nutrition*preference;if(potential>0&&(!best||potential>best.potential))best={kind,p,preference,field,i,potential,nutrition};
    }
  }
  return best;
}

export function harvestFreshwater(sim,animal,energyLimit,target=null){
  const world=sim.world,best=freshwaterHarvestCandidate(sim,animal,energyLimit,target);if(!best)return null;
  const energyGain=Math.min(energyLimit,best.potential),amount=energyGain/(best.nutrition*best.preference);
  const before=best.field[best.i];best.field[best.i]=Math.max(0,before-amount);exportAquaticReserve(world,best.kind,best.i,before-best.field[best.i],before);world.organicResources.totals.foodExported+=before-best.field[best.i];
  animal.lastFreshwaterMeal={kind:best.kind,amount,i:best.i,tick:sim.tickCount};
  if(best.kind==='detritus')sim.disease?.onCarrionFeed?.(animal,best.i,amount);
  return{kind:best.kind,amount,energyGain};
}

// Find a real food cell and a reachable feeding position. Bank access does not
// grant underwater locomotion; retain food coordinates separately from the route.
export function bestFreshwaterFood(sim,animal,radius=9){
  const w=sim.world;let best=null,bestScore=0;
  const diets=Object.entries(FRESHWATER_FOOD).filter(([kind])=>freshwaterPreference(animal,kind)>0);
  if(!diets.length)return null;
  const cx=Math.floor(animal.x),cy=Math.floor(animal.y),r=Math.ceil(radius);
  for(let yy=cy-r;yy<=cy+r;yy++)for(let xx=cx-r;xx<=cx+r;xx++){
    const fx=xx+.5,fy=yy+.5;if(!w.isPlayable(fx,fy)||Math.hypot(fx-animal.x,fy-animal.y)>radius)continue;
    const i=w.idx(fx,fy);if(!w.water[i])continue;let wetPosition,bankPosition;
    for(const [kind,p] of diets){const amount=freshwaterField(w,kind)?.[i]||0;if(!(amount>0))continue;
      let position=null;
      if(wetPosition===undefined)wetPosition=sim.canOccupy(animal,fx,fy)&&sim.canReach(animal,fx,fy)?{x:fx,y:fy}:null;
      position=wetPosition;
      if(!position&&p.surface&&bankPosition===undefined){for(const [ox,oy] of [[0,-1],[-1,0],[1,0],[0,1]]){
        const x=fx+ox,y=fy+oy;if(!w.isPlayable(x,y)||!sim.canOccupy(animal,x,y)||!sim.canReach(animal,x,y))continue;
        if(!position||Math.hypot(x-animal.x,y-animal.y)<Math.hypot(position.x-animal.x,position.y-animal.y))position={x,y};
      }bankPosition=position;}else if(!position&&p.surface)position=bankPosition;
      if(!position||!aquaticFoodAccessible(sim,animal,fx,fy,p,{planning:true}))continue;
      const score=amount*p.nutrition*freshwaterPreference(animal,kind)/34-Math.hypot(position.x-animal.x,position.y-animal.y)*.015;
      if(score>bestScore){bestScore=score;best={...position,kind,foodX:fx,foodY:fy,score}};
    }
  }
  return best;
}
