import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';
import fs from 'node:fs';
const policy=fs.readFileSync(new URL('../docs/EMERGENT_EVOLUTION_AND_TEST_POLICY.md',import.meta.url),'utf8');
assert.match(policy,/guarantees causal biological rules, not biological outcomes/i);
assert.match(policy,/legitimate emergent outcome/i);
// Different world seeds may disagree; identical seeds must retain deterministic core state.
const first=new Simulation('DIVERGENCE-CONTRACT-A',{player:false});
const twin=new Simulation('DIVERGENCE-CONTRACT-A',{player:false});
const other=new Simulation('DIVERGENCE-CONTRACT-B',{player:false});
const initial=first.animals.filter(a=>a.alive).length;
assert.equal(initial,twin.animals.filter(a=>a.alive).length);
const before=new Float32Array(first.world.fertility);
assert.deepEqual(first.world.fertility,twin.world.fertility);
assert.notDeepEqual(before,other.world.fertility,'different starting worlds may have genuinely different habitats');
for(let i=0;i<80;i++){first.update(null);twin.update(null);other.update(null)}
assert.deepEqual(first.population(),twin.population(),'same-seed deterministic population');
assert.deepEqual(first.world.fertility,twin.world.fertility,'same-seed deterministic habitat');
checkEcologicalIntegrity(first,initial);
checkEcologicalIntegrity(other,other.animals.filter(a=>a.alive).length-other.stats.births+other.stats.deaths);
// No requirements on mating, particular species survival, digging, or colonization counts.
console.log('emergent-contracts: deterministic mechanics, finite accounting, and unrestricted outcomes PASS');
