import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {advanceEnvironmentWater,validateEnvironment} from '../src/world/environment.js';
import {recordPageSaltTransfer,finishPageSaltTransfers,validatePageSaltTransfers,pageSaltStorage} from '../src/world/page-salt-transfers.js';

// The World keeps every stock; pages only identify the boundary across which it moved.
const n=128,len=n*n;
const w={n,len,water:new Uint8Array(len),environment:{
 schema:1,temperatureOffset:new Float32Array(len),rainScale:new Float32Array(len).fill(1),
 depth:new Float32Array(len),salt:new Float64Array(len),boundary:new Uint8Array(len),
 day:0,totals:{saltInput:0,saltOutput:0,rainWater:0,displacedWater:0},daily:[]
}};
const water=(x,y,s)=>{const i=y*n+x;w.water[i]=1;w.environment.depth[i]=1;w.environment.salt[i]=s;};
water(63,10,1);water(64,10,0);water(63,11,0);water(64,11,1);
water(10,63,1);water(10,64,0);
validateEnvironment(w,w.environment);
const before=pageSaltStorage(w);
const row=advanceEnvironmentWater(w,{rain:0,temp:.5},1);
validateEnvironment(w,w.environment);
assert.ok(Math.abs(row.closure)<1e-10,'the World salt stock still closes');
assert.equal(row.pageTransfers.schema,1);
assert.equal(row.pageTransfers.flows.length,2,'two physical page seams, not one event per cell');
validatePageSaltTransfers(w,row.pageTransfers);
const horizontal=row.pageTransfers.flows.find(f=>f.from==='0,0'&&f.to==='1,0');
const vertical=row.pageTransfers.flows.find(f=>f.from==='0,0'&&f.to==='0,1');
assert.ok(horizontal&&vertical);
assert.ok(horizontal.forwardSalt>.07&&horizontal.backwardSalt>.07,'opposing real salt transfers are retained rather than silently cancelled');
assert.ok(Math.abs(horizontal.netSalt)<1e-12,'opposing transfers sum to zero net');
assert.ok(Math.abs(vertical.netSalt-.08)<1e-10,'north/south physical seam transfer recorded');
const expected=new Map();
for(const flow of row.pageTransfers.flows){
 expected.set(flow.from,(expected.get(flow.from)||0)-flow.netSalt);
 expected.set(flow.to,(expected.get(flow.to)||0)+flow.netSalt);
}
const after=pageSaltStorage(w);
for(const [key,stock] of before)assert.ok(Math.abs(((after.get(key)||0)-stock)-(expected.get(key)||0))<1e-10,'no rain/reservoir: page inventory delta agrees with directed seam ledger '+key);
assert.equal(w.environment.totals.saltInput,0);
assert.equal(w.environment.totals.saltOutput,0);

// Reject malformed or fabricated cross-page evidence while retaining historical receipts.
const good=structuredClone(row.pageTransfers);
for(const mutate of [
 x=>x.schema=2,x=>x.flows[0].forwardSalt=-1,x=>x.flows[0].netSalt=5,
 x=>x.flows[0].from='1,1',x=>x.flows.push(structuredClone(x.flows[0]))
]){const altered=structuredClone(good);mutate(altered);assert.throws(()=>validatePageSaltTransfers(w,altered),/page salt transfer/i);}
const legacyEnvironment=structuredClone(w.environment);
for(const r of legacyEnvironment.daily)delete r.pageTransfers;
delete legacyEnvironment.lastDay.pageTransfers;
validateEnvironment(w,legacyEnvironment);
const direct=new Map();
assert.equal(recordPageSaltTransfer(direct,n,62+10*n,63+10*n,.1),false,'in-page salt does not become a boundary transaction');
assert.throws(()=>recordPageSaltTransfer(direct,n,63+10*n,64+11*n,.1),/cardinal/);
assert.equal(finishPageSaltTransfers(direct).flows.length,0);

// Production World/Save authority: page cache changes cannot rewrite stocks or evidence.
const live=new Simulation('PAGE-SALT-RECEIPT',{player:false,worldGenerator:'coastal/1'});
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'salt-seam-test'}));
const startDay=live.day;
while(live.day===startDay)live.update(null);
assert.ok(live.world.environment.lastDay.pageTransfers,'ordinary regional ecology records page-seam receipts');
const exact=snap(live);
live.world.pages.window(58,58,12,12);
live.world.pages.unload(0,0);
live.world.pages.unload(1,0);
assert.deepEqual(snap(live),exact,'camera view changes cannot touch biological state or transfer history');
const restored=restoreSimulationSnapshot(structuredClone(exact));
assert.deepEqual(snap(restored),exact,'current transfer receipts save exactly');
for(let t=0;t<60;t++){live.update(null);restored.update(null);}
assert.deepEqual(snap(restored),snap(live),'ordinary ecology, transfers and RNG resume exactly');
const invalid=structuredClone(exact);
invalid.world.environment.lastDay.pageTransfers={schema:3,flows:[]};
assert.throws(()=>restoreSimulationSnapshot(invalid),/page salt transfer/i,'corrupt saved transfer audit is not silently discarded');
const old=structuredClone(exact);
for(const r of old.world.environment.daily||[])delete r.pageTransfers;
if(old.world.environment.lastDay)delete old.world.environment.lastDay.pageTransfers;
assert.deepEqual(snap(restoreSimulationSnapshot(old)),old,'old worlds missing only this observation field remain unchanged on restore');
console.log('B1 page salt receipts: production flow, conserved seams, strict validation, page eviction and exact save continuation PASS');
