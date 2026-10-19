// Emergent guidance requires real repeated acquaintances and purposeful movement.
// Test stages positions and days deliberately; no genetic, reserve or RNG editing.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('SOCIAL-TEST',{player:false});
for(const a of sim.animals){a.x=110;a.y=110}
const group=sim.animals.filter(a=>a.alive&&a.species==='mosskip').slice(0,3);
const hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
assert.equal(group.length,3);
[[48,50],[54,50],[55,51]].forEach(([x,y],i)=>{group[i].x=x;group[i].y=y});
hunter.x=100;hunter.y=100;
sim.rebuildSpatial();
const rng=sim.rng.state;
sim.social.observe();
assert.equal(sim.social.state(group[0]).guideId,null,'no assigned alpha or instant recruit');
sim.day++;sim.tickCount+=CFG.lifeStride*2;
sim.social.observe();
assert.equal(sim.social.state(group[0]).guideId,null,'familiarity alone does not manufacture a leader');

group[2].intent='drink';group[2].target={x:64,y:52};
sim.social.observe({force:true});
const state=sim.social.state(group[0]);
assert.equal(state.guideId,group[2].id,'two familiar witnesses recognize actual directed travel');
const steering=sim.social.cohesionTarget(group[0]);
assert.ok(steering,'well-fed group member may follow the guide while still far from it');
assert.equal(steering.x,group[2].x,'movement follows the real guide position, not an invented marker');
assert.equal(steering.y,group[2].y);
const view=sim.social.visualState(group[0]);
assert.equal(view.guideId,group[2].id,'world visuals can identify actual situational guidance');

const snapshot=structuredClone(createSimulationSnapshot(sim,{reason:'observed-guide',savedAt:'fixed'}));
const restored=restoreSimulationSnapshot(structuredClone(snapshot));
restored.social.observe({force:true});
assert.equal(restored.social.state(restored.animals.find(a=>a.id===group[0].id)).guideId,group[2].id,'save and restore preserve memory-driven guide');
assert.equal(sim.rng.state,rng,'no guide draw or arbitrary status RNG');
group[2].intent='idle';group[2].target=null;
sim.social.observe({force:true});
assert.equal(sim.social.state(group[0]).guideId,null,'leadership ends when an individual stops guiding');
console.log('situational wildlife leadership: earned association, real movement, no fixed alpha, exact save and loss PASS');
