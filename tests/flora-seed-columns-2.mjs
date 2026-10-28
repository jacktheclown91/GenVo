// Seed columns /2 decode to exactly the records /1 decodes, for every value shape
// the live bank can hold; malformed tables and non-finite values are rejected.
import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {SEED_COLUMNS_2,packFloraSeedBanks,packFloraSeedColumns,unpackFloraSeedBanks} from '../src/persistence/flora-seed-codec.js';

const extended=[1,2];extended.note='kept';const sparse=[1,,3];const proto={amount:.5};Object.defineProperty(proto,'__proto__',{value:{x:1},enumerable:true,writable:true,configurable:true});
const shapes=[0,-0,1e-300,5e-324,-12.5,'a','',null,undefined,true,false,[],[-0,4,1e-300],['x','y'],[1,'x'],[null],[[1]],{nested:{v:[1,2]}},extended,sparse];
const seeds={bramble:new Map(),dustsage:new Map(),woodspire:new Map()};
let id=0;for(let cell=0;cell<60;cell++){const rows=new Map();for(let k=0;k<4;k++){const v=shapes[(cell*4+k)%shapes.length],r={amount:(cell+k)*1e-9,depositIds:[cell,cell+k],producerId:'p'+(cell%7),mixed:v};if(k===1)Object.assign(r,{route:'local',parentGenomeIds:['g'+k,'g'+cell]});if(k===2){delete r.depositIds;r.depositIds=[cell]}rows.set('g'+id++,r)}seeds.bramble.set(cell*3,rows)}
seeds.dustsage.set(7,new Map([['__proto__',proto],['b',{amount:0,flag:false}]]));
const before=structuredClone(seeds),v1=packFloraSeedBanks(seeds),v2=packFloraSeedColumns(seeds);
assert.equal(v2.codec,SEED_COLUMNS_2);assert.ok(isDeepStrictEqual(seeds,before),'packing never mutates the live bank');
const d1=unpackFloraSeedBanks(v1),d2=unpackFloraSeedBanks(v2);
assert.ok(isDeepStrictEqual(d2,d1),'/2 decodes exactly as /1');assert.ok(isDeepStrictEqual(d2,seeds),'/2 decodes the live bank');
for(const [cell,rows] of seeds.bramble)for(const [g,r] of rows)assert.deepEqual(Object.keys(d2.bramble.get(cell).get(g)),Object.keys(r),'field order is preserved');
assert.ok(isDeepStrictEqual(unpackFloraSeedBanks(structuredClone(v2)),d1),'stored (cloned) tables decode identically');
// Decoded records own their values.
d2.bramble.get(0).get('g0').depositIds.push(99);assert.ok(isDeepStrictEqual(unpackFloraSeedBanks(v2),d1),'decoded edits cannot reach the packed table');
// Normal saves copy fallback metadata; an owned regional runtime may transfer it.
const meta={nested:{v:[1]}},owned={bramble:new Map([[1,new Map([['g',{amount:1,meta}]])]])};
assert.notEqual(packFloraSeedColumns(owned).kinds.bramble.columns.find(c=>c.field==='meta').values[0],meta);
assert.equal(packFloraSeedColumns(owned,{ownedMetadata:true}).kinds.bramble.columns.find(c=>c.field==='meta').values[0],meta);
// Non-finite values are rejected exactly as /1 rejects them.
for(const value of [NaN,Infinity,[1,NaN],new Map(),new Date(0)]){const bad={a:new Map([[1,new Map([['g',{amount:1,value}]])]])};assert.throws(()=>packFloraSeedColumns(bad));assert.throws(()=>packFloraSeedBanks(bad))}
for(const bad of [{a:new Map([[-1,new Map()]])},{a:new Map([[1,new Map([['g',{amount:-1}]])]])},{a:new Map([[1,new Map([['g',{amount:NaN}]])]])}])assert.throws(()=>packFloraSeedColumns(bad));
// Corrupt tables fail decoding.
const table=t=>t.kinds.bramble,col=(t,f)=>table(t).columns.find(c=>c.field===f);
for(const corrupt of [t=>table(t).amounts[0]=NaN,t=>col(t,'depositIds').tags[0]=42,t=>col(t,'depositIds').refs[0]=1e9,t=>col(t,'depositIds').lengths[0]=1e9,t=>col(t,'producerId').refs[0]=1e9,
 t=>col(t,'mixed').numbers&&(col(t,'mixed').numbers.fill(NaN)),t=>col(t,'depositIds').flatNumbers[0]=Infinity,t=>col(t,'route').tags.fill(2),t=>col(t,'depositIds').tags[0]=0,t=>table(t).orders.push(['amount','missing'])&&table(t).orderIndices.fill(table(t).orders.length-1),
 t=>table(t).columns.push(structuredClone(table(t).columns[0])),t=>col(t,'depositIds').tags=new Uint8Array(1)]){
 const t=structuredClone(v2);corrupt(t);const snapshot=structuredClone(t);assert.throws(()=>unpackFloraSeedBanks(t),/Invalid/);assert.ok(isDeepStrictEqual(t,snapshot),'failed decoding cannot mutate its input')}
assert.throws(()=>unpackFloraSeedBanks({...v2,codec:'genvo.flora-seed-columns/99'}),/Invalid/);
console.log('Seed columns /2: exact /1 decode parity for every value shape, field order, ownership, non-finite and corrupt-table rejection PASS');
