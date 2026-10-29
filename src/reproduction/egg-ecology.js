import {preyPreference,canHunt} from '../ecology/functional-diet.js';
import {toReserve} from '../organisms/body-size.js';
// Canonical egg ecology: finite nests, voluntary parental care, and opportunistic
// predation. All functions act on existing world stocks/animal reserves. Neither
// protection nor incubation requires a guaranteed surviving clutch.
import {SPECIES} from '../organisms/species.js';
import {CFG} from '../sim/config.js';
import {hasPart} from '../lineage/part-abilities.js';
import {CANOPY,canopySupport,canopyFeedingPosition,canAccessCanopyNest,canopyGrips} from '../ecology/canopy-site.js';
import {winged} from '../lineage/flight.js';

export const NEST_MATERIAL=0.18;
export const NEST_ENERGY=2.4;
export const MAX_NESTS=64;
export const NEST_CARE_ENERGY=0.65;
const PLANT_KINDS=['marshroot','sunmoss','thistlepod','bramble','rotcap'];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));

export function nestForEgg(sim,egg){return egg?.nestId==null?null:(sim.nests||[]).find(n=>n.id===egg.nestId)||null}

export function constructNest(sim,mother){
  if(!mother?.alive||mother.energy<NEST_ENERGY+1||(sim.nests||[]).length>=MAX_NESTS)return null;
  const w=sim.world,i=w.idx(mother.x,mother.y);
  if(w.water[i]||mother.airborne)return null;
  const aloft=!!mother.perched;
  // Existing standing Woodspire directly funds the nest, while a healthy tree
  // remains to support the nest afterward. Surface nests use their old rules.
  if(aloft&&(!canopyFeedingPosition(mother,w)||w.plants.woodspire[i]<CANOPY.minimumTree+NEST_MATERIAL+.04))return null;
  const kind=aloft?'woodspire':PLANT_KINDS.find(k=>w.plants[k]?.[i]>=NEST_MATERIAL);
  if(!kind)return null;
  const used=w.consume(kind,mother.x,mother.y,NEST_MATERIAL);
  if(used<NEST_MATERIAL-.0001)return null;
  mother.energy-=NEST_ENERGY;
  const protectedByPart=hasPart(mother,'brood-pouch');
  const nest={id:sim.nextNestId++,x:mother.x,y:mother.y,builderId:mother.id,
    material:kind,materialUsed:used,layer:aloft?'canopy':'ground',integrity:protectedByPart?.83:.62,
    dayBuilt:sim.day,careCount:0,lastCareDay:-1};
  sim.nests.push(nest);
  sim.family?.pushEvent?.({type:'nest-built',animalId:mother.id,nestId:nest.id,material:kind});
  return nest;
}

export function chooseCareNest(sim,parent){
  if(!parent?.alive||parent.energy<(SPECIES[parent.species]?.maxEnergy||100)*.5||parent.hydration<(SPECIES[parent.species]?.maxHydration||100)*.5)return null;
  const eggs=(sim.eggs||[]).filter(e=>e.motherId===parent.id||e.fatherId===parent.id);
  let best=null,bestDistance=Infinity;
  for(const egg of eggs){const nest=nestForEgg(sim,egg);if(!nest||nest.integrity>=.96||nest.lastCareDay===sim.day)continue;
    if(nest.layer==='canopy'&&(!winged(parent)||canopyGrips(parent)<2))continue;
    const d=distance(parent,nest);if(d>5||d>=bestDistance)continue;
    if(!sim.canReach(parent,nest.x,nest.y))continue;
    bestDistance=d;best=nest;
  }
  return best;
}

export function nestCareAvailability(sim,parent,nest){
 if(parent?.underground||parent?.burrowWork||parent?.caveTransit||(parent?.diveDepth||0)>.03)return{enabled:false,state:'unavailable',reason:'Surface before tending a clutch.'};
 const fail=reason=>({enabled:false,state:'unavailable',reason});
 if(!parent?.alive||!nest||(sim.nests||[]).every(n=>n.id!==nest.id))return fail('That clutch is no longer here.');
 if(!(sim.eggs||[]).some(e=>e.nestId===nest.id&&(e.motherId===parent.id||e.fatherId===parent.id)))return fail('Only a parent can tend this clutch.');
 if(nest.lastCareDay===sim.day)return fail('This clutch has already been tended today.');
 if(parent.energy<NEST_CARE_ENERGY+1)return fail('Not enough energy to tend the clutch.');
 if(parent.hydration<SPECIES[parent.species].maxHydration*.42)return fail('Drink before tending the clutch.');
 if(nest.layer==='canopy'&&!canAccessCanopyNest(parent,sim.world,nest))return fail('Perch in this living tree to reach its elevated nest.');
 if(nest.layer!=='canopy'&&(parent.perched||parent.airborne))return fail('Descend to the ground to tend this nest.');
 if(distance(parent,nest)>1.4)return{enabled:false,state:'approachable',reason:'Approach this clutch first.',cost:NEST_CARE_ENERGY};
 return{enabled:true,state:'available',reason:'Tend the clutch · '+NEST_CARE_ENERGY+' energy.',cost:NEST_CARE_ENERGY};
}
export function careForNest(sim,parent,nest){
  if(!nestCareAvailability(sim,parent,nest).enabled)return false;
  // Body-part protection improves upkeep, but any surviving parent can tend eggs.
  parent.energy-=NEST_CARE_ENERGY;
  nest.integrity=clamp(nest.integrity+(hasPart(parent,'brood-pouch')?.13:.07));
  nest.lastCareDay=sim.day;nest.careCount=(nest.careCount||0)+1;
  return true;
}

export function nestIncubationQuality(nest,baseQuality){
  if(!nest)return baseQuality;
  // Nests ameliorate moderate exposure, not flooding: water remains lethal.
  if(baseQuality===0)return 0;
  return clamp(baseQuality+(1-baseQuality)*nest.integrity*.48);
}

export function advanceNests(sim){
  if(!sim.nests?.length)return;
  const activeIds=new Set((sim.eggs||[]).map(e=>e.nestId).filter(id=>id!=null));
  for(const nest of sim.nests){nest.integrity=clamp(nest.integrity-(activeIds.has(nest.id)?.024:.09));
    if(nest.layer==='canopy'&&!canopySupport(sim.world,nest.x,nest.y).supported)nest.integrity=clamp(nest.integrity-CANOPY.nestFailureDamage);
  }
  sim.nests=sim.nests.filter(n=>n.integrity>0);
}

export function edibleEggTarget(sim,predator,{radius=8}={}){
  if(!predator?.alive||predator.player||!canHunt(predator))return null;
  let best=null,closest=radius;
  for(const egg of sim.eggs||[]){
    if(!canHunt(predator))continue;
    const nest=nestForEgg(sim,egg);
    if(nest?.layer==='canopy'&&!canAccessCanopyNest(predator,sim.world,nest))continue;
    if(nest?.layer!=='canopy'&&(predator.perched||predator.airborne))continue;
    const d=distance(predator,egg);
    if(d>=closest||!sim.canReach(predator,egg.x,egg.y))continue;
    closest=d;best=egg;
  }
  return best;
}

export function eggFeedingAvailability(sim,predator,egg){
 if(!predator?.alive)return{enabled:false,state:'unavailable',reason:'No active creature.'};
 if(!egg||!(sim.eggs||[]).includes(egg))return{enabled:false,state:'unavailable',reason:'That egg is no longer here.'};
 if(!canHunt(predator))return{enabled:false,state:'unavailable',reason:'Predatory feeding anatomy is required to raid eggs.'};
 const nesting=nestForEgg(sim,egg);
 if(nesting?.layer==='canopy'&&!canAccessCanopyNest(predator,sim.world,nesting))return{enabled:false,state:'unavailable',reason:'Elevated clutch requires an attacker actually perched in that canopy.'};
 if(nesting?.layer!=='canopy'&&(predator.perched||predator.airborne))return{enabled:false,state:'unavailable',reason:'Ground eggs require landing first.'};
 if((predator.nextEggAttackTick||0)>sim.tickCount)return{enabled:false,state:'unavailable',reason:'Recover before raiding again.'};
 const label=nestForEgg(sim,egg)?.integrity>.22?'Break nest cover':'Eat Egg';
 if(distance(predator,egg)>1.1)return{enabled:false,state:'approachable',reason:'Approach this egg first.',label,cost:.4};
 return{enabled:true,state:'available',reason:label+' · 0.4 energy.',label,cost:.4};
}
export function eatEgg(sim,predator,egg){
  if(!eggFeedingAvailability(sim,predator,egg).enabled)return false;
  predator.nextEggAttackTick=sim.tickCount+Math.ceil(CFG.simHz*.8);
  const nest=nestForEgg(sim,egg);
  predator.energy=Math.max(0,predator.energy-.4); // physical work of breaking cover
  if(nest?.integrity>.22){
    nest.integrity=clamp(nest.integrity-.27);
    return false;
  }
  const digest=1;
  const benefit=Math.max(0,egg.energy||0)*.72+Math.max(0,egg.hydration||0)*.08;
  predator.energy=Math.min(SPECIES[predator.species].maxEnergy,predator.energy+toReserve(predator,benefit*digest));
  sim.eggs.splice(sim.eggs.indexOf(egg),1);
  sim.family?.pushEvent?.({type:'egg-predated',animalId:egg.motherId,eggId:egg.id,predatorId:predator.id});
  return true;
}
