import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {pressureSummaryText} from '../src/lineage/pressure.js';

{
  const sim=new Simulation('GENVO8-PRESSURE-COLD',{player:true}),p=sim.player();
  p.genes.climate=.92;p.genes.metabolism=1.08;
  sim.world.temperature[sim.world.idx(p.x,p.y)]=.25;
  const thermal=sim.pressure.evaluate(p).find(x=>x.kind==='cold'||x.kind==='heat');
  assert.ok(thermal,'cold/heat pressure is derived from local temperature');
  assert.equal(thermal.label,'Cold');
  assert.equal(thermal.tone,'help');
  assert.match(thermal.effect,/help/);
}

{
  const sim=new Simulation('GENVO8-PRESSURE-PREDATOR',{player:true}),p=sim.player();
  sim.day=sim.openingGraceUntilDay+2;p.genes.motion=1.09;p.genes.senses=1.07;p.genes.temperament=.94;
  const hunter=sim.animals.find(a=>a.species==='needlejaw');hunter.x=p.x+2;hunter.y=p.y;
  const pred=sim.pressure.evaluate(p).find(x=>x.kind==='predation');
  assert.ok(pred,'nearby hunter produces predation pressure');
  assert.equal(pred.tone,'help');
  assert.ok(pred.severity>.3);
}

{
  const sim=new Simulation('GENVO8-PRESSURE-SCARCITY',{player:true}),p=sim.player(),s=SPECIES[p.species];
  p.energy=s.maxEnergy*.22;p.genes.digestion=1.09;p.genes.metabolism=1.07;
  for(const field of Object.values(sim.world.plants))field.fill(0);
  sim.world.carrion.fill(0);sim.carrying.forageCache.clear();
  const food=sim.pressure.evaluate(p).find(x=>x.kind==='scarcity');
  assert.ok(food,'low food/energy produces scarcity pressure');
  assert.equal(food.tone,'help');
}

{
  const sim=new Simulation('GENVO8-PRESSURE-HISTORY',{player:true}),p=sim.player();
  sim.day=sim.openingGraceUntilDay+2;
  const hunter=sim.animals.find(a=>a.species==='needlejaw');hunter.x=p.x+2;hunter.y=p.y;
  for(let d=1;d<=3;d++){sim.day=20+d;sim.pressure.observe()}
  const summary=sim.pressure.lifetimeSummary(p,{limit:2});
  assert.ok(summary.some(x=>x.kind==='predation'),'daily exposure history records sustained pressure');
  assert.match(pressureSummaryText(summary),/predators/);
}

console.log('selection pressure checks: PASS');

{
  const a=new Simulation('GENVO8-PRESSURE-NO-RNG',{player:true});
  const b=new Simulation('GENVO8-PRESSURE-NO-RNG',{player:true});
  b.pressure.observe=()=>{};
  for(let i=0;i<240;i++){a.update(null);b.update(null)}
  assert.equal(a.rng.state,b.rng.state,'pressure tracking must not consume RNG');
  assert.deepEqual(a.population(),b.population(),'pressure tracking must not alter ecology outcomes');
}
