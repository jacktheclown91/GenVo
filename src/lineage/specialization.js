import {groundDiet,plantPreference,preyPreference,canHunt} from '../ecology/functional-diet.js';
import {FRESHWATER_FOOD,freshwaterPreference,freshwaterField,bestFreshwaterFood} from '../ecology/freshwater-food.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {adaptationEffects,hasAdaptation} from './evolution.js';

// Family-level expression of inherited evolutionary branches.
// The adaptation registry owns what evolved; this controller owns how autonomous
// founder-line animals turn those inherited traits into a recognizable survival style.
export class LineageSpecializationController{
  constructor(sim){this.sim=sim;this.challenges=new Map()}

  // One branch-specific field challenge is tracked for each controlled generation.
  // Challenges never spawn food, predators, relatives, or territory. They only
  // recognize useful situations already present in canonical simulation state and
  // surface them as something the player can deliberately exploit.
  strategyBranch(animal){
    if(!animal?.alive||!animal.lineage||animal.species!=='genvo')return null;
    const ids=[...(animal.adaptations||[])].reverse();
    for(const id of ids){
      if(id==='adaptive-chromatophores'||id==='camouflage-mantle')return'stealth';
      if(id==='crushing-jaw'||id==='heavy-jaw')return'offense';
      if(id==='coordinated-defense'||id==='mobbing-instinct')return'social';
      if(id==='provisioning-pouches'||id==='grasping-limbs')return'utility';
    }
    return null;
  }

  strategyLegacy(animal,branch=this.strategyBranch(animal)){
    if(!animal||!branch)return{branch,streak:0,stage:0};
    const path=this.sim.lineage.ancestryPath(animal.id);let streak=0;
    // Only consecutive completed generations count. Choosing a different strategic
    // branch, failing to complete it, or leaving a gap ends the practiced streak.
    for(let i=path.length-2;i>=0;i--){
      const practiced=path[i]?.strategy;
      if(!practiced?.complete||practiced.branch!==branch)break;
      streak++;if(streak>=3)break;
    }
    return{branch,streak,stage:Math.min(3,streak)};
  }

  challengeProfile(animal,branch=this.strategyBranch(animal)){
    const legacy=this.strategyLegacy(animal,branch),stage=legacy.stage;
    if(branch==='stealth')return{...legacy,required:stage===0?1:stage>=3?3:2,maxThreat:Math.max(5.8,8.5-stage*.85)};
    if(branch==='offense')return{...legacy,required:Math.min(4,2+stage),radiusBonus:stage*1.75};
    if(branch==='social')return{...legacy,required:stage===0?1:2,searchBonus:stage*2,threatBonus:stage*.8};
    if(branch==='utility')return{...legacy,required:1,distanceBonus:stage*2,radiusBonus:stage*3};
    return{...legacy,required:1};
  }

  challengeState(animal){
    const branch=this.strategyBranch(animal);if(!branch)return null;
    const profile=this.challengeProfile(animal,branch);let state=this.challenges.get(animal.id);
    if(!state||state.branch!==branch){state={animalId:animal.id,generation:animal.generation,branch,legacy:profile.streak,complete:false,completedDay:null,detail:null,progress:0,lastScanTick:-Infinity,cached:null};this.challenges.set(animal.id,state)}
    return state;
  }

  playerChallenge(animal=this.sim.player?.()){
    if(!animal?.alive||!this.sim.isManualPlayer?.(animal)||!animal.lineage||animal.species!=='genvo')return null;
    const state=this.challengeState(animal);if(!state||state.complete)return null;
    if(this.sim.tickCount-state.lastScanTick<CFG.simHz*2)return state.cached;
    state.lastScanTick=this.sim.tickCount;
    state.cached=this.scanPlayerChallenge(animal,state);
    return state.cached;
  }

  scanPlayerChallenge(animal,state){
    if(state.branch==='stealth')return this.stealthChallenge(animal,state);
    if(state.branch==='offense')return this.offenseChallenge(animal,state);
    if(state.branch==='social')return this.socialChallenge(animal,state);
    if(state.branch==='utility')return this.utilityChallenge(animal,state);
    return null;
  }

  stealthChallenge(animal,state){
    const adaptive=hasAdaptation(animal,'adaptive-chromatophores'),profile=this.challengeProfile(animal,'stealth'),radius=(adaptive?24:18)+profile.stage*2,w=this.sim.world;
    const hunters=this.sim.animals.filter(a=>a.alive&&canHunt(a)&&preyPreference(a,animal)>0);
    if(!hunters.length)return null;
    let best=null,bestScore=-Infinity;
    const minX=Math.max(1,Math.floor(animal.x-radius)),maxX=Math.min(CFG.worldSize-2,Math.ceil(animal.x+radius)),minY=Math.max(1,Math.floor(animal.y-radius)),maxY=Math.min(CFG.worldSize-2,Math.ceil(animal.y+radius));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const px=x+.5,py=y+.5,d=Math.hypot(px-animal.x,py-animal.y);if(d>radius||!w.sameLand(animal.x,animal.y,px,py)||w.water[w.idx(px,py)])continue;
      const cover=this.sim.coverAt({x:px,y:py}),minimumCover=adaptive?.30:.36;if(cover<minimumCover)continue;
      const food=this.foodCandidateAt(animal,w.idx(px,py),px,py);if(!food)continue;
      let threat=null,threatDistance=Infinity;
      for(const hunter of hunters){const hd=Math.hypot(px-hunter.x,py-hunter.y);if(hd<threatDistance){threatDistance=hd;threat=hunter}}
      if(!threat)continue;const senses=threat.genes?.senses||1,reveal=(adaptive?1.55:2.2)*senses,maxThreat=profile.maxThreat*senses;if(threatDistance<=reveal||threatDistance>maxThreat)continue;
      const score=food.value+cover*.7+(maxThreat-Math.min(maxThreat,threatDistance))*.09-d*.025;if(score>bestScore){bestScore=score;best={...food,threatId:threat.id,threatDistance}}
    }
    if(!best)return null;
    const label=PLANTS[best.kind]?.label||(best.kind==='carrion'?'carrion':best.kind),progress=state.progress?` · ${state.progress}/${profile.required} feeds`:profile.required>1?` · 0/${profile.required} feeds`:'';
    const title=profile.stage===0?'Risky feeding ground':profile.stage===1?'Feed close to danger':'Feed inside Stalker range';
    return{branch:'stealth',title,body:`${label} is within Stalker range · V hide · E eat without breaking cover${progress}`,target:{x:best.x,y:best.y,label:'Risky food'},targetId:best.threatId,legacy:profile.streak,required:profile.required};
  }

  offenseChallenge(animal,state){
    const territory=this.sim.territory.state(animal);if(!territory?.established||!territory.home)return null;
    const profile=this.challengeProfile(animal,'offense'),radius=Math.max(this.sim.territory.coreRadius(animal)+4,territory.radius*1.15)+(hasAdaptation(animal,'crushing-jaw')?3:0)+profile.radiusBonus;let target=null,best=Infinity;
    this.sim.forEachNearby(territory.home,radius,b=>{if(!b.alive||!canHunt(b)||preyPreference(b,animal)<=0)return;const d=Math.hypot(b.x-territory.home.x,b.y-territory.home.y);if(d<best){best=d;target=b}});
    if(!target)return null;
    state.targetId=target.id;
    const progress=state.progress?` · ${state.progress}/${profile.required} solid hits`:` · 0/${profile.required} solid hits`,title=profile.stage===0?'Defend the home range':profile.stage===1?'Defend the outer range':'Hold the family range';
    return{branch:'offense',title,body:`A Stalker is inside the defended range · close in and bite with E${progress}`,target:{x:target.x,y:target.y,label:'Stalker'},targetId:target.id,legacy:profile.streak,required:profile.required,defenseRadius:radius};
  }

  socialChallenge(animal,state){
    const coordinated=hasAdaptation(animal,'coordinated-defense'),profile=this.challengeProfile(animal,'social'),search=(coordinated?18:14)+profile.searchBonus,threatRange=(coordinated?11:9)+profile.threatBonus;let child=null,threat=null,best=Infinity;
    const available=this.sim.animals.filter(other=>other.alive&&other.id!==animal.id&&other.lineage&&other.species==='genvo'&&other.age>=SPECIES.genvo.maturity&&Math.hypot(other.x-animal.x,other.y-animal.y)<=11).length;
    if(available<profile.required)return null;
    for(const candidate of this.sim.animals){
      if(!candidate.alive||candidate.species!=='genvo'||!candidate.lineage||!this.sim.family.isDependent(candidate)||this.sim.cognition.relation(animal,candidate)==='unrelated')continue;
      if(Math.hypot(candidate.x-animal.x,candidate.y-animal.y)>search)continue;
      const hunter=this.sim.findNearest(candidate,b=>b.alive&&canHunt(b)&&preyPreference(b,candidate)>0,threatRange);if(!hunter)continue;
      const d=Math.hypot(hunter.x-candidate.x,hunter.y-candidate.y);if(d<best){best=d;child=candidate;threat=hunter}
    }
    if(!child||!threat)return null;
    const title=profile.stage===0?'Nursery under threat':profile.stage===1?'Rally the family':'Protect the nursery';
    return{branch:'social',title,body:`A Stalker is close to young family · get near and press X · rally ${profile.required} adult${profile.required===1?'':'s'}`,target:{x:threat.x,y:threat.y,label:'Stalker'},targetId:threat.id,childId:child.id,legacy:profile.streak,required:profile.required};
  }

  utilityChallenge(animal,state){
    const shelter=this.sim.shelter.nearest(animal,{radius:Infinity,familyOnly:true});if(!shelter||shelter.integrity<=0)return null;
    const territory=this.sim.territory.state(animal),pouches=hasAdaptation(animal,'provisioning-pouches'),profile=this.challengeProfile(animal,'utility'),minDistance=Math.max(pouches?8:6,(territory?.radius||7)*.62)+profile.distanceBonus,radius=(pouches?26:20)+profile.radiusBonus;
    const target=this.distantProvisionFood(animal,shelter,minDistance,radius);if(!target)return null;
    const label=PLANTS[target.kind]?.label||(target.kind==='carrion'?'carrion':target.kind),title=profile.stage===0?'Long supply run':profile.stage===1?'Far supply run':'Keep the shelter supplied';
    return{branch:'utility',title,body:`Bring ${label} from at least ${Math.ceil(minDistance)} tiles out · Z pick up · return to shelter · Z store`,target:{x:target.x,y:target.y,label:'Supply'},minDistance,legacy:profile.streak,required:1};
  }

  notePlayerAction(animal,result,context={}){
    if(!animal?.player||!result?.ok)return result;
    const state=this.challengeState(animal);if(!state||state.complete)return result;
    const profile=this.challengeProfile(animal,state.branch);let completed=false;
    if(state.branch==='stealth'&&result.type==='eat'&&context.hidden){
      const threat=this.sim.findNearest(animal,b=>b.alive&&canHunt(b)&&preyPreference(b,animal)>0,profile.maxThreat+1);
      const distance=threat?Math.hypot(animal.x-threat.x,animal.y-threat.y):Infinity,maxThreat=threat?profile.maxThreat*(threat.genes?.senses||1):0;
      if(threat&&distance<=maxThreat&&this.sim.camouflageConceals(animal,threat)){
        state.progress=Math.min(profile.required,(state.progress||0)+1);state.cached=null;state.lastScanTick=-Infinity;
        if(state.progress>=profile.required)completed=this.completeChallenge(animal,state,profile.required>1?`fed ${profile.required} times under Stalker pressure without being revealed`:'fed under Stalker pressure without being revealed');
      }
    }else if(state.branch==='offense'&&result.type==='fight'&&context.target){
      const territory=this.sim.territory.state(animal),target=context.target;if(territory?.established&&territory.home){
        const radius=Math.max(this.sim.territory.coreRadius(animal)+4,territory.radius*1.15)+(hasAdaptation(animal,'crushing-jaw')?3:0)+profile.radiusBonus,inside=Math.hypot(target.x-territory.home.x,target.y-territory.home.y)<=radius;
        if(inside){
          state.progress=Math.min(profile.required,(state.progress||0)+1);state.cached=null;state.lastScanTick=-Infinity;
          if(result.killed||state.progress>=profile.required||(profile.stage===0&&result.repelled))completed=this.completeChallenge(animal,state,result.killed?'killed a Stalker inside the family range':profile.stage===0&&result.repelled?'drove a Stalker out of the family range':`held the defended range through ${state.progress} solid strikes`);
        }
      }
    }else if(state.branch==='social'&&(result.type==='rally'||result.type==='alarm')&&context.threat){
      const radius=(hasAdaptation(animal,'coordinated-defense')?11:9)+profile.threatBonus;
      const threatened=this.sim.animals.some(child=>child.alive&&child.lineage&&child.species==='genvo'&&this.sim.family.isDependent(child)&&this.sim.cognition.relation(animal,child)!=='unrelated'&&Math.hypot(child.x-context.threat.x,child.y-context.threat.y)<=radius);
      if(threatened&&(result.rallied||0)>=profile.required)completed=this.completeChallenge(animal,state,`rallied ${result.rallied} adult family member${result.rallied===1?'':'s'} around threatened young`);
    }else if(state.branch==='utility'&&result.type==='carry'&&result.stored>0&&context.load&&context.shelter){
      const territory=this.sim.territory.state(animal),minDistance=Math.max(hasAdaptation(animal,'provisioning-pouches')?8:6,(territory?.radius||7)*.62)+profile.distanceBonus,origin=context.load.origin,d=origin?Math.hypot(origin.x-context.shelter.x,origin.y-context.shelter.y):0;
      if(d>=minDistance)completed=this.completeChallenge(animal,state,`completed a ${Math.round(d)}-tile supply run to the family shelter`);
    }
    if(completed){const text={stealth:'Risky feeding complete.',offense:'Family range defended.',social:'Family defense held.',utility:'Supply run complete.'}[state.branch]||'Lineage strategy complete.';result.strategyComplete=true;result.message=`${result.message} · ${text}`}
    return result;
  }

  completeChallenge(animal,state,detail){
    if(!state||state.complete)return false;state.complete=true;state.completedDay=this.sim.day;state.detail=detail;state.cached=null;
    const record=this.sim.lineage.records.get(animal.id);if(record)record.strategy={branch:state.branch,complete:true,generation:animal.generation,day:this.sim.day,detail,streak:Math.min(4,(state.legacy||0)+1)};
    this.sim.cognition.recordOnce(animal,`strategy:${state.branch}:g${animal.generation}`,`Lineage strategy: ${detail}`,{branch:state.branch,generation:animal.generation,streak:Math.min(4,(state.legacy||0)+1)});
    return true;
  }

  generationSummary(animalOrId){
    const id=typeof animalOrId==='number'?animalOrId:animalOrId?.id,state=this.challenges.get(id),record=this.sim.lineage.records.get(id),strategy=state?.complete?{branch:state.branch,detail:state.detail,streak:Math.min(4,(state.legacy||0)+1)}:record?.strategy;
    if(!strategy?.branch||!strategy?.detail)return'';
    const labels={stealth:'Stealth',offense:'Home defense',social:'Family defense',utility:'Provisioning'},streak=strategy.streak||1;
    return`${labels[strategy.branch]||strategy.branch}: ${strategy.detail} · practiced ${streak} generation${streak===1?'':'s'}`;
  }

  threatResponse(animal,threat){
    if(!this.eligible(animal)||!threat?.alive)return null;
    const s=SPECIES[animal.species],energy=animal.energy/s.maxEnergy,health=animal.health/100;

    // Stealth lineages can turn predator-rich cover into usable feeding ground instead
    // of treating camouflage as only an emergency pause button.
    if(hasAdaptation(animal,'camouflage-mantle')){
      const cover=this.sim.coverAt(animal),adaptive=hasAdaptation(animal,'adaptive-chromatophores');
      if(cover>=(adaptive?.30:.36)){
        animal.hidden=true;
        if(energy<.82){
          const food=this.stealthForageTarget(animal,threat,adaptive);
          if(food)return{intent:'stealth-forage',target:food};
        }
        if(adaptive){
          const target=this.coverRetreat(animal,threat,3.2);
          if(target)return{intent:'hide-shift',target};
        }
        return{intent:'hide',target:null};
      }
    }

    // Social lineages can turn a dangerous encounter into a family response without
    // requiring the player to be the currently controlled generation.
    if(hasAdaptation(animal,'mobbing-instinct')&&animal.age>=s.maturity&&energy>.48&&health>.45){
      const rally=this.autoRally(animal,threat);
      if(rally)return{intent:'mob',target:threat};
    }

    // Offense lineages are willing to counter a Stalker when healthy enough rather
    // than behaving like an unevolved animal with larger damage numbers.
    if(hasAdaptation(animal,'heavy-jaw')&&animal.age>=s.maturity&&energy>(hasAdaptation(animal,'crushing-jaw')?.48:.58)&&health>.55){
      const d=Math.hypot(animal.x-threat.x,animal.y-threat.y);
      if(d<=(hasAdaptation(animal,'crushing-jaw')?4.6:3.6))return{intent:'counter',target:threat};
    }
    return null;
  }

  // Proactive branch expression happens after immediate needs/danger but before
  // ordinary wandering. It lets inherited strategy change what a family chooses
  // to do with a stable moment, not only what happens after a Stalker lands a hit.
  strategicDecision(animal){
    if(!this.eligible(animal))return null;
    const nursery=this.nurseryDefenseDecision(animal);if(nursery)return nursery;
    const patrol=this.corePatrolDecision(animal);if(patrol)return patrol;
    return null;
  }

  provisioningDecision(animal){
    if(!this.eligible(animal)||!hasAdaptation(animal,'grasping-limbs'))return null;
    const s=SPECIES[animal.species];
    if(animal.age<s.maturity||animal.energy/s.maxEnergy<.64||animal.hydration/s.maxHydration<.56)return null;
    const shelter=this.sim.shelter.nearest(animal,{radius:Infinity,familyOnly:true});
    if(!shelter||shelter.integrity<=0||shelter.foodStore>=this.provisionTarget(animal,shelter))return null;
    if(animal.carryingFood)return{intent:'provision-home',target:{x:shelter.x,y:shelter.y,shelterId:shelter.id}};
    const food=this.findProvisionFood(animal,hasAdaptation(animal,'provisioning-pouches')?13:9);
    return food?{intent:'provision-food',target:food}:null;
  }

  resolve(animal){
    if(!this.eligible(animal))return false;
    if(animal.intent==='counter'&&animal.target?.alive&&Math.hypot(animal.x-animal.target.x,animal.y-animal.target.y)<1.2)return this.counterStrike(animal,animal.target);
    if(animal.intent==='core-patrol'&&animal.target?.alive&&Math.hypot(animal.x-animal.target.x,animal.y-animal.target.y)<1.2)return this.counterStrike(animal,animal.target);
    if(animal.intent==='provision-food'&&animal.target&&Math.hypot(animal.x-animal.target.x,animal.y-animal.target.y)<1.1)return this.collectProvision(animal,animal.target);
    if(animal.intent==='provision-home'&&animal.carryingFood&&animal.target&&Math.hypot(animal.x-animal.target.x,animal.y-animal.target.y)<1.7)return this.depositProvision(animal,animal.target.shelterId);
    return false;
  }

  maintainConcealment(animal,nextX,nextY){
    if(!animal?.hidden)return;
    if(animal.intent==='hide')return;
    if(animal.intent==='hide-shift'&&hasAdaptation(animal,'adaptive-chromatophores')&&this.sim.coverAt({x:nextX,y:nextY})>=.30)return;
    if(animal.intent==='stealth-forage'&&hasAdaptation(animal,'adaptive-chromatophores')&&this.sim.coverAt({x:nextX,y:nextY})>=.30)return;
    animal.hidden=false;
  }

  stealthForageTarget(animal,threat,adaptive=false){
    const s=SPECIES[animal.species],w=this.sim.world;
    if(!adaptive){
      const i=w.idx(animal.x,animal.y),candidate=this.foodCandidateAt(animal,i,animal.x,animal.y);
      return candidate&&Math.hypot(animal.x-threat.x,animal.y-threat.y)>2.15*(threat.genes?.senses||1)?candidate:null;
    }
    let best=null,bestScore=-Infinity;const radius=3.2,minX=Math.max(1,Math.floor(animal.x-radius)),maxX=Math.min(CFG.worldSize-2,Math.ceil(animal.x+radius)),minY=Math.max(1,Math.floor(animal.y-radius)),maxY=Math.min(CFG.worldSize-2,Math.ceil(animal.y+radius));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const px=x+.5,py=y+.5,d=Math.hypot(px-animal.x,py-animal.y);if(d>radius||!w.sameLand(animal.x,animal.y,px,py))continue;
      const cover=this.sim.coverAt({x:px,y:py});if(cover<.30)continue;
      const threatDistance=Math.hypot(px-threat.x,py-threat.y);if(threatDistance<=1.55*(threat.genes?.senses||1))continue;
      const candidate=this.foodCandidateAt(animal,w.idx(px,py),px,py);if(!candidate)continue;
      const score=candidate.value+cover*.85+threatDistance*.05-d*.08;
      if(score>bestScore){bestScore=score;best=candidate}
    }
    return best;
  }

  foodCandidateAt(animal,index,x,y){
    const s=SPECIES[animal.species],w=this.sim.world;let best=null,bestValue=.10;
    for(const [kind,eff] of Object.entries(groundDiet(animal))){
      if(eff<=0)continue;const arr=kind==='carrion'?w.carrion:w.plants[kind];if(!arr)continue;
      const amount=arr[index]||0,minimum=kind==='carrion'?0:.07;if(amount<=minimum+.04)continue;
      // Same edible authority as Simulation.bestFood: tissue-bearing plants this anatomy cannot
      // currently process yield nothing, so they are not a feeding target.
      if(kind!=='carrion'&&this.sim.dispersal.seedReserve[kind]&&!(this.sim.dispersal.cropYield(animal,kind,index)>0))continue;
      const nutrition=kind==='carrion'?34:(PLANTS[kind]?.nutrition||0)*3.6,value=amount*eff*nutrition*.08;
      if(value>bestValue){bestValue=value;best={x,y,kind,value,risky:true}}
    }
    return best;
  }

  corePatrolDecision(animal){
    if(!hasAdaptation(animal,'heavy-jaw'))return null;
    const s=SPECIES[animal.species],energy=animal.energy/s.maxEnergy;
    if(animal.age<s.maturity||energy<(hasAdaptation(animal,'crushing-jaw')?.62:.70)||animal.health<68)return null;
    const state=this.sim.territory.state(animal);if(!state?.established||!state.home)return null;
    const core=this.sim.territory.coreRadius(animal),radius=core+(hasAdaptation(animal,'crushing-jaw')?3:1.8);let target=null,best=Infinity;
    this.sim.forEachNearby(state.home,radius,b=>{
      if(!b.alive||!canHunt(b)||preyPreference(b,animal)<=0)return;
      const dHome=Math.hypot(b.x-state.home.x,b.y-state.home.y),dAnimal=Math.hypot(b.x-animal.x,b.y-animal.y);
      if(dHome<=radius&&dAnimal<best){best=dAnimal;target=b}
    });
    return target?{intent:'core-patrol',target}:null;
  }

  nurseryDefenseDecision(animal){
    if(!hasAdaptation(animal,'mobbing-instinct'))return null;
    const s=SPECIES[animal.species],coordinated=hasAdaptation(animal,'coordinated-defense');
    if(animal.age<s.maturity||animal.energy/s.maxEnergy<.54||animal.health<58)return null;
    const familyRadius=coordinated?12:9,threatRadius=coordinated?8.5:6.5;let threat=null,best=Infinity;
    for(const child of this.sim.animals){
      if(!child.alive||child.id===animal.id||child.species!=='genvo'||!child.lineage||!this.sim.family.isDependent(child))continue;
      if(this.sim.cognition.relation(animal,child)==='unrelated')continue;
      if(Math.hypot(child.x-animal.x,child.y-animal.y)>familyRadius)continue;
      const hunter=this.sim.findNearest(child,b=>b.alive&&canHunt(b)&&preyPreference(b,child)>0,threatRadius);if(!hunter)continue;
      const d=Math.hypot(hunter.x-child.x,hunter.y-child.y);if(d<best){best=d;threat=hunter}
    }
    if(!threat)return null;
    if(animal.familyRally?.targetId===threat.id&&animal.familyRally.untilTick>this.sim.tickCount)return{intent:'mob',target:threat};
    return this.autoRally(animal,threat)?{intent:'mob',target:threat}:null;
  }

  rangeMultiplier(animal){
    if(!this.eligible(animal)||!hasAdaptation(animal,'grasping-limbs'))return 1;
    const shelter=this.sim.shelter.nearest(animal,{radius:Infinity,familyOnly:true});if(!shelter||shelter.capacity<=0)return 1;
    const stock=Math.max(0,Math.min(1,shelter.foodStore/shelter.capacity));if(stock<.10)return 1;
    return hasAdaptation(animal,'provisioning-pouches')?1.22+stock*.24:1.08+stock*.12;
  }

  cacheReturnRadius(animal){
    const mult=this.rangeMultiplier(animal);if(mult<=1)return 10;
    return hasAdaptation(animal,'provisioning-pouches')?17:13;
  }

  autoRally(animal,threat){
    if((animal.autoRallyCooldownUntil||0)>this.sim.tickCount)return false;
    const coordinated=hasAdaptation(animal,'coordinated-defense');
    const adults=[];
    for(const other of this.sim.animals){
      if(!other.alive||other.id===animal.id||!other.lineage||other.species!=='genvo'||other.age<SPECIES.genvo.maturity)continue;
      if(Math.hypot(other.x-animal.x,other.y-animal.y)<=9)adults.push(other);
    }
    if(!adults.length)return false;
    const until=this.sim.tickCount+CFG.simHz*(coordinated?6:4);
    animal.familyRally={targetId:threat.id,untilTick:until,coordinated};
    for(const other of adults)other.familyRally={targetId:threat.id,untilTick:until,coordinated:coordinated&&hasAdaptation(other,'coordinated-defense')};
    animal.energy=Math.max(0,animal.energy-(coordinated?2.4:3.0));
    animal.autoRallyCooldownUntil=this.sim.tickCount+CFG.simHz*(coordinated?11:14);
    return true;
  }

  counterStrike(animal,target){
    if(!target?.alive||!canHunt(target)||(animal.counterCooldownUntil||0)>this.sim.tickCount)return false;
    const crushing=hasAdaptation(animal,'crushing-jaw'),fx=adaptationEffects(animal);
    animal.counterCooldownUntil=this.sim.tickCount+CFG.simHz*(crushing?.72:.92);
    animal.energy=Math.max(0,animal.energy-(crushing?2.0:1.55)*fx.strikeEnergy);
    const hit=Math.min(.9,.55+(animal.genes.senses-1)*.30+(animal.genes.motion-1)*.16+(crushing?.08:0));
    if(!this.sim.rng.chance(hit)){target.target=animal;return false}
    const damage=(crushing?8.8:5.2)+Math.max(0,(animal.genes.body-1)*(crushing?15:10));
    target.health-=damage;
    if(crushing&&target.health>0&&this.sim.rng.chance(.42)){target.playerAversion={targetId:animal.id,untilTick:this.sim.tickCount+CFG.simHz*1.4};target.target=null}else target.target=animal;
    // A defensive strike is not a meal. The remaining body enters carrion once;
    // any later food gain must use the normal finite carcass-consumption path.
    if(target.health<=0)this.sim.kill(target,'predation');
    return true;
  }

  collectProvision(animal,target){
    const s=SPECIES[animal.species],kind=target.kind,waterFood=FRESHWATER_FOOD[kind],eff=waterFood?freshwaterPreference(animal,kind):plantPreference(animal,kind);if(eff<=0)return false;
    const w=this.sim.world,x=target.foodX??target.x,y=target.foodY??target.y,i=w.idx(x,y),arr=waterFood?freshwaterField(w,kind):kind==='carrion'?w.carrion:w.plants[kind];if(!arr)return false;
    if(waterFood&&(!w.water[i]||Math.hypot(animal.x-x,animal.y-y)>1.5||!waterFood.surface&&(!this.sim.canOccupy(animal,x,y)||!this.sim.canReach(animal,x,y))))return false;
    const minimum=waterFood||kind==='carrion'?0:.07,available=Math.max(0,(arr[i]||0)-minimum);if(available<=.04){animal.target=null;return false}
    const fx=adaptationEffects(animal),biomass=Math.min(.16*fx.carryCapacity,available),nutrition=waterFood?waterFood.nutrition:kind==='carrion'?34:(PLANTS[kind]?.nutrition||0)*3.6;
    arr[i]-=biomass;if(!waterFood&&kind!=='carrion')this.sim.history.notePlantConsumption(kind,target.x,target.y,biomass);
    const label=waterFood?.label||PLANTS[kind]?.label||(kind==='carrion'?'carrion':kind);
    animal.carryingFood={kind,label,biomass,stored:biomass*nutrition*eff*(fx.provisioning?.78:.70)};
    animal.energy=Math.max(0,animal.energy-(fx.provisioning?.42:.34));
    const shelter=this.sim.shelter.nearest(animal,{radius:Infinity,familyOnly:true});
    animal.intent='provision-home';animal.target=shelter?{x:shelter.x,y:shelter.y,shelterId:shelter.id}:null;
    return true;
  }

  depositProvision(animal,shelterId){
    const shelter=this.sim.shelter.shelters.find(s=>s.id===shelterId&&s.integrity>0&&this.sim.shelter.familyCanUse(animal,s));
    if(!shelter||!animal.carryingFood)return false;
    const stored=Math.min(shelter.capacity-shelter.foodStore,animal.carryingFood.stored);if(stored<=0)return false;
    shelter.foodStore+=stored;shelter.lastUsedTick=this.sim.tickCount;animal.carryingFood=null;animal.target=null;animal.intent='idle';
    return true;
  }

  findProvisionFood(animal,radius){
    const s=SPECIES[animal.species];let best=null,bestScore=.08;
    for(const [kind,eff] of Object.entries(groundDiet(animal))){
      if(eff<=0)continue;const arr=kind==='carrion'?this.sim.world.carrion:this.sim.world.plants[kind];if(!arr)continue;
      const p=this.sim.findBestCell(animal,(x,y)=>{const amount=arr[this.sim.world.idx(x,y)]||0,nutrition=kind==='carrion'?34:(PLANTS[kind]?.nutrition||0)*3.6;return amount*eff*nutrition*.08},radius*animal.genes.senses);
      if(p&&p.score>bestScore){bestScore=p.score;best={...p,kind}}
    }
    const aquatic=bestFreshwaterFood(this.sim,animal,radius*animal.genes.senses);if(aquatic&&(!best||aquatic.score>bestScore))best=aquatic;
    return best;
  }

  distantProvisionFood(animal,shelter,minDistance,radius){
    const s=SPECIES[animal.species],w=this.sim.world;let best=null,bestScore=.10;
    const minX=Math.max(1,Math.floor(shelter.x-radius)),maxX=Math.min(CFG.worldSize-2,Math.ceil(shelter.x+radius)),minY=Math.max(1,Math.floor(shelter.y-radius)),maxY=Math.min(CFG.worldSize-2,Math.ceil(shelter.y+radius));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const px=x+.5,py=y+.5,dShelter=Math.hypot(px-shelter.x,py-shelter.y);if(dShelter<minDistance||dShelter>radius||!w.sameLand(animal.x,animal.y,px,py)||w.water[w.idx(px,py)])continue;
      const candidate=this.foodCandidateAt(animal,w.idx(px,py),px,py);if(!candidate)continue;
      const dAnimal=Math.hypot(px-animal.x,py-animal.y),score=candidate.value+dShelter*.025-dAnimal*.015;
      if(score>bestScore){bestScore=score;best={...candidate,dShelter}}
    }
    return best;
  }

  coverRetreat(animal,threat,radius){
    let best=null,bestScore=-Infinity;
    for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=3;ox++){
      const d=Math.hypot(ox,oy);if(d<.6||d>radius)continue;const x=animal.x+ox,y=animal.y+oy;
      if(x<=1||y<=1||x>=CFG.worldSize-2||y>=CFG.worldSize-2||this.sim.world.water[this.sim.world.idx(x,y)])continue;
      const cover=this.sim.coverAt({x,y});if(cover<.30)continue;
      const away=Math.hypot(x-threat.x,y-threat.y)-Math.hypot(animal.x-threat.x,animal.y-threat.y),score=cover*1.4+away*.18-d*.04;
      if(score>bestScore){bestScore=score;best={x,y}}
    }
    return best;
  }

  provisionTarget(animal,shelter){
    const dependents=this.sim.animals.filter(a=>a.alive&&a.lineage&&this.sim.family.isDependent(a)&&this.sim.shelter.familyCanUse(a,shelter)).length;
    return Math.min(shelter.capacity*.72,6+dependents*3+(hasAdaptation(animal,'provisioning-pouches')?5:0));
  }

  eligible(animal){return !!(animal?.alive&&!this.sim.isManualPlayer?.(animal)&&animal.lineage&&animal.species==='genvo')}
}
