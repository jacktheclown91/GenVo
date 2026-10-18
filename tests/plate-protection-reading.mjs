import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {plateProtectionReading,planProtectionInPlay} from '../src/lineage/protection-reading.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// The plate readout must say exactly what the damage authority does: the same bite through
// tryKill is reduced when (and only when) the readout calls the plates protective.

const PLATES=[{partId:'armor-plate',parent:'root',socket:'flank.left'},{partId:'armor-plate',parent:'root',socket:'flank.right'}];
const placements=a=>a.bodyPlan.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
function withPlates(a){const plan=makePlan([...placements(a).filter(p=>!p.socket?.startsWith('flank')),...PLATES]);assert.ok(validatePlan(plan).ok);return plan}
function bite(seed,prepare){
  const sim=new Simulation(seed,{player:true}),p=sim.player(),h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');sim.endOpeningGrace('test');
  prepare(sim,p);p.health=100;p.dir=2;h.x=p.x+.8;h.y=p.y;
  let n=0;const old=sim.rng.chance;sim.rng.chance=()=>n++===0;try{sim.tryKill(h,p)}finally{sim.rng.chance=old}
  return{sim,p,damage:sim.lastPlayerDamage,reading:plateProtectionReading(p)};
}

// 1. Plates gained through the evolution path express Hardened Mantle and really protect.
const evolved=bite('GENVO8-PLATE-EVOLVED',(sim,p)=>{assert.ok(applyLineageTarget(p,withPlates(p)))});
assert.ok(evolved.p.adaptations.includes('hardened-mantle'),'mounting plates through the lineage path expresses the mantle');
assert.equal(evolved.reading.protective,true);assert.equal(evolved.reading.source,'hardened-mantle');
assert.ok(evolved.damage.mantleReduction>0,'the authority reduced the real bite');
assert.match(evolved.reading.detail,/26% less/,'stated reduction matches adaptationEffects (0.74)');

// 2. Plates on a body without the trait: readout says not protective, and the bite is not reduced.
const bare=bite('GENVO8-PLATE-BARE',(sim,p)=>{p.bodyPlan=withPlates(p);p.adaptations=(p.adaptations||[]).filter(id=>id!=='hardened-mantle')});
assert.equal(bare.reading.protective,false);assert.match(bare.reading.label,/no Hardened Mantle/);assert.match(bare.reading.detail,/not expressed/);assert.match(bare.reading.detail,/upkeep still applies/);
assert.equal(bare.damage.mantleReduction,0,'no reduction, exactly as the readout says');
assert.ok(bare.damage.amount>evolved.damage.amount,'the same bite hurts more without the expressed trait');

// 3. No plates and no mantle: nothing to explain.
const plain=bite('GENVO8-PLATE-PLAIN',()=>{});assert.equal(plain.reading,null);

// 4. Lab/editor projection uses the same lineage path.
const sim=new Simulation('GENVO8-PLATE-PLAN',{player:true}),p=sim.player();
assert.equal(planProtectionInPlay(withPlates(p))?.protective,true,'a plated plan protects in play');
assert.equal(planProtectionInPlay(makePlan(placements(p))),null,'an unplated plan has no plate reading');

// 5. Wild bodies are read relative to their species' founding body, like partEffectFactors.
const wild=sim.animals.find(a=>a.alive&&a.species==='mosskip');const extra=makePlan([...placements(wild).filter(n=>!n.socket?.startsWith('flank')),...PLATES]);
assert.ok(validatePlan(extra).ok);const wildPlated={...wild,bodyPlan:extra};const wr=plateProtectionReading(wildPlated);
assert.equal(wr.source,'species-relative');assert.equal(wr.protective,true);assert.match(wr.detail,/founding body/);

// 6. Reading is pure; old observations without a species say so instead of guessing.
const before=JSON.stringify(bare.p);plateProtectionReading(bare.p);assert.equal(JSON.stringify(bare.p),before,'readout mutates nothing');
assert.equal(plateProtectionReading({bodyPlan:withPlates(p),adaptations:[]}).protective,null);
sim.discovery.noteCreatureAppearance(wild);assert.equal(sim.discovery.observedBodies.at(-1).species,'mosskip','new observations record the species');


// 7. Save/load keeps protective, non-protective and historical states exactly, and running the
// restored world afterwards grants or removes no trait.
{
  const sim=new Simulation('GENVO8-PLATE-SAVE',{player:true}),p=sim.player();
  const others=sim.animals.filter(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);const [evolvedAdult,plainAdult]=others;
  p.bodyPlan=withPlates(p);p.adaptations=(p.adaptations||[]).filter(id=>id!=='hardened-mantle');   // historical mismatch
  assert.ok(applyLineageTarget(evolvedAdult,withPlates(evolvedAdult)));                            // evolved, protective
  sim.discovery.observedBodies=[{id:999,name:'Old record',bodyPlan:withPlates(p),adaptations:[],genes:{...p.genes},anatomy:{},day:1}];
  const read=s=>[s.player(),s.animals.find(a=>a.id===evolvedAdult.id),s.animals.find(a=>a.id===plainAdult.id)].map(a=>({adapt:[...(a.adaptations||[])].sort(),r:plateProtectionReading(a)?.label??null}));
  const before=read(sim),oldBefore=plateProtectionReading(sim.discovery.observedBodies[0]).label;
  assert.deepEqual(before.map(x=>x.r),[`Plates don't protect · no Hardened Mantle`,'Plates protect · Hardened Mantle',null]);
  const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{reason:'test',savedAt:'2026-10-14T12:00:00.000Z'})));
  assert.deepEqual(read(restored),before,'save/load keeps every protection state and trait list');
  assert.equal(plateProtectionReading(restored.discovery.observedBodies[0]).label,oldBefore,'an old observation without species stays unrecorded');
  for(let i=0;i<240;i++)restored.update(null);
  assert.deepEqual(read(restored).map(x=>[x.adapt.includes('hardened-mantle'),x.r]),before.map(x=>[x.adapt.includes('hardened-mantle'),x.r]),'30 simulated seconds after loading, no mantle was granted or removed');
}

// 8. Real births through Simulation.spawnFundedOffspring (recombined parent plans, inherited anatomy,
// reconcileTraits + applyLineageTarget) always match the Lab's in-play projection of the
// child's own plan, including mixed plated x unplated parents.
{
  const sim=new Simulation('GENVO8-PLATE-BIRTHS',{player:true}),mother=sim.player(),father=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.sex!==mother.sex);
  const tally={protective:0,plain:0};
  const pairs=[['mixed',()=>{applyLineageTarget(mother,withPlates(mother));father.adaptations=(father.adaptations||[]).filter(i=>i!=='hardened-mantle')}],
               ['both plated',()=>{applyLineageTarget(mother,withPlates(mother));applyLineageTarget(father,withPlates(father))}],
               ['historical mismatch parent',()=>{mother.bodyPlan=withPlates(mother);mother.adaptations=mother.adaptations.filter(i=>i!=='hardened-mantle')}]];
  for(const [label,prepare] of pairs){prepare();
    for(let i=0;i<40;i++){
      const [child]=sim.spawnFundedOffspring(mother,father,[mother,father],{count:1,x:mother.x,y:mother.y,energyBudget:60,hydrationBudget:60});assert.ok(child,'a real funded birth occurred');
      const plates=child.bodyPlan.nodes.some(n=>n.partId==='armor-plate'),mantle=child.adaptations.includes('hardened-mantle');
      assert.equal(plates,mantle,`${label}: newborn ${child.id} carries plates exactly when it expresses the mantle`);
      const lab=planProtectionInPlay(child.bodyPlan),actual=plateProtectionReading(child);
      assert.equal(lab?.protective??null,actual?.protective??null,`${label}: Lab projection matches newborn ${child.id}`);
      tally[mantle?'protective':'plain']++;child.alive=false;
    }
  }
  assert.ok(tally.protective>0&&tally.plain>0,'mixed parents produce both protected and unprotected offspring: '+JSON.stringify(tally));
}
console.log('Plate protection readout matches the damage authority (evolved mantle, bare plates, wild relative, lab projection, old observations, save/load, real mixed-parent births): PASS');
