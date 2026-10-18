import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Prove what CURRENT dense-world "offscreen" really means: ALL living actors and
// real finite resources continue ticking, even when their camera page is evicted.
// This is not a test of yet-unimplemented unloaded-region simulation.
const snapshot=sim=>structuredClone(createSimulationSnapshot(sim,{reason:'offscreen-parity',savedAt:'fixed'}));
const seed='D0-OFFSCREEN-CANONICAL-A',a=new Simulation(seed,{player:false}),b=new Simulation(seed,{player:false});
function stageRemoteBirth(sim){
 const w=sim.world,s=SPECIES.genvo;
 let spot=null;
 for(let y=68;y<120&&!spot;y++)for(let x=68;x<120&&!spot;x++)if(!w.water[w.idx(x,y)]&&!w.water[w.idx(x+1,y)])spot={x:x+.5,y:y+.5};
 assert.ok(spot,'offscreen page contains a real dry reproductive site');
 const parents=sim.animals.filter(a=>a.alive&&a.species==='genvo').slice(0,2);
 assert.equal(parents.length,2,'normal world has a parent pair');
 const [mother,father]=parents;
 Object.assign(mother,{x:spot.x,y:spot.y,sex:'F',age:s.maturity+4,health:100,energy:s.maxEnergy*.95,hydration:s.maxHydration*.95,reproCooldown:0});
 Object.assign(father,{x:spot.x+.25,y:spot.y,sex:'M',age:s.maturity+4,health:100,energy:s.maxEnergy*.95,hydration:s.maxHydration*.95,reproCooldown:0});
 sim.regionalEcology.reconcilePages();
 mother.pregnant={fatherId:father.id,days:1,totalDays:s.gestation};
 return{mother,father,spot};
}
const left=stageRemoteBirth(a),right=stageRemoteBirth(b);
assert.deepEqual(snapshot(a),snapshot(b),'fixture starts at identical state and RNG');
b.world.pages.window(12,12,8,8);
b.world.pages.unload(1,1);
assert.deepEqual(snapshot(a),snapshot(b),'evict remote camera page without mutating World or animals');
const bornA=a.giveBirth(left.mother),bornB=b.giveBirth(right.mother);
assert.ok(bornA.length>0,'real financed pregnancy produced offspring');
assert.deepEqual(bornB.map(c=>c.id),bornA.map(c=>c.id),'the same offspring is born offscreen');
for(const child of bornB){
 assert.equal(b.regionalEcology.pageTransit.membership.get(child.id),'1,1','each newborn owns its actual page, with no second copy');
 assert.equal(b.animals.filter(actor=>actor.id===child.id).length,1,'one live actor object per offspring');
}
assert.deepEqual(snapshot(a),snapshot(b),'birth funding, inheritance, ecology and transit equal when invisible');
// Real death and finite carcass accounting must also happen without a camera page.
const casualtyA=a.animals.find(c=>c.alive&&c.species==='rootling'),casualtyB=b.animals.find(c=>c.id===casualtyA.id);
for(const c of [casualtyA,casualtyB]){c.x=left.spot.x+.5;c.y=left.spot.y+.5;}
a.regionalEcology.reconcilePages();b.regionalEcology.reconcilePages();
const cell=a.world.idx(casualtyA.x,casualtyA.y),before=a.world.carrion[cell];
a.kill(casualtyA,'test');b.kill(casualtyB,'test');
assert.ok(a.world.carrion[cell]>before,'real carcass biomass enters finite World inventory');
assert.equal(b.regionalEcology.pageTransit.membership.has(casualtyB.id),false,'dead actor no longer occupies a page');
assert.deepEqual(snapshot(a),snapshot(b),'death and carcass inventory unaffected by page eviction');
for(let tick=0;tick<96;tick++){
 if(tick%16===0){b.world.pages.unload(1,1);b.world.pages.window(8+tick%28,16,12,12);}
 a.update(null);b.update(null);
}
assert.deepEqual(snapshot(a),snapshot(b),'offscreen life, hydrology and ecosystem follow same history for 96 ticks');
const saved=snapshot(b),loaded=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(snapshot(loaded),saved,'unseen ecology and lineage save without reset');
for(let tick=0;tick<60;tick++){b.update(null);loaded.update(null);}
assert.deepEqual(snapshot(loaded),snapshot(b),'unseen world continues identically after restore');
assert.deepEqual(snapshot(a),snapshot(restoreSimulationSnapshot(structuredClone(snapshot(a)))),'visible control world also restores identically');
console.log('D0 current-map offscreen: actual funded births, deaths/carrion, resource cycles and exact camera/load parity PASS');
