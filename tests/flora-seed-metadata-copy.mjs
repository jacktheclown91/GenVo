import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {isDeepStrictEqual} from 'node:util';
import {packFloraSeedBanks,unpackFloraSeedBanks} from '../src/persistence/flora-seed-codec.js';
const source=fs.readFileSync(new URL('../docs/performance/flora-seed-codec-before-metadata-copy.txt',import.meta.url),'utf8');assert.equal(createHash('sha256').update(source).digest('hex'),'6290803b5bca29ab1c397c506660f55e069f459fd7c3c0fd983a4ffa813802b0');
const before=await import('data:text/javascript;base64,'+Buffer.from(source+'\n//# sourceURL=metadata-copy-reference.js').toString('base64'));
const shared={signed:-0,missing:undefined},sparse=new Array(5);sparse[3]=shared;sparse.extra=shared;
const metadata={first:shared,second:shared,sparse};Object.defineProperty(metadata,'__proto__',{value:{owned:true},enumerable:true,writable:true,configurable:true});
const seed={a:new Map([[1,new Map([['tiny',{amount:Number.MIN_VALUE,metadata}],['normal',{metadata,amount:.1}]])]])};
const old=before.packFloraSeedBanks(seed),packed=packFloraSeedBanks(seed);assert.ok(isDeepStrictEqual(packed,old),'full codec/dictionary/order unchanged');
const decoded=unpackFloraSeedBanks(packed);assert.ok(isDeepStrictEqual(decoded,before.unpackFloraSeedBanks(old)));
const a=decoded.a.get(1).get('tiny').metadata,b=decoded.a.get(1).get('normal').metadata;
assert.equal(a.first,a.second);assert.equal(a.first,a.sparse[3]);assert.equal(a.first,a.sparse.extra);assert.ok(!(0 in a.sparse));assert.equal(Object.getPrototypeOf(a),Object.prototype);assert.equal(Object.hasOwn(a,'__proto__'),true);
assert.notEqual(a,b);a.first.edited=true;assert.equal(b.first.edited,undefined);assert.equal(shared.edited,undefined);assert.ok(isDeepStrictEqual(unpackFloraSeedBanks(packed),before.unpackFloraSeedBanks(old)),'decoded mutation cannot alter packed metadata');
for(const value of [new Date(0),new Map(),NaN,Infinity]){const bad={a:new Map([[1,new Map([['g',{amount:1,metadata:value}]])]])};assert.throws(()=>packFloraSeedBanks(bad));assert.throws(()=>before.packFloraSeedBanks(bad))}
// The historical fingerprint ignores non-index array extensions. Native types there remain readable.
const extended=[1,2];extended.date=new Date(123);extended.mapping=new Map([['shared',shared]]);extended.ref=shared;
const unusual={a:new Map([[2,new Map([['g',{amount:.5,metadata:extended}]])]])};
const oldExtended=before.packFloraSeedBanks(unusual),newExtended=packFloraSeedBanks(unusual);assert.ok(isDeepStrictEqual(oldExtended,newExtended));assert.ok(isDeepStrictEqual(unpackFloraSeedBanks(newExtended),before.unpackFloraSeedBanks(oldExtended)));
const invalidArray=[1];invalidArray.fn=()=>{};const unsupported={a:new Map([[2,new Map([['g',{amount:1,metadata:invalidArray}]])]])};assert.throws(()=>packFloraSeedBanks(unsupported));assert.throws(()=>before.packFloraSeedBanks(unsupported));
console.log('plain seed metadata: exact reference codec, tiny quantities, aliases, sparse/property ordering, prototype safety and isolation PASS');
