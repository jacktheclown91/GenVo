import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
function fixture(){
  const sim=new Simulation('MIGRATION-STALE-DESTINATION',{player:false}),a=sim.animals.find(a=>a.species==='rootling'),others=sim.animals.filter(a=>a.species==='mosskip').slice(0,15);
  sim.animals=[a,...others];sim.world.water.fill(0);sim.world.buildLandRegions();sim.world.buildHydrology();
  for(const f of Object.values(sim.world.plants))f.fill(1);
  a.x=50.5;a.y=50.5;for(const b of others){b.x=100;b.y=100}sim.rebuildSpatial();
  assert.ok(sim.migration.begin(a,{x:58.5,y:50.5},'test'));
  return{sim,a,others};
}
{
  const {sim,a,others}=fixture();for(const b of others){b.x=58.5;b.y=50.5}sim.rebuildSpatial();
  assert.equal(sim.carrying.breedingState(a,{at:{x:58.5,y:50.5}}).allowed,false,'destination really became crowded');
  sim.migration.progress(a);
  assert.equal(sim.migration.state(a).status,'settled','wildlife cancels a destination whose resource capacity is no longer viable');
  assert.equal(sim.migration.targetFor(a),null);
}
{
  const {sim,a}=fixture();a.x=30.5;sim.rebuildSpatial();sim.migration.progress(a);
  assert.equal(sim.migration.targetFor(a),null,'after displacement beyond sensing wildlife reassesses its current habitat rather than chasing an unseen stale destination');
}
console.log('wild migration revalidates changed or displaced destinations: PASS');
