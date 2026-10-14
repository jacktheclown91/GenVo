import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function dryPoint(sim){for(let y=12;y<116;y+=3)for(let x=12;x<116;x+=3){const i=sim.world.idx(x,y);if(!sim.world.water[i]&&!sim.world.isDrinkable(x,y))return{x:x+.5,y:y+.5}}throw new Error('no dry point')}

{
  const sim=new Simulation('GENVO8-WEATHER-OUTSIDE',{player:true}),p=sim.player(),spot=dryPoint(sim);p.x=spot.x;p.y=spot.y;sim.endOpeningGrace('test');sim.climate={temp:.31,rain:.70};sim.rebuildSpatial();
  const rng=sim.rng.state,energy=p.energy;
  for(let i=0;i<10;i++)sim.exposure.phasePlayer();
  const snap=sim.exposure.snapshot(p);
  assert.ok(snap.wetness>.35,'cold rain accumulates wetness while exposed');
  assert.ok(snap.coldStress>.2,'wet cold creates readable thermal pressure');
  assert.ok(p.energy<energy,'cold exposure has a modest real energy cost');
  assert.equal(sim.rng.state,rng,'weather exposure consumes no simulation RNG');
  assert.ok(snap.label==='Soaked and chilled'||snap.label==='Soaked'||snap.label==='Chilled'||snap.label==='Cold rain');
  assert.ok(sim.exposure.routePenalty(12,p)>0,'rough weather discourages long optional forage routes');
}

{
  const sim=new Simulation('GENVO8-WEATHER-SHELTER',{player:true}),p=sim.player(),spot=dryPoint(sim);p.x=spot.x;p.y=spot.y;sim.endOpeningGrace('test');sim.climate={temp:.31,rain:.70};
  const state=sim.exposure.state(p);state.wetness=.82;state.strain=.72;
  sim.shelter.shelters.push({id:88,ownerId:p.id,x:p.x+.3,y:p.y,integrity:100,foodStore:0,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
  const energy=p.energy;sim.exposure.phasePlayer();const snap=sim.exposure.snapshot(p);
  assert.equal(snap.sheltered,true);assert.ok(snap.wetness<.82,'shelter actively dries a wet GenVo8');assert.ok(snap.stress<.72,'shelter relieves accumulated weather strain');
  assert.ok(energy-p.energy<.04,'shelter sharply reduces weather energy cost');
  assert.equal(sim.exposure.routePenalty(12,p),0,'sheltered animals are not penalized for a route before leaving');
}

{
  const sim=new Simulation('GENVO8-WEATHER-HOT',{player:true}),p=sim.player(),spot=dryPoint(sim);p.x=spot.x;p.y=spot.y;sim.endOpeningGrace('test');sim.climate={temp:.86,rain:.10};const water=p.hydration;
  for(let i=0;i<8;i++)sim.exposure.phasePlayer();const snap=sim.exposure.snapshot(p);
  assert.ok(snap.heatStress>.4);assert.ok(p.hydration<water,'hot exposure increases hydration pressure');assert.match(snap.label,/Hot|Heat/);
}

{
  const headless=new Simulation('GENVO8-WEATHER-HEADLESS',{player:false});const rng=headless.rng.state;for(let i=0;i<CFG.lifeStride*12;i++)headless.update(null);assert.equal(headless.exposure.states.size,0,'player:false ecology never creates exposure state');assert.notEqual(headless.rng.state,rng,'normal ecology still advances its canonical RNG');
}

console.log('weather exposure + shelter protection checks: PASS');
