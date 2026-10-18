import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {founderFloraGenome,clonalFloraGenome} from '../src/ecology/flora-genotype.js';
import {recordPageSeedDeposit,validatePageSeedTransfers} from '../src/ecology/page-seed-transfers.js';

const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'D2-seed-transit'}));
const a=new Simulation('D2-REAL-SEED-DEPOSIT',{player:false}),d=a.dispersal,w=a.world,kind='thistlepod';
let y=null;
for(let k=8;k<w.n-8&&y===null;k++)if(!w.water[w.idx(63,k)]&&!w.water[w.idx(64,k)])y=k;
assert.notEqual(y,null,'the actual World offers a dry two-page planting seam');
const source=w.idx(63,y),dest=w.idx(64,y),genome=founderFloraGenome(kind),variant=clonalFloraGenome(genome,.18);
const before=w.seedBank[kind][dest],plantBefore=w.plants[kind][dest];
const payload={genome,originCell:source,producerId:'source-parent',mode:'clonal'};
const added=d.deposit(kind,64.5,y+.5,.2,{payload});
assert.ok(added>0,'a real canonical seed-bank deposit succeeded');
assert.ok(w.seedBank[kind][dest]>before,'the existing seed bank receives physical seeds');
assert.equal(w.plants[kind][dest],plantBefore,'auditing a seed does not mint an adult plant');
assert.equal(d.pageSeedTransfers.transfers,1);
assert.ok(Math.abs(d.pageSeedTransfers.total-added)<1e-10,'remote-source mass equals actual funded deposit');
assert.equal(d.pageSeedTransfers.recent[0].from,'0,'+Math.floor(y/64));
assert.equal(d.pageSeedTransfers.recent[0].to,'1,'+Math.floor(y/64));
assert.equal(d.pageSeedTransfers.recent[0].kind,kind);
const originalEvent=d.pageSeedTransfers.recent[0],serial=d.pageSeedTransfers.lastDepositId;
assert.throws(()=>recordPageSeedDeposit(d,{kind,i:dest,added,payload,depositId:serial}),/Duplicate or stale/,'repeated receipt cannot double count the physical deposit');
assert.equal(d.pageSeedTransfers.transfers,1);
const local=d.deposit(kind,64.5,y+.5,.1,{payload:{genome,originCell:dest}});
assert.ok(local>0);
assert.equal(d.pageSeedTransfers.transfers,1,'same-page dispersal is not a page migration');
assert.ok(d.pageSeedTransfers.lastDepositId>serial,'local deposits still advance the checkpoint');
const mixed=d.deposit(kind,64.5,y+.5,.2,{payload:{genome,originCell:source,cohorts:new Map([
 [genome.id,{amount:3,genome,originCell:source,producerId:'source-parent'}],
 [variant.id,{amount:1,genome:variant,originCell:dest,producerId:'local-parent'}]
 ])}});
assert.ok(mixed>0,'a mixed genotype payload deposits through the real seed bank');
assert.equal(d.pageSeedTransfers.transfers,2);
assert.ok(Math.abs(d.pageSeedTransfers.total-added-mixed*.75)<1e-9,'only the remote genotype fraction crosses the page');
assert.ok(Math.abs(d.pageSeedTransfers.recent.at(-1).amount-mixed*.75)<1e-9);
assert.ok(d.floraState.seeds[kind].get(dest).has(variant.id),'canonical seed bank keeps the local variant, not an audit copy');
assert.deepEqual(d.pageSeedTransfers.recent[0],originalEvent,'later deposits never rewrite earlier evidence');
validatePageSeedTransfers(d.pageSeedTransfers,w);
w.pages.unload(0,Math.floor(y/64));w.pages.unload(1,Math.floor(y/64));
const saved=snapshot(a),copy=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(snapshot(copy),saved,'real seed transfers, cohort genomes and stocks restore exactly');
for(let t=0;t<90;t++){if(t%9===0)a.world.pages.unload(1,Math.floor(y/64));a.update(null);copy.update(null);}
assert.deepEqual(snapshot(copy),snapshot(a),'unloaded page and restored page follow the same real genetics and ecology');
const corrupt=structuredClone(saved);corrupt.controllers.dispersal.pageSeedTransfers.total+=.3;
assert.throws(()=>restoreSimulationSnapshot(corrupt),/Page seed transfer totals do not reconcile/);
const stale=structuredClone(saved);stale.controllers.dispersal.pageSeedTransfers.lastDepositId=0;
assert.throws(()=>restoreSimulationSnapshot(stale),/saved page seed receipt/i);
const invalid=structuredClone(saved);invalid.controllers.dispersal.pageSeedTransfers.byEdge.set('0,0>99,0|'+kind,{mass:1,deposits:1});
assert.throws(()=>restoreSimulationSnapshot(invalid),/Invalid page seed edge/);
const old=structuredClone(saved);delete old.controllers.dispersal.pageSeedTransfers;
assert.deepEqual(snapshot(restoreSimulationSnapshot(old)),old,'legacy snapshots do not invent old seed migration');
console.log('D2 physical multi-genotype seed crossing, source mass, no duplication, save and page parity PASS');
