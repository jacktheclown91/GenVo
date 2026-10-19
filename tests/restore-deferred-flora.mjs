import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const source=fs.readFileSync(new URL('../docs/performance/save-manager-before-deferred-flora.txt',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'05e1d59993d90447d5208d1920608dde3b3c19724fe88be54190d784c07c0a12');
const base=new URL('../src/persistence/save-manager.js',import.meta.url);
const previous=await import('data:text/javascript;base64,'+Buffer.from(source.replace(/from '([^']+)'/g,(_,s)=>'from '+JSON.stringify(new URL(s,base).href))+'\n//# sourceURL=deferred-flora-reference.js').toString('base64'));
const snap=s=>structuredClone(createSimulationSnapshot(s,{reason:'deferred-flora',savedAt:'fixed'}));
const same=(a,b,label)=>assert.ok(isDeepStrictEqual(a,b),label);
for(const generator of ['freshwater/1','coastal/1','planetary/1']){
 const sim=new Simulation('DEFERRED-FLORA',{player:false,worldGenerator:generator});for(let t=0;t<CFG.dayTicks*2;t++)sim.update(null);
 const saved=snap(sim);
 for(const mode of ['current','no-controller','old-flora']){
  const fixture=mode==='old-flora'?snap(new Simulation('DEFERRED-FLORA',{player:false,worldGenerator:generator})):structuredClone(saved);
  if(mode==='no-controller')delete fixture.controllers.dispersal;
  if(mode==='old-flora'){delete fixture.controllers.dispersal.floraState;delete fixture.controllers.dispersal.botanical;delete fixture.controllers.dispersal.seedReserve;delete fixture.controllers.dispersal.coatReserve;}
  const old=previous.restoreSimulationSnapshot(structuredClone(fixture)),next=restoreSimulationSnapshot(structuredClone(fixture));
  same(snap(old),snap(next),generator+' '+mode+' entire restored state');
  for(let t=0;t<CFG.dayTicks;t++){old.update(null);next.update(null)}
  same(snap(old),snap(next),generator+' '+mode+' full-day continuation');
  const kind='bramble',i=next.world.plants[kind].findIndex(v=>v>.02);assert.ok(i>=0);
  old.world.consume(kind,i%old.world.n,(i/old.world.n)|0,.01);next.world.consume(kind,i%next.world.n,(i/next.world.n)|0,.01);
  same(snap(old),snap(next),'crop-consumption callback and resource boundary remain attached to restored controller');
 }
 const invalid=structuredClone(saved);invalid.controllers.dispersal.seedReserve.bramble=new Float32Array(1);
 assert.throws(()=>previous.restoreSimulationSnapshot(structuredClone(invalid)),/Invalid crop tissue state/);assert.throws(()=>restoreSimulationSnapshot(structuredClone(invalid)),/Invalid crop tissue state/);
}
console.log('Deferred restore flora PASS: frozen reference, three generators, saved/missing/legacy flora, entire state and next-day parity, harvest callbacks and malformed-state rejection');
