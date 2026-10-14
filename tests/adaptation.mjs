import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {dominantTraits,compareGenes,traitListText} from '../src/lineage/adaptation.js';

{
  const animal={genes:{body:1.10,motion:1.08,metabolism:.98,digestion:1,senses:1.06,climate:1,immunity:1,temperament:.94}};
  const traits=dominantTraits(animal,{limit:3});
  assert.equal(traits.length,3);
  assert.ok(traits.some(t=>t.phrase==='larger body'));
  assert.ok(traits.some(t=>t.phrase==='faster movement'));
  assert.match(traitListText(traits),/larger body|faster movement/);
}

{
  const base={body:1,motion:1,metabolism:1,digestion:1,senses:1,climate:1,immunity:1,temperament:1};
  const next={...base,motion:1.07,senses:1.05,temperament:.95};
  const shifts=compareGenes(next,base,{limit:4});
  assert.ok(shifts.find(x=>x.key==='motion'&&x.phrase==='faster movement'));
  assert.ok(shifts.find(x=>x.key==='temperament'&&x.phrase==='more cautious and solitary'));
}

{
  const sim=new Simulation('GENVO8-ADAPTATION-HANDOFF',{player:true});
  const founder=sim.player();
  const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==founder.id&&!a.lineage);
  assert.ok(mate);
  const child=sim.spawnAnimal('genvo',founder.x+.2,founder.y+.2,[founder,mate]);
  child.age=SPECIES.genvo.maturity;
  child.genes={...founder.genes,motion:Math.min(1.28,founder.genes.motion+.08),senses:Math.min(1.28,founder.genes.senses+.06)};
  sim.lineage.registerBirth(child,[founder,mate]);
  assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true);
  const h=sim.lineage.lastHandoff();
  assert.equal(h.to,child.id);
  assert.ok(h.changes.some(x=>x.key==='motion'));
  assert.ok(Array.isArray(h.founderChanges));
}

{
  const sim=new Simulation('GENVO8-ADAPTATION-GEN8',{player:true});
  let active=sim.player();
  const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==active.id&&!a.lineage);
  for(let generation=2;generation<=8;generation++){
    const child=sim.spawnAnimal('genvo',active.x+.2,active.y+.2,[active,mate]);
    child.age=SPECIES.genvo.maturity;
    sim.lineage.registerBirth(child,[active,mate]);
    assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true);
    active=child;
  }
  const h=sim.lineage.lastHandoff();
  assert.equal(h.generation,8);
  assert.equal(h.newlyEstablished,true);
  assert.equal(sim.lineage.established,true);
}

console.log('adaptation readability checks: PASS');
