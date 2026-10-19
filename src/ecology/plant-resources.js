// Land-producer resource contract. Prototype normalized units, not calibrated biology.
// Existing vegetation schedules and biomass remain authoritative; no second plant simulation.
import {localRain} from '../world/environment.js';
import {coldFloraDieback} from './cold-flora.js';
import {snowLightFactor,snowGrowthFactor} from '../world/snowpack.js';
import {PLANTS} from '../sim/config.js';
import {SOIL_WATER,plantAvailableWater} from './soil-water.js';
export const PLANT_RESOURCE_UNITS=Object.freeze({waterPerBiomass:.5,mineralPerBiomass:.1,energyPerBiomass:1,waterCapacity:2,energyCapacity:.25});
export const LAND_PRODUCERS=Object.freeze(Object.keys(PLANTS).filter(k=>k!=='rotcap'));
export function initializePlantResources(w){
  w.plantResources={schema:1,units:'normalized-prototype/1',water:Float64Array.from(w.moisture,v=>v*2),minerals:Float64Array.from(w.fertility,v=>v*.4),energy:{},limits:{},totals:{rain:0,shoreInflow:0,evaporation:0,runoff:0,photosynthesis:0,respiration:0,growth:0,waterUsed:0,mineralsUsed:0,mineralized:0,plantLitter:0,seedLitter:0},receipts:[],day:0};
  for(const k of LAND_PRODUCERS){w.plantResources.energy[k]=Float64Array.from(w.plants[k],v=>Math.min(.25,v*.1));w.plantResources.limits[k]=new Uint8Array(w.len)}
  return w.plantResources;
}
export function validatePlantResources(w,r){
  if(r?.schema!==1||r.units!=='normalized-prototype/1')throw Error('Invalid plant resource schema.');
  for(const a of [r.water,r.minerals,...LAND_PRODUCERS.map(k=>r.energy?.[k])])if(!(a instanceof Float64Array)||a.length!==w.len||[...a].some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid finite plant resource stores.');
  for(const k of LAND_PRODUCERS)if(!(r.limits?.[k] instanceof Uint8Array)||r.limits[k].length!==w.len||r.limits[k].some(v=>v>4))throw Error('Invalid plant growth limits.');
}
export function producerBoundary(s,kind,i,amount,direction,reason){if(!(amount>0)||!PLANTS[kind])return;const r=s.world.plantResources,key=direction==='in'?'biomassImported':'biomassExported';r.totals[key]=(r.totals[key]||0)+amount;if(wNear(s.world,i,s.player?.()||{x:-1,y:-1}))record(s,{type:'transfer',kind,i,amount,direction,reason});}
export function exportPlantReserve(s,kind,i,before,after){const r=s.world.plantResources,energy=r?.energy[kind];if(energy&&after<before&&before>0){const exported=energy[i]*(1-after/before);energy[i]-=exported;r.totals.reserveExport=(r.totals.reserveExport||0)+exported;}}
function record(s,entry){const r=s.world.plantResources;r.receipts.push({...entry,tick:s.tickCount,day:s.day});if(r.receipts.length>48)r.receipts.shift()}
export function advancePlantInputs(s){const w=s.world,r=w.plantResources,u=PLANT_RESOURCE_UNITS;r.day=s.day;
  for(let i=0;i<w.len;i++){if(w.water[i])continue;if(SOIL_WATER.enabled){const before=r.water[i];r.water[i]=plantAvailableWater(w,i,u.waterCapacity);r.totals.soilExchange=(r.totals.soilExchange||0)+r.water[i]-before;}else{const before=r.water[i],rain=Math.max(0,s.climate.rain)*.06,shore=(w.seepage[i]||0)*.02,evap=Math.min(before+rain+shore,.025+.035*Math.max(0,s.climate.temp)),next=before+rain+shore-evap,runoff=Math.max(0,next-u.waterCapacity);r.water[i]=Math.min(u.waterCapacity,next);r.totals.rain+=rain;r.totals.shoreInflow+=shore;r.totals.evaporation+=evap;r.totals.runoff+=runoff;}
    const total=LAND_PRODUCERS.reduce((v,k)=>v+w.plants[k][i],0),flux=Math.max(0,1-localRain(w,s.climate,i)*.45)*.04;
    // A real standing woody canopy intercepts light before it reaches plants
    // below. Interception reduces solar input; it never creates new reserves.
    const shade=Math.min(.60,Math.max(0,(w.plants.woodspire?.[i]||0)*.55)),snowlight=snowLightFactor(w,i);
    for(const k of LAND_PRODUCERS){const biomass=w.plants[k][i],energy=r.energy[k],incoming=(total>0?flux*snowlight*Math.min(1,total)*biomass/total:0)*(k==='woodspire'?1:k==='sunmoss'||k==='bramble'?1-shade:1-shade*.35),beforeEnergy=energy[i],respiration=Math.min(beforeEnergy+incoming,.003*biomass),excess=Math.max(0,beforeEnergy+incoming-respiration-u.energyCapacity);energy[i]=Math.min(u.energyCapacity,beforeEnergy+incoming-respiration);r.totals.photosynthesis+=incoming;r.totals.respiration+=respiration+excess;}
  }
  r.soilWaterLinked=SOIL_WATER.enabled;
}
export function fundPlantGrowth(s,kind,i,before,desired,{cap=Infinity,sharedLimit=0}={}){const r=s.world.plantResources,u=PLANT_RESOURCE_UNITS,wanted=Math.max(0,desired-before),water=r.water[i],minerals=r.minerals[i],energy=r.energy[kind][i],limits=[wanted,water/u.waterPerBiomass,minerals/u.mineralPerBiomass,energy/u.energyPerBiomass],growth=Math.min(...limits,cap);r.limits[kind][i]=wanted<=1e-12?0:growth+1e-12>=wanted?1:growth===cap&&sharedLimit?sharedLimit:limits.indexOf(growth)+1;
  if(growth>0){r.water[i]=Math.max(0,water-growth*u.waterPerBiomass);r.minerals[i]=Math.max(0,minerals-growth*u.mineralPerBiomass);r.energy[kind][i]=Math.max(0,energy-growth*u.energyPerBiomass);r.totals.growth+=growth;r.totals.waterUsed+=growth*u.waterPerBiomass;r.totals.mineralsUsed+=growth*u.mineralPerBiomass;}
  const p=s.player?.();if(p&&wNear(s.world,i,p)&&wanted>0)record(s,{type:'growth',kind,i,before,after:before+growth,requested:wanted,waterBefore:water,waterAfter:r.water[i],mineralsBefore:minerals,mineralsAfter:r.minerals[i],energyBefore:energy,energyAfter:r.energy[kind][i],limit:r.limits[kind][i]});return before+growth;
}
function wNear(w,i,p){return i===w.idx(p.x,p.y)}
export function returnPlantLoss(s,kind,i,amount){if(!(amount>0))return;s.dispersal.litter[i]+=amount;s.world.plantResources.totals.plantLitter+=amount;}
export function mineralizePlantLitter(s,i,amount){const r=s.world.plantResources,u=PLANT_RESOURCE_UNITS,gain=amount*u.mineralPerBiomass;r.minerals[i]+=gain;r.totals.mineralized+=gain;if(wNear(s.world,i,s.player?.()||{x:-1,y:-1}))record(s,{type:'decomposition',i,biomass:amount,minerals:gain});return gain;}
export function plantResourceView(w,kind,i){const r=w.plantResources;if(!r?.energy[kind])return null;const state=['Dormant or declining','Growing','Water limited','Nutrient limited','Stored energy limited'][r.limits[kind][i]]||'Growing';return{state,water:r.water[i],minerals:r.minerals[i],energy:r.energy[kind][i],day:r.day}}

// Plant tissue turnover candidate (Phase 3J Step 5; OFF by default, for creator review). At equilibrium
// rooted producers shed almost no tissue (litter 5.9/day from 16,000 standing biomass: a tissue lifetime of
// about 2,700 days), which starves decomposers: rotcap stays near 0.05 per cell and mirelick cannot fund
// reproduction. With the candidate every rooted producer sheds PLANT_TURNOVER.rate of its standing tissue to
// litter each day and regrows it only through the ordinary funded growth below (water, minerals, its own
// stored energy). Nothing is created; decomposition returns minerals. Rate 1/120 (about 4 months) is a
// PROPOSAL. ?plantTurnover=1 enables.
export const PLANT_TURNOVER={enabled:false,rate:1/120};
// All local producers submit demand before any shared soil input is withdrawn.
// Energy remains producer-owned; scarce water/minerals are allocated proportionally.
export function growLandProducers(s,i,entries,{m,f,temp,scar,grow}){
  const w=s.world,r=w.plantResources,u=PLANT_RESOURCE_UNITS,dispersal=s.dispersal,requests=[];
  for(const e of entries){const {kind,p,d,plants,bank,seasonBoost}=e,initial=plants[i];let current=initial;
    if(d?.seedLimited&&current<=.002&&!dispersal.isEstablished(kind,i)){returnPlantLoss(s,kind,i,current);current=current<=.0005&&(!bank||bank[i]<.012)?0:dispersal.germinate(kind,i,m,f,temp);}
    // Real warm spells kill specialist tissue; it becomes ordinary decomposer
    // litter, not vanished biomass or a synthetic climate multiplier.
    const heatLoss=current*coldFloraDieback(kind,temp);
    if(heatLoss>0){current-=heatLoss;returnPlantLoss(s,kind,i,heatLoss)}
    if(PLANT_TURNOVER.enabled&&current>0){const shed=current*PLANT_TURNOVER.rate;current-=shed;returnPlantLoss(s,kind,i,shed);w.plantResources.totals.senescence=(w.plantResources.totals.senescence||0)+shed}
    const genome=dispersal.genomeAt(kind,i),phenotype=genome?.schema===4?{...p,growth:genome.traits.growth,waterNeed:genome.traits.waterNeed}:p;let desired=grow(current,phenotype,m,f,temp,{seedLimited:!!d?.seedLimited&&!dispersal.isEstablished(kind,i)});if(scar>0&&desired>current)desired=current+(desired-current)*(1-scar);
    if(desired>current)desired=current+(desired-current)*snowGrowthFactor(w,i);
    desired=Math.min(p.carry,desired*seasonBoost);
    requests.push({e,initial,current,desired,wanted:Math.max(0,desired-current),demand:Math.min(Math.max(0,desired-current),r.energy[kind][i]/u.energyPerBiomass)});
  }
  const total=requests.reduce((a,b)=>a+b.demand,0),waterScale=total>0?r.water[i]/(total*u.waterPerBiomass):1,mineralScale=total>0?r.minerals[i]/(total*u.mineralPerBiomass):1,scale=Math.min(1,waterScale,mineralScale),sharedLimit=scale<1?(waterScale<=mineralScale?2:3):0;
  for(const q of requests){const {e,initial,current,desired,demand}=q,{kind,p,d,plants}=e;let next=desired;
    if(next>current)next=fundPlantGrowth(s,kind,i,current,desired,{cap:demand*scale,sharedLimit});else{r.limits[kind][i]=0;if(next<current)returnPlantLoss(s,kind,i,current-next);}
    dispersal.noteGrowth(kind,i,initial,next);plants[i]=next;if(d?.localRelease&&next>=(d.mature??p.carry*.45))dispersal.releaseLocal(kind,i,next);
  }
}
