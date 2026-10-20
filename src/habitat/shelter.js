import {groundDiet,canHunt,preyPreference} from '../ecology/functional-diet.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {shelterExposureEffect} from '../lineage/effects.js';

const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));

// Founder-line shelter authority. Shelters are physical shared family structures:
// they consume local biomass to construct/maintain, store gathered food biomass,
// and modify thermal/predation pressure only while creatures are actually nearby.
export class ShelterController{
  constructor(sim){
    this.sim=sim;
    this.shelters=[];
    this.projects=[];
    this.nextId=1;
    this.nextProjectId=1;
    this.showOverlay=false;
  }
  enabled(animal){return !!(animal&&animal.alive&&animal.species==='genvo'&&(animal.lineage||animal.player))}
  familyCanUse(animal,shelter){
    if(!this.enabled(animal)||!shelter)return false;
    if(shelter.taxonId&&this.sim.speciesCoexistence?.multipleTaxa?.()&&this.sim.evolutionTree?.taxonFor?.(animal)!==shelter.taxonId)return false;
    const owner=this.sim.animals.find(a=>a.id===shelter.ownerId)||null;
    if(!owner)return !!animal.lineage;
    const relation=this.sim.cognition.relation(animal,owner);
    return animal.id===owner.id||relation!=='unrelated';
  }
  activeShelters(){return this.shelters.filter(s=>s.integrity>0)}
  activeProjects(){this.projects=this.projects.filter(p=>!p.complete&&!p.cancelled);return this.projects}
  nearestProject(x,y,radius=Infinity){let best=null,bestD=radius;for(const project of this.activeProjects()){const d=Math.hypot(project.x-x,project.y-y);if(d<bestD){bestD=d;best=project}}return best}
  cancelProjectAt(x,y,radius=2.5){const project=this.nearestProject(x,y,radius);if(!project)return false;project.cancelled=true;this.activeProjects();return true}
  canEstablishNestAt(target,{taxonId=null,taxonLabel=null,preference=null}={}){
    if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))return{ok:false,reason:'Choose a valid nesting site.'};
    const active=this.activeShelters();if(!active.length)return{ok:false,reason:'Build the first family shelter before founding another nest.'};
    const reach=this.sim.expansion?.snapshot?.()||null;if(!reach?.nestUnlocked){const n=reach?.nestNeed;return{ok:false,reason:n?`Satellite nest needs ${n.targetAdults} adults across ${n.targetCells} familiar cells.`:'Satellite nest is not unlocked yet.'}};
    if(active.length+this.activeProjects().length>=reach.shelterCapacity)return{ok:false,reason:`Family can currently sustain ${reach.shelterCapacity} shelter${reach.shelterCapacity===1?'':'s'}.`};
    const x=Math.max(1,Math.min(CFG.worldSize-2,target.x)),y=Math.max(1,Math.min(CFG.worldSize-2,target.y)),i=this.sim.world.idx(x,y);
    if(this.sim.world.water[i])return{ok:false,reason:'Choose dry ground for a nest.'};
    const primary=active[0];if(!this.sim.world.sameLand(primary.x,primary.y,x,y)){const adults=this.sim.expansion?.adults?.()||[],eligible=taxonId?adults.filter(a=>this.sim.evolutionTree?.taxonFor?.(a)===taxonId):adults,swimmer=eligible.some(a=>this.sim.canSwim?.(a));if(!swimmer)return{ok:false,reason:taxonId?'This taxon cannot reach that ground without crossing water.':'The family cannot reach that ground without crossing water.'}};
    const close=active.find(s=>Math.hypot(s.x-x,s.y-y)<7.5);if(close)return{ok:false,reason:'Choose ground farther from an existing shelter.'};
    const projectClose=this.activeProjects().find(q=>Math.hypot(q.x-x,q.y-y)<6);if(projectClose)return{ok:false,reason:'A new nest is already being established nearby.'};
    const cells=this.sim.expansion?.occupiedCells?.()||[],nearest=cells.reduce((m,c)=>Math.min(m,Math.hypot(c.x-x,c.y-y)),Infinity);if(nearest>this.sim.territory.cellSize*1.35)return{ok:false,reason:'Scout and learn this area before establishing a nest.'};
    const materialNeed=1.35*(taxonId?(this.sim.speciesLifestyle?.nestMaterialMultiplier?.(taxonId)||1):1),material=this.materialAvailable(x,y,2.6);if(material<materialNeed)return{ok:false,reason:`Not enough plant material here (${material.toFixed(2)}/${materialNeed.toFixed(2)}).`};
    const cx=Math.floor(x/this.sim.territory.cellSize),cy=Math.floor(y/this.sim.territory.cellSize),key=`${cx},${cy}`,eco=this.sim.sustainability?.sampleCell?.({key,cx,cy,x:(cx+.5)*this.sim.territory.cellSize,y:(cy+.5)*this.sim.territory.cellSize},{cache:false})||null;
    if((eco?.danger||0)>0)return{ok:false,reason:'Known predator pressure makes this a poor nesting site.'};
    if(eco&&eco.foodIndex<.22)return{ok:false,reason:'This ground is too depleted to support a new nest.'};
    const viability=this.sim.populationEcology?.settlementCheck?.({x,y},{kind:'satellite-colony'})||null;if(viability&&!viability.ok)return{ok:false,reason:viability.reason,eco,viability:viability.assessment};
    const branchFit=preference||(taxonId?this.sim.speciesCoexistence?.settlementPreference?.(taxonId,{x,y}):null);if(taxonId&&this.sim.speciesCoexistence?.multipleTaxa?.()&&branchFit&&branchFit.score<.24)return{ok:false,reason:`${taxonLabel||'This taxon'} is poorly matched to this settlement ground · seek ${branchFit.label}.`,eco,viability:viability?.assessment||null,preference:branchFit};
    return{ok:true,x,y,material,materialNeed,eco,viability:viability?.assessment||null,preference:branchFit||null,capacity:reach.shelterCapacity};
  }
  beginNestProject(target,source='player',meta={}){
    const check=this.canEstablishNestAt(target,meta);if(!check.ok)return check;
    const owner=this.sim.player()||this.sim.expansion?.adults?.()[0]||null;if(!owner)return{ok:false,reason:'No family adult can establish the nest.'};
    const lifestyleId=meta.taxonId?this.sim.speciesLifestyle?.stateForTaxon?.(meta.taxonId)?.lifestyle?.id:null;
    const project={id:this.nextProjectId++,type:'satellite-nest',ownerId:owner.id,x:check.x,y:check.y,progress:0,required:check.materialNeed||1.35,setTick:this.sim.tickCount,lastWorkedTick:-1,source,complete:false,cancelled:false,scope:meta.scope||'lineage',taxonId:meta.taxonId||null,taxonLabel:meta.taxonLabel||null,settlementPreference:check.preference||null,lifestyleId:lifestyleId||null};
    this.projects.push(project);this.sim.cognition?.record?.(owner,'nest-project',`Marked a new family nest site`,{x:project.x,y:project.y,projectId:project.id});
    return{ok:true,action:'nest-project',project};
  }
  phaseNestProjects(){
    if(!this.projects.length)return;const adults=this.sim.expansion?.adults?.()||[];
    for(const project of this.activeProjects()){
      const workers=adults.filter(a=>a.alive&&a.health>=55&&a.energy/SPECIES.genvo.maxEnergy>=.48&&Math.hypot(a.x-project.x,a.y-project.y)<=1.7&&(project.scope!=='taxon'||!project.taxonId||this.sim.evolutionTree?.taxonFor?.(a)===project.taxonId));
      if(!workers.length)continue;const remaining=Math.max(0,project.required-project.progress),request=Math.min(remaining,.018*workers.length),taken=this.consumeMaterials(project.x,project.y,request,2.6);if(taken<=0)continue;
      project.progress+=taken;project.lastWorkedTick=this.sim.tickCount;for(const worker of workers)worker.energy=Math.max(0,worker.energy-taken*.22/workers.length);
      if(project.progress+1e-6<project.required)continue;
      const burrow=project.lifestyleId==='burrower',shelter={id:this.nextId++,ownerId:project.ownerId,x:project.x,y:project.y,integrity:burrow ? 94 : 88,weatherSeal:burrow ? .78 : .66,foodStore:0,capacity:burrow ? 22 : 18,kind:'satellite',denStyle:burrow?'burrow':null,constructedDay:this.sim.day,constructedYear:this.sim.year,lastUsedTick:this.sim.tickCount,taxonId:project.taxonId||null,taxonLabel:project.taxonLabel||null};
      this.shelters.push(shelter);project.complete=true;project.completedTick=this.sim.tickCount;project.shelterId=shelter.id;this.sim.speciesCoexistence?.onSettlementBuilt?.(shelter,project);
      const p=this.sim.player();if(p)this.sim.cognition?.record?.(p,'satellite-nest-built',`Family established satellite nest #${shelter.id}`,{shelterId:shelter.id,x:shelter.x,y:shelter.y});
      const order=this.sim.familyDirectives?.areaOrder;if(order?.type==='nest'&&Math.hypot(order.x-project.x,order.y-project.y)<2)this.sim.familyDirectives.areaOrder=null;
    }
    this.activeProjects();
  }
  nearest(animal,{radius=Infinity,familyOnly=true}={}){
    if(animal?.underground)return null; // Surface buildings do not open into a passage.
    if(!animal)return null;let best=null,bestD=radius;
    for(const shelter of this.shelters){
      if(shelter.integrity<=0)continue;
      if(familyOnly&&!this.familyCanUse(animal,shelter))continue;
      const d=Math.hypot(animal.x-shelter.x,animal.y-shelter.y);
      if(d<bestD){bestD=d;best=shelter}
    }
    return best;
  }
  pairKey(animal){
    if(!animal?.lastMate)return null;return[animal.id,animal.lastMate].sort((a,b)=>a-b).join(':')
  }
  broodShelterFor(animal){
    const pairKey=this.pairKey(animal);if(!pairKey)return null;
    return this.activeShelters().find(s=>s.pairKey===pairKey)||null;
  }
  broodShelterEligible(animal){return !!(this.enabled(animal)&&(animal.generation||1)>=2&&animal.lastMate)}
  canBuildHere(animal){
    if(!this.enabled(animal))return{ok:false,reason:'Only your family can build a shelter.'};
    const active=this.activeShelters().filter(s=>this.familyCanUse(animal,s)),nearby=this.nearest(animal,{radius:2.5,familyOnly:true});
    if(nearby)return{ok:false,reason:'A shelter is already here.',shelter:nearby};
    const broodEligible=this.broodShelterEligible(animal),pairKey=this.pairKey(animal),broodExisting=broodEligible?this.broodShelterFor(animal):null;
    if(active.length){
      if(!broodEligible)return{ok:false,reason:`Your family already has shelter #${active[0].id}. A grown G2+ pair can establish another home.`,shelter:active[0]};
      if(broodExisting)return{ok:false,reason:`This pair already established brood shelter #${broodExisting.id}.`,shelter:broodExisting};
      const capacity=Math.max(1,this.sim.expansion?.shelterCapacity?.()||1);if(active.length>=capacity)return{ok:false,reason:`Your family can currently sustain ${capacity} shelter${capacity===1?'':'s'}.`};
      const close=active.find(s=>Math.hypot(s.x-animal.x,s.y-animal.y)<7.5);if(close)return{ok:false,reason:'Move farther from the old shelter to establish a second home.',shelter:close};
    }
    const state=this.sim.territory.state(animal),pairFounding=broodEligible&&active.length>0;
    if(!pairFounding){
      if(!state?.established||!state.home)return{ok:false,reason:'Spend more time in this area before building.'};
      const d=Math.hypot(animal.x-state.home.x,animal.y-state.home.y);
      if(d>this.sim.territory.coreRadius(animal))return{ok:false,reason:'Build closer to the center of your home range.'};
    }else{
      const mate=this.sim.animals.find(a=>a.id===animal.lastMate&&a.alive)||null,currentFamiliarity=this.sim.territory.familiarityAt?.(animal,animal.x,animal.y)||0;
      if(mate&&Math.hypot(animal.x-mate.x,animal.y-mate.y)>6&&currentFamiliarity<.08)return{ok:false,reason:'Stay with your mate or learn this ground a little before founding the new home.'};
    }
    const i=this.sim.world.idx(animal.x,animal.y);if(this.sim.world.water[i])return{ok:false,reason:'Choose dry ground for a shelter.'};
    const taxonId=this.sim.evolutionTree?.taxonFor?.(animal),materialNeed=1.15*(this.sim.speciesLifestyle?.nestMaterialMultiplier?.(taxonId)||1),material=this.materialAvailable(animal.x,animal.y,2.2);
    if(material<materialNeed)return{ok:false,reason:`Not enough plant material nearby (${material.toFixed(2)}/${materialNeed.toFixed(2)}).`};
    const spec=SPECIES[animal.species];if(animal.energy<spec.maxEnergy*.52)return{ok:false,reason:'You need at least 52% energy to build.'};
    return{ok:true,reason:pairFounding?'Ready to establish a new brood home.':'Ready.',material,materialNeed,kind:pairFounding?'brood':'family',pairKey:pairFounding?pairKey:null};
  }
  maintenanceAvailability(animal,id){
    if(animal?.underground||animal?.burrowWork||(animal?.diveDepth||0)>.03)return{enabled:false,state:'unavailable',reason:'Surface before maintaining a shelter.'};
    const shelter=this.activeShelters().find(s=>s.id===id),fail=reason=>({enabled:false,state:'unavailable',reason});
    if(!shelter||!this.enabled(animal)||!this.familyCanUse(animal,shelter))return fail('This creature cannot maintain that shelter.');
    const seal=this.weatherSeal(shelter),repair=shelter.integrity<86||(shelter.integrity<99&&seal>=.90)||seal>=.92&&shelter.integrity<99;
    if(!repair&&seal>=.92)return fail('The shelter is already sound and weather-tight.');
    if(Math.hypot(shelter.x-animal.x,shelter.y-animal.y)>2.2)return{enabled:false,state:'approachable',reason:'Approach this shelter first.',label:repair?'Repair':'Reinforce'};
    if(this.materialAvailable(animal.x,animal.y,2.2)<(repair?.32:.26))return fail('Not enough nearby material to maintain this shelter.');
    return{enabled:true,state:'available',reason:repair?'Repair · 1.4 energy.':'Reinforce · 1.05 energy.',label:repair?'Repair':'Reinforce'};
  }
  constructOrRepair(animal,targetId=null){
    if(animal?.underground||animal?.burrowWork||(animal?.diveDepth||0)>.03)return{ok:false,reason:'Surface before building or repairing.'};
    if(!this.enabled(animal))return{ok:false,reason:'No active animal can build right now.'};
    if(targetId!==null){const status=this.maintenanceAvailability(animal,targetId);if(!status.enabled)return{ok:false,reason:status.reason}}const nearby=targetId===null?this.nearest(animal,{radius:2.2,familyOnly:true}):this.activeShelters().find(s=>s.id===targetId);
    if(nearby){
      const seal=this.weatherSeal(nearby),repairFirst=nearby.integrity<86||(nearby.integrity<99&&seal>=.90);
      if(repairFirst){
        const available=this.materialAvailable(animal.x,animal.y,2.2);
        if(available<.32)return{ok:false,reason:'Not enough plant material nearby to repair.',shelter:nearby};
        const taken=this.consumeMaterials(animal.x,animal.y,.32,2.2);
        const restored=Math.min(22,taken*62);nearby.integrity=Math.min(100,nearby.integrity+restored);nearby.weatherSeal=clamp01(seal+.10);
        animal.energy=Math.max(0,animal.energy-1.4);
        this.sim.cognition.recordOnce(animal,`repair:${nearby.id}:${Math.floor(this.sim.day/8)}`,`Repaired shelter #${nearby.id}`,{shelterId:nearby.id});
        return{ok:true,action:'repair',shelter:nearby,taken};
      }
      if(seal<.92){
        const available=this.materialAvailable(animal.x,animal.y,2.2);
        if(available<.26)return{ok:false,reason:'Not enough plant material nearby to reinforce the roof.',shelter:nearby};
        const taken=this.consumeMaterials(animal.x,animal.y,.26,2.2);nearby.weatherSeal=clamp01(seal+Math.min(.36,taken*1.25));animal.energy=Math.max(0,animal.energy-1.05);
        this.sim.cognition.recordOnce(animal,`reinforce:${nearby.id}:${Math.floor(this.sim.day/6)}`,`Reinforced shelter #${nearby.id} against weather`,{shelterId:nearby.id});
        return{ok:true,action:'reinforce',shelter:nearby,taken};
      }
      if(nearby.integrity<99){
        const available=this.materialAvailable(animal.x,animal.y,2.2);if(available<.32)return{ok:false,reason:'Not enough plant material nearby to repair.',shelter:nearby};
        const taken=this.consumeMaterials(animal.x,animal.y,.32,2.2),restored=Math.min(22,taken*62);nearby.integrity=Math.min(100,nearby.integrity+restored);animal.energy=Math.max(0,animal.energy-1.4);return{ok:true,action:'repair',shelter:nearby,taken};
      }
      return{ok:false,reason:'The shelter is already sound and weather-tight.',shelter:nearby};
    }
    const check=this.canBuildHere(animal);if(!check.ok)return check;
    const taken=this.consumeMaterials(animal.x,animal.y,check.materialNeed||1.15,2.2);
    const burrow=this.sim.speciesLifestyle?.lifestyleFor?.(animal)?.id==='burrower',shelter={id:this.nextId++,ownerId:animal.id,x:animal.x,y:animal.y,integrity:100,weatherSeal:burrow ? .88 : .78,foodStore:0,capacity:burrow ? 32 : 28,kind:check.kind==='brood'?'brood':'family',pairKey:check.pairKey||null,foundingGeneration:animal.generation||1,denStyle:burrow?'burrow':null,constructedDay:this.sim.day,constructedYear:this.sim.year,lastUsedTick:this.sim.tickCount};
    this.shelters.push(shelter);animal.energy=Math.max(0,animal.energy-7.5);
    if(shelter.kind==='brood'){
      const mate=this.sim.animals.find(a=>a.id===animal.lastMate)||null;animal.broodShelterId=shelter.id;if(mate)mate.broodShelterId=shelter.id;
      this.sim.cognition.recordOnce(animal,`brood-shelter-built:${shelter.id}`,`Established a new brood shelter #${shelter.id}`,{shelterId:shelter.id,x:shelter.x,y:shelter.y,mateId:animal.lastMate,generation:animal.generation});
    }else this.sim.cognition.recordOnce(animal,`shelter-built:${shelter.id}`,`Built shelter #${shelter.id}`,{shelterId:shelter.id,x:shelter.x,y:shelter.y});
    return{ok:true,action:'build',shelter,taken,newHome:shelter.kind==='brood'};
  }
  materialAvailable(x,y,radius=2.2){
    let total=0;const w=this.sim.world,keys=['sunmoss','bramble','thistlepod','marshroot'];
    const minX=Math.max(0,Math.floor(x-radius)),maxX=Math.min(CFG.worldSize-1,Math.ceil(x+radius)),minY=Math.max(0,Math.floor(y-radius)),maxY=Math.min(CFG.worldSize-1,Math.ceil(y+radius));
    for(let yy=minY;yy<=maxY;yy++)for(let xx=minX;xx<=maxX;xx++){
      if(Math.hypot(xx-x,yy-y)>radius)continue;const i=w.idx(xx,yy);if(w.water[i])continue;
      for(const key of keys)total+=Math.max(0,(w.plants[key]?.[i]||0)-.08);
    }
    return total+(this.sim.discovery?.carriedAt?.(x,y)||0);
  }
  consumeMaterials(x,y,amount,radius=2.2){
    const w=this.sim.world,keys=['sunmoss','bramble','thistlepod','marshroot'];const carried=this.sim.discovery?.takeCarried?.(x,y,amount)||0;let remaining=amount-carried,taken=carried;
    const cells=[];const minX=Math.max(0,Math.floor(x-radius)),maxX=Math.min(CFG.worldSize-1,Math.ceil(x+radius)),minY=Math.max(0,Math.floor(y-radius)),maxY=Math.min(CFG.worldSize-1,Math.ceil(y+radius));
    for(let yy=minY;yy<=maxY;yy++)for(let xx=minX;xx<=maxX;xx++)if(Math.hypot(xx-x,yy-y)<=radius)cells.push({x:xx,y:yy,d:Math.hypot(xx-x,yy-y)});
    cells.sort((a,b)=>a.d-b.d);
    for(const cell of cells){if(remaining<=0)break;const i=w.idx(cell.x,cell.y);for(const key of keys){if(remaining<=0)break;const arr=w.plants[key];if(!arr)continue;const available=Math.max(0,arr[i]-.08),use=Math.min(available,remaining);w.consume(key,cell.x,cell.y,use);this.sim.history?.notePlantConsumption(key,cell.x,cell.y,use);remaining-=use;taken+=use}}
    return taken;
  }
  cacheNearbyFood(animal){
    if(animal?.underground||animal?.burrowWork||(animal?.diveDepth||0)>.03)return{ok:false,reason:'Surface before storing food.'};
    if(!this.enabled(animal))return{ok:false,reason:'No active animal can store food right now.'};
    const shelter=this.nearest(animal,{radius:2.0,familyOnly:true});if(!shelter)return{ok:false,reason:'Stand beside your shelter to store food.'};
    if(shelter.foodStore>=shelter.capacity-.05)return{ok:false,reason:'The shelter is full of food.',shelter};
    const spec=SPECIES[animal.species],w=this.sim.world;let best=null;
    for(const [kind,eff] of Object.entries(groundDiet(animal))){
      if(eff<=0)continue;
      for(let yy=Math.max(0,Math.floor(shelter.y-2));yy<=Math.min(CFG.worldSize-1,Math.ceil(shelter.y+2));yy++)for(let xx=Math.max(0,Math.floor(shelter.x-2));xx<=Math.min(CFG.worldSize-1,Math.ceil(shelter.x+2));xx++){
        if(Math.hypot(xx-shelter.x,yy-shelter.y)>2.2)continue;const i=w.idx(xx,yy);
        const biomass=kind==='carrion'?w.carrion[i]:(PLANTS[kind]?w.plants[kind][i]:0);if(!biomass)continue;
        const nutrition=kind==='carrion'?34:(PLANTS[kind]?.nutrition||0)*3.6;const score=biomass*eff*nutrition;if(!best||score>best.score)best={kind,x:xx,y:yy,i,score,eff,nutrition};
      }
    }
    if(!best||best.score<.2)return{ok:false,reason:'No food is close enough to store.',shelter};
    const arr=best.kind==='carrion'?w.carrion:w.plants[best.kind];const minimum=best.kind==='carrion'?0:.06;const formCache=this.sim.divergence?.cacheMultiplier?.(animal)||1,creditPerMass=best.nutrition*best.eff*.58*formCache;const biomass=Math.min(.16,Math.max(0,arr[best.i]-minimum),Math.max(0,shelter.capacity-shelter.foodStore)/Math.max(.001,creditPerMass));if(biomass<=0)return{ok:false,reason:'There is not enough food here to store.',shelter};
    if(best.kind==='carrion')arr[best.i]-=biomass;else w.consume(best.kind,best.x,best.y,biomass);if(best.kind!=='carrion')this.sim.history?.notePlantConsumption(best.kind,best.x,best.y,biomass);const stored=Math.min(shelter.capacity-shelter.foodStore,biomass*best.nutrition*best.eff*.58*formCache);shelter.foodStore+=stored;shelter.lastUsedTick=this.sim.tickCount;animal.energy=Math.max(0,animal.energy-.55);
    this.sim.cognition.recordOnce(animal,`cache:${shelter.id}:${this.sim.day}:${best.kind}`,`Stored ${PLANTS[best.kind]?.label||best.kind} at shelter #${shelter.id}`,{shelterId:shelter.id,kind:best.kind});
    return{ok:true,action:'cache',shelter,kind:best.kind,stored};
  }
  phaseSupport(){
    this.phaseNestProjects();
    for(const animal of this.sim.animals){
      if(!this.enabled(animal)||!animal.alive)continue;const shelter=this.nearest(animal,{radius:1.7,familyOnly:true});if(!shelter||shelter.foodStore<=0)continue;
      const spec=SPECIES[animal.species],ratio=animal.energy/spec.maxEnergy;
      const dependent=this.sim.family.isDependent(animal);if(ratio>(dependent?.62:.38))continue;
      const need=spec.maxEnergy*(dependent?.72:.52)-animal.energy;if(need<=0)continue;
      const draw=Math.min(need/1.05,shelter.foodStore,dependent?1.2:.7);if(draw<=0)continue;
      shelter.foodStore-=draw;animal.energy=Math.min(spec.maxEnergy,animal.energy+draw*1.05);shelter.lastUsedTick=this.sim.tickCount;
    }
  }

  weatherSeal(shelter){return clamp01(shelter?.weatherSeal??.78)}
  weatherQuality(shelter){if(!shelter)return 0;const structure=clamp01(shelter.integrity/100),seal=this.weatherSeal(shelter);return clamp01(structure*(.50+.50*seal))}
  weatherLabel(shelter){const q=this.weatherQuality(shelter),seal=this.weatherSeal(shelter);if(q>=.84&&seal>=.82)return'Reinforced';if(q>=.68&&seal>=.58)return'Holding';if(q>=.48)return'Weathered';return'Leaking'}
  maintenanceAction(shelter){if(!shelter)return null;if(shelter.integrity<86)return'repair';if(this.weatherSeal(shelter)<.92)return'reinforce';if(shelter.integrity<99)return'repair';return null}

  safeTarget(animal,{maxDistance=12,requireFood=false}={}){
    if(!this.enabled(animal))return null;
    const shelter=this.nearest(animal,{radius:maxDistance,familyOnly:true});
    if(!shelter||(requireFood&&shelter.foodStore<=.2))return null;
    return{x:shelter.x,y:shelter.y,shelterId:shelter.id,safeShelter:true};
  }
  thermalMultiplier(animal){
    const shelter=this.nearest(animal,{radius:1.55,familyOnly:true});if(!shelter)return 1;
    return (1-(.58*this.weatherQuality(shelter)))*(this.sim.speciesLifestyle?.shelterThermalMultiplier?.(animal)||1);
  }
  protectionFactor(animal){
    const shelter=this.nearest(animal,{radius:1.55,familyOnly:true});if(!shelter)return 1;
    const dependent=this.sim.family.isDependent(animal);
    const maxProtection=dependent?.64:.30;
    const base=Math.max(dependent?.36:.70,1-maxProtection*(shelter.integrity/100));return Math.max(dependent?.30:.50,base*shelterExposureEffect(this.sim,animal));
  }
  advanceDay(){
    for(const shelter of this.shelters){
      const rain=this.sim.climate?.rain??.4,temp=this.sim.climate?.temp??.55;
      const weatherWear=.018+.026*rain+.012*Math.abs(temp-.55);shelter.integrity=Math.max(0,shelter.integrity-weatherWear);
      const sealWear=.003+Math.max(0,rain-.35)*.030+Math.abs(temp-.55)*.008;shelter.weatherSeal=clamp01(this.weatherSeal(shelter)-sealWear);
      shelter.foodStore=Math.max(0,shelter.foodStore-.012*(.7+rain));
    }
  }
  intruderFor(shelter,viewer){
    if(!shelter||!viewer)return null;let best=null,bestD=Infinity;
    this.sim.forEachNearby({x:shelter.x,y:shelter.y},3.5,b=>{
      if(!b.alive||b.species!=='genvo'||this.familyCanUse(b,shelter))return;
      const d=Math.hypot(b.x-shelter.x,b.y-shelter.y);if(d<bestD){bestD=d;best=b}
    });return best;
  }
  snapshot(animal){
    const shelter=this.nearest(animal,{radius:Infinity,familyOnly:true});if(!shelter)return{exists:false,canBuild:this.canBuildHere(animal),material:this.materialAvailable(animal?.x??0,animal?.y??0,2.2)};
    const d=Math.hypot(animal.x-shelter.x,animal.y-shelter.y),intruder=this.intruderFor(shelter,animal);
    return{exists:true,shelter,distance:d,inside:d<=1.55,thermalMultiplier:this.thermalMultiplier(animal),protectionFactor:this.protectionFactor(animal),weatherQuality:this.weatherQuality(shelter),weatherSeal:this.weatherSeal(shelter),weatherLabel:this.weatherLabel(shelter),maintenanceAction:this.maintenanceAction(shelter),intruder,material:this.materialAvailable(animal.x,animal.y,2.2)};
  }
}
