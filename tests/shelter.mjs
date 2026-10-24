import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function prep(seed){
  const sim=new Simulation(seed,{player:true}),p=sim.player();
  p.x=52.5;p.y=52.5;p.age=SPECIES.genvo.maturity+6;p.energy=SPECIES.genvo.maxEnergy*.9;p.hydration=SPECIES.genvo.maxHydration*.9;p.health=100;
  const state=sim.territory.ensure(p);state.cells.clear();
  const cell={key:'6,6',cx:6,cy:6,x:52,y:52,visits:8,lastTick:sim.tickCount};state.cells.set(cell.key,cell);sim.territory.recompute(p,state);state.established=true;state.home={x:52.5,y:52.5};state.radius=7;state.totalFamiliarity=8;
  for(let yy=50;yy<=55;yy++)for(let xx=50;xx<=55;xx++){const i=sim.world.idx(xx,yy);if(!sim.world.water[i]){sim.world.plants.sunmoss[i]=.75;sim.world.plants.bramble[i]=.5;sim.world.plants.thistlepod[i]=.4}}
  sim.rebuildSpatial();return{sim,p};
}

{
  const {sim,p}=prep('GENVO8-SHELTER-BUILD');
  const before=sim.shelter.materialAvailable(p.x,p.y,2.2),result=sim.shelter.constructOrRepair(p);
  assert.equal(result.ok,true,'founder can build inside established familiar core');
  assert.equal(result.action,'build');
  assert.equal(sim.shelter.shelters.length,1);
  assert.ok(sim.shelter.materialAvailable(p.x,p.y,2.2)<before,'construction consumes real local plant biomass');
  assert.ok(p.energy<SPECIES.genvo.maxEnergy*.9,'construction costs animal energy');
}

{
  const {sim,p}=prep('GENVO8-SHELTER-CACHE');sim.shelter.constructOrRepair(p);const sh=sim.shelter.shelters[0];
  const before=sh.foodStore,result=sim.shelter.cacheNearbyFood(p);
  assert.equal(result.ok,true,'nearby edible biomass can be cached');
  assert.ok(sh.foodStore>before,'cache stores gathered food energy');
  assert.ok(result.kind,'cache reports the gathered food source');
}

{
  const {sim,p}=prep('GENVO8-SHELTER-FAMILY');sim.shelter.constructOrRepair(p);const sh=sim.shelter.shelters[0];sh.foodStore=10;
  const mate=sim.spawnAnimal('genvo',p.x+.2,p.y+.2);mate.sex=p.sex==='F'?'M':'F';mate.age=SPECIES.genvo.maturity+4;
  const child=sim.spawnAnimal('genvo',p.x+.15,p.y+.1,[p,mate]);sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);child.age=2;child.energy=SPECIES.genvo.maxEnergy*.2;
  const before=child.energy,storeBefore=sh.foodStore;sim.shelter.phaseSupport();
  assert.ok(child.energy>before,'dependent lineage member draws energy from the shelter cache');
  assert.ok(sh.foodStore<storeBefore,'shelter support consumes stored food');
  assert.ok(sim.shelter.protectionFactor(child)<.5,'dependent inside intact shelter gets substantial predation protection');
  assert.ok(sim.shelter.thermalMultiplier(child)<.5,'family shelter substantially buffers thermal stress when inside');
}

{
  const {sim,p}=prep('GENVO8-SHELTER-REPAIR');sim.shelter.constructOrRepair(p);const sh=sim.shelter.shelters[0];sh.integrity=61;
  const result=sim.shelter.constructOrRepair(p);assert.equal(result.action,'repair');assert.ok(sh.integrity>61,'repair consumes biomass and restores integrity');
  const before=sh.integrity;sim.climate={rain:.8,temp:.3};sim.shelter.advanceDay();assert.ok(sh.integrity<before,'weather slowly wears shelter integrity');
}

{
  const {sim,p}=prep('GENVO8-SHELTER-INTRUDER');sim.shelter.constructOrRepair(p);const sh=sim.shelter.shelters[0];
  const stranger=sim.spawnAnimal('genvo',sh.x+1,sh.y+.5);stranger.age=SPECIES.genvo.maturity+4;sim.rebuildSpatial();
  assert.equal(sim.shelter.intruderFor(sh,p)?.id,stranger.id,'unrelated GenVo8 near family shelter is readable as a shelter intruder');
}

{
  const sim=new Simulation('GENVO8-SHELTER-PLAYER-OFF',{player:false});for(let i=0;i<CFG.dayTicks*16;i++)sim.update(null);
  assert.equal(sim.shelter.shelters.length,0,'player-off baseline creates no hidden founder shelters');
}

{
  const {sim,p}=prep('GENVO8-SHELTER-MOUSE-INTERACT');sim.shelter.constructOrRepair(p);const sh=sim.shelter.shelters[0];
  const target={kind:'shelter',id:sh.id,x:sh.x,y:sh.y,label:'Family shelter'};
  const opts1=sim.interactionOptions(target);
  assert.ok(opts1.some(o=>o.id==='maintain'&&o.enabled),'clicked shelter exposes maintain');
  assert.ok(opts1.some(o=>o.id==='cache-food'&&o.enabled),'clicked shelter exposes Store food when nearby food exists');
  const cacheRes=sim.playerInteract(target,'cache-food');
  assert.equal(cacheRes.ok,true,'clicking Store food on shelter caches nearby biomass');
  assert.ok(sh.foodStore>0,'shelter foodStore increased');
  p.energy=SPECIES.genvo.maxEnergy*.45;
  const opts2=sim.interactionOptions(target);
  assert.ok(opts2.some(o=>o.id==='eat-cache'&&o.enabled),'clicked stocked shelter exposes Eat stored food when hungry');
  const eBefore=p.energy,storeBefore=sh.foodStore;
  const eatRes=sim.playerInteract(target,'eat-cache');
  assert.equal(eatRes.ok,true,'clicking Eat stored food consumes shelter cache');
  assert.ok(p.energy>eBefore&&sh.foodStore<storeBefore,'player energy increased and shelter cache decreased');
  // When local ground plants are depleted (as in winter), plain E / Shift+E eats from nearby stocked shelter
  for(const k of Object.keys(sim.world.plants))sim.world.plants[k].fill(0);
  sh.foodStore=6;p.energy=SPECIES.genvo.maxEnergy*.5;
  const eBefore2=p.energy;
  const directEat=sim.playerEat();
  assert.equal(directEat.ok,true,'playerEat falls back to nearby stocked shelter when ground plants are depleted');
  assert.ok(p.energy>eBefore2&&sh.foodStore<6,'playerEat drew energy from shelter cache');
}

console.log('shelter + habitat modification checks: PASS');
