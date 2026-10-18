import assert from 'node:assert/strict';
import {exchangeTerrainGroundwater} from '../src/world/topography.js';
import {recordPageGroundwater,finishPageGroundwater,validatePageGroundwater,pageLandGroundwater} from '../src/world/page-groundwater-transfers.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// A real land-to-land flux crosses both axes of the existing 64-tile page layout.
// No water is invented: compare World-owned groundwater before and after the
// unchanged terrain exchange, with/without the optional observation callback.
const n=128,len=n*n,w={n,len,water:new Uint8Array(len),terrain:{elevation:new Float32Array(len)}};
const g=new Float32Array(len).fill(.5),idx=(x,y)=>y*n+x;
for(const [x,y,v] of [[63,10,.9],[64,10,.1],[63,11,.1],[64,11,.9],[10,63,.9],[10,64,.1]])g[idx(x,y)]=v;
const before=pageLandGroundwater({...w,soilWater:{groundwater:g}});
const actual=new Float32Array(len),baseline=new Float32Array(len),map=new Map();
const external=exchangeTerrainGroundwater(w,g,actual,.5,(i,j,volume)=>recordPageGroundwater(map,n,i,j,volume));
const reference=exchangeTerrainGroundwater(w,g,baseline,.5);
assert.equal(external,0);
assert.equal(reference,0);
assert.deepEqual(actual,baseline,'observation cannot modify any physical water exchange');
const receipt=finishPageGroundwater(map);
validatePageGroundwater(w,receipt);
assert.equal(receipt.flows.length,2,'one east/west and one north/south regional page seam');
const east=receipt.flows.find(f=>f.from==='0,0'&&f.to==='1,0');
const south=receipt.flows.find(f=>f.from==='0,0'&&f.to==='0,1');
assert.ok(east&&south);
assert.ok(east.forwardWater>0&&east.backwardWater>0,'opposing water transfers remain visible');
assert.ok(Math.abs(east.netWater)<1e-12,'opposing equal movement has zero net flow');
assert.ok(south.netWater>0,'groundwater truly moves across the southern seam');
const expected=new Map();
for(const f of receipt.flows){
 expected.set(f.from,(expected.get(f.from)||0)-f.netWater);
 expected.set(f.to,(expected.get(f.to)||0)+f.netWater);
}
const after=pageLandGroundwater({...w,soilWater:{groundwater:actual}});
for(const [key,stock] of before)assert.ok(Math.abs((after.get(key)-stock)-(expected.get(key)||0))<.0002,'each page inventory closes across the real land seam '+key);
for(const mutate of [
 r=>r.schema=2,r=>r.flows[0].forwardWater=-1,r=>r.flows[0].netWater+=1,
 r=>r.flows[0].to='1,1',r=>r.flows.push(structuredClone(r.flows[0]))
]){const corrupted=structuredClone(receipt);mutate(corrupted);assert.throws(()=>validatePageGroundwater(w,corrupted),/groundwater page/i);}
assert.equal(recordPageGroundwater(new Map(),n,idx(60,10),idx(61,10),.5),false,'same-page flow has no seam receipt');
assert.throws(()=>recordPageGroundwater(new Map(),n,idx(63,10),idx(64,11),1),/groundwater page edge/i);

// Integrated ecology: an unchanged landscape may be viewed/evicted freely.
// Receipts are optional historical data, but new saved evidence must be valid.
const s=new Simulation('B1-GROUNDWATER-SEAM',{player:false,worldGenerator:'coastal/1'});
const snap=x=>structuredClone(createSimulationSnapshot(x,{savedAt:'fixed',reason:'groundwater-seam'}));
const first=s.day;while(s.day===first)s.update(null);
assert.ok(s.world.soilWater?.lastDay?.pageGroundwaterTransfers,'terrain runoff records real water flux');
validatePageGroundwater(s.world,s.world.soilWater.lastDay.pageGroundwaterTransfers);
const saved=snap(s);
s.world.pages.window(62,62,6,6);s.world.pages.unload(0,0);s.world.pages.unload(1,0);
assert.deepEqual(snap(s),saved,'unloading the camera view cannot erase water/history');
const restored=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(snap(restored),saved,'full save retains water receipt and history');
for(let k=0;k<60;k++){s.update(null);restored.update(null);}
assert.deepEqual(snap(restored),snap(s),'same future ecological state after exact restore');
const malformed=structuredClone(saved);
malformed.world.soilWater.lastDay.pageGroundwaterTransfers.schema=6;
assert.throws(()=>restoreSimulationSnapshot(malformed),/groundwater page receipt/,'save rejects corrupt page transfers');
const legacy=structuredClone(saved);
delete legacy.world.soilWater.pageGroundwaterTransfers;
for(const row of legacy.world.soilWater.daily||[])delete row.pageGroundwaterTransfers;
if(legacy.world.soilWater.lastDay)delete legacy.world.soilWater.lastDay.pageGroundwaterTransfers;
assert.deepEqual(snap(restoreSimulationSnapshot(legacy)),legacy,'prior save without observations is preserved');
console.log('B1 groundwater seams: actual terrain flux, conserved page inventories, immutable observation, legacy and exact save PASS');
