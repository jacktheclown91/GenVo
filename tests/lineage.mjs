import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function unrelatedGenvo(sim,exceptId){return sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==exceptId&&!a.lineage)}
function makeLineageChild(sim,parent,mate){
  const child=sim.spawnAnimal('genvo',parent.x+.2,parent.y+.2,[parent,mate]);
  child.energy=SPECIES.genvo.maxEnergy*.9;
  child.hydration=SPECIES.genvo.maxHydration*.9;
  sim.lineage.registerBirth(child,[parent,mate]);
  return child;
}

{
  const sim=new Simulation('GENVO8-LINEAGE-FOUNDATION',{player:true});
  const founder=sim.player();
  assert.ok(founder?.lineage,'controlled founder belongs to tracked lineage');
  assert.equal(sim.lineage.founderId,founder.id);
  assert.ok(sim.lineage.records.has(founder.id));
  const mate=unrelatedGenvo(sim,founder.id);assert.ok(mate);
  const child=makeLineageChild(sim,founder,mate);
  assert.equal(child.generation,2);
  assert.deepEqual(child.parentIds,[founder.id,mate.id]);
  assert.equal(child.lineage,true);
  assert.ok(sim.lineage.records.get(founder.id).children.includes(child.id));
  assert.equal(sim.lineage.isDescendant(child.id,founder.id),true);
  assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),false,'juvenile cannot receive manual handoff');
  child.age=SPECIES.genvo.maturity;
  sim.lineage.refreshSelection();
  assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true);
  assert.equal(sim.playerId,child.id);
  assert.equal(founder.alive,true,'handoff leaves prior generation alive');
  assert.equal(founder.player,false);
}

{
  const sim=new Simulation('GENVO8-LINEAGE-DEATH',{player:true});
  const founder=sim.player(),mate=unrelatedGenvo(sim,founder.id),child=makeLineageChild(sim,founder,mate);
  child.age=SPECIES.genvo.maturity;
  sim.kill(founder,'test-death');
  assert.equal(sim.playerId,child.id,'death hands control to living descendant');
  assert.equal(sim.lineage.records.get(founder.id).cause,'test-death');
  assert.equal(sim.lineage.records.get(founder.id).alive,false);
}

{
  const sim=new Simulation('GENVO8-LINEAGE-GEN8',{player:true});
  let active=sim.player();
  const mate=unrelatedGenvo(sim,active.id);assert.ok(mate);
  for(let generation=2;generation<=8;generation++){
    const child=makeLineageChild(sim,active,mate);
    child.age=SPECIES.genvo.maturity;
    assert.equal(child.generation,generation);
    assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true);
    active=child;
  }
  assert.equal(sim.player().generation,8);
  assert.equal(sim.lineage.highestGeneration,8);
  assert.equal(sim.lineage.established,true,'Generation 8 handoff establishes lineage milestone');
  assert.equal(sim.lineage.ancestryPath().length,8);
  const milestoneTick=sim.lineage.establishedTick;
  const ninth=makeLineageChild(sim,active,mate);ninth.age=SPECIES.genvo.maturity;
  assert.equal(ninth.generation,9,'offspring can continue beyond the introductory challenge');
  assert.equal(sim.lineage.handoffTo(ninth.id,{manual:true}),true);
  assert.equal(sim.player().generation,9);
  assert.equal(sim.lineage.established,true);
  assert.equal(sim.lineage.establishedTick,milestoneTick,'the original achievement is retained');
  const tick=sim.tickCount;sim.update(null);
  assert.equal(sim.tickCount,tick+1,'simulation keeps running after Generation 8');
}

{
  const sim=new Simulation('GENVO8-KIN',{player:false});
  const a=sim.animals.find(x=>x.species==='genvo');
  const b=sim.animals.find(x=>x.species==='genvo'&&x.id!==a.id);
  const c1=sim.spawnAnimal('genvo',a.x,a.y,[a,b]);
  const c2=sim.spawnAnimal('genvo',a.x,a.y,[a,b]);
  assert.equal(sim.closeKin(a,c1),true,'parent/child recognized');
  assert.equal(sim.closeKin(c1,c2),true,'siblings recognized');
}
console.log('lineage checks: PASS');
