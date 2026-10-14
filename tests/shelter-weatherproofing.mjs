import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function prep(seed){
  const sim=new Simulation(seed,{player:true}),p=sim.player();sim.endOpeningGrace('test');
  p.x=54.5;p.y=54.5;p.age=SPECIES.genvo.maturity+5;p.energy=SPECIES.genvo.maxEnergy*.92;p.hydration=SPECIES.genvo.maxHydration*.9;
  for(let yy=52;yy<=57;yy++)for(let xx=52;xx<=57;xx++){const i=sim.world.idx(xx,yy);if(!sim.world.water[i]){sim.world.plants.sunmoss[i]=.8;sim.world.plants.bramble[i]=.55;sim.world.plants.marshroot[i]=.4}}
  const sh={id:76,ownerId:p.id,x:p.x,y:p.y,integrity:96,weatherSeal:.34,foodStore:4,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);sim.rebuildSpatial();return{sim,p,sh};
}

{
  const {sim,p,sh}=prep('GENVO8-SHELTER-SEAL');const rng=sim.rng.state,material=sim.shelter.materialAvailable(p.x,p.y,2.2),before=sim.shelter.weatherQuality(sh);
  assert.equal(sim.shelter.weatherLabel(sh),'Weathered');
  const r=sim.shelter.constructOrRepair(p);assert.equal(r.ok,true);assert.equal(r.action,'reinforce','sound but weathered shelter uses N to reinforce instead of wasting structural repair');
  assert.ok(sh.weatherSeal>.34,'reinforcement raises weather seal');assert.ok(sim.shelter.weatherQuality(sh)>before,'reinforcement improves real shelter weather quality');assert.ok(sim.shelter.materialAvailable(p.x,p.y,2.2)<material,'reinforcement consumes real nearby plant biomass');assert.equal(sim.rng.state,rng,'reinforcement consumes no simulation RNG');
}

{
  const {sim,p,sh}=prep('GENVO8-SHELTER-LEAK');sh.integrity=58;sh.weatherSeal=.16;sim.climate={temp:.30,rain:.75};const state=sim.exposure.state(p);state.wetness=.82;state.strain=.70;
  const snap=sim.exposure.snapshot(p);assert.equal(snap.sheltered,true);assert.equal(snap.shelterLeaking,true);assert.equal(snap.label,'Shelter leaking');assert.equal(snap.urgent,true,'a badly weathered shelter does not suppress urgent weather pressure');
  assert.ok(sim.shelter.thermalMultiplier(p)>.6,'poor shelter buffers thermal stress much less than an intact maintained shelter');
}

{
  const {sim,sh}=prep('GENVO8-SHELTER-WEAR');sh.weatherSeal=.88;sim.climate={temp:.30,rain:.82};const before=sh.weatherSeal;for(let i=0;i<8;i++)sim.shelter.advanceDay();assert.ok(sh.weatherSeal<before-.08,'sustained rough weather visibly wears weatherproofing across a season');
}

{
  const sim=new Simulation('GENVO8-SHELTER-WEATHERPROOF-HEADLESS',{player:false});for(let i=0;i<180;i++)sim.update(null);assert.equal(sim.shelter.shelters.length,0,'player-off benchmark creates no hidden weatherproofed shelters');
}

console.log('shelter weatherproofing + storm maintenance checks: PASS');
