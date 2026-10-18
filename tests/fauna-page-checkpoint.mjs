import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {createFaunaPageCheckpoint,restoreFaunaPageCheckpoint,validateFaunaPageCheckpoint,pageCheckpointActors} from '../src/persistence/fauna-page-checkpoint.js';
import {faunaPageActors,validateFaunaPageOwners} from '../src/ecology/page-fauna-owners.js';

const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'d5-archive-parity'}));
const sim=new Simulation('D5-PAGE-CHECKPOINT',{player:true});
const w=sim.world,r=sim.regionalEcology,player=sim.player();
const row=Array.from({length:110},(_,i)=>i+8).find(y=>[62,63,64,65,66].every(x=>!w.water[w.idx(x,y)]));
assert.ok(row!==undefined,'test has a real dry seam');
player.x=63.95;player.y=row+.5;r.reconcilePages();
const start=player.id;
for(let i=0;i<45&&player.x<64;i++)sim.playerControlStep({right:true},8);
assert.ok(player.x>=64,'real movement across a page boundary');
const dead=sim.spawnAnimal('rootling',14.5,16.5);
sim.kill(dead,'test');
const outside=sim.spawnAnimal('rootling',-3.5,22.5);
const canonical=snap(sim);
const archive=createFaunaPageCheckpoint(sim,{savedAt:'fixed',reason:'d5-archive-parity'});
const basic=validateFaunaPageCheckpoint(archive);
assert.equal(basic.actors,sim.animals.length,'all canonical slots including dead records stored exactly once');
assert.equal(archive.slots.length,sim.animals.length);
assert.equal(Object.hasOwn(archive.header,'animals'),false,'header holds no second actor array');
assert.ok(archive.pages.has('retired')&&archive.pages.has('outside'),'dead and off-map actors have explicit storage buckets');
assert.ok(archive.pages.get('retired').some(a=>a.id===dead.id));
assert.ok(archive.pages.get('outside').some(a=>a.id===outside.id));
assert.equal(archive.slots.find(s=>s.id===start).owner,'1,'+Math.floor(row/64));
assert.equal(pageCheckpointActors(archive,'1,'+Math.floor(row/64)).filter(a=>a.id===start).length,1);
assert.equal(pageCheckpointActors(archive,'0,0').some(a=>a.id===start),false);
assert.deepEqual(snap(sim),canonical,'creating an archive does not mutate the original living simulation');
const clone=structuredClone(archive);
assert.deepEqual(validateFaunaPageCheckpoint(clone),basic,'archive remains valid after browser-standard structuredClone');
const loaded=restoreFaunaPageCheckpoint(clone);
assert.deepEqual(snap(loaded),canonical,'every actor and controller, world resource and RNG matches normal save at restoration');
assert.equal(validateFaunaPageOwners(loaded).living,sim.animals.filter(a=>a.alive).length);
assert.equal(faunaPageActors(loaded,'1,'+Math.floor(row/64)).find(a=>a.id===start),loaded.animals.find(a=>a.id===start),'restored page index points to canonical creature');
for(let t=0;t<90;t++){if(t%12===0)loaded.world.pages.unload(1,Math.floor(row/64));sim.update(null);loaded.update(null);}
assert.deepEqual(snap(sim),snap(loaded),'independent full world and page-archived restore evolve identically for 90 ticks');
assert.deepEqual(snap(loaded),snap(restoreSimulationSnapshot(structuredClone(snap(loaded)))),'normal save also survives after page-archive continuation');

const removePage=structuredClone(archive);const key=[...removePage.pages.keys()].find(k=>k!=='outside'&&k!=='retired');
removePage.pages.delete(key);
assert.throws(()=>restoreFaunaPageCheckpoint(removePage),/Incomplete fauna checkpoint/,'a missing physical page fails before recovery');

const duplicate=structuredClone(archive),pkey=[...duplicate.pages.keys()].find(k=>duplicate.pages.get(k).length>0);
duplicate.pages.get(pkey).push(duplicate.pages.get(pkey)[0]);
assert.throws(()=>restoreFaunaPageCheckpoint(duplicate),/duplicated|incorrect page ownership/,'duplicate actor record cannot be loaded');

const wrongPage=structuredClone(archive),target=wrongPage.pages.get(pkey)[0];
wrongPage.slots.find(s=>s.id===target.id).owner='outside';
assert.throws(()=>restoreFaunaPageCheckpoint(wrongPage),/incorrect page ownership/,'identity cannot be silently assigned to a different page');

const missingSlot=structuredClone(archive);missingSlot.slots.pop();
assert.throws(()=>restoreFaunaPageCheckpoint(missingSlot),/incorrect page ownership|Incomplete fauna/,'extra unslotted creature cannot be loaded');

const bogus=structuredClone(archive);bogus.pages.set('99,0',[{id:999,x:999,y:0,alive:true}]);
assert.throws(()=>restoreFaunaPageCheckpoint(bogus),/Invalid fauna checkpoint page/,'pages must fit the actual canonical world');

const swapped=structuredClone(archive);swapped.slots.reverse();
const alternate=restoreFaunaPageCheckpoint(swapped);
assert.notDeepEqual(alternate.animals.map(a=>a.id),sim.animals.map(a=>a.id),'manifest order governs real restoration, never map iteration order');
assert.equal(alternate.animals.length,sim.animals.length,'no creature duplicated or lost when order is different');
// A checkpoint can be inspected on a page without turning it into live actors.
const actorsBefore=sim.animals.length,detached=pageCheckpointActors(archive,pkey);
detached[0].health=-999;
assert.equal(sim.animals.length,actorsBefore);
assert.notEqual(archive.pages.get(pkey)[0].health,-999,'page inspection is detached and read-only relative to the archive');

console.log('D5 page checkpoint: exact one-copy actor slots, actual seam, death/outside, partial rejection, page inspection and full-world deterministic resume PASS');
