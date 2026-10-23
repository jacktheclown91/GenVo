import {CFG,PLANTS} from '../sim/config.js';
import {drain} from '../sim/resumable.js';
import {SPECIES} from '../organisms/species.js';
import {groundDiet,canHunt,preyPreference} from './functional-diet.js';
import {forageRangeEffect} from '../lineage/effects.js';
import {FRESHWATER_FOOD,freshwaterPreference,freshwaterField} from './freshwater-food.js';
import {coldMigrationOpportunity,COLD_BEHAVIOR} from './cold-wildlife.js';
import {emigrate,nearestOpenExit} from '../world/planetary-dispersal.js';

// Shared habitat migration authority. Founder lines retain seasonal home/refuge
// behavior; ordinary wildlife evaluates perceived connected habitat under pressure.
export class MigrationController{
  constructor(sim){this.sim=sim;this.states=new Map();this.showOverlay=false;this.sampleStep=8;this.searchRadius=32}
  founder(animal){return !!(animal?.species==='genvo'&&(animal.lineage||animal.player))}
  enabled(animal){return !!(animal?.alive&&SPECIES[animal.species])}
  ensure(animal){
    if(!animal)return null;let state=this.states.get(animal.id);
    if(!state){state={status:'settled',target:null,origin:null,recommendation:null,lastEvalDay:-1,departedSeason:null,departedDay:null,arrivedDay:null,seasonalRefuges:{},reason:null};this.states.set(animal.id,state)}
    return state;
  }
  state(animal){return this.states.get(animal?.id)||this.ensure(animal)}
  observe(){drain(this.observeSteps())}
  // Resumable form (day-boundary slicing): pauses between groups of animals.
  *observeSteps(){
    const living=new Set(this.sim.animals.filter(a=>a.alive).map(a=>a.id));for(const id of this.states.keys())if(!living.has(id))this.states.delete(id);
    let visited=0;
    for(const animal of this.sim.animals){
      if(++visited%4===0)yield;
      if(!this.enabled(animal))continue;
      const state=this.ensure(animal);
      if(state.lastEvalDay===this.sim.day)continue;
      state.lastEvalDay=this.sim.day;
      this.progress(animal,state);
      if(!this.founder(animal)&&state.status!=='settled')continue;
      state.recommendation=this.recommend(animal);
      if(!animal.player&&state.status==='settled'&&state.recommendation?.shouldMigrate&&!this.sim.family.isDependent(animal))this.begin(animal,state.recommendation.target,state.recommendation.reason==='cold-season refuge'?'cold-season refuge':'scarcity');
    }
  }
  progress(animal,state=this.ensure(animal)){
    if(!state||state.status==='settled')return;
    const home=this.homeFor(animal),target=state.target;
    if(state.purpose==='emigration'){
      if(!target||!this.sim.canReach(animal,target.x,target.y)){state.status='settled';state.target=null;state.reason='emigration route closed';return}
      if(Math.hypot(animal.x-target.x,animal.y-target.y)<=1.5){if(!emigrate(this.sim,animal,state.direction)){state.status='settled';state.target=null;state.reason='border no longer open'}}
      return;
    }
    if(state.purpose==='dispersal'){
      if(!target||!this.sim.canOccupy(animal,target.x,target.y)||!this.sim.canReach(animal,target.x,target.y)||!this.sim.carrying.breedingState(animal,{at:target}).allowed){state.status='settled';state.target=null;state.dispersalArrival=null;state.reason='dispersal destination requires reassessment';return}
      const committed=this.sim.territory.state(animal)?.residenceAnchor;if(state.dispersalArrival&&committed?.arrivalDay===state.dispersalArrival.day){state.status='settled';state.target=null;state.reason='established dispersal home';return}
      if(Math.hypot(animal.x-target.x,animal.y-target.y)<=1){if(!state.dispersalArrival){const territory=this.sim.territory.state(animal);const visitBaseline=[...territory.cells.values()].filter(c=>Math.hypot(c.x-animal.x,c.y-animal.y)<=8).reduce((n,c)=>n+c.visits,0);state.dispersalArrival={x:animal.x,y:animal.y,day:this.sim.day,visitBaseline};state.arrivedDay=this.sim.day;}const learned=this.sim.territory.state(animal)?.residenceAnchor;state.status=learned?.arrivalDay===state.dispersalArrival.day?'settled':'settling';if(state.status==='settled')state.target=null;state.reason=state.status==='settled'?'established dispersal home':'learning dispersal home';}
      return;
    }
    if(state.purpose==='cold'){
      const now=this.sim.world.temperature[this.sim.world.idx(animal.x,animal.y)];
      if(!target||!this.sim.canOccupy(animal,target.x,target.y)||!this.sim.canReach(animal,target.x,target.y)||
         now>COLD_BEHAVIOR.wakeTemperature){state.status='settled';state.target=null;state.reason='cold route no longer required or reachable';return}
      if(Math.hypot(animal.x-target.x,animal.y-target.y)<=1.2){state.status='settled';state.target=null;state.arrivedDay=this.sim.day;state.reason='reached warmer forage';this.sim.regionalEcology?.noteMigrationArrival(animal,target)}
      return;
    }
    if(this.founder(animal)&&(!target||!this.sim.canOccupy(animal,target.x,target.y)||!this.sim.canReach(animal,target.x,target.y))){state.status='settled';state.target=null;state.reason='destination requires reassessment';return}
    if(!this.founder(animal)){
      if(!target||!this.sim.canOccupy(animal,target.x,target.y)||!this.sim.canReach(animal,target.x,target.y)||Math.hypot(animal.x-target.x,animal.y-target.y)>9*animal.genes.senses*forageRangeEffect(this.sim,animal)||!this.sim.carrying.breedingState(animal,{at:target}).allowed){state.status='settled';state.target=null;state.reason='destination requires reassessment';return}
      if(Math.hypot(animal.x-target.x,animal.y-target.y)<=1){state.status='settled';state.target=null;state.arrivedDay=this.sim.day;state.reason='reached habitat';this.sim.regionalEcology?.noteMigrationArrival(animal,target)}
      return;
    }
    if(state.status==='outbound'&&target&&Math.hypot(animal.x-target.x,animal.y-target.y)<=1.6){
      state.status='refuge';state.arrivedDay=this.sim.day;state.seasonalRefuges[this.sim.season]={...target,quality:this.habitatQuality(animal,target.x,target.y).score,day:this.sim.day,year:this.sim.year};
      this.sim.cognition.recordOnce(animal,`migration-arrive:${this.sim.year}:${this.sim.day}`,`Reached a good ${this.sim.season.toLowerCase()} area`,{x:target.x,y:target.y});
    }
    if(state.status==='refuge'&&home){
      const homeQ=this.habitatQuality(animal,home.x,home.y,{home:true}).score,refugeQ=this.habitatQuality(animal,state.target.x,state.target.y).score;
      const seasonChanged=state.departedSeason&&state.departedSeason!==this.sim.season;
      const nomadic=this.sim.speciesLifestyle?.lifestyleFor?.(animal)?.id==='nomadic',stayDays=nomadic?Math.max(2,Math.ceil(CFG.seasonDays*.45)):CFG.seasonDays;
      const longStay=state.arrivedDay!=null&&(this.sim.day-state.arrivedDay)>=stayDays;
      if((seasonChanged&&homeQ>=.47)||(longStay&&homeQ>=Math.max(.50,refugeQ-.04)))this.beginReturn(animal);
    }
    if(state.status==='returning'&&home&&Math.hypot(animal.x-home.x,animal.y-home.y)<=Math.max(2,this.sim.territory.coreRadius(animal))){
      state.status='settled';state.target=null;state.reason='home recovered';state.departedSeason=null;state.arrivedDay=null;
      this.sim.cognition.recordOnce(animal,`migration-home:${this.sim.year}:${this.sim.day}`,'Returned home',{x:home.x,y:home.y});
    }
  }
  homeFor(animal){if(!this.founder(animal))return null;const s=this.sim.territory.state(animal);return s?.established&&s.home?{x:s.home.x,y:s.home.y}:null}
  habitatQuality(animal,x,y,{home=false}={}){
    const spec=SPECIES[animal.species],w=this.sim.world,r=3;let cells=0,food=0,water=0,temp=0;
    const foodWeights=Object.entries(groundDiet(animal)).filter(([kind,eff])=>eff>0&&(PLANTS[kind]||kind==='carrion'));
    let weightTotal=foodWeights.reduce((n,[,eff])=>n+eff,0)||1;
    const projected={...animal,x,y},waterFoods=Object.entries(FRESHWATER_FOOD).filter(([kind])=>freshwaterPreference(animal,kind)>0);
    for(let yy=Math.max(1,Math.floor(y-r));yy<=Math.min(CFG.worldSize-2,Math.ceil(y+r));yy+=2)for(let xx=Math.max(1,Math.floor(x-r));xx<=Math.min(CFG.worldSize-2,Math.ceil(x+r));xx+=2){
      const i=w.idx(xx,yy);if(w.water[i]){
        if(!this.sim.canOccupy(projected,xx,yy)||!this.sim.canReach(projected,xx,yy))continue;
        cells++;let value=0,total=0;
        for(const [kind,p] of waterFoods){const preference=freshwaterPreference(animal,kind);value+=Math.min(1,(freshwaterField(w,kind)?.[i]||0)/(p.carry||1))*preference;total+=preference}
        food+=total?value/total:0;water++;
        temp+=Math.max(0,1-Math.abs(w.temperature[i]-.55*(animal.genes.climate||1))*2.2);continue;
      }if(!this.sim.canOccupy(projected,xx,yy)||!this.sim.canReach(projected,xx,yy))continue;cells++;
      let f=0;for(const [kind,eff] of foodWeights){const amount=kind==='carrion'?Math.min(1,w.carrion[i]/.5):Math.min(1,(w.plants[kind]?.[i]||0)/(PLANTS[kind]?.carry||1));f+=amount*eff}food+=f/weightTotal;
      water+=Math.min(1,w.moisture[i]*1.18);
      const comfort=.55*(animal.genes.climate||1);temp+=Math.max(0,1-Math.abs(w.temperature[i]-comfort)*2.2);
    }
    if(!cells)return{score:0,food:0,water:0,temp:0,danger:1,familiarity:0,shelter:0};
    food/=cells;water/=cells;temp/=cells;
    const point={x,y},danger=this.predatorPressure(animal,point,6),familiarity=this.founder(animal)?this.sim.territory.familiarityAt(animal,x,y):0;
    const denLandscape=this.sim.stalkerTerritory?.migrationAdjustment?.(animal,x,y)||{score:0,risk:0,uncertainty:0,opening:0};
    let shelter=0;
    const sh=this.sim.shelter.nearest(animal,{radius:Infinity,familyOnly:true});
    if(sh&&Math.hypot(sh.x-x,sh.y-y)<=4){const cache=sh.capacity?sh.foodStore/sh.capacity:0;shelter=Math.min(1,.55*(sh.integrity/100)+.45*cache)}
    let score=.36*food+.22*water+.21*temp+.08*familiarity+.13*shelter-.16*danger+denLandscape.score;
    if(home)score+=.035*Math.min(1,familiarity+.35*shelter);
    return{score:clamp(0,1,score),food,water,temp,danger,familiarity,shelter,denRisk:denLandscape.risk||0,denUncertainty:denLandscape.uncertainty||0,territoryOpening:denLandscape.opening||0};
  }
  predatorPressure(animal,point,radius){let n=0;this.sim.forEachNearby(point,radius,b=>{if(!b.alive||!canHunt(b)||preyPreference(b,animal)<=0||Math.hypot(b.x-point.x,b.y-point.y)>radius)return;n++});return clamp(0,1,n/3)}
  recommend(animal){
    if(!this.enabled(animal))return null;
    if(!this.founder(animal))return this.recommendWild(animal);
    const pressure=this.recommendWild(animal);if(pressure.shouldMigrate&&pressure.reason==='competing consumers')return{...pressure,target:{...pressure.target,purpose:'dispersal'}};
    const home=this.homeFor(animal),origin=home||{x:animal.x,y:animal.y},homeQ=this.habitatQuality(animal,origin.x,origin.y,{home:!!home});
    let best={x:origin.x,y:origin.y,quality:homeQ.score,detail:homeQ};
    for(let dy=-this.searchRadius;dy<=this.searchRadius;dy+=this.sampleStep)for(let dx=-this.searchRadius;dx<=this.searchRadius;dx+=this.sampleStep){
      if(dx===0&&dy===0||Math.hypot(dx,dy)<10)continue;const x=clamp(3,CFG.worldSize-4,origin.x+dx),y=clamp(3,CFG.worldSize-4,origin.y+dy),i=this.sim.world.idx(x,y);if(this.sim.world.water[i])continue;
      if(!this.sim.canOccupy(animal,x,y)||!this.sim.canReach(animal,x,y))continue;
      const detail=this.habitatQuality(animal,x,y);if(detail.score>best.quality){best={x,y,quality:detail.score,detail}}
    }
    const delta=best.quality-homeQ.score;
    const scarcity=homeQ.food<.30||homeQ.water<.43||homeQ.temp<.46,territoryPressure=(homeQ.denUncertainty||0)>.42||(homeQ.denRisk||0)>.58,pressured=scarcity||territoryPressure;
    const nomadic=this.sim.speciesLifestyle?.lifestyleFor?.(animal)?.id==='nomadic',minQuality=nomadic ? .44 : .50,minDelta=nomadic ? (pressured ? .055 : .085) : (pressured ? .105 : .17),maxHome=nomadic ? .74 : .61;
    const shouldMigrate=!!home&&best.quality>=minQuality&&delta>=minDelta&&homeQ.score<maxHome;
    const reason=(homeQ.denUncertainty||0)>.42?'stalker territory changed':(homeQ.denRisk||0)>.58?'learned Stalker pressure':homeQ.food<.30?'food scarcity':homeQ.water<.43?'water stress':homeQ.temp<.46?'temperature stress':homeQ.danger>.36?'predator pressure':shouldMigrate?'better seasonal habitat':'home remains viable';
    return{home:origin,homeQuality:homeQ,target:best,delta,shouldMigrate,reason,distance:Math.hypot(best.x-origin.x,best.y-origin.y)};
  }
  begin(animal,target,reason='player choice'){
    if(!this.enabled(animal)||!target)return false;const state=this.ensure(animal),home=this.homeFor(animal);
    if(this.founder(animal)&&!home&&target.purpose!=='dispersal')return false;
    if(!this.sim.canOccupy(animal,target.x,target.y)||!this.sim.canReach(animal,target.x,target.y))return false;
    if(!this.founder(animal)&&(!this.sim.canOccupy(animal,target.x,target.y)||!this.sim.canReach(animal,target.x,target.y)||Math.hypot(target.x-animal.x,target.y-animal.y)>9*animal.genes.senses*forageRangeEffect(this.sim,animal)))return false;
    state.dispersalArrival=null;state.purpose=target.purpose==='dispersal'?'dispersal':target.purpose==='emigration'?'emigration':reason==='cold-season refuge'?'cold':'seasonal';state.direction=target.direction??null;state.status='outbound';state.origin=home?{...home}:{x:animal.x,y:animal.y};state.target={x:target.x,y:target.y,quality:target.quality??this.habitatQuality(animal,target.x,target.y).score};state.reason=reason;state.departedSeason=this.sim.season;state.departedDay=this.sim.day;state.arrivedDay=null;
    this.sim.cognition.recordOnce(animal,`migration-depart:${this.sim.year}:${this.sim.day}`,`Left home for a better ${this.sim.season.toLowerCase()} area`,{x:state.target.x,y:state.target.y,reason});return true;
  }
  // `step`: candidate spacing; the population model samples more coarsely.
  recommendWild(animal,{step=2}={}){
    const thermal=coldMigrationOpportunity(this.sim,animal);
    if(thermal)return{home:{x:animal.x,y:animal.y},homeQuality:this.habitatQuality(animal,animal.x,animal.y),target:thermal,delta:thermal.temp-this.sim.world.temperature[this.sim.world.idx(animal.x,animal.y)],shouldMigrate:true,reason:'cold-season refuge',distance:Math.hypot(thermal.x-animal.x,thermal.y-animal.y)};
    const sim=this.sim,s=SPECIES[animal.species],origin={x:animal.x,y:animal.y},current=sim.carrying.breedingState(animal);
    const ready=animal.age>=s.maturity&&animal.energy/s.maxEnergy>=.72&&animal.hydration/s.maxHydration>=.58&&!animal.infected&&!sim.family.isDependent(animal);
    const radius=9*animal.genes.senses*forageRangeEffect(sim,animal);
    const evaluate=(x,y,pressure)=>{const habitat=this.habitatQuality(animal,x,y);return{x,y,quality:.45*Math.min(1,pressure.resource)+.30*pressure.crowd+.15*habitat.temp+.10*habitat.water-.20*habitat.danger,detail:habitat,carrying:pressure}};
    const here=evaluate(animal.x,animal.y,current);let best=here;const surveyMemo=new Map();
    // Existing sensing, anatomy and route authority; candidate demand includes the migrant.
    if(ready&&!current.allowed)for(let dy=-Math.floor(radius);dy<=radius;dy+=step)for(let dx=-Math.floor(radius);dx<=radius;dx+=step){
      const distance=Math.hypot(dx,dy);if(distance<2||distance>radius)continue;
      const x=animal.x+dx,y=animal.y+dy;if(!sim.canOccupy(animal,x,y)||!sim.canReach(animal,x,y))continue;
      const pressure=sim.carrying.breedingState(animal,{at:{x,y},surveyMemo,onlyIfAllowed:true});if(!pressure.allowed)continue;
      const candidate=evaluate(x,y,pressure);if(candidate.quality>best.quality+.001)best=candidate;
    }
    const delta=best.quality-here.quality,shouldMigrate=ready&&!current.allowed&&best!==here&&delta>=.06;
    // regional-dispersal/1: with no better reachable site here, an open border
    // within the animal's senses leads into the physically adjacent region.
    if(!shouldMigrate&&ready&&!current.allowed&&sim.regionalDispersalContext){const exit=nearestOpenExit(sim,animal,radius);if(exit&&sim.canOccupy(animal,exit.x,exit.y)&&sim.canReach(animal,exit.x,exit.y))return{home:origin,homeQuality:here.detail,target:{x:exit.x,y:exit.y,purpose:'emigration',direction:exit.direction},delta:0,shouldMigrate:true,reason:'emigration',distance:exit.distance}}
    return{home:origin,homeQuality:here.detail,target:best,delta,shouldMigrate,reason:current.ratio>=1.18?'competing consumers':'food scarcity',distance:Math.hypot(best.x-animal.x,best.y-animal.y)};
  }
  beginReturn(animal){const state=this.ensure(animal),home=this.homeFor(animal);if(!state||!home||!this.sim.canOccupy(animal,home.x,home.y)||!this.sim.canReach(animal,home.x,home.y))return false;state.status='returning';state.target={...home};state.reason='home habitat recovered';return true}
  togglePlayer(animal){
    if(!this.enabled(animal)||!animal.player)return{ok:false,reason:'No active animal.'};const state=this.ensure(animal);
    if(state.status!=='settled'){state.status='settled';state.target=null;state.reason='route cancelled';state.arrivedDay=null;return{ok:true,action:'cancel'}}
    const rec=state.recommendation||this.recommend(animal);state.recommendation=rec;if(!rec?.shouldMigrate)return{ok:false,reason:'No nearby area looks better enough to leave home.',recommendation:rec};
    if(!this.begin(animal,rec.target,'player route'))return{ok:false,reason:'The recommended habitat is no longer reachable.',recommendation:rec};return{ok:true,action:'begin',target:state.target};
  }
  targetFor(animal){const state=this.state(animal);if(!state||state.status==='settled'||!state.target)return null;return{x:state.target.x,y:state.target.y,migration:true,status:state.status}}
  isAway(animal){const state=this.state(animal);return !!state&&state.status!=='settled'}
  snapshot(animal){const state=this.state(animal);if(!state)return null;const rec=state.recommendation||this.recommend(animal);const current=this.habitatQuality(animal,animal.x,animal.y);return{status:state.status,target:state.target,recommendation:rec,current,reason:state.reason,seasonalRefuges:{...state.seasonalRefuges},away:this.isAway(animal)}}
}

function clamp(min,max,v){return Math.max(min,Math.min(max,v))}
