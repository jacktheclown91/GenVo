import {submerged} from '../lineage/diving.js';
import {FLORA_TISSUES} from '../ecology/flora-genotype.js';
import {PLANTS} from '../sim/config.js';
import {FRESHWATER_FOOD,freshwaterField} from '../ecology/freshwater-food.js';
import {nestForEgg,nestCareAvailability,careForNest,chooseCareNest,eggFeedingAvailability,eatEgg} from '../reproduction/egg-ecology.js';
// Command composition only. Food, hydration, care, maintenance and collection
// remain owned by their existing controllers and revalidate at execution.
const foodLabel=k=>PLANTS[k]?.label||FRESHWATER_FOOD[k]?.label||(k==='carrion'?'Carrion':k);
const targetKey=t=>t.kind+':'+(t.id??t.i??'')+':'+(t.food||'')+':'+(t.tissue||'');
const info=(id,label,target,status,extra={})=>({id,key:id+'|'+targetKey(target),label,target,enabled:!!status.enabled,state:status.state||(status.enabled?'available':'unavailable'),reason:status.reason||label,...extra});
export function contextualInteractions(sim,target=null){
 const a=sim.player();if(!a?.alive||a.airborne)return[];
 if(a.burrowWork)return[];if(a.underground&&target&&!['food','plant','corpse'].includes(target.kind))return[];
 if(a.perched){
  const site={kind:'canopy',x:a.x,y:a.y,i:sim.world.idx(a.x,a.y),label:'Woodspire crown'};
  const options=[];
  if(!target||target.kind==='canopy')options.push(info('feed-canopy','Feed canopy',site,sim.canopyFoodAvailability(a)));
  for(const nest of sim.nests||[])if(nest.layer==='canopy'&&Math.hypot(a.x-nest.x,a.y-nest.y)<=1.4&&(!target||target.kind==='nest'&&target.id===nest.id))options.push(info('tend-egg','Tend canopy eggs',{kind:'nest',id:nest.id,x:nest.x,y:nest.y},nestCareAvailability(sim,a,nest),{nestId:nest.id}));
  return sim.paused?options.map(o=>({...o,enabled:false,reason:'Resume the world first.'})):options;
 }
 if(submerged(a)){if(target&&!['food','water'].includes(target.kind))return[];if(target?.kind==='food'&&!FRESHWATER_FOOD[target.food])return[];if(!target)return sim.foraging.options(a).filter(m=>FRESHWATER_FOOD[m.kind]).flatMap(m=>contextualInteractions(sim,{kind:'food',food:m.kind,i:m.i,x:m.x,y:m.y}));}
 if(!target){
  const candidates=[];const manual=sim.foraging.states.get(a.id);for(const meal of sim.foraging.options(a)){if(manual?.manual&&meal.kind!==manual.selectedKind)continue;candidates.push({kind:'food',food:meal.kind,i:meal.i,x:meal.i%sim.world.n+.5,y:Math.floor(meal.i/sim.world.n)+.5,label:foodLabel(meal.kind),tissue:meal.tissue})}
  if(sim.resourceAvailability('drink').enabled){const w=sim.world;let source=null,best=Infinity;for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){const i=w.idx(a.x+x,a.y+y);if(!w.water[i])continue;const t={kind:'water',i,x:i%w.n+.5,y:Math.floor(i/w.n)+.5,label:'Water'},d=Math.hypot(t.x-a.x,t.y-a.y);if(d<best){best=d;source=t}}candidates.push(source||{kind:'drinkable-ground',x:a.x,y:a.y,i:w.idx(a.x,a.y),label:'Drinkable ground'})}
  for(const site of sim.discovery?.sites||[])if(!site.gone&&Math.hypot(site.x-a.x,site.y-a.y)<=1.4&&['relic','nest-ruin'].includes(site.kind))candidates.push({kind:'site',id:site.id,x:site.x,y:site.y,label:site.kind==='relic'?'Relic':'Nest material'});
  const care=sim.family.careTarget(a,{radius:1.75,urgentOnly:true}),sick=sim.familyIllness?.sickCareTarget?.(a,{radius:1.8}),storm=sim.familyWeather?.aftercareTarget?.(a,{radius:1.8});for(const c of [care?.child,sick?.child,storm?.child])if(c)candidates.push({kind:'creature',id:c.id,x:c.x,y:c.y});
  const nest=chooseCareNest(sim,a);if(nest&&Math.hypot(nest.x-a.x,nest.y-a.y)<=1.4)candidates.push({kind:'nest',id:nest.id,x:nest.x,y:nest.y,label:'Clutch'});
  const shelter=sim.shelter.nearest(a,{radius:2.2,familyOnly:true});if(shelter)candidates.push({kind:'shelter',id:shelter.id,x:shelter.x,y:shelter.y,label:'Shelter'});
  const denSite=sim.stalkerTerritory?.nearbySite?.(a,{radius:1.9,includeAbandoned:true});if(denSite&&!denSite.known)candidates.push({kind:'den',id:denSite.den.id,x:denSite.den.x,y:denSite.den.y,label:'Animal scrape'});
  const options=[...new Map(candidates.map(t=>[targetKey(t),t])).values()].sort((p,q)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(q.x-a.x,q.y-a.y)||(targetKey(p)<targetKey(q)?-1:targetKey(p)>targetKey(q)?1:0)).flatMap(t=>contextualInteractions(sim,t)).filter(o=>o.enabled&&o.id!=='inspect')
   // A meal can be reached both as a forage target and through its water cell; one action id is one choice.
   .filter((o,k,all)=>all.findIndex(x=>x.id===o.id)===k);
  if(sim.partAbilities.digAvailability(a).enabled&&!sim.nearestPlayerCombatTarget(a,1.9))options.push(...contextualInteractions(sim,{kind:'ground',x:a.x,y:a.y,i:sim.world.idx(a.x,a.y)}));
  return options;
 }
 let options=[];
 if(['plant','corpse','food'].includes(target.kind)){if(FLORA_TISSUES[target.food]){const tissues=target.tissue?[target.tissue]:['crop','kernel'];options=tissues.map(tissue=>{const t={...target,tissue},status=sim.resourceAction('eat',t);return info('eat:'+target.food+':'+target.i+(tissue==='kernel'?':kernel':''),tissue==='kernel'?'Crush seeds':target.food==='bramble'?'Eat fruit':'Eat pods',t,status)})}else{const status=sim.resourceAction('eat',target);options=[info('eat:'+target.food+':'+target.i,'Eat '+foodLabel(target.food),target,status)]}}
 else if(target.kind==='water'||target.kind==='drinkable-ground'){
  const status=target.kind==='water'?sim.resourceAction('drink',target):{...sim.resourceAvailability('drink'),state:sim.world.isDrinkable(target.x,target.y)&&Math.hypot(target.x-a.x,target.y-a.y)<=1.5?'available':'unavailable'};status.enabled=!!status.enabled&&status.state!=='unavailable';options.push(info('drink','Drink',target,status));
  if(target.kind==='water')for(const kind of Object.keys(FRESHWATER_FOOD)){if(!(freshwaterField(sim.world,kind)?.[target.i]>.01))continue;const food={...target,kind:'food',food:kind,label:foodLabel(kind)};const edible=sim.resourceAction('eat',food);if(edible.state!=='unavailable')options.push(info('eat:'+kind+':'+target.i,'Eat '+foodLabel(kind),food,edible))}
 }
 else if(target.kind==='nest'||target.kind==='egg'){
  const egg=target.kind==='egg'?(sim.eggs||[]).find(e=>e.id===target.id):null,nest=egg?nestForEgg(sim,egg):(sim.nests||[]).find(n=>n.id===target.id),status=nestCareAvailability(sim,a,nest);options=[info('tend-egg','Tend Egg',target,status,{nestId:nest?.id})];if(egg){const feeding=eggFeedingAvailability(sim,a,egg);options.push(info('raid-egg',feeding.label||'Raid Egg',target,feeding))}
 }
 else if(target.kind==='trace'){options=[info('study-trace','Read marks',target,sim.discovery.traceAvailability(a,target.id)),info('follow-trace','Follow trail',target,sim.discovery.traceAvailability(a,target.id,{follow:true}))];const trace=sim.discovery.traceById(target.id);if(trace?.type==='feed'){const food={kind:'food',food:trace.food,i:sim.world.idx(trace.x,trace.y),x:trace.x,y:trace.y};options.push(...contextualInteractions(sim,food).filter(o=>o.id.startsWith('eat:')))}}
 else if(target.kind==='seed-patch'){options=[info('read-seed-patch','Read patch',target,sim.discovery.seedPatchAvailability(a,target.id))]}
 else if(target.kind==='den'){const den=sim.stalkerTerritory.activeSites().find(d=>d.id===target.id);options=[info('den-inspect','Inspect scrape',target,!den?{enabled:false,reason:'That scrape is gone.'}:Math.hypot(den.x-a.x,den.y-a.y)<=1.9?{enabled:true,reason:'Read the actual signs at this scrape.'}:{enabled:false,state:'approachable',reason:'Approach this scrape first.'})]}
 else if(target.kind==='site'){const site=sim.discovery.sites.find(s=>s.id===target.id&&!s.gone);options=[info(site?.kind==='relic'?'collect-relic':'collect-material','Collect',target,sim.discovery.collectionAvailability(a,target.id))]}
 else if(target.kind==='shelter'){const status=sim.shelter.maintenanceAvailability(a,target.id);options=[info('maintain',status.label||'Maintain',target,status)]}
 else if(target.kind==='ground'){const here=sim.world.idx(a.x,a.y)===target.i,probe=here?a:Object.assign(Object.create(Object.getPrototypeOf(a)),a,{x:target.x,y:target.y}),status=sim.partAbilities.digAvailability(probe);options=[info('dig','Dig roots',target,here||!status.enabled?status:{enabled:false,state:'approachable',reason:'Approach this ground before digging.'})]}
 else if(target.kind==='creature'){
  const child=sim.animals.find(v=>v.id===target.id&&v.alive);if(child){const status=sim.family.tendAvailability(a,child),care=sim.family.careStatus(child,a);if(child.parentIds?.includes(a.id)&&care)options.push(info('care',status.label||'Tend',target,status));
   const sick=sim.familyIllness?.sickCareTarget?.(a,{radius:1.8});if(sick?.child.id===child.id)options.push(info('illness-care','Check young',target,{enabled:true,reason:'Check your sick young using the existing caregiver action.'}));
   const storm=sim.familyWeather?.aftercareTarget?.(a,{radius:1.8});if(storm?.child.id===child.id)options.push(info('storm-check','Check after storm',target,{enabled:true,reason:'Settle your young after the storm.'}));
   if(!options.length)options.push(info('inspect','Inspect',target,{enabled:true,reason:'Inspect this creature without starting combat or courtship.'}));
  }
 }
 if(sim.paused)options=options.map(o=>({...o,enabled:false,state:'unavailable',reason:'Resume the world first.'}));return options;
}
export function executeInteraction(sim,target=null,actionId=null){
 if(sim.paused)return{ok:false,type:'interact',message:'Resume the world first.'};
 if(sim.player()?.airborne)return{ok:false,type:'interact',message:'Land before feeding, drinking, mating or tending creatures.'};
 const options=contextualInteractions(sim,target),available=options.filter(o=>o.enabled);
 if(actionId===null&&available.length>1)return{ok:false,type:'interaction-choice',choices:available,message:'Choose how to interact.'};
 const option=actionId===null?available[0]:options.find(o=>o.id===actionId);
 if(!option?.enabled)return{ok:false,type:'interact',state:option?.state||options[0]?.state||'unavailable',message:option?.reason||options[0]?.reason||(target?'No valid interaction with this target.':sim.nearestPlayerCombatTarget(sim.player(),1.9)?'No world interaction nearby. Space attacks; hold J to brace.':'No usable object nearby.')};
 const a=sim.player(),t=option.target;let result;
 if(option.id==='feed-canopy')result=sim.playerCanopyFeed();
 else if(option.id.startsWith('eat:')){const status=sim.resourceAction('eat',t);result=status.enabled?sim.playerEat(status.meal):{ok:false,type:'eat',message:status.reason}}
 else if(option.id==='drink')result=sim.playerDrink(t.kind==='water'?t:null);
 else if(option.id==='tend-egg'){const nest=(sim.nests||[]).find(n=>n.id===option.nestId),ok=careForNest(sim,a,nest);result={ok,type:'nest-care',message:ok?'Tended the clutch.':'The clutch cannot be tended now.'};if(ok)sim.lastPlayerAction={type:'nest-care',nestId:nest.id,tick:sim.tickCount}}
 else if(option.id==='raid-egg'){const egg=sim.eggs.find(e=>e.id===t.id),nest=nestForEgg(sim,egg),before=nest?.integrity,ate=eatEgg(sim,a,egg),broken=nest&&nest.integrity<before;result={ok:!!ate||!!broken,type:'egg-raid',message:ate?'Ate the egg.':broken?'Broke some nest cover.':'The egg cannot be reached or consumed now.'}}
 else if(option.id==='maintain'){result=sim.shelter.constructOrRepair(a,t.id);result={...result,type:'shelter',message:result.ok?(result.action==='repair'?'Shelter repaired.':'Shelter reinforced.'):result.reason}}
 else if(option.id==='collect-relic')result=sim.discovery.collectRelic(a,t.id);
 else if(option.id==='collect-material')result=sim.discovery.collectNest(a,t.id);
 else if(option.id==='read-seed-patch')result=sim.discovery.readSeedPatch(a,t.id);
 else if(option.id==='study-trace')result=sim.discovery.studyTrace(a,t.id);
 else if(option.id==='follow-trace')result=sim.discovery.startTraceFollow(a,t.id);
 else if(option.id==='den-inspect')result=sim.stalkerTerritory.inspect(a,t.id);
 else if(option.id==='dig')result=sim.partAbilities.dig(a);
 else if(option.id==='inspect')result={ok:true,type:'inspect',target:t,message:'Inspecting the selected creature.'};
 else {const child=sim.animals.find(v=>v.id===t.id&&v.alive);result=option.id==='care'?sim.family.tend(a,child):option.id==='illness-care'?sim.familyIllness.checkSickYoung(a,child):sim.familyWeather.checkAfterStorm(a,child)}
 return result||{ok:false,type:'interact',message:'That target is no longer available.'};
}
