import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {playablePlan} from '../tools/check-playable.mjs';

const all=playablePlan(),key=check=>`${check.mode}:${check.item}`;
assert.equal(all.length,125,'Retain all 124 prior checks plus live mating tutorial guidance');
assert.equal(new Set(all.map(key)).size,all.length,'No duplicated manifest entries');
assert.equal(all[0].item,'src/main.js');
assert.equal(all.at(-1).item,'tests/living-planet-extended.mjs');
assert.ok(all.some(check=>check.item==='tests/reproductive-similarity.mjs'));
assert.ok(all.some(check=>check.item==='tests/autonomous-population-founding.mjs'));
assert.ok(all.some(check=>check.item==='tests/autonomous-policy-compatibility.mjs'));
assert.ok(all.some(check=>check.item==='tests/mating-tutorial-guide.mjs'));
for(const item of ['tests/extinct-lineage-save.mjs','tests/botanical-gamete-parity.mjs','tests/snapshot-signature.mjs','tests/interleaved-day-clock.mjs','tests/care-expression.mjs','tests/spatial-index.mjs'])assert.ok(all.some(check=>check.item===item));
for(const count of [1,2,3,5,all.length]){
  const union=[];
  for(let index=1;index<=count;index++){
    const shard=playablePlan(`${index}/${count}`);
    assert.ok(shard.length>0);
    assert.deepEqual(shard.map(key),all.filter((_,position)=>position%count===index-1).map(key),'Shard keeps canonical relative order');
    union.push(...shard.map(key));
  }
  assert.equal(union.length,all.length);
  assert.deepEqual(union.sort(),all.map(key).sort(),'All original checks run exactly once across workers');
}
for(const shard of ['0/2','3/2','1/0',`1/${all.length+1}`,'1/1.5','-1/2','2','1/9007199254740992'])assert.throws(()=>playablePlan(shard));
for(const shard of [null,'1/2','2/2']){
  const args=['tools/check-playable.mjs','--list',...(shard?[`--shard=${shard}`]:[])];
  const result=spawnSync(process.execPath,args,{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout),playablePlan(shard),'Actual CLI executes the validated plan');
}
for(const args of [['--shard=0/2'],['--unknown'],['--shard=1/2','--shard=2/2'],['--list','--list']]){
  const result=spawnSync(process.execPath,['tools/check-playable.mjs',...args],{encoding:'utf8'});
  assert.notEqual(result.status,0,'Invalid selection fails closed');
}
console.log('Playable CI plan PASS: all 125 checks exactly once, ordered, disjoint shards, actual CLI selection and invalid inputs.');
