import assert from 'node:assert/strict';
import {PlanetaryWorkQueue} from '../src/sim/planetary-work-queue.js';
import {SaveManager} from '../src/persistence/save-manager.js';
import {REGIONAL_RESIDENCY} from '../src/world/regional-residency.js';
const callbacks=[],events=[],errors=[];let world={},playing=true;
const queue=new PlanetaryWorkQueue({schedule:job=>callbacks.push(job),isCurrent:target=>target===world,onError:error=>errors.push(error.message)});
const run=async()=>{assert.equal(callbacks.length,1);await callbacks.shift()()};
for(const name of ['residency','border','biology','destination'])queue.enqueue(name,world,()=>events.push(name),{ready:()=>playing});
queue.frame();queue.frame();assert.equal(callbacks.length,1,'one idle callback admitted before the next paint');
await run();assert.deepEqual(events,['residency']);assert.equal(callbacks.length,0,'completion cannot recursively drain the queue');
queue.enqueue('residency',world,()=>events.push('residency-again'));
for(let i=0;i<3;i++){queue.frame();await run()}
assert.deepEqual(events,['residency','border','biology','destination'],'new observations cannot starve waiting jobs');
playing=false;queue.enqueue('residency',world,()=>events.push('resumed'),{ready:()=>playing});queue.frame();await run();assert.equal(events.length,4,'pause is checked at execution');
playing=true;queue.frame();await run();assert.equal(events.at(-1),'resumed');
let release;const pending=new Promise(resolve=>release=resolve);
queue.enqueue('storage',world,()=>pending);queue.frame();const running=callbacks.shift()();queue.enqueue('biology',world,()=>events.push('after-storage'));queue.frame();assert.equal(callbacks.length,0,'async storage excludes another admission');
release();await running;assert.equal(callbacks.length,0);queue.frame();await run();assert.equal(events.at(-1),'after-storage');
queue.enqueue('old',world,()=>assert.fail('obsolete world work'));queue.frame();world={};await run();assert.equal(queue.size,0);
queue.enqueue('cancelled',world,()=>assert.fail('cleared callback'));queue.frame();const stale=callbacks.shift();queue.clear();queue.enqueue('new',world,()=>events.push('new-world'));queue.frame();await stale();assert.equal(queue.busy,true,'stale callback cannot unlock the new admission');await run();assert.equal(events.at(-1),'new-world');
queue.enqueue('throws',world,()=>{throw Error('controlled')});queue.enqueue('continues',world,()=>events.push('continues'));queue.frame();await run();assert.deepEqual(errors,['controlled']);queue.frame();await run();assert.equal(events.at(-1),'continues','a failed task releases admission');
// Real SaveManager lifecycle: switching worlds/slots during an awaited save or
// database open must stop residency before it can advance or publish old work.
for(const boundary of ['save','database'])for(const switchSlot of [false,true]){
 let resume;const wait=new Promise(resolve=>resume=resolve),original={regionalResidencyRules:REGIONAL_RESIDENCY.policy};let active=original,opens=0;
 const manager=new SaveManager({getSim:()=>active});manager.available=true;manager.activeSlotId='world-old';
 manager.db=()=>{opens++;if(boundary==='database')return wait;assert.fail('stale save must not open storage')};
 if(boundary==='save')manager.activeSave=wait;
 const work=manager.maintainRegionalResidency(original);
 if(switchSlot)manager.activeSlotId='world-new';else active={};
 resume({});assert.equal(await work,null);assert.equal(manager.residencyBusy,false);assert.equal(opens,boundary==='save'?0:1);
}
console.log('Planetary work queue PASS: one admission per paint, fair jobs, pause recheck, async exclusion, world replacement, stale cancellation, failure recovery and residency save/database lifecycle guards.');
