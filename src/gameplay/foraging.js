import {undergroundFood} from '../lineage/burrowing.js';
import {waterFromCarrion} from '../ecology/tissue-water.js';
import {plantHandling} from '../ecology/plant-handling.js';
import {exportAquaticReserve} from '../ecology/organic-resource-cycle.js';
import {FLORA_TISSUES,floraMealChannels} from '../ecology/flora-genotype.js';
import {plantPreference,groundDiet} from '../ecology/functional-diet.js';
import {aquaticFoodAccessible,submerged} from '../lineage/diving.js';
import {FRESHWATER_FOOD,freshwaterField,freshwaterPreference} from '../ecology/freshwater-food.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {adaptationEffects} from '../lineage/evolution.js';
import {PHYSIOLOGY_PARITY,noteFoodGroup,mealBiteFor,plantMealWater} from '../ecology/physiology.js';
import {PLACE,taughtOffset} from '../cognition/cognition.js';

// Player-facing food physiology and learned forage places. Ecology still owns plant
// growth, biomass and animal diets; this controller only makes the controlled
// GenVo8's forage choices and remembered patches distinct/readable.
export const FOOD_PROFILES=Object.freeze({
  sunmoss:{group:'ground',role:'steady bulk',bite:.22,energy:1.00,water:1},
  bramble:{group:'fruit',role:'rich + juicy',bite:.16,energy:1.02,water:5},
  marshroot:{group:'wet',role:'water-rich',bite:.17,energy:.96,water:9},
  rotcap:{group:'fungus',role:'soft + damp',bite:.16,energy:1.02,water:3},
  thistlepod:{group:'seed',role:'dense seed',bite:.15,energy:1.14,water:0},
  dunebulb:{group:'fruit',role:'drought bulb flesh',bite:.14,energy:1.04,water:4},
  dustsage:{group:'seed',role:'hard-coated sage seeds',bite:.14,energy:1.07,water:0},
  frostlichen:{group:'ground',role:'cold ground cover',bite:.16,energy:1.01,water:1},
  snowberry:{group:'fruit',role:'cold-season fruit',bite:.14,energy:1.05,water:3},
  carrion:{group:'animal',role:'dense · disease risk',bite:.18,energy:1.20,water:0}
});

const FOOD_ORDER=['sunmoss','bramble','marshroot','rotcap','thistlepod','woodspire','dunebulb','dustsage','frostlichen','snowberry','carrion'];
export const SEASONAL_FORAGE=Object.freeze({
  sunmoss:{SPRING:1.10,SUMMER:.96,AUTUMN:1.02,WINTER:.72},
  bramble:{SPRING:.92,SUMMER:1.02,AUTUMN:1.16,WINTER:.68},
  marshroot:{SPRING:1.15,SUMMER:.90,AUTUMN:1.00,WINTER:.70},
  rotcap:{SPRING:1.06,SUMMER:.86,AUTUMN:1.15,WINTER:.76},
  thistlepod:{SPRING:.86,SUMMER:1.16,AUTUMN:1.08,WINTER:.78},
  dunebulb:{SPRING:1.05,SUMMER:.83,AUTUMN:1.12,WINTER:.68},
  dustsage:{SPRING:.90,SUMMER:1.10,AUTUMN:1.05,WINTER:.76},
  frostlichen:{SPRING:1.06,SUMMER:.80,AUTUMN:1.04,WINTER:.96},
  snowberry:{SPRING:.92,SUMMER:.98,AUTUMN:1.16,WINTER:.68}
});
const PATCH_RADIUS=2.5,PATCH_MERGE=5,PATCH_MEMORY_LIMIT=8,PATCH_READY=.45,PATCH_ABUNDANT=.72,PATCH_THIN=.18,COMPETITION_RADIUS=6;
const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
const labelFor=kind=>PLANTS[kind]?.label||FRESHWATER_FOOD[kind]?.label||(kind==='carrion'?'Carrion':kind);

export class ForagingController{
  constructor(sim){this.sim=sim;this.states=new Map()}
  state(animal){
    if(!animal)return null;
    let s=this.states.get(animal.id);if(!s){s={selectedKind:null,manual:false,recent:[],recentKinds:[],lastMeal:null,patches:[],patchNotice:null};this.states.set(animal.id,s)}return s;
  }
  foodPreference(animal,kind){return FRESHWATER_FOOD[kind]?freshwaterPreference(animal,kind):plantPreference(animal,kind)}
  profile(kind){return FOOD_PROFILES[kind]||{group:kind,role:'edible',bite:.18,energy:1,water:0}}
  seasonFactor(kind,season=this.sim.season){return SEASONAL_FORAGE[kind]?.[season]??1}
  seasonReliability(patch){const base=this.seasonFactor(patch.kind),sample=patch.seasonSamples?.[this.sim.season];if(!sample)return base;const empirical=.72+clamp01(sample.meanRatio)*.46,weight=Math.min(.45,.18+sample.visits*.09);return base*(1-weight)+empirical*weight}
  seasonLabel(kind,season=this.sim.season,factor=this.seasonFactor(kind,season)){const name=season.toLowerCase();return factor>=1.08?`strong this ${name}`:factor<=.80?`weak this ${name}`:`steady this ${name}`}
  observeCompetition(animal,patch){
    let family=0,wildlife=0;for(const other of this.sim.animals){if(!other?.alive||other.id===animal.id)continue;if(plantPreference(other,patch.kind)<=0)continue;const d=Math.hypot(other.x-patch.x,other.y-patch.y);if(d>COMPETITION_RADIUS)continue;const engaged=other.intent==='feed'||d<=3.25;if(!engaged)continue;if(other.lineage)family++;else wildlife++;}
    const pressure=clamp01(family*.15+wildlife*.28);return{family,wildlife,pressure,tick:this.sim.tickCount};
  }
  competitionView(patch){const c=patch.competition||{family:0,wildlife:0,pressure:0,tick:patch.lastSeenTick??this.sim.tickCount},ageDays=Math.max(0,(this.sim.tickCount-(c.tick??patch.lastSeenTick??0))/CFG.dayTicks),decay=Math.exp(-ageDays/6),pressure=clamp01((c.pressure||0)*decay);return{family:c.family||0,wildlife:c.wildlife||0,pressure,ageDays,label:pressure>=.48?'contested':pressure>=.22?(c.family>c.wildlife?'family-used':'grazed'):'quiet'}}
  options(animal=this.sim.player(),{index=null,kind:onlyKind=null,tissue:onlyTissue=null}={}){
    if(!animal?.alive)return[];
    const spec=SPECIES[animal.species],w=this.sim.world,best=new Map();
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
      const x=animal.x+ox,y=animal.y+oy,i=w.idx(x,y);if(index!==null&&i!==index)continue;
      for(const [kind,eff] of [...Object.entries(groundDiet(animal)),...Object.keys(FRESHWATER_FOOD).map(kind=>[kind,this.foodPreference(animal,kind)])]){
        if(!undergroundFood(animal,i,kind,w))continue;if(submerged(animal)&&!FRESHWATER_FOOD[kind])continue;
        if(eff<=0||(onlyKind!==null&&kind!==onlyKind))continue;let amount=0,nutrition=0;
        if(FRESHWATER_FOOD[kind]){if(!aquaticFoodAccessible(this.sim,animal,x,y,FRESHWATER_FOOD[kind]))continue;if(!w.water[i]||!FRESHWATER_FOOD[kind].surface&&(!this.sim.canOccupy(animal,x,y)||!this.sim.canReach(animal,x,y)))continue;amount=freshwaterField(w,kind)?.[i]||0;nutrition=FRESHWATER_FOOD[kind].nutrition}
        else if(kind==='carrion'){amount=w.carrion[i]||0;nutrition=34}
        else if(PLANTS[kind]){amount=w.plants[kind]?.[i]||0;nutrition=(this.sim.dispersal.genomeAt(kind,i)?.traits.nutrition??PLANTS[kind].nutrition)*3.6}
        else continue;
        if(amount<=(FRESHWATER_FOOD[kind]?0:.06))continue;
        const channels=FLORA_TISSUES[kind]?floraMealChannels(animal,kind):[{tissue:null,eff}];for(const channel of channels){if(onlyTissue!==null&&channel.tissue!==onlyTissue)continue;const preview=channel.tissue?this.sim.dispersal.previewMeal(animal,kind,i,this.profile(kind).bite,channel.tissue):null;if(channel.tissue&&(!preview||preview.edible<=.001))continue;const mealEff=channel.eff;const mealAmount=preview?.edible??Math.min(this.profile(kind).bite,amount);
        const profile=this.profile(kind),lifestyleFood=this.sim.speciesLifestyle?.foodEnergyMultiplier?.(animal,{kind})||1,handling=plantHandling(animal,preview),potential=mealAmount*nutrition*mealEff*profile.energy*lifestyleFood-handling.energyCost;
        const needEnergy=1-clamp01(animal.energy/spec.maxEnergy),needWater=1-clamp01(animal.hydration/spec.maxHydration);
        const distance=Math.hypot(ox,oy),standing=distance<.68?6:0,needScore=potential*(.55+needEnergy*.75)+(channel.tissue==='kernel'?0:profile.water)*(.25+needWater*1.15)-distance*3+standing;
        const key=kind+'|'+(channel.tissue||'');const prev=best.get(key);if(!prev||needScore>prev.needScore)best.set(key,{kind,x,y,i,eff:mealEff,nutrition,amount,profile,needScore,tissue:channel.tissue,label:channel.label,handling});}
      }
    }
    return [...best.values()].sort((a,b)=>FOOD_ORDER.indexOf(a.kind)-FOOD_ORDER.indexOf(b.kind));
  }
  selected(animal=this.sim.player()){
    const options=this.options(animal);if(!options.length)return null;const s=this.state(animal);
    let target=s.manual?options.find(o=>o.kind===s.selectedKind&&(!s.selectedTissue||o.tissue===s.selectedTissue)):null;
    if(!target){target=[...options].sort((a,b)=>b.needScore-a.needScore)[0];s.selectedKind=target.kind;s.selectedTissue=target.tissue;s.manual=false}
    return {...target,index:options.findIndex(o=>o.kind===target.kind&&o.tissue===target.tissue),count:options.length};
  }
  clearManualSelection(animal=this.sim.player()){const state=this.states.get(animal?.id);if(state)state.manual=false}
  cycle(animal=this.sim.player(),step=1){
    const options=this.options(animal);if(!options.length)return null;const s=this.state(animal),selected=this.selected(animal),current=Math.max(0,options.findIndex(o=>o.kind===selected?.kind&&o.tissue===selected?.tissue));const next=(current+(step<0?-1:1)+options.length)%options.length;s.selectedKind=options[next].kind;s.selectedTissue=options[next].tissue;s.manual=true;return {...options[next],index:next,count:options.length};
  }
  // Phase 3J shared physiology: diet variety is read from the animal itself, the same record autonomous feeding keeps.
  projectedBreadth(animal,kind){const group=this.profile(kind).group,recent=[...(PHYSIOLOGY_PARITY.enabled?(animal?.dietRecent||[]):this.state(animal).recent).slice(-3),group];return new Set(recent).size}
  breadthBonus(animal,kind){return 1+Math.max(0,this.projectedBreadth(animal,kind)-1)*.025}
  availability(animal=this.sim.player(),target=null){
    if(!animal?.alive)return{enabled:false,reason:'No active creature.'};
    const spec=SPECIES[animal.species];if(animal.energy>=spec.maxEnergy-.05&&animal.hydration>=spec.maxHydration-.05)return{enabled:false,reason:'Already full and hydrated.'};
    const meal=target?this.options(animal,{index:target.i,kind:target.kind,tissue:target.tissue??null})[0]:this.options(animal)[0];
    if(meal&&!meal.handling.enabled)return{enabled:false,reason:`Not enough energy to open this coat (${meal.handling.energyCost.toFixed(2)} needed). Find softer food.`,meal:null};
    return meal?{enabled:true,reason:meal.handling.reason,meal}:{enabled:false,reason:target?'The selected food is unreachable or incompatible with this body.':'Move beside food this body can eat.'};
  }
  consume(animal,target=this.selected(animal)){
    if(!animal?.alive||!target)return{ok:false,type:'eat',message:'No food nearby.'};
    const w=this.sim.world,spec=SPECIES[animal.species],profile=this.profile(target.kind),arr=FRESHWATER_FOOD[target.kind]?freshwaterField(w,target.kind):target.kind==='carrion'?w.carrion:w.plants[target.kind];if(!arr)return{ok:false,type:'eat',message:'That food is gone.'};
    if(FRESHWATER_FOOD[target.kind]&&(!w.water[target.i]||!freshwaterPreference(animal,target.kind)||Math.hypot(animal.x-target.x,animal.y-target.y)>1.5||!FRESHWATER_FOOD[target.kind].surface&&(!this.sim.canOccupy(animal,target.x,target.y)||!this.sim.canReach(animal,target.x,target.y))))return{ok:false,type:'eat',message:'Cannot reach that food.'};
    const validated=this.options(animal,{index:target.i,kind:target.kind,tissue:target.tissue??null}).find(o=>!target.tissue||o.tissue===target.tissue);if(!validated)return{ok:false,type:'eat',message:'That tissue is unavailable for this anatomy.'};target=validated;if(!target.handling.enabled)return{ok:false,type:'eat',message:`Not enough energy to open this coat (${target.handling.energyCost.toFixed(2)} needed). Find softer food.`};const available=arr[target.i]||0,got=Math.min(PLANTS[target.kind]?mealBiteFor(profile,this.sim):profile.bite,available);if(got<=(FRESHWATER_FOOD[target.kind]?0:.01))return{ok:false,type:'eat',kind:target.kind,message:'That patch is picked clean.'};
    const beforeEnergy=animal.energy,beforeWater=animal.hydration,breadth=this.projectedBreadth(animal,target.kind),breadthBonus=this.breadthBonus(animal,target.kind),fx=adaptationEffects(animal);
    const lifestyleFood=this.sim.speciesLifestyle?.foodEnergyMultiplier?.(animal,{kind:target.kind})||1,preview=target.tissue?this.sim.dispersal.previewMeal(animal,target.kind,target.i,got,target.tissue):null,gross=(preview?.edible??got)*target.nutrition*target.eff*animal.genes.digestion*fx.foodGain*profile.energy*breadthBonus*lifestyleFood,waterScale=Math.min(1,got/profile.bite),potentialWater=target.tissue==='kernel'||(PLANTS[target.kind]&&!plantMealWater(this.sim))?0:profile.water*waterScale*(preview?preview.edible/Math.max(.001,got):1);
    if(beforeEnergy>=spec.maxEnergy-.05&&beforeWater>=spec.maxHydration-.05)return{ok:false,type:'eat',kind:target.kind,message:'Already full and hydrated.'};
    const beforePatch=(PLANTS[target.kind]||FRESHWATER_FOOD[target.kind])?this.surveyPatch(target.kind,target.x,target.y):null;
    if(FRESHWATER_FOOD[target.kind]){const before=arr[target.i];arr[target.i]-=got;exportAquaticReserve(w,target.kind,target.i,before-arr[target.i],before);w.organicResources.totals.foodExported+=before-arr[target.i];if(target.kind==='detritus')this.sim.disease.onCarrionFeed(animal,target.i,got)}
    else if(target.kind==='carrion'){const carrionBefore=arr[target.i];arr[target.i]-=got;waterFromCarrion(this.sim,animal,target.i,got,carrionBefore);this.sim.disease.onCarrionFeed(animal,target.i,got)}
    else{if(target.tissue){const receipt=this.sim.dispersal.harvestMeal(animal,target.kind,target.i,got,target.tissue);if(!receipt)return{ok:false,type:'eat',message:'That crop tissue is no longer available.'}}else{w.consume(target.kind,target.i%w.n+.5,Math.floor(target.i/w.n)+.5,got);this.sim.dispersal.onFeed(animal,target.kind,got)}this.sim.history.notePlantConsumption(target.kind,target.x,target.y,got)}
    animal.energy=Math.min(spec.maxEnergy,animal.energy+gross);if(target.tissue&&animal.lastPlantMeal){animal.lastPlantMeal.processingCost=target.handling.energyCost;animal.lastPlantMeal.specializedHandling=target.handling.specialized;}
    animal.hydration=Math.min(spec.maxHydration,animal.hydration+potentialWater);
    const state=this.state(animal),group=profile.group;if(PHYSIOLOGY_PARITY.enabled)noteFoodGroup(animal,group);state.recent.push(group);if(state.recent.length>4)state.recent.shift();state.recentKinds.push(target.kind);if(state.recentKinds.length>4)state.recentKinds.shift();state.selectedKind=target.kind;state.selectedTissue=target.tissue;state.manual=false;
    const energyGain=animal.energy-beforeEnergy,waterGain=animal.hydration-beforeWater;state.lastMeal={kind:target.kind,tissue:target.tissue,producerGenomeId:preview?.genome?.id,group,energyGain,waterGain,processingCost:target.handling.energyCost,breadth,day:this.sim.day,year:this.sim.year,tick:this.sim.tickCount};
    this.sim.cognition.onFeed(animal,target.kind,{x:target.x,y:target.y});this.sim.speciesLifestyle?.noteFeeding?.(animal,{kind:target.kind,amount:got,energyGain});
    const patch=(PLANTS[target.kind]||FRESHWATER_FOOD[target.kind])?this.rememberPatch(animal,target.kind,target.x,target.y,{before:beforePatch,meal:true}):null;
    const gains=[];if(energyGain>.05)gains.push(energyGain<.5?'+<1 energy':`+${Math.round(energyGain)} energy`);if(waterGain>.05)gains.push(waterGain<.5?'+<1 water':`+${Math.round(waterGain)} water`);if(!gains.length)gains.push('topped up');
    return{ok:true,type:'eat',kind:target.kind,processingCost:target.handling.energyCost,energyGain,waterGain,breadth,role:profile.role,patch,tissue:target.tissue,plantReceipt:target.tissue?animal.lastPlantMeal:null,message:`${target.label||labelFor(target.kind)} · ${gains.join(' · ')}${target.handling.energyCost>0?' · worked through the coat':''}${preview?.viableSeeds>0?' · carrying seeds':preview?.destroyedSeeds>0?' · kernels consumed; seeds destroyed':''}${animal.lastBotanicalContact?.tick===this.sim.tickCount?(animal.lastBotanicalContact.accepted?' · flowers received pollen':animal.lastBotanicalContact.result==='recognition'?' · flowers did not accept this pollen':animal.pollenCargo?' · flower dust clings to you':''):''}`};
  }
  surveyPatch(kind,x,y,center=null){
    if(!PLANTS[kind]&&!FRESHWATER_FOOD[kind])return null;const w=this.sim.world,arr=FRESHWATER_FOOD[kind]?freshwaterField(w,kind):w.plants[kind],cx=center?.x??x,cy=center?.y??y;let total=0,cells=0;
    const minX=Math.max(1,Math.floor(cx-PATCH_RADIUS)),maxX=Math.min(CFG.worldSize-2,Math.ceil(cx+PATCH_RADIUS));
    const minY=Math.max(1,Math.floor(cy-PATCH_RADIUS)),maxY=Math.min(CFG.worldSize-2,Math.ceil(cy+PATCH_RADIUS));
    for(let yy=minY;yy<=maxY;yy++)for(let xx=minX;xx<=maxX;xx++){if(Math.hypot(xx+.5-cx,yy+.5-cy)>PATCH_RADIUS+.45)continue;total+=arr[w.idx(xx+.5,yy+.5)]||0;cells++}
    return{kind,x:cx,y:cy,total,cells,max:cells*(PLANTS[kind]?.carry||FRESHWATER_FOOD[kind]?.carry||1)};
  }
  patchStatus(ratio){return ratio>=PATCH_ABUNDANT?'abundant':ratio>=PATCH_READY?'usable':ratio>=PATCH_THIN?'thin':'exhausted'}
  patchFor(animal,kind,x,y){const patches=this.state(animal)?.patches||[];return patches.filter(p=>p.kind===kind).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]}
  rememberPatch(animal,kind,x,y,{before=null,meal=false}={}){
    if(!animal||!PLANTS[kind]&&!FRESHWATER_FOOD[kind])return null;const state=this.state(animal);let patch=state.patches.find(p=>p.kind===kind&&Math.hypot(p.x-x,p.y-y)<=PATCH_MERGE);
    const surveyBefore=before||this.surveyPatch(kind,x,y,patch),center=patch?{x:patch.x,y:patch.y}:{x,y},after=this.surveyPatch(kind,x,y,center);if(!after)return null;
    const isNew=!patch;if(!patch){patch={id:`${kind}:${Math.round(x*2)}:${Math.round(y*2)}`,kind,x,y,firstSeenTick:this.sim.tickCount,lastSeenTick:this.sim.tickCount,bestSeen:Math.max(.01,surveyBefore?.total||after.total),lastAmount:after.total,lastRatio:1,status:'abundant',visits:0,meals:0,depletedTick:null,lastEvent:null,seasonSamples:{},competition:{family:0,wildlife:0,pressure:0,tick:this.sim.tickCount}};state.patches.push(patch);if(state.patches.length>PATCH_MEMORY_LIMIT)state.patches.sort((a,b)=>b.lastSeenTick-a.lastSeenTick).length=PATCH_MEMORY_LIMIT}
    const previous=patch.status,previousCompetition=patch.competition?.pressure||0;patch.bestSeen=Math.max(patch.bestSeen||.01,surveyBefore?.total||0,after.total);patch.lastAmount=after.total;patch.lastRatio=clamp01(after.total/Math.max(.01,patch.bestSeen));patch.status=this.patchStatus(patch.lastRatio);patch.lastSeenTick=this.sim.tickCount;patch.visits+=(isNew||this.sim.tickCount-(patch.lastVisitTick||-Infinity)>=CFG.dayTicks*.25)?1:0;patch.lastVisitTick=this.sim.tickCount;if(meal)patch.meals=(patch.meals||0)+1;
    const season=this.sim.season,observedRatio=clamp01((surveyBefore?.total??after.total)/Math.max(.01,patch.bestSeen)),sample=patch.seasonSamples?.[season]||{visits:0,meanRatio:0};sample.meanRatio=(sample.meanRatio*sample.visits+observedRatio)/(sample.visits+1);sample.visits++;sample.lastTick=this.sim.tickCount;patch.seasonSamples[season]=sample;patch.competition=this.observeCompetition(animal,patch);
    if(patch.status==='exhausted'&&previous!=='exhausted'){patch.depletedTick=this.sim.tickCount;patch.lastEvent='depleted';state.patchNotice={type:'depleted',patchId:patch.id,tick:this.sim.tickCount};this.sim.cognition.record(animal,'forage-depleted',`${labelFor(kind)} patch picked nearly clean`,{kind,x:patch.x,y:patch.y})}
    else if((previous==='exhausted'||previous==='thin')&&(patch.status==='usable'||patch.status==='abundant')){patch.lastEvent='recovered';state.patchNotice={type:'recovered',patchId:patch.id,tick:this.sim.tickCount};this.sim.cognition.record(animal,'forage-recovered',`${labelFor(kind)} patch recovered`,{kind,x:patch.x,y:patch.y})}
    if(isNew)this.sim.cognition.recordOnce(animal,`forage-patch:${patch.id}`,`Learned a ${labelFor(kind)} patch`,{kind,x:patch.x,y:patch.y});
    if(patch.competition.pressure>=.48&&previousCompetition<.30)this.sim.cognition.record(animal,'forage-contested',`${labelFor(kind)} patch had heavy feeding pressure`,{kind,x:patch.x,y:patch.y,family:patch.competition.family,wildlife:patch.competition.wildlife});
    else if(previousCompetition>=.42&&patch.competition.pressure<.18)this.sim.cognition.record(animal,'forage-open',`${labelFor(kind)} patch looked quieter again`,{kind,x:patch.x,y:patch.y});
    return this.patchView(animal,patch,{actual:true});
  }
  observeNearby(animal=this.sim.player()){
    if(!animal?.alive)return;const state=this.state(animal);for(const patch of state.patches){if(Math.hypot(animal.x-patch.x,animal.y-patch.y)>PATCH_RADIUS+1.4)continue;if(this.sim.tickCount-patch.lastSeenTick<CFG.lifeStride)continue;this.rememberPatch(animal,patch.kind,patch.x,patch.y)}
  }
  recoveryRate(kind,patch=null){const p=PLANTS[kind],season=patch?this.seasonReliability(patch):this.seasonFactor(kind),competition=patch?this.competitionView(patch).pressure:0,seasonScale=.72+season*.28,competitionScale=1-competition*.42,postRain=1+(this.sim.familyWeather?.postRainBoost?.(kind)||0);return Math.max(.018,Math.min(.18,(p?.growth||.03)*1.35*seasonScale*competitionScale*postRain))}
  estimatedRatio(patch){const days=Math.max(0,(this.sim.tickCount-patch.lastSeenTick)/CFG.dayTicks),rate=this.recoveryRate(patch.kind,patch);return clamp01(1-(1-clamp01(patch.lastRatio))*Math.pow(1-rate,days))}
  daysUntilReady(patch,fromRatio=null){let ratio=clamp01(fromRatio==null?this.estimatedRatio(patch):fromRatio);if(ratio>=PATCH_READY)return 0;const rate=this.recoveryRate(patch.kind,patch);for(let d=1;d<=16;d++){ratio=1-(1-ratio)*(1-rate);if(ratio>=PATCH_READY)return d}return null}
  patchView(animal,patch,{actual=false}={}){
    const distance=Math.hypot(animal.x-patch.x,animal.y-patch.y),ageDays=Math.max(0,(this.sim.tickCount-patch.lastSeenTick)/CFG.dayTicks),ratio=actual?patch.lastRatio:this.estimatedRatio(patch),status=this.patchStatus(ratio),readyIn=ratio>=PATCH_READY?0:this.daysUntilReady(patch,ratio),competition=this.competitionView(patch),seasonFactor=this.seasonFactor(patch.kind),seasonSample=patch.seasonSamples?.[this.sim.season]||null,seasonConfidence=seasonSample?Math.min(1,.45+seasonSample.visits*.18):.25,confidence=Math.max(.2,Math.min(1,(1-ageDays/14)*.78+seasonConfidence*.22))*(patch.taught&&!patch.visits?PLACE.taughtSure:1);
    return{...patch,distance,ageDays,estimatedRatio:ratio,estimatedStatus:status,readyInDays:readyIn,confidence,label:labelFor(patch.kind),season:this.sim.season,seasonFactor,seasonLabel:this.seasonLabel(patch.kind,this.sim.season,seasonFactor),seasonObserved:!!seasonSample,seasonMeanRatio:seasonSample?.meanRatio??null,competitionPressure:competition.pressure,competitionLabel:competition.label,competitionAgeDays:competition.ageDays,familyUse:competition.family,wildlifeUse:competition.wildlife};
  }
  // v1.33 Knowledge: a patch not revisited for PLACE.forgetDays is forgotten.
  forget(state){if(state?.patches?.length)state.patches=state.patches.filter(p=>(this.sim.tickCount-p.lastSeenTick)/CFG.dayTicks<=PLACE.forgetDays);return state}
  knownPatches(animal=this.sim.player()){
    if(!animal)return[];const state=this.forget(this.state(animal));return state.patches.map(p=>this.patchView(animal,p)).sort((a,b)=>a.distance-b.distance||b.estimatedRatio-a.estimatedRatio);
  }
  // A young watching its caregiver feed learns that patch, imperfectly: a little off, less
  // sure, and without knowing how picked-over it was. Its own visit later replaces the copy.
  teachPatch(child,caregiver,kind,x,y){
    if(!child||!PLANTS[kind]&&!FRESHWATER_FOOD[kind])return null;const state=this.state(child),own=state.patches.find(p=>p.kind===kind&&Math.hypot(p.x-x,p.y-y)<=PATCH_MERGE);
    if(own){own.lastSeenTick=Math.max(own.lastSeenTick,this.sim.tickCount);return own}
    const source=this.state(caregiver)?.patches?.find(p=>p.kind===kind&&Math.hypot(p.x-x,p.y-y)<=PATCH_MERGE)||null,o=taughtOffset(child.id,x,y),px=Math.max(1,Math.min(CFG.worldSize-2,(source?.x??x)+o.dx)),py=Math.max(1,Math.min(CFG.worldSize-2,(source?.y??y)+o.dy));
    const survey=this.surveyPatch(kind,px,py);if(!survey)return null;
    const patch={id:`${kind}:${Math.round(px*2)}:${Math.round(py*2)}`,kind,x:px,y:py,firstSeenTick:this.sim.tickCount,lastSeenTick:this.sim.tickCount,bestSeen:Math.max(.01,source?.bestSeen??survey.total),lastAmount:survey.total,lastRatio:PATCH_READY,status:'usable',visits:0,meals:0,depletedTick:null,lastEvent:'taught',seasonSamples:{},competition:{family:0,wildlife:0,pressure:0,tick:this.sim.tickCount},taught:true,taughtBy:caregiver?.id??null};
    state.patches.push(patch);if(state.patches.length>PATCH_MEMORY_LIMIT){state.patches.sort((a,b)=>b.lastSeenTick-a.lastSeenTick);state.patches.length=PATCH_MEMORY_LIMIT}
    this.sim.cognition?.recordOnce?.(child,`forage-patch:${patch.id}`,`Was shown a ${labelFor(kind)} patch`,{kind,x:px,y:py,taught:true});
    return patch;
  }
  routeSuggestion(animal=this.sim.player()){
    if(!animal?.alive)return null;const spec=SPECIES[animal.species],needWater=1-clamp01(animal.hydration/spec.maxHydration),needEnergy=1-clamp01(animal.energy/spec.maxEnergy);let best=null,bestScore=-Infinity;
    for(const patch of this.knownPatches(animal)){if(patch.distance<2.8||patch.ageDays>16)continue;if(this.sim.cognition?.fearAt?.(animal,patch.x,patch.y))continue;if(patch.estimatedRatio<PATCH_THIN&&!(patch.readyInDays!=null&&patch.readyInDays<=2))continue;const profile=this.profile(patch.kind),seasonValue=(patch.seasonFactor-1)*.34,competitionCost=patch.competitionPressure*.34,weatherCost=this.sim.exposure?.routePenalty?.(patch.distance,animal)||0,score=patch.estimatedRatio*.9+profile.water*needWater*.045+profile.energy*needEnergy*.3-patch.distance*.018+patch.confidence*.08+seasonValue-competitionCost-weatherCost;if(score>bestScore){bestScore=score;best=patch}}
    return best;
  }
  projectedPatchNote(patch){if(!patch)return'';const condition=patch.estimatedStatus==='abundant'?'abundant when last known':patch.estimatedStatus==='usable'?(patch.ageDays>.5?'likely usable again':'usable'):patch.readyInDays!=null?`recovering · roughly ${patch.readyInDays}d to usable`:'known thin patch';const season=patch.seasonLabel||this.seasonLabel(patch.kind),pressure=this.competitionNote(patch),rain=this.sim.familyWeather?.postRainBoost?.(patch.kind)>0?' · recent rain may help':'';return`${condition} · ${season} · ${pressure}${rain}`}
  competitionNote(patch){if(!patch)return'';if(patch.competitionLabel==='contested')return patch.familyUse>patch.wildlifeUse?'heavy family use':'heavy wildlife use';if(patch.competitionLabel==='family-used')return'family using this patch';if(patch.competitionLabel==='grazed')return'other grazers seen here';return'quiet when last checked'}
  snapshot(animal=this.sim.player()){
    if(!animal)return null;const s=this.state(animal),breadth=new Set(s.recent).size;return{selected:this.selected(animal),recent:[...s.recent],recentKinds:[...s.recentKinds],breadth,assimilation:1+Math.max(0,breadth-1)*.025,lastMeal:s.lastMeal,label:breadth>=4?'very broad':breadth===3?'broad':breadth===2?'mixed':breadth===1?'narrow':'untried',patches:this.knownPatches(animal),route:this.routeSuggestion(animal),patchNotice:s.patchNotice};
  }
  hint(target=this.selected(this.sim.player())){if(!target)return'';const switcher=target.count>1?' · Q switch':'';return`${labelFor(target.kind)}${switcher}`}
}
