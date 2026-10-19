// Detached regional restoration owns the clone of world arrays, so runtime
// buffers may be adopted once. Public/ordinary save restores remain defensive.
// No biological rule, random draw, save schema, or rare seed amount changes.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,restoreDetachedSimulationSnapshot} from '../src/persistence/save-manager.js';

const snap=sim=>structuredClone(createSimulationSnapshot(sim,{reason:'owned-world-buffer-parity',savedAt:'fixed'}));
const eq=(a,b,label)=>assert.ok(isDeepStrictEqual(a,b),label);
for(const generator of ['freshwater/1','planetary/1']){
 const original=new Simulation('OWNED-WORLD-BUFFER-'+generator,{player:true,worldGenerator:generator});
 for(let i=0;i<CFG.lifeStride+8;i++)original.update(null);
 if(generator==='planetary/1'){
  original.planetaryRegions.neighbor(original.world.regionOrigin,'east',{create:true});
  original.planetaryRegions.neighbor(original.world.regionOrigin,'north',{create:true});
 }
 const source=snap(original),untouched=structuredClone(source);
 const baseline=restoreSimulationSnapshot(structuredClone(source));
 const owned=restoreDetachedSimulationSnapshot(source);
 eq(snap(owned),snap(baseline),generator+' full world and all surveyed-region state is exact');
 eq(source,untouched,'restoring cannot change source arrays or metadata');
 const worlds=[owned.world,...(owned.planetaryRegions?.entries()||[]).map(e=>e.world).filter(w=>w!==owned.world)];
 const references=[baseline.world,...(baseline.planetaryRegions?.entries()||[]).map(e=>e.world).filter(w=>w!==baseline.world)];
 assert.equal(worlds.length,references.length);
 for(let i=0;i<worlds.length;i++){
  const w=worlds[i],ref=references[i];
  for(const kind of Object.keys(w.plants)){
   assert.equal(w[kind],w.plants[kind],'resource alias is restored for '+kind);
   assert.notEqual(w.plants[kind],ref.plants[kind],'different loaded worlds own their own plant arrays');
  }
  eq(w.plants,ref.plants,'plant stock is exactly retained in region '+i);
  eq(w.seedBank,ref.seedBank,'seed-bank stock is exactly retained in region '+i);
  eq(w.freshwaterFood,ref.freshwaterFood,'aquatic producers are exact in region '+i);
  eq(w.moisture,ref.moisture,'climate stocks are exact in region '+i);
 }
 const kept=snap(owned);
 source.world.moisture[0]=.99;
 const kind=Object.keys(source.world.plants)[0];
 source.world.plants[kind][0]=.17;
 source.world.terrain.elevation[0]+=1;
 for(const region of source.regionalWorlds||[])region.world.moisture[0]=.09;
 eq(snap(owned),kept,'caller edits to cloned input cannot change restored runtime');
 baseline.player()?.id; // ordinary restore and owned restore continue identically
 for(let i=0;i<CFG.lifeStride+8;i++){baseline.update(null);owned.update(null)}
 eq(snap(owned),snap(baseline),'real ecological continuation remains exactly equivalent for '+generator);
}
console.log('Detached owned world arrays: exact state, source isolation, alias wiring, surveyed worlds, climate and real ecological continuation PASS');
