// Save cadence: the player's lineage saves promptly; wildlife births and deaths
// stay unsaved events that the routine autosave window persists. No biology runs
// differently; only when SaveManager asks for a save.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SaveManager} from '../src/persistence/save-manager.js';

const sim=new Simulation('SAVE-MILESTONE-CADENCE',{player:true});
for(let i=0;i<12;i++)sim.update(null);
const manager=new SaveManager({getSim:()=>sim});manager.available=true;
const calls=[];manager.schedule=(reason,delay)=>calls.push({reason,delay});
const saved=Date.now();manager.lastSavedAt=saved;manager.lastSavedTick=sim.tickCount;
manager.observe();assert.equal(calls.length,0,'first observation records the baseline only');

// A wildlife death remains eligible, but waits for the autosave window.
const wild=sim.animals.find(a=>a.alive&&!a.player&&!a.lineage);assert.ok(wild);
sim.kill(wild,'controlled-wildlife-death');manager.observe();
assert.equal(calls.length,1);assert.equal(calls[0].reason,'lineage-milestone');
assert.ok(calls[0].delay>=manager.autosaveMs-5000&&calls[0].delay<=manager.autosaveMs,'wildlife event defers to the autosave window: '+calls[0].delay);

// While that deferred save is pending, further wildlife events do not push it later.
manager.pendingTimer=1;
const another=sim.animals.find(a=>a.alive&&!a.player&&!a.lineage);sim.kill(another,'controlled-wildlife-death');manager.observe();
assert.equal(calls.length,1,'pending deferred save is kept');

// A death in the player's lineage saves promptly, replacing the deferred wait.
const kin=sim.spawnAnimal(sim.player().species,sim.player().x,sim.player().y,[sim.player(),sim.player()]);
kin.lineage=true;sim.lineage.register(kin,[sim.player().id]);manager.observe();
assert.equal(calls.at(-1).reason,'lineage-milestone');assert.equal(calls.at(-1).delay,900,'lineage birth saves promptly');
sim.kill(kin,'controlled-lineage-death');manager.observe();
assert.equal(calls.at(-1).delay,900,'lineage death saves promptly');

// Without a pending timer, an overdue window saves at the ordinary prompt delay.
manager.pendingTimer=null;manager.lastSavedAt=saved-manager.autosaveMs*2;calls.length=0;
const late=sim.animals.find(a=>a.alive&&!a.player&&!a.lineage);sim.kill(late,'controlled-wildlife-death');manager.observe();
assert.ok(calls.some(c=>c.reason==='lineage-milestone'&&c.delay===900),'overdue wildlife event is not deferred further');

// An overdue autosave waits for its pending request instead of re-arming it each observation.
const overdue=new SaveManager({getSim:()=>sim});overdue.available=true;const armed=[];overdue.schedule=reason=>armed.push(reason);
overdue.lastObservedSignature=overdue.signature(sim);overdue.lastObservedLineage=overdue.lineageSignature(sim);overdue.lastSavedAt=Date.now()-overdue.autosaveMs*2;
overdue.pendingTimer=1;overdue.observe();assert.deepEqual(armed,[],'pending autosave is not re-armed');
overdue.pendingTimer=null;overdue.observe();assert.deepEqual(armed,['autosave']);

// A newer request replaces one already queued for idle time: one save, not two.
const idle=[];globalThis.requestIdleCallback=fn=>idle.push(fn);globalThis.cancelIdleCallback=id=>{idle[id-1]=null};
const once=new SaveManager({getSim:()=>sim});once.available=true;const runs=[];once.saveNow=async reason=>{runs.push(reason)};
once.schedule('autosave',0);await new Promise(resolve=>setTimeout(resolve,20));assert.equal(idle.length,1,'first request waits for idle time');
once.schedule('lineage-milestone',0);await new Promise(resolve=>setTimeout(resolve,20));
for(const run of idle)run?.();assert.deepEqual(runs,['lineage-milestone'],'superseded idle request never runs');
delete globalThis.requestIdleCallback;delete globalThis.cancelIdleCallback;
console.log('save milestone cadence: prompt lineage saves, deferred wildlife-only saves, single queued save PASS');
