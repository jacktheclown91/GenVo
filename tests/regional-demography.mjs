import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {validatePlanetAnimalOwnership} from '../src/world/planet-regions.js';
import {REGIONAL_DEMOGRAPHY} from '../src/world/planetary-demography.js';
import {POPULATION_MODE,remoteBiologicalDebt} from '../src/world/planetary-offscreen-biology.js';
import {foundRegionalPopulations} from '../src/ecology/regional-founding.js';

const CANONICAL='canonical-ticks/1';
const checkpoint=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'demography'}));
function cross(sim,x){
 const p=sim.player();p.energy=SPECIES[p.species].maxEnergy*.94;p.hydration=SPECIES[p.species].maxHydration*.95;
 for(let y=8.5;y<118.5;y++){p.x=x;p.y=y;sim.rebuildSpatial();if(planetaryTravelAvailability(sim).enabled){const r=crossPlanetaryBorder(sim);assert.equal(r.ok,true,r.message);return r.simulation}}
 throw Error('no traversable border');
}
const session=(sim,key)=>sim.planetaryTravel.sessions.find(s=>s.key===key);
const ids=s=>new Set(s.snapshot.animals.map(a=>a.id));
const run=(sim,ticks)=>{for(let i=0;i<ticks;i++)sim.update()};

// 1. The population model keeps canonical reproduction: real parents, inherited bodies.
{
 const s=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:{x:128,y:0}});
 foundRegionalPopulations(s,{region:'128,0'});s.paused=false;
 const founders=new Set(s.animals.map(a=>a.id)),plantsBefore=s.world.plants.sunmoss.reduce((a,b)=>a+b,0);
 for(let d=0;d<30;d++)run({update:()=>s.update(null,{externalPlayerControl:true,populationModel:true})},CFG.dayTicks);
 const born=s.animals.filter(a=>!founders.has(a.id));
 assert.ok(born.length>0,'population-model regions reproduce through the canonical conception and birth authorities');
 for(const c of born){assert.equal(c.parentIds.length,2);assert.ok(c.generation>=2);assert.ok(c.bodyPlan?.nodes?.length);assert.equal(c.foundingOrigin,undefined,'offspring are births, not founders')}
 assert.notEqual(s.world.plants.sunmoss.reduce((a,b)=>a+b,0),plantsBefore,'foraging and vegetation act on the real stocks');
 assert.equal(s.day,31);assert.equal(s.tickCount,30*CFG.dayTicks);
}

// 2. Near/far assignment through real crossings.
let sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
assert.equal(sim.regionalDemographyRules,REGIONAL_DEMOGRAPHY.policy);
sim=cross(sim,125.2);run(sim,CFG.lifeStride*3);
assert.equal(session(sim,'0,0').biologicalMode,CANONICAL,'an adjacent region keeps full individual simulation');
sim=cross(sim,125.2);
assert.deepEqual(sim.world.regionOrigin,{x:256,y:0});
const home=session(sim,'0,0'),east=session(sim,'128,0');
assert.equal(home.biologicalMode,POPULATION_MODE,'two regions away uses the population model');
assert.equal(east.biologicalMode,CANONICAL);
const homeIds=ids(home),homeLedger=structuredClone(home.biologicalLedger);
const founding=structuredClone(east.snapshot.core.regionalFounding);

// 3. Far regions keep level with the player's clock; seams keep exchanging between canonical neighbors.
run(sim,CFG.dayTicks);
const far=session(sim,'0,0');
assert.ok(remoteBiologicalDebt(sim,far)<=CFG.lifeStride,'far region stays within one life stride of the player');
assert.ok(far.biologicalLedger.ticks>(homeLedger?.ticks||0),'the same ledger continues across the mode change');
assert.equal(far.biologicalLedger.lastTick,far.snapshot.core.tickCount);
for(const id of homeIds)if(!ids(far).has(id))assert.ok(far.biologicalLedger.deaths>(homeLedger?.deaths||0),'an individual leaves only by recorded death');
assert.ok(sim.planetaryTravel.seamLedger?.lastTick>=sim.tickCount-CFG.dayTicks,'paired seams still reconcile with a far population-model region present');
validatePlanetAnimalOwnership(sim.animals,sim.planetaryTravel);

// 4. Exact save/restore and identical continuation.
const saved=checkpoint(sim),restored=restoreSimulationSnapshot(structuredClone(saved));
assert.equal(session(restored,'0,0').biologicalMode,POPULATION_MODE);
assert.deepEqual(checkpoint(restored),saved);
run(sim,CFG.lifeStride*2);run(restored,CFG.lifeStride*2);
assert.deepEqual(checkpoint(restored),checkpoint(sim),'restored population-model world continues identically');

// 5. Returning promotes the far region back to full simulation without regenerating it.
const beforeReturn=ids(session(sim,'0,0'));
sim=cross(sim,2.6);
assert.deepEqual(sim.world.regionOrigin,{x:128,y:0});
const back=session(sim,'0,0');
assert.equal(back.biologicalMode,CANONICAL,'a region within one step returns to individual simulation');
assert.equal(remoteBiologicalDebt(sim,back),0,'promotion runs the genuine elapsed ticks first');
for(const id of ids(back))assert.ok(beforeReturn.has(id)||back.snapshot.animals.find(a=>a.id===id).parentIds.length===2,'every individual is a survivor or a real birth');
assert.deepEqual(sim.regionalFounding,founding,'a visited region is never re-founded');
run(sim,CFG.lifeStride*2);

// 6. Historical worlds keep all visited regions canonical, and a forged mode is rejected.
const legacy=structuredClone(saved);delete legacy.core.regionalDemographyRules;
assert.throws(()=>restoreSimulationSnapshot(structuredClone(legacy)),/Population-model region without its recorded policy/);
for(const s of legacy.core.planetaryTravel.sessions)if(s.biologicalMode===POPULATION_MODE)s.biologicalMode=CANONICAL;
const old=restoreSimulationSnapshot(legacy);assert.equal(old.regionalDemographyRules,undefined);
run(old,CFG.lifeStride);assert.ok(old.planetaryTravel.sessions.every(s=>s.biologicalMode===CANONICAL));
console.log('Regional demography PASS: canonical births under the population model, near/far assignment by real crossings, level far clocks with one continuous ledger, live seams, exact save/continuation, promotion on return without re-founding, and historical policy.');
