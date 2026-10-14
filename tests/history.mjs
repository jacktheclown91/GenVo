import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';

{
  const sim=new Simulation('GENVO8-HISTORY-FIELDS',{player:false});
  const a=sim.animals.find(x=>x.species==='rootling');
  const i=sim.world.idx(a.x,a.y);
  for(let k=0;k<24;k++)sim.history.noteStep(a);
  assert.ok(sim.history.traffic[i]>.12,'repeated movement leaves persistent traffic wear');

  const before=sim.history.grazing[i];
  sim.history.notePlantConsumption('sunmoss',a.x,a.y,.18);
  assert.ok(sim.history.grazing[i]>before,'plant consumption records grazing/harvest pressure');

  sim.history.noteDeath(a);
  assert.ok(sim.history.nutrientLegacy[i]>0,'death records a nutrient legacy before carrion decomposes');
}

{
  const sim=new Simulation('GENVO8-HISTORY-RECOVERY',{player:false});
  const a=sim.animals.find(x=>x.species==='mosskip'),i=sim.world.idx(a.x,a.y);
  sim.world.plants.sunmoss[i]=.70;
  const got=sim.world.consume('sunmoss',a.x,a.y,.35);
  sim.history.notePlantConsumption('sunmoss',a.x,a.y,got);
  sim.world.plants.sunmoss[i]+=Math.min(.22,1-sim.world.plants.sunmoss[i]);
  sim.history.advanceCell(i);
  assert.ok(Math.abs(sim.history.previousBiomass[i]-sim.history.biomassAt(i))<1e-5,'daily history refresh records current biomass');
  assert.ok(sim.history.recovery[i]>0,'regrowth after grazing leaves a visible recovery trace');
}

{
  const a=new Simulation('GENVO8-HISTORY-NO-RNG',{player:false});
  const b=new Simulation('GENVO8-HISTORY-NO-RNG',{player:false});
  b.history.noteStep=()=>{};b.history.notePlantConsumption=()=>{};b.history.noteDeath=()=>{};b.history.noteDecomposition=()=>{};b.history.advanceCell=()=>{};
  for(let i=0;i<360;i++){a.update(null);b.update(null)}
  assert.equal(a.rng.state,b.rng.state,'environmental history must not consume RNG');
  assert.deepEqual(a.population(),b.population(),'environmental history must not alter ecology outcomes');
}

console.log('environmental history checks: PASS');
