// regional-founding-templates/3 (morphology S6): water is judged by each body's own
// physiology. A land site qualifies with drinking water within reach, or when the
// water its diet supplies (eaten only up to its food need) covers what its body
// loses there. Where water exists /3 founds exactly what /2 founds; in a waterless
// region no current template's diet covers its loss (0.3-2.4%), so none is founded
// and the receipt says why. Recorded /2 and /1 worlds keep their founding.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {REGIONAL_FOUNDING,regionalFoundingPolicy,validateRegionalFounding} from '../src/ecology/regional-founding.js';
import {foundingWaterBudget,dailyWaterNeed,dailyDietWater} from '../src/ecology/water-founding.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

assert.equal(REGIONAL_FOUNDING.policy,'regional-founding-templates/3');
for(const p of [REGIONAL_FOUNDING.policy,REGIONAL_FOUNDING.drinking,REGIONAL_FOUNDING.legacy])assert.ok(regionalFoundingPolicy(p));
const full={player:true,worldGenerator:'planetary/1',regionalFrontier:true,dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,winterWater:true,tissueEnergy:true,perennialRegrowth:true,bodySize:true,aridPhysiology:true,climateWater:true};
const east=sim=>{sim.setPlayerAutonomy(false);const a=sim.player();
 for(let y=8.5;y<118.5;y++){a.x=sim.world.n;a.y=y;sim.rebuildSpatial();const s=planetaryTravelAvailability(sim);if(!s.enabled||s.direction!=='east')continue;const trip=crossPlanetaryBorder(sim);if(trip.ok)return trip.simulation}
 throw Error('No approved east crossing')};
const landFounders=sim=>sim.animals.filter(a=>a.alive&&a.foundingOrigin);

// 1. Where drinking water exists, /3 founds exactly what /2 founds and records each group's water basis.
{
 const two=east(new Simulation('PLANET-B0-A',{...full,regionalFounding:REGIONAL_FOUNDING.drinking})),three=east(new Simulation('PLANET-B0-A',{...full,regionalFounding:REGIONAL_FOUNDING.policy}));
 const groups=s=>s.regionalFounding.introduced.map(g=>[g.template,g.ids]);
 assert.ok(three.regionalFounding.introduced.length>0);assert.deepEqual(groups(three),groups(two),'same founders as /2 where water exists');
 assert.equal(three.regionalFounding.policy,REGIONAL_FOUNDING.policy);
 for(const g of three.regionalFounding.introduced)if(g.water)assert.ok(g.water.drinkingSites>0||g.water.dietRatio>=1,'every land group has a measured water basis');
 // Receipts validate and survive saves.
 validateRegionalFounding(three,three.regionalFounding.region);
 const back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(three,{savedAt:'fixed',reason:'founding-physiology'})));
 assert.deepEqual(back.regionalFounding,three.regionalFounding);
}
// 2. A waterless region: every land template's diet falls far short of its loss, so none is founded,
// and the receipt names the physiological reason. Nothing is created to make founding succeed.
{
 const dry=east(new Simulation('POPULATION-FOUNDING-PROBE-1',{...full,regionalFounding:REGIONAL_FOUNDING.policy}));
 let water=0;for(let i=0;i<dry.world.len;i++)if(dry.world.water[i])water++;assert.equal(water,0,'the region really has no open water');
 assert.equal(landFounders(dry).length,0,'no current anatomy can live there without drinking');
 assert.ok(dry.regionalFounding.absent.some(a=>a.reason==='neither drinking water within reach nor enough water in its diet'));
 // The measured budget for a real body at a real site: diet water is a small share of its loss.
 const body=dry.spawnAnimal('genvo',64,64),point={x:64.5,y:64.5},b=foundingWaterBudget(dry,body,point);
 assert.equal(b.drinking,false);assert.ok(b.need>0&&b.diet>=0&&b.ratio<.1,`diet covers ${(b.ratio*100).toFixed(1)}% of loss`);
 assert.equal(b.sustainable,false);assert.equal(b.need,dailyWaterNeed(dry,body,point));assert.equal(b.diet,dailyDietWater(dry,body,point));
 dry.animals.splice(dry.animals.indexOf(body),1);
}
// 3. New games found with /3; recorded worlds keep their policy.
assert.equal(new Simulation('FOUNDING-PHYS-NEW',{...full,regionalFounding:REGIONAL_FOUNDING.policy}).regionalFoundingRules,REGIONAL_FOUNDING.policy);
assert.equal(new Simulation('FOUNDING-PHYS-OLD',{...full,regionalFounding:REGIONAL_FOUNDING.drinking}).regionalFoundingRules,REGIONAL_FOUNDING.drinking);
console.log('Regional founding /3 PASS: identical founders to /2 where water exists with recorded water basis, waterless region founds no land template because no current diet covers its loss, receipts validate and save, recorded policies kept');
