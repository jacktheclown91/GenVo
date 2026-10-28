// Warm regional publication copy: structuredClone's result, except that deeply
// frozen objects are shared. Unsupported shapes fall back to structuredClone.
import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {independentSnapshotCopy} from '../src/persistence/snapshot-copy.js';
import {snapshotSignature} from '../tools/snapshot-signature.mjs';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreDetachedSimulationSnapshot} from '../src/persistence/save-manager.js';

const deepFreeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))deepFreeze(x);Object.freeze(v)}return v};
const genome=deepFreeze({id:'g',traits:{growth:.1},alleles:[[1,2],[3,4]]});
const shallow=Object.freeze({mutable:{n:1}}),cycle={};cycle.self=cycle;Object.freeze(cycle);
const symbolic=Object.freeze(Object.defineProperty({a:1},Symbol('s'),{value:2,enumerable:true}));
const hidden=Object.freeze(Object.defineProperty({a:1},'secret',{value:2,enumerable:false}));
const live={a:{genome,list:[genome,{n:-0}]},m:new Map([['x',{genome}],[genome,1]]),s:new Set([genome,{k:1}]),t:new Float64Array([1,-0,3]),u:undefined,shallow,cycle,symbolic,hidden};
live.self=live;Object.defineProperty(live.a,'__proto__',{value:{p:1},enumerable:true,writable:true,configurable:true});
const copy=independentSnapshotCopy(live),reference=structuredClone(live);
assert.ok(isDeepStrictEqual(copy,reference),'same content as structuredClone');assert.equal(snapshotSignature(copy),snapshotSignature(reference),'same order and aliases as structuredClone');
assert.equal(copy.a.genome,genome,'deeply frozen objects are shared');assert.equal(copy.m.get('x').genome,genome);assert.ok(copy.m.has(genome));
assert.notEqual(copy.a,live.a);assert.notEqual(copy.t,live.t);assert.equal(copy.self,copy,'cycles map to the copy');
assert.notEqual(copy.shallow,shallow,'shallowly frozen objects with mutable children are copied');assert.notEqual(copy.shallow.mutable,shallow.mutable);
assert.notEqual(copy.cycle,cycle,'frozen cycles are copied, not shared');assert.notEqual(copy.symbolic,symbolic,'symbol keys are not carried by sharing');assert.notEqual(copy.hidden,hidden,'hidden properties are not carried by sharing');
assert.equal(Object.getOwnPropertySymbols(copy.symbolic).length,0);assert.equal(copy.hidden.secret,undefined);
live.a.list[1].n=5;live.m.get('x').extra=1;live.t[0]=9;assert.ok(isDeepStrictEqual(copy,reference),'later live edits cannot reach the copy');
// Owned subtrees pass through unchanged.
const fresh={rows:[1,2]},withFresh=independentSnapshotCopy({fresh},{owned:[fresh]});assert.equal(withFresh.fresh,fresh);
// Anything outside the supported shapes falls back to structuredClone of the whole value.
class Thing{constructor(){this.v=1}}const buffer=new ArrayBuffer(16);
for(const odd of [{x:new Thing()},{x:[1,,3]},{x:Object.defineProperty({},'g',{get:()=>1,enumerable:true})},{a:new Uint8Array(buffer,0,4),b:new Uint8Array(buffer,4,4)},{x:new DataView(new ArrayBuffer(4))}]){
 const fallback=independentSnapshotCopy(odd),expected=structuredClone(odd);assert.ok(isDeepStrictEqual(fallback,expected));assert.equal(snapshotSignature(fallback),snapshotSignature(expected))}
assert.throws(()=>independentSnapshotCopy({f:()=>1}),/could not be cloned/,'uncloneable values still fail as structuredClone does');
// A real simulation: identical complete state, and the copy is independent of later ticks.
const sim=new Simulation('SNAPSHOT-COPY-PARITY',{player:true});for(let i=0;i<60;i++)sim.update(null);
const captured=createSimulationSnapshot(sim,{reason:'copy',savedAt:'fixed'}),published=independentSnapshotCopy(captured,{owned:[captured.controllers.dispersal.floraState.seeds]});
const atCapture=structuredClone(captured),signature=snapshotSignature(atCapture);assert.equal(snapshotSignature(published),signature);
for(let i=0;i<12;i++)sim.update(null);assert.equal(snapshotSignature(published),signature,'published checkpoint is unchanged by later ticks');
const a=restoreDetachedSimulationSnapshot(published),b=restoreDetachedSimulationSnapshot(atCapture);for(let i=0;i<12;i++){a.update(null);b.update(null)}
assert.equal(snapshotSignature(createSimulationSnapshot(a,{reason:'c',savedAt:'f'})),snapshotSignature(createSimulationSnapshot(b,{reason:'c',savedAt:'f'})),'restored continuation is identical');
console.log('Snapshot copy: structuredClone parity, shared deep-frozen values, independence, owned pass-through and unsupported-shape fallback PASS');
