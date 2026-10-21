import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {mouthOf,canHunt} from '../src/ecology/functional-diet.js';
import {FOUNDING_TEMPLATES,FOUNDING_EXCLUDED_TAGS,FOUNDING_MAX_DEPTH,developmentalDepth,foundingTemplate} from '../src/organisms/founding-templates.js';
import {REGIONAL_FOUNDING,foundRegionalPopulations,validateRegionalFounding} from '../src/ecology/regional-founding.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {SPECIES} from '../src/organisms/species.js';

// Catalog: ~30 bodies, every one a valid, bounded, non-culminating anatomy.
assert.ok(FOUNDING_TEMPLATES.length>=28&&FOUNDING_TEMPLATES.length<=34,'approximately thirty founding templates');
assert.equal(new Set(FOUNDING_TEMPLATES.map(t=>t.id)).size,FOUNDING_TEMPLATES.length);
for(const t of FOUNDING_TEMPLATES){
 for(const p of t.placements){assert.ok(developmentalDepth(p.partId)<=FOUNDING_MAX_DEPTH,t.id);assert.ok(!PARTS[p.partId].tags.some(x=>FOUNDING_EXCLUDED_TAGS.includes(x)),t.id+' introduces '+p.partId)}
 assert.equal(!!t.predator,['tearing-jaw','gape-mouth','crushing-jaw'].includes(t.placements.find(p=>p.socket==='mouth').partId),t.id+': hunting follows its jaw, and hunters use hunter life history');
 if(t.predator)assert.ok(SPECIES[t.carrier].hunter,t.id);
}
assert.ok(new Set(FOUNDING_TEMPLATES.map(t=>t.habitat.medium)).size===3,'land, shore and freshwater templates');

// Found three genuinely different regions through the real constructor.
function emptyRegion(origin){const s=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin});return s}
const regions=[{x:128,y:0},{x:-25600,y:12800},{x:12800,y:0}].map(origin=>{
 const s=emptyRegion(origin),key=origin.x+','+origin.y,receipt=foundRegionalPopulations(s,{region:key});
 return{s,key,receipt};
});
const seen=new Set();
for(const {s,key,receipt} of regions){
 assert.equal(receipt.policy,REGIONAL_FOUNDING.policy);
 assert.ok(receipt.introduced.length>=2,key+' founds several viable groups');
 for(const g of receipt.introduced){
  seen.add(g.template);
  assert.ok(g.supportable>=2&&g.ids.length===g.supportable,'every introduced group is a breeding group');
  assert.ok(g.renewableFood>=g.needPerFounder*g.supportable-1e-9,g.template+' is supported by renewable food its anatomy reaches');
  const members=s.animals.filter(a=>g.ids.includes(a.id));
  assert.equal(members.length,g.ids.length);
  assert.ok(new Set(members.map(a=>a.sex)).size===2,g.template+' has both sexes');
  assert.ok(new Set(members.map(a=>JSON.stringify(a.genes))).size===members.length,'founders are genetically varied');
  const t=foundingTemplate(g.template);
  for(const a of members){
   assert.equal(a.species,t.carrier);assert.equal(a.generation,1);assert.deepEqual(a.parentIds,[]);
   assert.deepEqual(a.foundingOrigin,{schema:1,policy:REGIONAL_FOUNDING.policy,template:t.id,region:key,day:s.day,tick:s.tickCount});
   assert.equal(mouthOf(a),t.placements.find(p=>p.socket==='mouth').partId,'mounted anatomy is the template body');
   assert.equal(canHunt(a),!!t.predator);
   assert.equal(!!s.world.water[s.world.idx(a.x,a.y)],t.habitat.medium==='water','placed in its medium');
  }
 }
 for(const g of receipt.introduced.filter(g=>foundingTemplate(g.template).predator)){
  const prey=receipt.introduced.filter(p=>!foundingTemplate(p.template).predator);assert.ok(prey.length,'predators are only founded with prey present');
 }
 validateRegionalFounding(s,key);
 assert.throws(()=>foundRegionalPopulations(s,{region:key}),/never regenerated/);
 // Deterministic: an unexplored continent is founded identically when first reached.
 const again=emptyRegion(s.world.regionOrigin);foundRegionalPopulations(again,{region:key});
 assert.deepEqual(again.regionalFounding,s.regionalFounding);
 assert.deepEqual(again.animals.map(a=>[a.id,a.x,a.y,a.bodyPlan.id]),s.animals.map(a=>[a.id,a.x,a.y,a.bodyPlan.id]));
 // Exact save/restore with validated provenance; a forged founder is rejected.
 const snap=structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'founding'})),back=restoreSimulationSnapshot(structuredClone(snap));
 assert.deepEqual(back.regionalFounding,s.regionalFounding);assert.equal(back.regionalFoundingRules,REGIONAL_FOUNDING.policy);
 const forged=structuredClone(snap);forged.animals.find(a=>a.foundingOrigin&&a.alive).foundingOrigin.template='frost-stalker';
 assert.throws(()=>restoreSimulationSnapshot(forged),/founding receipt|provenance/);
}
assert.ok(seen.size>=6,'regions draw on different templates: '+[...seen].join(','));

// One day of ordinary simulation runs over a founded region without special cases.
{const s=regions[0].s;for(let i=0;i<CFG.dayTicks;i++)s.update();assert.ok(s.animals.some(a=>a.alive))}

// Real crossing uses the policy; a historical save without it keeps classic founding.
const home=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'}),p=home.player();
assert.equal(home.regionalFoundingRules,REGIONAL_FOUNDING.policy);
assert.equal(home.regionalFounding,undefined,'the home valley keeps its established founding');
p.energy=SPECIES[p.species].maxEnergy*.94;p.hydration=SPECIES[p.species].maxHydration*.95;
let ok=null;for(let y=8.5;y<118.5;y++){p.x=125.2;p.y=y;home.rebuildSpatial();if(planetaryTravelAvailability(home).enabled){ok=true;break}}
assert.ok(ok);
const legacyCore=structuredClone(createSimulationSnapshot(home,{savedAt:'fixed',reason:'legacy'}));delete legacyCore.core.regionalFoundingRules;
const crossed=crossPlanetaryBorder(home);assert.equal(crossed.ok,true,crossed.message);
const east=crossed.simulation;
assert.equal(east.regionalFounding?.region,'128,0');assert.equal(east.regionalFoundingRules,REGIONAL_FOUNDING.policy);
assert.ok(east.animals.some(a=>a.foundingOrigin),'new region is founded from templates');
assert.ok(east.animals.filter(a=>a.foundingOrigin).every(a=>a.parentIds.length===0&&a.generation===1),'no fabricated ancestry');
const legacy=restoreSimulationSnapshot(legacyCore);assert.equal(legacy.regionalFoundingRules,undefined);
const lp=legacy.player();lp.x=p.x;lp.y=p.y;legacy.rebuildSpatial();
const old=crossPlanetaryBorder(legacy);assert.equal(old.ok,true,old.message);
assert.equal(old.simulation.regionalFounding,undefined);assert.ok(!old.simulation.animals.some(a=>a.foundingOrigin),'historical worlds keep CFG.initial founding');
console.log('Regional founding PASS: '+FOUNDING_TEMPLATES.length+' bounded templates, '+seen.size+' founded across three regions, food-supported breeding groups, prey-before-predator, provenance, determinism, save validation, crossing and historical policy.');
