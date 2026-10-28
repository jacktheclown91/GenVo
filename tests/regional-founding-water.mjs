// regional-founding-templates/2: a newly entered region founds land templates only
// at sites with open fresh water reachable on foot within the founding range.
// /1 worlds keep their recorded founding. Crossings are real, through manual
// control at an approved frontier; founding is never staged.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {REGIONAL_FOUNDING,foundRegionalPopulations,validateRegionalFounding} from '../src/ecology/regional-founding.js';
import {FOUNDING_RANGE} from '../src/ecology/resource-founding.js';
import {foundingTemplate} from '../src/organisms/founding-templates.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

assert.equal(REGIONAL_FOUNDING.policy,'regional-founding-templates/2');assert.equal(REGIONAL_FOUNDING.legacy,'regional-founding-templates/1');
const world=(seed,regionalFounding)=>new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true,regionalFounding});
assert.equal(world('FOUNDING-WATER-DEFAULT',true).regionalFoundingRules,REGIONAL_FOUNDING.legacy,'default worlds keep /1');
assert.equal(world('FOUNDING-WATER-NAMED',REGIONAL_FOUNDING.policy).regionalFoundingRules,REGIONAL_FOUNDING.policy);
assert.equal(new Simulation('FOUNDING-WATER-FRESH',{player:true,regionalFounding:REGIONAL_FOUNDING.policy}).regionalFoundingRules,undefined,'only planetary worlds found regions');
assert.throws(()=>world('FOUNDING-WATER-BAD','regional-founding-templates/9'),/Unknown regional founding policy/);
const east=sim=>{sim.setPlayerAutonomy(false);const a=sim.player();
  for(let y=8.5;y<118.5;y++){a.x=sim.world.n;a.y=y;sim.rebuildSpatial();const s=planetaryTravelAvailability(sim);if(!s.enabled||s.direction!=='east')continue;const trip=crossPlanetaryBorder(sim);if(trip.ok)return trip.simulation}
  throw Error('No approved east crossing');};
const founders=sim=>sim.animals.filter(a=>a.alive&&a.foundingOrigin);
const waterCells=w=>{let n=0;for(let i=0;i<w.len;i++)if(w.water[i])n++;return n};
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'founding-water'}));

// A waterless neighbour: /1 founds drinkers that later die of thirst; /2 founds no land template there.
const dry1=east(world('POPULATION-FOUNDING-PROBE-1',REGIONAL_FOUNDING.legacy)),dry2=east(world('POPULATION-FOUNDING-PROBE-1',REGIONAL_FOUNDING.policy));
assert.equal(waterCells(dry2.world),0,'the neighbour region really has no open water');
assert.ok(founders(dry1).length>0,'/1 founds the waterless region');assert.equal(dry1.regionalFounding.policy,REGIONAL_FOUNDING.legacy);
assert.equal(dry2.regionalFounding.policy,REGIONAL_FOUNDING.policy);assert.equal(dry2.regionalFoundingRules,REGIONAL_FOUNDING.policy,'new regions inherit the world rule');
assert.equal(founders(dry2).length,0,'/2 founds no land template without drinking water');assert.deepEqual(dry2.regionalFounding.introduced,[]);
assert.ok(dry2.regionalFounding.absent.some(r=>r.reason==='no drinking water within reach'),'the receipt records why');

// A watered neighbour: founders exist, and every founding site has water within the founding range.
const wet=east(world('PLANET-B0-A',REGIONAL_FOUNDING.policy));
assert.ok(waterCells(wet.world)>0);assert.ok(wet.regionalFounding.introduced.length>0,'a watered region is founded');
let landGroups=0;
for(const group of wet.regionalFounding.introduced){const aquatic=foundingTemplate(group.template).habitat.medium==='water';if(!aquatic)landGroups++;
  for(const site of group.sites){const i=wet.world.idx(site.x,site.y);
    if(aquatic)assert.equal(wet.world.water[i],1,'water templates are founded in water');
    else assert.ok(wet.world.waterDistance[i]<=FOUNDING_RANGE,'land founding site '+JSON.stringify(site)+' reaches drinking water')}}
assert.ok(landGroups>0,'land templates are founded beside water');
for(const a of founders(wet))assert.equal(a.foundingOrigin.policy,REGIONAL_FOUNDING.policy);
validateRegionalFounding(wet,'128,0');

// Saves keep the rule, receipt and provenance; founders cannot disagree with their receipt.
const saved=snap(wet),back=restoreSimulationSnapshot(structuredClone(saved));
assert.equal(back.regionalFoundingRules,REGIONAL_FOUNDING.policy);assert.ok(isDeepStrictEqual(back.regionalFounding,wet.regionalFounding));
const mixed=structuredClone(saved);mixed.animals.find(a=>a.foundingOrigin).foundingOrigin.policy=REGIONAL_FOUNDING.legacy;
assert.throws(()=>validateRegionalFounding(restoreSimulationSnapshot(mixed),'128,0'),/disagrees/);

// Deterministic: the same first entry founds the same region identically.
assert.ok(isDeepStrictEqual(east(world('PLANET-B0-A',REGIONAL_FOUNDING.policy)).regionalFounding,wet.regionalFounding));
assert.throws(()=>foundRegionalPopulations(new Simulation('FOUNDING-WATER-EMPTY',{player:false,bootstrap:false,worldGenerator:'planetary/1'}),{region:'0,0',policy:'nope'}),/Unknown regional founding policy/);
console.log(`Regional founding /2 PASS: waterless neighbour founds no land template (vs ${founders(dry1).length} under /1), watered neighbour founds ${founders(wet).length} with every site within ${FOUNDING_RANGE} steps of drinking water, rule inherited, saved, validated and deterministic`);
