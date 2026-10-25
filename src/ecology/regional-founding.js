import {RNG} from '../core/rng.js';
import {salinityAt} from '../world/environment.js';
import {isWildSpecies} from '../organisms/wild-bodies.js';
import {FOUNDING_TEMPLATES,FOUNDING_TEMPLATES_VERSION,FOUNDING_TEMPLATE_VERSIONS,foundingTemplate,foundingTemplatePlan} from '../organisms/founding-templates.js';
import {libraryFoundingTemplates} from '../lineage/evolved-library.js';
import {serializePlan,deserializePlan} from '../lineage/body-plan.js';
import {applyLineageTarget} from '../lineage/reproduction-bridge.js';
import {canOccupy} from '../lineage/lifestyle.js';
import {isWaterDweller} from '../lineage/aquatic.js';
import {thermalSiteDemand} from './thermal-refuge.js';
import {renewableFood,founderDailyNeed,FOUNDING_RANGE} from './resource-founding.js';

// Regional evolutionary founding (creator direction 2026-10-21). A newly
// entered planetary region receives small, genetically varied founding groups
// built from authored templates that its REAL habitat can hold. Nothing here
// creates food, ancestry or history: founders are generation-one introductions
// with a recorded receipt, placed on occupiable cells, and kept only where the
// renewable food their own anatomy can reach covers their daily need (the
// existing resource-informed founding measure, plus the body's actual thermal
// load at its sites). Templates are ranked by that same support ratio, so a
// better-insulated grazer outranks an otherwise identical one in a cold region.
// Predators are ranked and founded after their prey, so prey biomass actually
// present decides whether they persist. Once founded, ordinary Simulation
// rules own every individual. Previously visited regions are restored from
// their archives and never pass through here again.
export const REGIONAL_FOUNDING=Object.freeze({
 policy:'regional-founding-templates/1',
 maxPrimary:6,maxScavengers:2,maxPredators:2,maxPerMouth:2,
 minSuitableCells:96,probeSites:6,siteSamples:24,placementTries:40,shoreRange:3,jitter:.35
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const inRange=(v,[lo,hi])=>v>=lo&&v<=hi;
const mouthPart=t=>t.plan?t.plan.nodes.find(n=>n.socket==='mouth')?.partId:t.placements.find(p=>p.socket==='mouth').partId;
const templatePlan=t=>t.plan||foundingTemplatePlan(t);
// Authored templates plus, in worlds created with a frozen copy of the living
// evolutionary library, its naturally evolved configurations.
const catalogFor=sim=>[...FOUNDING_TEMPLATES,...libraryFoundingTemplates(sim)];
const templateIn=(sim,id)=>foundingTemplate(id)||libraryFoundingTemplates(sim).find(t=>t.id===id)||null;
const role=t=>t.predator?'predator':t.carrier==='mirelick'?'scavenger':'primary';
const cellPoint=(w,i)=>({x:i%w.n+.5,y:Math.floor(i/w.n)+.5});

function shoreMask(w,range){
 const near=new Uint8Array(w.len);
 for(let i=0;i<w.len;i++){if(!w.water[i])continue;const x=i%w.n,y=Math.floor(i/w.n);
  for(let dy=-range;dy<=range;dy++)for(let dx=-range;dx<=range;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<w.n&&ny<w.n)near[ny*w.n+nx]=1}}
 return near;
}
// Pure observation of the region's physical fields. No randomness, no writes.
export function regionalHabitatProfile(world){
 const w=world,shore=shoreMask(w,REGIONAL_FOUNDING.shoreRange);let land=0,water=0,temp=0,moist=0;
 for(let i=0;i<w.len;i++){if(w.water[i]){water++;continue}land++;temp+=w.temperature[i];moist+=w.moisture[i]}
 return{world:w,shore,landCells:land,waterCells:water,meanTemperature:land?temp/land:0,meanMoisture:land?moist/land:0,catalog2:true};
}
function suitableCells(profile,template){
 const w=profile.world,h=template.habitat,cells=[];
 for(let i=0;i<w.len;i++){
  const wet=!!w.water[i];
  if(h.medium==='water'?!wet:wet)continue;
  if(h.medium==='shore'&&!profile.shore[i])continue;
  if(!wet&&(!inRange(w.temperature[i],h.temp)||!inRange(w.moisture[i],h.moisture)))continue;
  // Water habitats are fresh unless the template is marine (founding-templates/2).
  if(wet&&profile.catalog2&&(h.salinity==='marine'?salinityAt(w,i)<=.1:salinityAt(w,i)>.05))continue;
  cells.push(i);
 }
 return cells;
}
function bodyFor(a,plan){
 if(isWildSpecies(a.species))a.bodyPlan=structuredClone(plan);
 else if(!applyLineageTarget(a,plan))throw Error('Founding anatomy could not be applied to '+a.species+'.');
}
// A detached measuring body built by the ordinary constructor. The region's
// RNG, identity counter and population are restored exactly afterwards.
function withProbe(sim,template,measure){
 const state=sim.rng.state,nextId=sim.nextId,count=sim.animals.length,ecology=sim.regionalEcology;
 let probe;sim.regionalEcology=null;
 try{probe=sim.spawnAnimal(template.carrier,64,64)}finally{sim.regionalEcology=ecology;sim.animals.length=count;sim.rng.state=state;sim.nextId=nextId}
 bodyFor(probe,templatePlan(template));return measure(probe);
}
// Daily support at a point: renewable food the body's own mouth/medium reaches
// over the daily need of its basal physiology plus its thermal load there.
function supportAt(sim,a,point,baseNeed=founderDailyNeed(a.species,a)){
 const at={...a,x:point.x,y:point.y},need=baseNeed*(1+Math.max(0,thermalSiteDemand(sim,a,point.x,point.y).load));
 return{food:renewableFood(sim,at),need};
}
function rankRole(sim,profile,rng,kind,absent){
 const rows=[];
 for(const t of catalogFor(sim)){
  if(role(t)!==kind)continue;
  const cells=suitableCells(profile,t),total=t.habitat.medium==='water'?profile.waterCells:profile.landCells;
  if(cells.length<REGIONAL_FOUNDING.minSuitableCells||!total){absent.push({template:t.id,reason:'insufficient suitable habitat'});continue}
  const samples=[];for(let k=0;k<REGIONAL_FOUNDING.siteSamples;k++)samples.push(cellPoint(profile.world,cells[Math.floor(rng.next()*cells.length)]));
  const measured=withProbe(sim,t,probe=>{
   const baseNeed=founderDailyNeed(probe.species,probe);
   return samples.map(p=>({...p,...supportAt(sim,probe,p,baseNeed)}));
  });
  measured.sort((a,b)=>b.food/b.need-a.food/a.need||a.y-b.y||a.x-b.x);
  const best=measured.slice(0,REGIONAL_FOUNDING.probeSites),ratio=best.reduce((s,m)=>s+m.food/m.need,0)/best.length;
  const share=cells.length/total;
  if(!(ratio>0)){absent.push({template:t.id,reason:'no renewable food this anatomy can reach'});continue}
  rows.push({template:t,cells,share,best,score:Math.sqrt(share)*ratio*(1+rng.range(0,REGIONAL_FOUNDING.jitter))});
 }
 return rows.sort((a,b)=>b.score-a.score||a.template.id.localeCompare(b.template.id));
}
function pickSites(row){
 const sites=[];
 for(const s of row.best){if(sites.every(o=>Math.hypot(o.x-s.x,o.y-s.y)>=FOUNDING_RANGE))sites.push({x:s.x,y:s.y});if(sites.length===2)break}
 return sites;
}
function variantPlan(template,rng){
 if(template.plan)return template.plan;
 let placements=template.placements;
 for(const v of template.variants)if(rng.chance(v.chance)){const part=rng.pick(v.parts);placements=placements.map(p=>p.parent==='root'&&p.socket===v.socket?{...p,partId:part}:p)}
 return foundingTemplatePlan(template,placements);
}
function place(sim,a,site,rng,waterRequired){
 const w=sim.world;
 for(let k=0;k<REGIONAL_FOUNDING.placementTries;k++){
  const x=clamp(site.x+rng.range(-6,6),3,w.n-3),y=clamp(site.y+rng.range(-6,6),3,w.n-3);
  if(waterRequired&&!w.water[w.idx(x,y)])continue;
  if(canOccupy(a,w,x,y)){a.x=x;a.y=y;return true}
 }
 return false;
}
const balanceSexes=group=>{if(group.length>=2&&group.every(a=>a.sex===group[0].sex))group[group.length-1].sex=group[0].sex==='F'?'M':'F'};
function foundGroup(sim,row,rng,origin){
 const t=row.template,sites=pickSites(row);if(!sites.length)return{absent:'no measured founding site'};
 const want=Math.round(t.group[0]+(t.group[1]-t.group[0])*clamp(row.share*4,0,1)),members=[];
 for(let k=0;k<want;k++){
  const site=sites[k%sites.length],a=sim.spawnAnimal(t.carrier,site.x,site.y);bodyFor(a,variantPlan(t,rng));
  if(!place(sim,a,site,rng,isWaterDweller(a))){sim.animals.splice(sim.animals.indexOf(a),1);continue}
  a.foundingOrigin={schema:1,policy:REGIONAL_FOUNDING.policy,template:t.id,region:origin,day:sim.day,tick:sim.tickCount,...(t.library?{library:t.library}:{})};
  members.push(a);
 }
 balanceSexes(members);
 if(!members.length)return{absent:'no occupiable founding position'};
 // Shared renewable food at the distinct sites against each founder's own need.
 const support=sites.map(c=>supportAt(sim,members[0],c)),shared=support.reduce((s,m)=>s+m.food,0);
 const need=members.reduce((s,a)=>s+supportAt(sim,a,a).need,0)/members.length;
 let supportable=need>0?Math.min(members.length,Math.floor(shared/need)):0;if(supportable<2)supportable=0;
 const scored=members.map(a=>({a,food:renewableFood(sim,a)})).sort((x,y)=>y.food-x.food||x.a.id-y.a.id),kept=scored.slice(0,supportable).map(x=>x.a);
 balanceSexes(kept);
 const removed=new Set(scored.slice(supportable).map(x=>x.a));if(removed.size)sim.animals=sim.animals.filter(a=>!removed.has(a));
 const summary={template:t.id,carrier:t.carrier,configured:members.length,supportable,renewableFood:+shared.toFixed(3),needPerFounder:+need.toFixed(3),sites:sites.map(s=>({x:+s.x.toFixed(2),y:+s.y.toFixed(2)})),ids:kept.map(a=>a.id)};
 if(!kept.length)return{absent:'renewable food cannot support a breeding group',summary};
 sim.spawnCenters[t.carrier]=[...(sim.spawnCenters[t.carrier]||[]),...sites];
 return{summary};
}
// Founds a newly entered region exactly once. The simulation's own RNG keeps
// supplying genes, pigments and mate preferences through spawnAnimal; template
// ranking and placement use a separate regional stream, so an unexplored
// continent is founded identically whenever it is first reached.
export function foundRegionalPopulations(sim,{region}){
 if(sim.regionalFounding)throw Error('Region '+region+' already has a founding receipt; visited ecosystems are never regenerated.');
 if(sim.animals.some(a=>!a.player))throw Error('Regional founding requires an unpopulated region.');
 const rng=new RNG(sim.seed+'|regional-founding|'+region),profile=regionalHabitatProfile(sim.world),absent=[],introduced=[];
 const limits={primary:REGIONAL_FOUNDING.maxPrimary,scavenger:REGIONAL_FOUNDING.maxScavengers,predator:REGIONAL_FOUNDING.maxPredators};
 for(const kind of ['primary','scavenger','predator']){
  let count=0;
  for(const r of rankRole(sim,profile,rng,kind,absent)){
   if(count>=limits[kind]){absent.push({template:r.template.id,reason:'regional '+kind+' founding slots filled'});continue}
   if(introduced.filter(g=>mouthPart(templateIn(sim,g.template))===mouthPart(r.template)).length>=REGIONAL_FOUNDING.maxPerMouth){absent.push({template:r.template.id,reason:'feeding niche already founded twice'});continue}
   const out=foundGroup(sim,r,rng,region);
   if(out.absent)absent.push({template:r.template.id,reason:out.absent,...(out.summary?{measured:out.summary}:{})});else{introduced.push(out.summary);count++}
  }
 }
 sim.regionalFounding={schema:1,policy:REGIONAL_FOUNDING.policy,catalog:FOUNDING_TEMPLATES_VERSION,...(sim.foundingLibrary?.length?{library:sim.foundingLibrary.map(e=>e.id)}:{}),source:'deterministic-regional-founding',region,day:sim.day,tick:sim.tickCount,
  profile:{landCells:profile.landCells,waterCells:profile.waterCells,meanTemperature:+profile.meanTemperature.toFixed(4),meanMoisture:+profile.meanMoisture.toFixed(4)},
  introduced,absent};
 // Trimmed founders were registered at birth; rebuild residency from survivors.
 sim.regionalEcology?.resetPageResidency?.();
 sim.foundingReport=Object.fromEntries(introduced.map(g=>[g.template,{configured:g.configured,supportable:g.supportable,renewableFood:g.renewableFood,needPerFounder:g.needPerFounder}]));
 return sim.regionalFounding;
}
// Founders may later travel with a family; each is checked against the receipt
// of the region that introduced it, when this simulation owns that region.
export function validateRegionalFounding(sim,region){
 const r=sim.regionalFounding;
 for(const a of sim.animals){const o=a.foundingOrigin;if(o!==undefined&&(o?.schema!==1||o.policy!==REGIONAL_FOUNDING.policy||!templateIn(sim,o.template)||typeof o.region!=='string'||a.parentIds?.length))throw Error('Invalid regional founder provenance.')}
 const marked=sim.animals.filter(a=>a.foundingOrigin?.region===region);
 if(r===undefined){if(marked.length)throw Error('Founded creatures lack a regional founding receipt.');return}
 if(r.region!==region)throw Error('Regional founding receipt belongs to another region.');
 if(r?.schema!==1||r.policy!==REGIONAL_FOUNDING.policy||!FOUNDING_TEMPLATE_VERSIONS.includes(r.catalog)||
  !Number.isSafeInteger(r.day)||r.day<1||!Number.isSafeInteger(r.tick)||r.tick<0||!Array.isArray(r.introduced)||!Array.isArray(r.absent))
  throw Error('Invalid regional founding receipt.');
 const ids=new Map();
 for(const g of r.introduced){
  const t=templateIn(sim,g?.template);
  if(!t||g.carrier!==t.carrier||!Array.isArray(g.ids)||g.ids.length!==g.supportable||g.supportable<2||g.supportable>g.configured)throw Error('Invalid regional founding group.');
  for(const id of g.ids){if(!Number.isSafeInteger(id)||ids.has(id))throw Error('Duplicate regional founder identity.');ids.set(id,g.template)}
 }
 for(const a of marked)if(ids.get(a.id)!==a.foundingOrigin.template)throw Error('Founder disagrees with its regional founding receipt.');
}
