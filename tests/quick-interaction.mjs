import assert from 'node:assert/strict';
import {QuickInteractionSelection} from '../src/ui/quick-interaction.js';
const actor={},sim={player:()=>actor},q=new QuickInteractionSelection(),fruit={key:'fruit',label:'Eat fruit',enabled:true,target:{kind:'plant',i:1}},seed={key:'seed',label:'Crush seeds',enabled:true,target:{kind:'plant',i:1}},drink={key:'water',label:'Drink',enabled:true,target:{kind:'water',i:2}};
assert.equal(q.resolve(sim,()=>[fruit,seed]).key,'fruit');q.remember(sim,fruit);assert.equal(q.cycle(sim,[fruit,seed,drink]).key,'seed');assert.equal(q.cycle(sim,[fruit,seed,drink]).key,'water');assert.equal(q.resolve(sim,t=>t.i===2?[drink]:[fruit]).key,'water');
assert.equal(q.resolve(sim,()=>[fruit]).enabled,false,'missing selected water does not redirect to unrelated fruit');const disabled={...drink,enabled:false,reason:'Water is unreachable'};assert.equal(q.resolve(sim,()=>[disabled]).reason,'Water is unreachable');assert.equal(q.cycle(sim,[fruit]).key,'fruit','Q explicitly chooses a new target');
q.resolve({player:()=>({})},()=>[]);assert.equal(q.choice,null,'world/actor changes release keyboard intention');
console.log('Deterministic quick-action cycling, exact selection, unavailable reasons and actor/world reset PASS');
