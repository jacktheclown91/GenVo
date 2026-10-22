import {SPECIES,GENE_KEYS} from '../organisms/species.js';
import {WILD_START,wildBranch} from '../organisms/wild-bodies.js';
import {FOUNDER_PLACEMENTS} from './body-inheritance.js';
import {makePlan,serializePlan,deserializePlan,validatePlan} from './body-plan.js';
import {FOUNDING_TEMPLATES,foundingTemplatePlan} from '../organisms/founding-templates.js';
import {reproductiveCompatibility} from '../reproduction/reproductive-compatibility.js';
import {canHunt} from '../ecology/functional-diet.js';
import {isWaterDweller} from './aquatic.js';
import {regionKey} from '../world/planet-regions.js';

// Living evolutionary library (evolved-lineage-library/1, creator direction
// 2026-10-21). It RECOGNIZES naturally evolved, reproductively successful and
// anatomically stable configurations; it never changes mutation, selection,
// reproduction or mortality. A configuration is the exact inherited body plan
// on a life-history carrier. A configuration qualifies only from recorded
// evidence in a real population, sustained for a period:
//   - enough living carriers of it;
//   - members whose two parents both carried it (it breeds true);
//   - members born with it that reached maturity (viable offspring);
//   - it is not an authored founding template or starting body.
// Stability is therefore observed, not imposed: mutation and recombination
// continue at their ordinary rates, and a configuration that is outcompeted
// simply stops qualifying. Entries are reusable starting configurations for
// FUTURE worlds; a world never founds its own regions from its own entries.
export const EVOLVED_LIBRARY=Object.freeze({policy:'evolved-lineage-library/1',schema:1,
 minLiving:8,minTrueBreeding:3,minMatureOffspring:3,sustainDays:30,compatibilitySamples:24,
 // Founding tolerance around the habitat the population actually occupied.
 temperatureMargin:.08,moistureMargin:.12});
export const libraryEnabled=sim=>sim?.evolvedLibraryRules===EVOLVED_LIBRARY.policy;
export const configurationKey=a=>a?.bodyPlan?.id?a.species+'|'+a.bodyPlan.id:null;

let authored=null;
// Every authored founding body (templates and variants) and starting body.
export function authoredConfigurations(){
 if(authored)return authored;authored=new Set();
 for(const t of FOUNDING_TEMPLATES){authored.add(t.carrier+'|'+foundingTemplatePlan(t).id);for(const v of t.variants)for(const part of v.parts)authored.add(t.carrier+'|'+foundingTemplatePlan(t,t.placements.map(p=>p.parent==='root'&&p.socket===v.socket?{...p,partId:part}:p)).id)}
 for(const [species,placements] of Object.entries(WILD_START))authored.add(species+'|'+makePlan(placements).id);
 authored.add('genvo|'+makePlan(FOUNDER_PLACEMENTS).id);
 return authored;
}
const hash=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')};
export const entryIdFor=key=>'ev-'+hash(key)+'-'+hash('genvo|'+key);
const round=(v,d=4)=>+Number(v).toFixed(d);
const stats=values=>{const n=values.length,mean=values.reduce((s,v)=>s+v,0)/Math.max(1,n),sd=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/Math.max(1,n));return{mean:round(mean),sd:round(sd)}};

// Founding lineage carried through births: which founding templates or
// library entries this animal descends from. Real recorded provenance only.
export function inheritFoundingLineage(child,parents){
 const set=new Set();
 for(const p of parents||[]){if(p?.foundingOrigin?.template)set.add(p.foundingOrigin.template);for(const t of p?.foundingLineage||[])set.add(t)}
 if(set.size)child.foundingLineage=[...set].sort();
}
function evidence(sim,key,cohort){
 const planId=key.slice(key.indexOf('|')+1),species=cohort[0].species,maturity=SPECIES[species]?.maturity??Infinity;
 const trueBreeding=cohort.filter(a=>{const ps=a.bodyInheritance?.parents;return a.parentIds?.length===2&&ps?.length===2&&ps.every(p=>p.bodyId===planId)}).length;
 const matureOffspring=cohort.filter(a=>a.parentIds?.length===2&&a.age>=maturity).length;
 return{living:cohort.length,trueBreeding,matureOffspring,generations:[...new Set(cohort.map(a=>a.generation))].sort((a,b)=>a-b)};
}
const qualifies=e=>e.living>=EVOLVED_LIBRARY.minLiving&&e.trueBreeding>=EVOLVED_LIBRARY.minTrueBreeding&&e.matureOffspring>=EVOLVED_LIBRARY.minMatureOffspring;

// Builds the record for a cohort. Exported for storage tests; registration
// itself happens only through observeEvolvedConfigurations' evidence gate.
export function entryFromCohort(sim,cohort,{firstDay=sim.day,since=sim.day}={}){const key=configurationKey(cohort[0]);return buildEntry(sim,key,cohort,{firstDay,since},evidence(sim,key,cohort))}
function buildEntry(sim,key,cohort,state,ev){
 const planId=key.slice(key.indexOf('|')+1),species=cohort[0].species,w=sim.world;
 const representative=[...cohort].sort((a,b)=>b.generation-a.generation||a.id-b.id)[0];
 // The recorded mutation or recombination that produced this configuration,
 // where a living member still carries the event.
 const emerged=[...cohort].filter(a=>a.bodyVariation?.finalBody===planId&&(a.bodyVariation.accepted&&a.bodyVariation.attempted||(a.bodyInheritance?.parents||[]).every(p=>p.bodyId!==planId)))
  .sort((a,b)=>(a.birthDay??0)-(b.birthDay??0)||a.id-b.id)[0];
 const genes=Object.fromEntries(GENE_KEYS.map(k=>[k,stats(cohort.map(a=>a.genes?.[k]).filter(Number.isFinite))]));
 const sorted=[...cohort].sort((a,b)=>a.id-b.id),females=sorted.filter(a=>a.sex==='F'),males=sorted.filter(a=>a.sex==='M');let pairs=0,compatible=0;
 for(let i=0;i<females.length&&pairs<EVOLVED_LIBRARY.compatibilitySamples;i++)for(let j=0;j<males.length&&pairs<EVOLVED_LIBRARY.compatibilitySamples;j++){pairs++;if(reproductiveCompatibility(females[i],males[j]).enabled)compatible++}
 let temp=0,moist=0,wet=0;for(const a of cohort){const i=w.idx(a.x,a.y);temp+=w.temperature[i];moist+=w.moisture[i];if(w.water[i])wet++}
 const n=cohort.length,medium=isWaterDweller(representative)?'water':wet/n>.5?'water':'land';
 const label=species==='genvo'?'Evolved GenVo':wildBranch(representative).label;
 return{schema:EVOLVED_LIBRARY.schema,policy:EVOLVED_LIBRARY.policy,id:entryIdFor(key),configuration:key,provenance:'natural-evolution',
  carrier:species,label,plan:serializePlan(representative.bodyPlan),
  representative:{id:representative.id,generation:representative.generation,sex:representative.sex,parentIds:[...(representative.parentIds||[])],grandparentIds:[...(representative.grandparentIds||[])],birthDay:representative.birthDay??null,foundingLineage:[...(representative.foundingLineage||[])]},
  emergence:emerged?{animalId:emerged.id,birthDay:emerged.birthDay??null,generation:emerged.generation,operator:emerged.bodyVariation?.attempted&&emerged.bodyVariation?.accepted?emerged.bodyVariation.operator:'recombination',fromBody:emerged.bodyVariation?.from??null,parentBodies:(emerged.bodyInheritance?.parents||[]).map(p=>p.bodyId)}:null,
  traits:{genes,hunter:canHunt(representative),medium},
  diversity:{living:n,females:females.length,males:males.length,generations:ev.generations,distinctPigmentGenomes:new Set(cohort.map(a=>JSON.stringify(a.pigmentGenome??null))).size},
  compatibility:{sampledPairs:pairs,compatiblePairs:compatible},
  habitat:{region:w.regionOrigin?regionKey(w.regionOrigin):'local',meanTemperature:round(temp/n),meanMoisture:round(moist/n),waterShare:round(wet/n),medium},
  history:{seed:sim.seed,projection:w.planet?.descriptor?.projection??null,firstObservedDay:state.firstDay,qualifyingSinceDay:state.since,registeredDay:sim.day,registeredTick:sim.tickCount,evidence:{living:ev.living,trueBreeding:ev.trueBreeding,matureOffspring:ev.matureOffspring}}};
}
// Daily observation for one regional Simulation. Records only; returns the
// entries registered today.
export function observeEvolvedConfigurations(sim){
 if(!libraryEnabled(sim))return[];
 const cohorts=new Map(),excluded=authoredConfigurations();
 for(const a of sim.animals){if(!a.alive)continue;const key=configurationKey(a);if(!key||excluded.has(key))continue;if(!cohorts.has(key))cohorts.set(key,[]);cohorts.get(key).push(a)}
 const states=sim.lineageObservations instanceof Map?sim.lineageObservations:(sim.lineageObservations=new Map());
 const registered=new Set((sim.evolvedRegistrations||[]).map(e=>e.configuration)),out=[];
 for(const [key,state] of states)if(!cohorts.has(key)&&!state.registered)states.delete(key);
 for(const [key,cohort] of cohorts){
  let state=states.get(key);if(!state){state={firstDay:sim.day,since:null,registered:registered.has(key)};states.set(key,state)}
  if(state.registered)continue;
  const ev=evidence(sim,key,cohort);
  if(!qualifies(ev)){state.since=null;continue}
  state.since??=sim.day;
  if(sim.day-state.since<EVOLVED_LIBRARY.sustainDays)continue;
  const entry=buildEntry(sim,key,cohort,state,ev);
  sim.evolvedRegistrations=[...(sim.evolvedRegistrations||[]),entry];state.registered=true;out.push(entry);
 }
 return out;
}
export function validateEvolvedEntry(e){
 if(e?.schema!==EVOLVED_LIBRARY.schema||e.policy!==EVOLVED_LIBRARY.policy||e.provenance!=='natural-evolution'||typeof e.configuration!=='string'||e.id!==entryIdFor(e.configuration)||!SPECIES[e.carrier]||!e.configuration.startsWith(e.carrier+'|'))throw Error('Invalid evolved library entry.');
 const plan=deserializePlan(e.plan);if(!validatePlan(plan).ok||e.configuration!==e.carrier+'|'+plan.id)throw Error('Evolved library entry body is invalid.');
 if(authoredConfigurations().has(e.configuration))throw Error('An authored body cannot be a naturally evolved library entry.');
 const h=e.habitat;if(!h||!['land','water'].includes(h.medium)||![h.meanTemperature,h.meanMoisture].every(Number.isFinite))throw Error('Evolved library entry lacks its observed habitat.');
 return e;
}
export function validateEvolvedLibraryState(sim){
 if(sim.evolvedLibraryRules!==undefined&&!libraryEnabled(sim))throw Error('Unknown evolved library policy.');
 if(!libraryEnabled(sim)){if(sim.evolvedRegistrations?.length||sim.foundingLibrary?.length)throw Error('Evolved library records without their policy.');return}
 const ids=new Set();for(const e of [...(sim.evolvedRegistrations||[])]){validateEvolvedEntry(e);if(ids.has(e.id))throw Error('Duplicate evolved registration.');ids.add(e.id)}
 const lib=new Set();for(const e of sim.foundingLibrary||[]){validateEvolvedEntry(e);if(lib.has(e.id))throw Error('Duplicate founding library entry.');lib.add(e.id)}
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Founding-template view of a library entry for regional founding in a NEW
// world. The body is the naturally evolved plan (it is not subject to the
// authored founding depth/part limits: it already evolved).
export function libraryFoundingTemplates(sim){
 return(sim.foundingLibrary||[]).map(e=>{const h=e.habitat,T=EVOLVED_LIBRARY.temperatureMargin,M=EVOLVED_LIBRARY.moistureMargin;
  return Object.freeze({id:'evolved:'+e.id,label:e.label,carrier:e.carrier,library:e.id,plan:deserializePlan(e.plan),placements:[],variants:[],group:[3,8],
   predator:!!e.traits?.hunter&&!!SPECIES[e.carrier]?.hunter,
   habitat:{medium:h.medium,temp:[clamp(h.meanTemperature-T,0,1),clamp(h.meanTemperature+T,0,1)],moisture:[clamp(h.meanMoisture-M,0,1),clamp(h.meanMoisture+M,0,1)]}})});
}
