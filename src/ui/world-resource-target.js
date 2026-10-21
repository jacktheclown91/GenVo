import {surfaceIceCovered,iceAmount} from '../world/surface-ice.js';
import {iceSupports} from '../lineage/ice-locomotion.js';
import {botanicalPlantView} from '../ecology/botanical-reproduction.js';
import {seedPatchDescription} from '../gameplay/seed-observations.js';
import {plantHandling} from '../ecology/plant-handling.js';
import {plantResourceView} from '../ecology/plant-resources.js';
import {PLANTS,CFG} from '../sim/config.js';
import {plantPreference} from '../ecology/functional-diet.js';
import {CAVES} from '../world/cave-policy.js';
export function worldResourceAt(sim,renderer,cx,cy){const p=renderer.screenToWorld(cx,cy);if(!p||!sim.world.isPlayable(p.x,p.y))return null;const w=sim.world,i=w.idx(p.x,p.y),x=Math.floor(p.x)+.5,y=Math.floor(p.y)+.5;
 if(sim.caveRules===CAVES.policy&&w.subsurface?.passages.get(i)?.entry&&!w.subsurface.passages.get(i).closed)return{kind:'ground',cave:i,i,x,y,label:'Cave opening'};
 let hit=null,bestObject=Infinity;for(const [kind,objects] of [['egg',sim.eggs||[]],['nest',sim.nests||[]],['shelter',sim.shelter.activeShelters?.()||[]]])for(const object of objects){const d=Math.hypot(object.x-p.x,object.y-p.y);if(d<(kind==='egg'?.35:.7)&&d<bestObject){bestObject=d;hit={kind,id:object.id,x:object.x,y:object.y,label:kind==='shelter'?'Family shelter':kind==='egg'?'Egg':'Nest'}}}if(hit)return hit;
 for(const den of sim.stalkerTerritory?.activeSites?.()||[])if(Math.hypot(den.x-p.x,den.y-p.y)<.65)return{kind:'den',id:den.id,x:den.x,y:den.y,label:'Animal scrape'};
 for(const site of sim.discovery?.sites||[])if(!site.gone&&['relic','nest-ruin'].includes(site.kind)&&Math.hypot(site.x-p.x,site.y-p.y)<.65)return{kind:'site',id:site.id,x:site.x,y:site.y,label:site.kind==='relic'?'Relic':'Nest material'};
 if(w.carrion[i]>.06&&Math.hypot(p.x-x,p.y-y)<.5)return{kind:'corpse',i,food:'carrion',x,y,label:'Carrion'};
 const patch=sim.discovery?.pickSeedPatchAt(sim.player(),p.x,p.y);if(patch)return sim.discovery.seedPatchTarget(patch);
 const trace=sim.discovery?.pickTraceAt(sim.player(),p.x,p.y);if(trace)return sim.discovery.traceTarget(trace);
 let plant=null,best=.38;
 if(renderer.plantTargetWorld===w)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=w.idx(p.x+dx,p.y+dy);for(const food of Object.keys(PLANTS)){const candidate=renderer.visiblePlantTargets?.get(j+'|'+food);if(!candidate||!(w.plants[food]?.[j]>.01))continue;const d=Math.hypot(candidate.hitX-p.x,candidate.hitY-p.y);if(d<best){plant=candidate;best=d}}}
 if(plant)return{kind:'plant',...plant,label:PLANTS[plant.food].label||plant.food};
 if(w.water[i])return{kind:'water',i,x,y,label:'Water'};
 return{kind:'ground',i,x,y,label:'Open ground'};
}
export function approachGoal(sim,target){const a=sim.player();if(!a)return null;if(target.kind==='ground'||target.kind==='trace'||target.kind==='seed-patch')return sim.canOccupy(a,target.x,target.y)?{x:target.x,y:target.y}:null;const choices=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){const p={x:target.x+x,y:target.y+y};if(sim.canOccupy(a,p.x,p.y)&&(target.kind!=='water'||sim.world.isDrinkable(p.x,p.y)))choices.push(p)}return choices.sort((p,q)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(q.x-a.x,q.y-a.y))[0]||null}
export function resourceTargetView(sim,target){const a=sim.player();if(!a)return null;let live=true;if(target.kind==='seed-patch')live=!!sim.discovery.seedObservations?.some(o=>o.id===target.id);else if(target.kind==='trace')live=!!sim.discovery.traceById(target.id);else if(target.kind==='plant')live=(sim.world.plants[target.food]?.[target.i]||0)>.01;else if(target.kind==='water')live=!!sim.world.water[target.i];else if(target.kind==='corpse'||target.kind==='food')live=(target.food==='carrion'?sim.world.carrion[target.i]:sim.world.plants[target.food]?.[target.i])>.01;else if(target.kind==='den')live=sim.stalkerTerritory.activeSites().some(d=>d.id===target.id);else if(target.kind==='site')live=sim.discovery.sites.some(s=>s.id===target.id&&!s.gone);else if(['nest','egg','shelter'].includes(target.kind)){const objects=target.kind==='nest'?sim.nests:target.kind==='egg'?sim.eggs:sim.shelter.activeShelters();live=objects?.some(o=>o.id===target.id)}
 const near=target.kind==='water'?Math.abs(Math.floor(a.x)-Math.floor(target.x))<=1&&Math.abs(Math.floor(a.y)-Math.floor(target.y))<=1:Math.hypot(a.x-target.x,a.y-target.y)<=1.5,edible=target.kind==='plant'&&plantPreference(a,target.food)>0;
 const meal=edible?sim.foraging.options(a,{index:target.i,kind:target.food})[0]||null:null;
 return{live,near,edible,meal,action:target.kind==='water'?sim.resourceAction('drink',target):target.kind==='plant'?sim.resourceAction('eat',target):null,goal:approachGoal(sim,target),description:target.kind==='corpse'?'Organic remains feed decomposers and return soil nutrients.':target.kind==='plant'&&target.food==='rotcap'?'Fungi consume real organic remains; without substrate they decline.':target.kind==='plant'&&sim.dispersal.seedReserve[target.food]?(()=>{const v=sim.dispersal.tissueView(target.food,target.i),r=plantResourceView(sim.world,target.food,target.i);const inherited=v.genome.schema>=2?(v.genome.traits.seedAllocation>.2?'Seed-rich inherited crop. ':v.genome.traits.seedAllocation<.2?'Flesh-rich inherited crop. ':'Inherited crop. '):'';return `${inherited}${r?.state||''}. Edible tissue ${v.flesh.toFixed(2)} · intact propagules ${v.seed.toFixed(2)} · coat ${v.coat.toFixed(2)}. Fruit/pod feeding can disperse seeds; cracking destroys them.`})():target.kind==='trace'?sim.discovery.traceDescription(sim.discovery.traceById(target.id),a):target.kind==='plant'?(edible?'Your mouth can eat this.':'Your current mouth cannot eat this.'):target.kind==='water'?(()=>{const o=sim.world.organicResources;const labels=['Dormant','Growing','Water limited','Nutrient limited','Stored energy limited'];const states=Object.entries(o.limits).filter(([k])=>sim.world.freshwaterFood[k][target.i]>.01).map(([k,v])=>k+': '+labels[v[target.i]]);return 'Approach a drinkable shore. '+states.join(' · ')})():'Select Approach or Inspect.'};
}
export function worldTargetScreen(renderer,target){const tile=CFG.tileSize*renderer.zoom;return{x:renderer.w/2+(target.x-renderer.camera.x)*tile,y:renderer.h/2+(target.y-renderer.camera.y)*tile}}

// Plain observations for ordinary play; numerical biology stays behind Inspect.
export function resourceSummary(sim,target){
 if(target.kind==='water'&&iceAmount(sim.world.environment,target.i)>.003){const covered=surfaceIceCovered(sim.world.environment,target.i),support=covered&&iceSupports(sim.world,sim.player(),target.x,target.y);return{identity:covered?'Frozen water':'Fractured ice',features:[covered?'Ice seals the water below':'Open water between broken ice',covered?support?'Supports your current body':'Too weak for your current body':'Swimming anatomy is needed away from the bank'],consequence:covered?'More weight or thaw can break the sheet. Water and surface food are inaccessible through intact ice.':'The opening exposes water and air. A non-swimmer must stay near supporting ground.'}}

 if(target.cave!==undefined){const p=sim.world.subsurface?.passages.get(target.cave);return{identity:p?.origin===CAVES.policy?'Natural cave opening':'Excavated entrance',features:['Connected underground passage','Only bodies that fit can pass'],consequence:'Approach the opening, then Interact to enter or return to the surface. You need digging anatomy only to excavate new passages.'}}
 if(target.kind==='seed-patch'){const o=sim.discovery.seedObservations?.find(o=>o.id===target.id);return{identity:o?.status==='established'?'New growth observed':o?.status==='gone'?'Previously observed plant is gone':'Seeds left here',features:[o?seedPatchDescription(o):'Observation unavailable'],consequence:'Read the patch to update your field observation. Journal keeps your last observed outcome.'}}

 if(target.kind==='plant'&&sim.dispersal.seedReserve[target.food]){
  const v=sim.dispersal.tissueView(target.food,target.i),fruit=target.food==='bramble',rich=v.genome.traits.seedAllocation>.2;
  const reproductive=botanicalPlantView(sim.dispersal,target.food,target.i);const identity=fruit?(rich?'Seed-rich fruiting plant':'Fruiting plant'):v.genome.traits.coatAllocation>.25?'Thick-coated pod plant':v.genome.traits.coatAllocation<.25?'Thin-coated pod plant':'Seed-bearing pod plant';
  const food=v.flesh>0?(plantPreference(sim.player(),target.food)>0?(fruit?'Edible fruit':'Edible pods'):'Your mouth cannot eat this '+(fruit?'fruit':'pod')):'No edible tissue left';
  return {identity,features:[food,v.seed>0?'Viable seeds':'No viable seeds left',...(v.coat>1e-8?['Tough seed coat']:[]),...(reproductive?.receptive?['Receptive flowers']:[]),...(reproductive?.pollen?['Pollen available']:[]),...(reproductive?.developing?['Seeds developing']:[])],consequence:'Eating '+(fruit?'the fruit':'the pods')+' may disperse seeds. Crushing prevents those seeds from growing.'};
 }
 return {identity:target.kind==='plant'?(target.food==='rotcap'?'Decomposer fungus':'Growing plant'):target.kind==='water'?'Water source':target.kind==='corpse'?'Organic remains':target.kind==='trace'?'World trail':target.label,features:[],consequence:''};
}
export function resourceInspection(sim,target){
 const v=resourceTargetView(sim,target);if(!v?.live)return null;
 const summary=resourceSummary(sim,target);const sections=[{title:'Observation',text:target.kind==='plant'?[summary.identity,...summary.features,summary.consequence].filter(Boolean).join('\n'):v.description}];
 if(target.kind==='seed-patch'){const o=sim.discovery.seedObservations?.find(o=>o.id===target.id);if(o)sections.push({title:'Recorded seed journey',text:`Carrier #${o.carrierId} · deposit ${o.depositId??'not recorded in this older save'}\nLast observed day ${o.observedDay} · ${o.genomeId||'Inherited genotype not yet observed'}\nThis record updates through observation, not remote monitoring.`});}
 if(target.kind==='plant'){
  const tissue=sim.dispersal.seedReserve[target.food]?sim.dispersal.tissueView(target.food,target.i):null,r=plantResourceView(sim.world,target.food,target.i);
  if(tissue?.coat>0){const cost=plantHandling(sim.player(),sim.dispersal.previewMeal(sim.player(),target.food,target.i,sim.foraging.profile(target.food).bite,'crop')||{coat:Math.min(tissue.coat,sim.foraging.profile(target.food).bite*tissue.coat/tissue.total)});sections.push({title:'Protective tissue and handling',text:`Existing seed coat requires handling effort. Current mouth: ${cost.energyCost.toFixed(3)} energy per crop bite. Crushing/pecking anatomy reduces effort; kernels still require a seed-cracking mouth. These effort units are provisional.`})}
  if(tissue)sections.push({title:'Tissues and seed viability',text:`Edible tissue ${tissue.flesh.toFixed(3)} · intact viable propagules ${tissue.seed.toFixed(3)} · coat ${tissue.coat.toFixed(3)}
These are current standing tissue amounts; dispersal also requires survival and a suitable place to grow.`});
  if(r)sections.push({title:'Growth resources',text:`${r.state}
Stored energy ${r.energy.toFixed(3)} · soil water ${r.water.toFixed(3)} · minerals ${r.minerals.toFixed(3)}`});
  const reproductive=botanicalPlantView(sim.dispersal,target.food,target.i);if(reproductive)sections.push({title:'Botanical reproduction',text:`${reproductive.receptive?'Funded receptive ovules present':'No receptive ovules'} · ${reproductive.pollen?'Pollen-producing structures active':'No available pollen'} · ${reproductive.developing?'Fertilized seeds developing':'No developing embryos'}
${reproductive.selfCompatible?'Inherited self-compatible reception':'Inherited self-incompatibility'}
Delivery, recognition, fertilization, seed development and germination are separate stages. Compatibility follows inherited signal/receptor and self-identity loci, never resource labels.
`+Object.entries(reproductive.reproductiveGenome).filter(([k])=>k!=='schema').map(([k,v])=>k+': '+v.join(', ')).join('\n')});
  const genome=tissue?.genome||sim.dispersal.genomeAt(target.food,target.i);
  if(genome)sections.push({title:'Inherited genetics',text:`${genome.id}
${genome.reproduction}
`+Object.entries(genome.traits).map(([k,n])=>`${k}: ${n}`).join('\n')});
 }
 return {label:target.label,sections};
}
