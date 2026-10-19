// Freeze pre-optimization arithmetic as a direct reference. Every surviving
// rare cohort amount, insertion order and metadata must remain identical.
import assert from 'node:assert/strict';
import {scaleSeedCohorts,chooseSeedCohort} from '../src/ecology/flora-inheritance.js';
import {founderFloraGenome} from '../src/ecology/flora-genotype.js';

const sum=rows=>{let v=0;for(const r of rows.values())v+=r.amount;return v};
function fixture(stock,initial,day=1){
  const kind='bramble',i=7,field=new Float32Array(32);field[i]=stock;
  const rows=new Map(initial.map(([id,amount,extra])=>[id,{amount,...extra}]));
  const d={sim:{day,world:{seedHash:492837}},bankGenomes:{[kind]:new Map()},
    floraState:{seeds:{[kind]:new Map([[i,rows]])},genomes:new Map(
      initial.map(([id])=>[id,{id}]))},seedBank:k=>field};
  return{kind,i,field,d,rows};
}
function referenceReconcile(f){
  const {d,kind,i,field}=f;let r=d.floraState.seeds[kind].get(i);
  if(!r){r=new Map();d.floraState.seeds[kind].set(i,r)}
  const stock=field[i],total=sum(r);
  if(Math.abs(stock-total)>1e-7){
    if(stock<=0)r.clear();
    else if(total>0){const scale=stock/total;for(const c of r.values())c.amount*=scale}
    else r.set(founderFloraGenome(kind).id,{amount:stock,originCell:i,route:'legacy-bank'});
  }
  return r;
}
function referenceScale(f,next){
  const records=referenceReconcile(f),before=sum(records),scale=before>0?next/before:0;
  for(const c of records.values())c.amount*=scale;
}
function hash(x){x|=0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);return(x^(x>>>16))>>>0}
function referenceChoose(f){
  const records=referenceReconcile(f),total=sum(records),{d,i}=f;
  let draw=(hash(d.sim.world.seedHash^Math.imul(i+1,7919)^Math.imul(d.sim.day+1,104729))>>>0)/4294967296*total;
  for(const [id,c] of records){draw-=c.amount;if(draw<=0)return{id,record:c,genome:d.floraState.genomes.get(id)}}
  return null;
}
const tiny=2**-140; // Positive Float32 subnormal, retained exactly in the bank.
const cases=[
  {name:'single coherent',stock:.6,rows:[['a',Math.fround(.6),{route:'gut'}]],next:Math.fround(.6)*.982},
  {name:'multi coherent',stock:1,rows:[['a',.2,{originCell:2}],['b',.3,{originCell:3}],['c',.5,{originCell:4}]],next:.982},
  {name:'rounding tolerant',stock:.5,rows:[['a',.1,{mode:'sexual'}],['b',.40000003,{route:'gut'}]],next:.482},
  {name:'reconciliation drift',stock:.8,rows:[['a',.3,{depositIds:[1]}],['b',.2,{depositIds:[9]}]],next:.74},
  {name:'empty stock',stock:0,rows:[['a',.2,{mode:'sexual'}]],next:0},
  {name:'stock without cohorts',stock:.25,rows:[],next:.2},
  {name:'rare positive',stock:tiny,rows:[['a',tiny/3,{originCell:1}],['b',tiny*2/3,{originCell:2}]],next:tiny*.982},
  {name:'zero record retained',stock:.5,rows:[['a',0,{mode:'clonal'}],['b',.5,{mode:'sexual'}]],next:.49}
];
for(const example of cases){
  const a=fixture(example.stock,example.rows),b=fixture(example.stock,example.rows);
  referenceScale(a,example.next);scaleSeedCohorts(b.d,b.kind,b.i,example.next);
  assert.deepEqual([...b.rows],[...a.rows],example.name+' cohort records match the frozen arithmetic exactly');
  const original=referenceChoose(a),now=chooseSeedCohort(b.d,b.kind,b.i);
  assert.deepEqual(now,original,example.name+' deterministic selected cohort and metadata match');
  assert.deepEqual([...b.rows],[...a.rows],example.name+' post-selection ledger remains equal');
}
// JavaScript Set iteration visits every surviving original element even if
// the currently visited one is removed. Active sets need no copying.
const old=new Set([3,6,9,12]),direct=new Set(old),visitedOld=[],visitedNew=[];
for(const i of [...old]){visitedOld.push(i);if(i===3||i===9)old.delete(i)}
for(const i of direct){visitedNew.push(i);if(i===3||i===9)direct.delete(i)}
assert.deepEqual(visitedNew,visitedOld);
assert.deepEqual([...direct],[...old]);
console.log('Seed stream parity: exact floating point decay, corrected totals, rare cohorts, deterministic choice and deletion-safe traversal PASS');
