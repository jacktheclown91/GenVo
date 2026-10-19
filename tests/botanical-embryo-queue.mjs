// Regression for many developing embryos and ordered completion receipts.
// This test deliberately stages valid embryo stocks to isolate the queue
// lifecycle. It makes no claim about autonomous mating or population success.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {advanceBotanicalReproduction} from '../src/ecology/botanical-reproduction.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('BOTANICAL-QUEUE-INTEGRATION',{player:false});
sim.phaseClimate();
sim.phaseVegetation();
const d=sim.dispersal,b=d.botanical,w=sim.world;
const flower=[...b.flowers.values()].find(f=>w.plants[f.kind][f.i]>.002);
assert.ok(flower,'test needs an actual funded parent flower');
const e=(n,createdEpoch)=>({
 kind:flower.kind,i:flower.i,mass:.0002+(n%4)*.00001,
 genome:flower.genome,createdEpoch,producerId:flower.producerId,
 parentGenomeId:flower.genome.id,parentGenomeIds:[flower.genome.id,flower.genome.id],
 parentProducerIds:[flower.producerId,flower.producerId],
 selfing:true,homozygosity:0.5,mode:'sexual',fixtureId:n
});
// All staged amounts are finite and supported by a real standing plant.
// Embryos whose createdEpoch matches the newly advanced epoch are deferred.
const due=Array.from({length:64},(_,n)=>e(n,b.epoch));
const pending=Array.from({length:18},(_,n)=>e(n+100,b.epoch+1));
b.embryos=[...due.slice(0,32),...pending,...due.slice(32)];
const startRng=sim.rng.state,startEpoch=b.epoch;
const beforeCompleted=b.stats.viable+b.stats.nonviable;
advanceBotanicalReproduction(d);
assert.equal(b.epoch,startEpoch+1);
assert.ok(due.every(o=>!b.embryos.includes(o)),'every due embryo completes once');
assert.ok(pending.every(o=>b.embryos.includes(o)),'not-yet-due embryos survive');
const currentPending=b.embryos.filter(o=>o.fixtureId!=null);
assert.deepEqual(currentPending,pending,'pending stock insertion order is preserved');
assert.equal(b.stats.viable+b.stats.nonviable-beforeCompleted,64,'one real viability decision per due embryo');
assert.ok(b.receipts.length<=128,'receipt history remains bounded while completion counters retain all decisions');
assert.equal(sim.rng.state,startRng,'genetic botanical processing does not perturb animal RNG');
const saved=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'embryo-queue'}));
const loaded=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(structuredClone(createSimulationSnapshot(loaded,{savedAt:'fixed',reason:'embryo-queue'})),saved,
 'pending embryos and all seed/genome stores survive exact snapshot restoration');
advanceBotanicalReproduction(d);
advanceBotanicalReproduction(loaded.dispersal);
assert.deepEqual(
 structuredClone(createSimulationSnapshot(loaded,{savedAt:'fixed',reason:'embryo-queue'})),
 structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'embryo-queue'})),
 'pending embryos continue identically after a full save');
assert.ok(pending.every(o=>!b.embryos.includes(o)),'all deferred staged embryos eventually complete');
console.log('Ordered botanical embryo queue, delayed release, genotype receipts, animal RNG and full save continuation PASS');
