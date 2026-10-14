import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function stagedFamily(seed='GENVO8-FAMILY-AGENCY'){
  const sim=new Simulation(seed,{player:true}),founder=sim.player();
  let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==founder.id&&a.sex!==founder.sex);
  if(!mate){mate=sim.spawnAnimal('genvo',founder.x+1,founder.y);mate.sex=founder.sex==='F'?'M':'F'}
  founder.age=mate.age=SPECIES.genvo.maturity+4;
  const child=sim.spawnAnimal('genvo',founder.x+1.2,founder.y+.4,[founder,mate]);
  child.age=SPECIES.genvo.maturity+1;child.energy=90;child.hydration=88;child.health=100;
  sim.lineage.registerBirth(child,[founder,mate]);sim.family.registerBirth(child,founder,mate);sim.rebuildSpatial();
  return{sim,founder,mate,child};
}

{
  const sim=new Simulation('GENVO8-TAB-LOCK',{player:true});
  const r=sim.switchFamilyControl(1);
  assert.equal(r.ok,false,'family switching stays locked before another lineage member exists');
  assert.equal(sim.playerId,sim.lineage.activeId,'failed switch does not change control');
}

{
  const {sim,founder,child}=stagedFamily();
  const activeBefore=sim.lineage.activeId;
  const r=sim.switchFamilyControl(1);
  assert.equal(r.ok,true,'Tab-style family switching succeeds after a child exists');
  assert.equal(sim.playerId,child.id,'control moves to the next living lineage member');
  assert.equal(child.player,true,'new controlled member owns the player flag');
  assert.equal(founder.player,false,'previous controlled member returns to autonomous status');
  assert.equal(sim.lineage.activeId,activeBefore,'temporary family switching does not count as a generational handoff');

  sim.setPlayerAutonomy(true);
  child.energy=SPECIES.genvo.maxEnergy*.3;child.hydration=SPECIES.genvo.maxHydration*.9;child.intent='idle';child.target=null;
  sim.phaseDecision({up:false,down:false,left:false,right:false,sprint:false});
  assert.notEqual(child.intent,'idle','automation routes the selected creature through autonomous decision making');
  assert.equal(sim.isManualPlayer(child),false,'automated selected creature is not treated as manual input authority');

  sim.setPlayerAutonomy(false);
  assert.equal(sim.isManualPlayer(child),true,'turning automation off restores manual authority immediately');
}

{
  const {sim,founder,child}=stagedFamily('GENVO8-FAMILY-DEATH');
  sim.switchFamilyControl(1);
  assert.equal(sim.playerId,child.id);
  sim.kill(child,'health');
  assert.equal(sim.playerId,founder.id,'death of a temporarily controlled family member returns control to the living lineage lead');
  assert.equal(sim.lineage.activeId,founder.id,'temporary-control death does not rewrite lineage succession');
  assert.equal(founder.player,true,'restored family member owns the single player flag');
}

{
  const {sim,founder,child}=stagedFamily('GENVO8-HANDOFF-WHILE-SWITCHED');
  sim.switchFamilyControl(1);
  assert.equal(sim.playerId,child.id);
  const before=sim.lineage.handoffs.length;
  const ok=sim.lineage.handoffTo(child.id,{manual:true});
  assert.equal(ok,true,'a mature currently controlled descendant can still be committed as the next lineage lead');
  assert.equal(sim.lineage.activeId,child.id,'handoff changes the lineage lead only when explicitly committed');
  assert.equal(sim.lineage.handoffs.length,before+1,'explicit commitment records one handoff');
  assert.equal(sim.animals.filter(a=>a.player).length,1,'handoff leaves exactly one controlled animal');
}

console.log('family agency checks: PASS');
