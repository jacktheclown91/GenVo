// Frozen unoptimized survey/demand algorithm; current local-biomass biology only.
import {dietaryDemand} from '../../src/../src/ecology/dietary-demand.js';
import {preyNormalization,localPreyOpportunity} from '../../src/../src/ecology/prey-normalization.js';
import {FRESHWATER_FOOD,freshwaterPreference,freshwaterField,canAccessFreshwater} from '../../src/../src/ecology/freshwater-food.js';
import {CFG,PLANTS} from '../../src/sim/config.js';
import {SPECIES} from '../../src/organisms/species.js';
import {groundDiet,canHunt} from '../../src/../src/ecology/functional-diet.js';

const clamp=(min,max,v)=>Math.max(min,Math.min(max,v));

// CarryingPressureController keeps reproduction tied to local crowding and food
// availability while leaving CFG.maxAnimals as an emergency safety ceiling only.
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
    const seenWater=new Set();let food=0,land=0,waterEnergy=0;
    for(const {x,y,i} of cells){
      if(w.water[i]){
        if(seenWater.has(i))continue;seenWater.add(i);
        let accessible=false;for(const {kind,p,preference} of wetFoods){
          if(!canAccessFreshwater(this.sim,a,x,y,p))continue;accessible=true;
          const energy=(freshwaterField(w,kind)?.[i]||0)*p.nutrition;
          food+=energy*preference;waterEnergy+=energy*preference;
          if(energy>0)rows.push({kind,x,y,wet:true,preference,energy});
        }
        if(accessible)land++;continue;
      }
      if(!this.sim.canOccupy(a,x,y)||!this.sim.canReach(a,x,y))continue;land++;
      for(const [kind,eff] of foods){
        const stock=w.plants[kind]?.[i]||0;if(stock<=0)continue;
        const nutrition=this.sim.dispersal.genomeAt(kind,i)?.traits.nutrition??PLANTS[kind].nutrition,energy=stock*nutrition;
        const edible=this.sim.dispersal.seedReserve[kind]?this.sim.dispersal.cropYield(a,kind,i)*nutrition:energy*eff;
        food+=edible;rows.push({kind,x,y,wet:false,preference:edible/energy,energy});
      }
    }
    return{value:land?food/land:0,rows,waterEnergy,totalEnergy:food};
  }
  breedingState(a,{at=null}={}){
    const resident=a;if(at)a={...a,x:at.x,y:at.y};
    const s=SPECIES[a.species],density=s?.density||{radius:4,softCap:10},repro=s?.reproduction||{};
    const supply=this.surveyAt(a),demand=dietaryDemand(this.sim,a,supply,density.radius,{residentId:resident.id});
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
      // Same adult-prey equivalent units. Accessible finite aquatic energy is
      // the supply; normalization contributes no resource and grants no breeding.
      preyReference=preyNormalization(this.sim,a);
      const surveyedFood=supply.totalEnergy/preyReference.energyPerUnit;
      resourceValue=prey.foodUnits+surveyedFood;resource=clamp(0,1.12,resourceValue/need);
    }else{const forage=supply.value,min=repro.minForage??0,opt=Math.max(min+.01,repro.optimalForage??Math.max(1,min*1.6));resourceValue=forage;resource=clamp(0,1.08,(forage-min)/(opt-min))}
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
