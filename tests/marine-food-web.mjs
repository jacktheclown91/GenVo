import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {RNG} from '../src/core/rng.js';
import {salinityAt} from '../src/world/environment.js';
import {MARINE_FOOD,MARINE_KEYS,advanceMarineFood} from '../src/ecology/marine-food.js';
import {FRESHWATER_FOOD,advanceFreshwater,freshwaterPreference} from '../src/ecology/freshwater-food.js';
import {foundRegionalPopulations} from '../src/ecology/regional-founding.js';
import {FOUNDING_TEMPLATES,foundingTemplate,foundingTemplatePlan} from '../src/organisms/founding-templates.js';
import {mutatePlan} from '../src/lineage/body-inheritance.js';
import {hasSaltGland} from '../src/lineage/aquatic.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// marine-food-web/1 (creator direction 2026-10-21): ocean regions are habitats.
const COAST={x:-57600,y:-18176},OPEN_SEA={x:-51200,y:55936},INLAND={x:128,y:0};
const region=origin=>new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin});
const sea=(w,i)=>w.water[i]&&salinityAt(w,i)>.1;
const total=(w,k)=>w.marineFood[k].reduce((a,b)=>a+b,0);

// New planetary worlds record the policy; marine biomass exists only in seawater.
const open=region(OPEN_SEA),inland=region(INLAND),coast=region(COAST);
for(const s of [open,inland,coast])assert.equal(s.marineFoodRules,MARINE_FOOD.policy);
for(const k of MARINE_KEYS)assert.ok(total(open.world,k)>0,'open sea holds '+k);
for(const k of MARINE_KEYS)assert.equal(total(inland.world,k),0,'no marine '+k+' inland');
{const w=coast.world;for(let i=0;i<w.len;i++)if(!sea(w,i))for(const k of MARINE_KEYS)assert.equal(w.marineFood[k][i],0,'marine biomass only in seawater')}
// Producers are funded by the shared energy and mineral accounts.
for(const k of ['phytoplankton','kelp'])assert.ok(open.world.organicResources.energy[k] instanceof Float64Array);
// Classic worlds keep their freshwater-only ecology.
const classic=new Simulation('GENVO8-MARINE',{player:false,bootstrap:false});
assert.equal(classic.marineFoodRules,undefined);assert.equal(classic.world.marineFood,undefined);

// The web turns over: the real daily aquatic pair (freshwater step recycles
// carrion and litter in every water cell, then the marine step) sustains every
// tier for years without additions; consumers only grow by eating.
{const w=region(COAST).world,mins={},maxs={};
 for(let d=0;d<900;d++){advanceFreshwater(w);advanceMarineFood(w);for(const k of MARINE_KEYS){const t=total(w,k);mins[k]=Math.min(mins[k]??t,t);maxs[k]=Math.max(maxs[k]??t,t)}}
 for(const k of MARINE_KEYS){assert.ok(mins[k]>0,k+' persists');assert.ok(w.marineFood[k].every(v=>Number.isFinite(v)&&v>=0))}
 assert.ok(maxs.zooplankton>2*mins.zooplankton&&maxs.phytoplankton>2*mins.phytoplankton,'grazers and plankton cycle rather than sitting at fixed stocks');
 assert.ok(w.organicResources.totals.aquaticGrowth>0&&w.organicResources.totals.aquaticWaste>0,'growth is paid for and losses return as litter');
}
// Marine life dies back in fresh water, as freshwater life does in salt.
{const w=inland.world,i=w.water.findIndex((v,j)=>v&&salinityAt(w,j)<=.05&&w.isPlayable(j%w.n+.5,(j/w.n|0)+.5));assert.ok(i>=0);
 w.marineFood.zooplankton[i]=.4;advanceMarineFood(w);assert.ok(w.marineFood.zooplankton[i]<.4,'marine zooplankton declines in fresh water')}

// Mouths reach the marine web through the shared feeding authority.
const plan=id=>({bodyPlan:foundingTemplatePlan(foundingTemplate(id))});
assert.ok(freshwaterPreference(plan('plankton-sifter'),'phytoplankton')>0);
assert.ok(freshwaterPreference(plan('kelp-browser'),'kelp')>0);
assert.ok(freshwaterPreference(plan('shell-cruncher'),'shellfish')>0);
assert.ok(freshwaterPreference(plan('sea-gaper'),'forage-fish')>0);
assert.ok(FOUNDING_TEMPLATES.filter(t=>t.habitat.salinity==='marine').every(t=>t.placements.some(p=>p.partId==='salt-gland')),'every marine founder carries a salt gland');

// Founding: marine templates settle only in seawater, freshwater ones never there.
const receipt=foundRegionalPopulations(coast,{region:COAST.x+','+COAST.y});
const marineGroups=receipt.introduced.filter(g=>foundingTemplate(g.template).habitat.salinity==='marine');
assert.ok(marineGroups.length>=2,'the coast founds marine groups: '+receipt.introduced.map(g=>g.template));
assert.ok(marineGroups.some(g=>!foundingTemplate(g.template).predator)&&marineGroups.some(g=>foundingTemplate(g.template).predator),'marine grazers and marine hunters');
for(const g of receipt.introduced){const t=foundingTemplate(g.template);if(t.habitat.medium!=='water')continue;
 for(const a of coast.animals.filter(a=>g.ids.includes(a.id))){const i=coast.world.idx(a.x,a.y);assert.equal(salinityAt(coast.world,i)>.1,t.habitat.salinity==='marine',g.template+' founded in matching water')}}

// Salt glands keep gills watered in seawater; gills alone do not.
const sifters=coast.animals.filter(a=>marineGroups.find(g=>g.template==='plankton-sifter')?.ids.includes(a.id));
assert.ok(sifters.length>=4);
const glandless=foundingTemplatePlan(foundingTemplate('plankton-sifter'),foundingTemplate('plankton-sifter').placements.filter(p=>p.partId!=='salt-gland'));
const [withGland,without]=[sifters.slice(0,2),sifters.slice(2,4)];
for(const a of without){a.bodyPlan=glandless;assert.equal(hasSaltGland(a),false)}
for(const a of sifters)a.hydration=CFG.lifeStride; // low but alive
for(let i=0;i<CFG.lifeStride;i++)coast.update();
const mean=as=>as.filter(a=>a.alive&&sea(coast.world,coast.world.idx(a.x,a.y))).map(a=>a.hydration);
const g=mean(withGland),n=mean(without);assert.ok(g.length&&n.length);
assert.ok(Math.min(...g)>Math.max(...n),'gland-bearing gills refill in seawater: '+g+' vs '+n);

// The salt gland evolves from gills only where the policy is recorded.
{const base=foundingTemplatePlan(foundingTemplate('plankton-sifter'),foundingTemplate('plankton-sifter').placements.filter(p=>p.partId!=='salt-gland'));
 const gained=marine=>{let n=0;for(let s=0;s<600;s++){const p=mutatePlan(new RNG('gland-'+s),base,{marine});if(p.nodes.some(x=>x.partId==='salt-gland'))n++}return n};
 assert.equal(gained(false),0,'no salt gland without the marine policy');assert.ok(gained(true)>0,'salt glands are reachable from gills')}

// Exact save/restore and identical continuation.
for(let d=0;d<2;d++)for(let i=0;i<CFG.dayTicks;i++)coast.update();
const snap=structuredClone(createSimulationSnapshot(coast,{savedAt:'t',reason:'t'})),back=restoreSimulationSnapshot(structuredClone(snap));
assert.equal(back.marineFoodRules,MARINE_FOOD.policy);
assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),snap);
for(let i=0;i<CFG.lifeStride;i++){coast.update();back.update()}
assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),structuredClone(createSimulationSnapshot(coast,{savedAt:'t',reason:'t'})));

// Historical saves without the policy restore without marine fields; a save
// whose fields and policy disagree is refused.
{const s=structuredClone(createSimulationSnapshot(classic,{savedAt:'t',reason:'t'}));const old=restoreSimulationSnapshot(s);assert.equal(old.marineFoodRules,undefined);assert.equal(old.world.marineFood,undefined)}
{const s=structuredClone(snap);delete s.core.marineFoodRules;assert.throws(()=>restoreSimulationSnapshot(s),/disagree/)}
console.log('Marine food web PASS: seawater-only biomass funded by shared accounts, cycling tiers over 900 days, die-back in fresh water, mouth access, '+marineGroups.map(g=>g.template+':'+g.supportable).join(' ')+' founded only in seawater, salt-gland hydration, policy-gated evolution, exact save/continuation and historical policy.');
