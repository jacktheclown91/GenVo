import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {setProto} from '../src/lineage/readings.js';
const sim=new Simulation('PROTO-NEUTRAL-PARENTAL',{player:false,bootstrap:false});
const a=sim.spawnAnimal('genvo',32,32),b=sim.spawnAnimal('genvo',33,32),outsider=sim.spawnAnimal('genvo',34,32);
setProto(a,{id:'dryland-skin',strength:.55,populationKey:'home',populationLabel:'Home',originPopulationKey:'home',lineageDepth:2});
setProto(b,{id:'range-sense',strength:.42,populationKey:'outer',populationLabel:'Outer',originPopulationKey:'outer',lineageDepth:3});
let pop={key:'home',label:'Home'};sim.protoSpeciation.sourcePopulationFor=()=>pop;
sim.populationMemory.profile=()=>{throw Error('pressure profile consulted by inheritance')};
const child=(parents,generation=2)=>{const c={id:100+sim.rng.state,alive:true,species:'genvo',generation,anatomy:{},adaptations:[]};sim.protoSpeciation.onBirth(c,parents);return c};
const pure=child([a,outsider]),t=sim.protoSpeciation.traitFor(pure);
assert.equal(t.id,'dryland-skin');assert.equal(t.strength,.55);assert.equal(t.inheritanceState,'inherited-neutral');assert.equal(t.lineageDepth,3);
const seen=new Set();for(let i=0;i<64;i++){const c=child([a,b]),r=sim.protoSpeciation.traitFor(c);seen.add(r.id);assert.ok(['dryland-skin','range-sense'].includes(r.id));assert.equal(r.strength,r.id==='dryland-skin'?.55:.42,'parental strength is neither boosted, weakened nor stacked');assert.equal(r.sourceParentId,r.id==='dryland-skin'?a.id:b.id)}
assert.equal(seen.size,2,'both parental determinants are selectable');
pop={key:'new-region',label:'New region'};const migrant=child([pure,outsider],1),r=sim.protoSpeciation.traitFor(migrant);
assert.equal(r.populationKey,'new-region');assert.equal(r.originPopulationKey,'home');assert.equal(r.strength,.55,'migration cannot instruct weakening');assert.match(sim.protoSpeciation.chipText(migrant),/INHERITED/);assert.match(sim.protoSpeciation.revealText(migrant),/environmental pressure did not select/);
assert.equal(sim.protoSpeciation.onBirth({generation:99,anatomy:{}},[outsider,outsider]),null,'population need cannot create missing traits');
assert.ok([pure,migrant].every(c=>c.species==='genvo'),'inherited traits do not declare a new species');
console.log('proto parental gene flow: both sources, unchanged strength, no pressure input, early inheritance and origin-preserving migration PASS');
