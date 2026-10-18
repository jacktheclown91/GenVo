import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {faunaPageActors,faunaPageOf,validateFaunaPageOwners,reconcileFaunaPageOwners,noteFaunaPageOwner} from '../src/ecology/page-fauna-owners.js';

const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'d4-page-ownership'}));
const sim=new Simulation('D4-EXCLUSIVE-FAUNA-OWNERS',{player:true}),r=sim.regionalEcology,w=sim.world;
const all=sim.animals.filter(a=>a.alive),ids=new Set(all.map(a=>a.id));
assert.equal(ids.size,all.length,'canonical animals have unique living IDs');
const proof=validateFaunaPageOwners(sim);
assert.equal(proof.living,all.length);
const originals=new Map(all.map(a=>[a.id,a]));
let received=[];
for(const cy of [0,1])for(const cx of [0,1])received.push(...r.pageActors(cx+','+cy));
assert.equal(received.length,all.length);
assert.equal(new Set(received.map(a=>a.id)).size,all.length,'exactly one bucket owns each live ID');
for(const a of received)assert.equal(originals.get(a.id),a,'page holds the ORIGINAL object, not a copy');
const player=sim.player(),row=Array.from({length:110},(_,i)=>i+8).find(y=>[62,63,64,65,66].every(x=>!w.water[w.idx(x,y)]));
assert.ok(row!==undefined);
player.x=63.95;player.y=row+.5;r.reconcilePages();
const previous=r.pageOwner(player),next='1,'+Math.floor(row/64);
assert.equal(previous,'0,'+Math.floor(row/64));
const beforeMoves=r.pageTransit.transferred,original=player,genes=structuredClone(player.genes);
for(let i=0;i<48&&player.x<64;i++)sim.playerControlStep({right:true},8);
assert.ok(player.x>=64,'real input crosses physical seam');
assert.equal(r.pageOwner(player),next);
assert.equal(r.pageActors(previous).some(a=>a.id===player.id),false,'origin bucket loses the original reference');
assert.equal(r.pageActors(next).filter(a=>a.id===player.id).length,1,'destination exclusively owns the SAME object');
assert.equal(r.pageActors(next).find(a=>a.id===player.id),original);
assert.equal(r.pageTransit.transferred,beforeMoves+1,'single physical crossing, single canonical transit');
assert.deepEqual(player.genes,genes,'movement changes neither genetics nor ancestry');
const stable=r.pageActors(next).length;
noteFaunaPageOwner(sim,player);noteFaunaPageOwner(sim,player);
assert.equal(r.pageActors(next).length,stable,'repeat sync never produces duplicate ownership');
assert.equal(r.pageTransit.transferred,beforeMoves+1,'ownership indexing adds no migration receipts');
const child=sim.spawnAnimal('rootling',83.5,42.5);
assert.equal(r.pageOwner(child),'1,0','spawn enters one real bucket immediately');
assert.equal(r.pageActors('1,0').filter(a=>a.id===child.id).length,1);
sim.kill(child,'test');
assert.equal(r.pageActors('1,0').some(a=>a.id===child.id),false,'death releases immediately from the page bucket');
assert.equal(faunaPageOf(sim,child),undefined);
const off=sim.spawnAnimal('rootling',-4.5,20.5);
assert.equal(r.pageOwner(off),null,'finite scripted out-of-world position has no invented page');
assert.ok(r.pageActors(null).includes(off));
off.x=32.5;off.y=65.5;
r.reconcilePages();
assert.equal(r.pageOwner(off),'0,1','out-of-band movement reconciles with canonical coordinates');
assert.equal(r.pageActors(null).includes(off),false);
// Specialized movers may change x/y without the normal player movement hook.
// The real lifecycle actor pass must repair page ownership in the same visit,
// not defer the correction to an unrelated daily observer sweep.
const unmapped=new Simulation('D4-LIFECYCLE-MOVER',{player:false});
const mover=unmapped.animals.find(a=>a.alive),oldOwner=unmapped.regionalEcology.pageOwner(mover);
mover.x=oldOwner?.startsWith('0,')?70.5:20.5;
mover.y=20.5;mover.health=100;mover.age=0;
unmapped.phaseLifecycle();
const movedPage=Math.floor(mover.x/64)+','+Math.floor(mover.y/64);
assert.equal(unmapped.regionalEcology.pageOwner(mover),movedPage,'lifecycle updates a moved actor in its existing pass');
assert.equal(unmapped.regionalEcology.pageActors(movedPage).find(a=>a.id===mover.id),mover,'lifecycle retains the same object');
const saved=snapshot(sim);
for(const y of [0,1])for(const x of [0,1])w.pages.unload(x,y);
assert.deepEqual(snapshot(sim),saved,'evicting camera-page views does not unload any living actor');
assert.equal(validateFaunaPageOwners(sim).living,sim.animals.filter(a=>a.alive).length);
const resumed=restoreSimulationSnapshot(structuredClone(saved)),rr=resumed.regionalEcology;
assert.deepEqual(snapshot(resumed),saved,'runtime page-owner index is reconstructed, not duplicated in saves');
assert.equal(validateFaunaPageOwners(resumed).living,sim.animals.filter(a=>a.alive).length);
assert.deepEqual(rr.pageActors(next).map(a=>a.id).sort((a,b)=>a-b),r.pageActors(next).map(a=>a.id).sort((a,b)=>a-b),'page ownership is a set of identities, not a lifecycle iteration order');
assert.equal(rr.pageActors(next).find(a=>a.id===player.id),resumed.animals.find(a=>a.id===player.id));
for(let t=0;t<96;t++){if(t%12===0)resumed.world.pages.unload(1,0);sim.update(null);resumed.update(null);}
assert.deepEqual(snapshot(sim),snapshot(resumed),'restored page ownership produces identical real lifecycle, RNG and materials');
assert.equal(validateFaunaPageOwners(sim,{reconcile:true}).living,sim.animals.filter(a=>a.alive).length);
assert.equal(validateFaunaPageOwners(resumed,{reconcile:true}).living,resumed.animals.filter(a=>a.alive).length);
// No page view or index may claim two different objects with the same real ID.
const fixture={world:{n:128,len:128*128},animals:[
 {id:7,x:4,y:4,alive:true},{id:7,x:70,y:70,alive:true}
]};
assert.throws(()=>reconcileFaunaPageOwners(fixture),/Duplicate canonical organism identity/);
console.log('D4 exclusive fauna page object ownership, real transfer, death, off-map, eviction, save and exact resume PASS');
