import {reproductionFor} from './breeding-calibration.js';
import {scoresWaterOnly} from './aquatic-foraging.js';
import {BREEDING_SUPPORT,breedingSupportEnabled,breedingSupport,renewableSupply,breedingNeed} from './breeding-support.js';
import {dietaryDemand} from './dietary-demand.js';
import {preyNormalization,localPreyOpportunity} from './prey-normalization.js';
import {FRESHWATER_FOOD,freshwaterPreference,freshwaterField,canAccessFreshwater} from './freshwater-food.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {groundDiet,canHunt,plantPreference} from './functional-diet.js';
import {DEMAND_REVIEW} from './demand-review.js';
import {meatEnergy} from './tissue-energy.js';
import {canSwim} from '../lineage/lifestyle.js';

const clamp=(min,max,v)=>Math.max(min,Math.min(max,v));

// CarryingPressureController keeps reproduction tied to local crowding and food
// availability. Computational warning thresholds do not constrain births.
// Forage is sampled lazily per occupied coarse cell/day instead of scanning the
// entire 128x128 world each update.
export class CarryingPressureController{
  constructor(sim){this.sim=sim;this.bucketSize=8;this.cols=Math.ceil(CFG.worldSize/this.bucketSize);this.lastDay=-1;this.forageCache=new Map()}
  observe(){if(this.lastDay!==this.sim.day){this.lastDay=this.sim.day;this.forageCache.clear()}}
  forageAt(a){return this.surveyAt(a).value}
  surveyAt(a){
    this.observe();
    const bx=Math.max(0,Math.min(this.cols-1,Math.floor(a.x/this.bucketSize))),by=Math.max(0,Math.min(this.cols-1,Math.floor(a.y/this.bucketSize)));
    // Cache only the bounded sampling lattice, never consumable stocks or an
    // individual's ability to pay handling costs. Both can change within a day.
    const key=`lattice:${bx}:${by}`;let cells=this.forageCache.get(key);
    const w=this.sim.world;
    if(!cells){
      cells=[];const x0=bx*this.bucketSize+this.bucketSize*.5,y0=by*this.bucketSize+this.bucketSize*.5;
      for(let oy=-10;oy<=10;oy+=3)for(let ox=-10;ox<=10;ox+=3){
        const x=Math.max(1,Math.min(CFG.worldSize-2,x0+ox)),y=Math.max(1,Math.min(CFG.worldSize-2,y0+oy)),i=w.idx(x,y);
        cells.push({x,y,i});
      }
      this.forageCache.set(key,cells);
    }
    const rows=[],foods=Object.entries(groundDiet(a)).filter(([kind,eff])=>PLANTS[kind]&&eff>0),wetFoods=Object.entries(FRESHWATER_FOOD).map(([kind,p])=>({kind,p,preference:freshwaterPreference(a,kind)})).filter(v=>v.preference>0);
    // Reach to ground cells depends only on one physical land-region label,
    // unless the animal is capable of swimming. Read the resident's region
    // exactly once rather than re-querying both coordinates for 121 survey
    // samples. We still check the same playable coordinates and same water.
    const swimmer=canSwim(a),originRegion=swimmer?0:w.regionAt(a.x,a.y),waterOnly=scoresWaterOnly(this.sim,a);
    const seenWater=new Set();let food=0,land=0,waterEnergy=0;
    for(const {x,y,i} of cells){
      if(w.water[i]){
        if(seenWater.has(i))continue;seenWater.add(i);
        let accessible=false;for(const {kind,p,preference} of wetFoods){
          if(!canAccessFreshwater(this.sim,a,x,y,p,{planning:true}))continue;accessible=true;
          const energy=(freshwaterField(w,kind)?.[i]||0)*p.nutrition;
          food+=energy*preference;waterEnergy+=energy*preference;
          if(energy>0)rows.push({kind,x,y,wet:true,preference,energy,stock:freshwaterField(w,kind)?.[i]||0});
        }
        if(accessible)land++;continue;
      }
      // aquatic-foraging/1: a water dweller's forage is scored over usable water only.
      if(waterOnly)continue;
      if(!w.isPlayable(x,y)||!(swimmer||(originRegion!==0&&w.landRegion[i]===originRegion)))continue;land++;
      for(const [kind,eff] of foods){
        const stock=w.plants[kind]?.[i]||0;if(stock<=0)continue;
        const nutrition=this.sim.dispersal.genomeAt(kind,i)?.traits.nutrition??PLANTS[kind].nutrition,energy=stock*nutrition;
        const edible=this.sim.dispersal.seedReserve[kind]?this.sim.dispersal.cropYield(a,kind,i)*nutrition:energy*eff;
        food+=edible;rows.push({kind,x,y,wet:false,preference:edible/energy,energy,stock});
      }
      {const pref=plantPreference(a,'carrion'),stock=w.carrion?.[i]||0;if(pref>0&&stock>0){const energy=stock*meatEnergy(this.sim,a);food+=energy*pref;rows.push({kind:'carrion',x,y,wet:false,preference:pref,energy})}}
    }
    return{value:land?food/land:0,rows,waterEnergy,totalEnergy:food};
  }
  // A caller scanning many candidate positions for ONE animal within one tick may pass a Map as
  // surveyMemo. surveyAt depends on the position only through its sampling bucket and, for a
  // non-swimmer, the connected land region that canReach tests, so those are the key. Stocks
  // cannot change mid-scan because the scan only reads. Never reuse a memo across ticks or animals.
  surveyFor(a,memo){
    if(!memo)return this.surveyAt(a);
    const bx=Math.max(0,Math.min(this.cols-1,Math.floor(a.x/this.bucketSize))),by=Math.max(0,Math.min(this.cols-1,Math.floor(a.y/this.bucketSize)));
    const key=bx+':'+by+':'+(canSwim(a)?'swim':this.sim.world.regionAt(a.x,a.y));
    let supply=memo.get(key);if(!supply){supply=this.surveyAt(a);memo.set(key,supply)}return supply;
  }
  // onlyIfAllowed: the caller discards any refused result, so a forager whose surveyed forage
  // already fails the resource gate (which no crowding value can rescue) returns {allowed:false}
  // without the crowding survey. Hunters keep the full evaluation (their resource is prey-based).
  breedingState(a,{at=null,surveyMemo=null,onlyIfAllowed=false}={}){
    const resident=a;if(at)a={...a,x:at.x,y:at.y};
    const s=SPECIES[a.species],density=s?.density||{radius:4,softCap:10},repro=reproductionFor(a.species);
    const supply=this.surveyFor(a,surveyMemo);
    // breeding-support/1: one anatomy- and resource-based rule for every body.
    const shared=breedingSupportEnabled(this.sim);
    if(shared&&onlyIfAllowed&&!(renewableSupply(this.sim,a,supply)>breedingNeed(a,this.sim)))return{allowed:false};
    if(!shared&&onlyIfAllowed&&!canHunt(a)&&this.sim.speciesLifestyle?.feedingMode?.(a)!=='hunter'){const min=repro.minForage??0,opt=Math.max(min+.01,repro.optimalForage??Math.max(1,min*1.6));if(!(clamp(0,1.08,(supply.value-min)/(opt-min))>.04))return{allowed:false}}
    const overlaps=surveyMemo?(surveyMemo.overlaps??=new WeakMap()):null;let overlapMemo=overlaps?.get(supply)||null;if(overlaps&&!overlapMemo){overlapMemo=new Map();overlaps.set(supply,overlapMemo)}
    const demand=dietaryDemand(this.sim,a,supply,shared?BREEDING_SUPPORT.radius:density.radius,{residentId:resident.id,overlapMemo});
    // Nearby is a habitat headcount, not a family or species population. Only
    // accessible finite-food overlap contributes consumer-equivalent demand.
    const local=demand.nearby,competitors=demand.demand;
    const ratio=(1+competitors)/Math.max(1,density.softCap);
    const crowd=ratio<=.32?1:ratio>=1.18?0:clamp(0,1,1-(ratio-.32)/.86);
    let resource=1,resourceValue=1,preyReference=null;
    const hunterLifestyle=this.sim.speciesLifestyle?.feedingMode?.(a)==='hunter';
    if(canHunt(a)||hunterLifestyle){
      const radius=hunterLifestyle?Math.max(10,density.radius):repro.preyRadius??density.radius;
      const prey=localPreyOpportunity(this.sim,a,radius),need=hunterLifestyle?4:Math.max(1,repro.minPrey??1);
      // Current edible-biomass equivalents from local finite stock only.
      // Retained minPrey numbers now use these declared units, not headcounts.
      preyReference=preyNormalization(this.sim,a);
      const surveyedFood=supply.totalEnergy/preyReference.energyPerUnit;
      resourceValue=prey.foodUnits+surveyedFood;resource=clamp(0,1.12,resourceValue/need);
    }else{const forage=supply.value,min=repro.minForage??0,opt=Math.max(min+.01,repro.optimalForage??Math.max(1,min*1.6));resourceValue=forage;resource=clamp(0,1.08,(forage-min)/(opt-min))}
    if(shared){const support=breedingSupport(this.sim,a,supply,competitors);return{allowed:support.resource>.04,local,competitors,ratio:support.supportRatio>0?1/support.supportRatio:Infinity,crowd:1,resource:support.resource,resourceValue:support.share,driveRate:.20*Math.max(.05,support.resource),preyReference:null,support}}
    const recoveryBoost=this.sim.recovery?.driveBoost(a.species)??1;
    const driveRate=.20*(repro.driveScale??1)*recoveryBoost*crowd*Math.max(.05,resource);
    return{allowed:ratio<1.18&&resource>.04,local,competitors,ratio,crowd,resource,resourceValue,driveRate,preyReference};
  }
  decisionStride(a){
    const sim=this.sim,p=sim.player?.();if(!p||!sim.playerEnabled||a.player||a.lineage)return 1;
    const dx=a.x-p.x,dy=a.y-p.y,d2=dx*dx+dy*dy,urgent=!!sim.activity?.isUrgent?.(a),near2=CFG.backgroundDecisionDistance**2,far2=CFG.farDecisionDistance**2;
    // The camera follows the player, so these distance bands are also the gameplay view LOD.
    // Urgent off-screen wildlife keeps progressing, but it does not spend the same CPU budget
    // as a threat or animal the player can currently read and react to.
    if(d2>=far2)return urgent?Math.min(4,CFG.farDecisionStride):CFG.farDecisionStride;
    if(d2>=near2)return urgent?Math.min(2,CFG.backgroundDecisionStride):CFG.backgroundDecisionStride;
    if(urgent)return 1;
    return CFG.nearAmbientDecisionStride||1;
  }
  shouldRefreshDecision(a){
    const stride=this.decisionStride(a);if(stride<=1)return true;const s=SPECIES[a.species];
    if(!s||a.hydration/s.maxHydration<.48||a.energy/s.maxEnergy<.52||!a.target||a.target?.alive===false)return true;
    const step=Math.floor(this.sim.tickCount/CFG.lifeStride);return ((step+a.id*3)%stride)===0;
  }
}
