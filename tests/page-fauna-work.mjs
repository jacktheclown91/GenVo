import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {visitLivingFaunaByPage,validatePageFaunaWork,beginPageFaunaTick} from '../src/ecology/page-fauna-work.js';

const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'d3-fauna'}));
const a=new Simulation('D3-FAUNA-LIFECYCLE',{player:false});
const stage=a.animals.filter(x=>x.alive&&x.species==='genvo');
assert.ok(stage.length>=2);
const [mother,father]=stage,s=SPECIES.genvo;
Object.assign(mother,{sex:'F',age:s.maturity+4,health:100,energy:s.maxEnergy*.95,hydration:s.maxHydration*.95,reproCooldown:0});
Object.assign(father,{sex:'M',age:s.maturity+4,health:100,energy:s.maxEnergy*.95,hydration:s.maxHydration*.95,reproCooldown:0});
mother.pregnant={fatherId:father.id,days:1,totalDays:s.gestation};
const casualty=a.animals.find(x=>x.alive&&x.species==='rootling');
assert.ok(casualty);
casualty.health=0;casualty.energy=0;
const aliveAtStart=a.animals.filter(x=>x.alive).length,prevBirths=a.stats.births,prevDeaths=a.stats.deaths;
const rng=a.rng.state;
a.phaseLifecycle({once:true});
assert.equal(a.stats.deaths,prevDeaths+1,'one real death, not an aggregate loss');
assert.ok(a.stats.births>prevBirths,'one real funded litter, with inherited organism identity');
assert.equal(a.rng.state===rng,false,'the actual lifecycle retains normal biology RNG');
assert.equal(a.pageFaunaWork.processed,aliveAtStart,'only actors living at entry are visited');
assert.equal(a.pageFaunaWork.counts.reduce((n,v)=>n+v,0)+a.pageFaunaWork.outside,aliveAtStart);
assert.equal(a.pageFaunaWork.lastTick,a.tickCount);
assert.equal(a.pageFaunaWork.pendingTick,null);
assert.ok(a.animals.some(x=>x.id!==mother.id&&x.id!==father.id&&x.parentIds?.includes(mother.id)),'newborn exists only in canonical animal array');
assert.equal(a.regionalEcology.pageTransit.membership.has(casualty.id),false,'dead organism owns no page');
const done=snapshot(a);
a.phaseLifecycle({once:true});
assert.deepEqual(snapshot(a),done,'same-tick scheduled repeat cannot age pregnancy or duplicate death/birth');
assert.equal(beginPageFaunaTick(a),false,'completed tick is immutable');
validatePageFaunaWork(a.pageFaunaWork,a.world);
const restore=restoreSimulationSnapshot(structuredClone(done));
assert.deepEqual(snapshot(restore),done,'full lifecycle receipts, genomes, mortality and resources save exactly');
for(let t=0;t<60;t++){a.update(null);restore.update(null);}
assert.deepEqual(snapshot(a),snapshot(restore),'real lifecycle continues identically after save with no duplicate tick');
const corrupt=structuredClone(done);corrupt.core.pageFaunaWork.processed+=1;
assert.throws(()=>restoreSimulationSnapshot(corrupt),/Fauna lifecycle page counts do not reconcile/);
const pending=structuredClone(done);pending.core.pageFaunaWork.pendingTick=done.core.pageFaunaWork.lastTick+1;
assert.throws(()=>restoreSimulationSnapshot(pending),/Invalid saved fauna page work/);
const future=structuredClone(done);future.core.pageFaunaWork.lastTick+=20;
assert.throws(()=>restoreSimulationSnapshot(future),/Fauna lifecycle receipt is in the future/);
const old=structuredClone(done);delete old.core.pageFaunaWork;
assert.deepEqual(snapshot(restoreSimulationSnapshot(old)),old,'legacy saves never invent earlier organism work');
const observed=[];
const mock={world:{n:128,len:128*128},animals:[
 {id:1,alive:true,x:65,y:30},
 {id:2,alive:true,x:2,y:70},
 {id:3,alive:true,x:-4,y:70},
 {id:4,alive:false,x:8,y:8}
]};
const census=visitLivingFaunaByPage(mock,animal=>observed.push(animal.id));
assert.deepEqual(observed,[1,2,3],'original organism processing order is retained');
assert.deepEqual([...census.counts],[0,1,1,0]);
assert.equal(census.outside,1);
assert.equal(census.processed,3);
assert.throws(()=>visitLivingFaunaByPage({...mock,animals:[mock.animals[0],{...mock.animals[0]}]},()=>{}),/Duplicate or invalid/);
console.log('D3 canonical fauna lifecycle: real funded births/deaths, page attribution, once-tick, save and RNG PASS');
