// Historical acquaintance follows actual local co-presence and survives saves.
// Calendar/tick jumps below are declared controlled observation fixtures, not an
// autonomous ecological history or an artificial biological outcome.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('SOCIAL-TEST',{player:false});
for(const a of sim.animals){a.x=110;a.y=110}
const herd=sim.animals.filter(a=>a.alive&&a.species==='mosskip').slice(0,3);
const hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
assert.equal(herd.length,3);
[[50,50],[54,50],[55,51]].forEach(([x,y],i)=>{herd[i].x=x;herd[i].y=y});
hunter.x=100;hunter.y=100;
sim.rebuildSpatial();
const rng=sim.rng.state;
const [one,two]=herd;
const before=sim.social.affinity(one,two,sim.social.profile(one));
sim.social.observe();
const contact=sim.social.familiarity(one,two);
assert.ok(contact?.observations===1,'first true encounter records acquaintance once');
assert.ok(sim.social.affinity(one,two,sim.social.profile(one))>before,'familiarity changes candidate grouping preference');
sim.social.observe({force:true});
assert.deepEqual(sim.social.familiarity(one,two),contact,'read-only forced visual observation cannot manufacture social history');

sim.day++;
sim.tickCount+=CFG.lifeStride*2;
sim.social.observe();
assert.equal(sim.social.familiarity(one,two)?.observations,2,'new day of contact reinforces acquaintance once');
assert.equal(sim.rng.state,rng,'social learning consumes no biological RNG');

const snapshot=structuredClone(createSimulationSnapshot(sim,{reason:'social-memory',savedAt:'fixed'}));
const restored=restoreSimulationSnapshot(structuredClone(snapshot));
assert.deepEqual(restored.social.contacts,sim.social.contacts,'real social contacts persist across a complete save and restore');
restored.social.observe({force:true});
assert.deepEqual(restored.social.contacts,sim.social.contacts,'reading restored groups does not create extra encounters');
restored.day+=17;restored.tickCount+=CFG.lifeStride*2;
restored.social.rememberContacts(new Map());
assert.equal(restored.social.familiarity(one,two),null,'unreinforced memories decay with elapsed days');
console.log('persistent social contact: observed pair, preference, read-only force, save/restore and expiry PASS');
