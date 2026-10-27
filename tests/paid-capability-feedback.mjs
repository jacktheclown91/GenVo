import assert from 'node:assert/strict';
import {surfaceIceCovered} from '../src/world/surface-ice.js';
import {canTreeClimb} from '../src/lineage/gliding.js';
import {canSwim,canOccupy} from '../src/lineage/lifestyle.js';
import {thermalCoverFactor} from '../src/lineage/terrain-cover-physiology.js';
import {visionProfile} from '../src/lineage/vision.js';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {buildYoungSummary} from '../src/ui/young-summary.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Explicitly controlled authored parents and initial adult placement/reserves.
// Actual one-shot paid conception and normal gestation; no child, preference,
// mutation chance, ecological resource or biological-clock intervention.
const variants={
  climbing:{shape:ns=>ns.map(n=>({...n,partId:n.partId==='walking-leg'?'climber-leg':n.partId})),claim:/paired climbing legs/},
  swimming:{shape:ns=>ns.map(n=>({...n,partId:n.partId==='walking-leg'?'webbed-leg':n.partId})),claim:/swimming anatomy/},
  insulation:{shape:ns=>[...ns,{partId:'fur-mantle',parent:'root',socket:'dorsal'}],claim:/less heat loss.*more heat strain/},
  eyes:{shape:ns=>ns.map(n=>({...n,partId:n.partId==='simple-eye'?'telescopic-eye':n.partId})),claim:/eyes can see farther/}
};
let unchangedChildren=0;
const snapshot=sim=>structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'paid-capability-feedback'}));
for(const [kind,fixture] of Object.entries(variants)){
  const sim=new Simulation('PAID-CAPABILITY-'+kind+'-0',{player:false,bootstrap:false,worldGenerator:'planetary/1',dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,tissueEnergy:true});
  const point=sim.safeSpawn('genvo',sim.pickHabitatCenter('genvo'));
  const mother=sim.spawnAnimal('genvo',point.x,point.y),father=sim.spawnAnimal('genvo',point.x+.1,point.y);
  for(const [i,a] of [mother,father].entries())Object.assign(a,{sex:i?'M':'F',age:SPECIES.genvo.maturity+3,energy:SPECIES.genvo.maxEnergy,hydration:SPECIES.genvo.maxHydration,health:100,infected:false,reproCooldown:0});
  const plan=makePlan(fixture.shape(founderPlan().nodes));assert.ok(validatePlan(plan).ok);
  applyLineageTarget(father,plan);placeSupportedBreedingPair(sim,mother,father,{developDays:0});
  const before=mother.energy+father.energy;
  assert.ok(sim.conceptionAvailability(mother,father).enabled);
  assert.ok(sim.tryMate(mother,father),'The selected controlled pair actually accepts canonical conception');
  assert.ok(mother.pregnant);assert.ok(mother.energy+father.energy<before,'Conception pays actual reserves');
  const pregnancy=snapshot(sim);assert.deepEqual(snapshot(restoreSimulationSnapshot(pregnancy)),pregnancy);
  let ticks=0;while(mother.alive&&mother.pregnant&&ticks<6000){sim.update(null);ticks++}
  assert.ok(ticks>0&&mother.alive&&!mother.pregnant);
  const children=sim.animals.filter(a=>a.parentIds?.includes(mother.id)&&a.parentIds?.includes(father.id));
  assert.ok(children.length);assert.ok(children.every(c=>c.bodyInheritance&&validatePlan(c.bodyPlan).ok));
  const saved=snapshot(sim),summary=buildYoungSummary(sim,mother,children);
  assert.ok(summary.highlights.some(h=>fixture.claim.test(h.text)),kind+' explanation follows a genuinely born inherited capability');
  const carriers=summary.young.filter(y=>y.capabilities.some(text=>fixture.claim.test(text)));
  for(const record of carriers){
    const child=children.find(c=>c.id===record.id);
    if(kind==='climbing'){assert.equal(canTreeClimb(sim,mother),false);assert.ok(canTreeClimb(sim,child));}
    if(kind==='swimming'){
      assert.ok(canSwim(child));assert.equal(canSwim(mother),false);
      const water=sim.world.water.findIndex((wet,i)=>wet&&sim.world.isPlayable(i%sim.world.n+.5,Math.floor(i/sim.world.n)+.5)&&!surfaceIceCovered(sim.world.environment,i));assert.ok(water>=0,'Fixture has actual playable open water; no boundary or ice override');
      const x=water%sim.world.n+.5,y=Math.floor(water/sim.world.n)+.5;
      assert.ok(canOccupy(child,sim.world,x,y));assert.equal(canOccupy(mother,sim.world,x,y),false);
    }
    if(kind==='insulation'){
      assert.ok(thermalCoverFactor(child,.2,.55)<thermalCoverFactor(mother,.2,.55));
      assert.ok(thermalCoverFactor(child,.8,.55)>thermalCoverFactor(mother,.8,.55));
    }
    if(kind==='eyes'){
      assert.ok(visionProfile(child).range>visionProfile(mother).range);
      assert.ok(visionProfile(child).fieldOfView<visionProfile(mother).fieldOfView);
    }
  }

  unchangedChildren+=summary.young.filter(y=>y.capabilities.length===0).length;
  for(const h of summary.highlights)for(const id of h.ids)
    assert.ok(summary.young.find(y=>y.id===id).capabilities.includes(h.text),'Every displayed carrier is real');
  assert.deepEqual(snapshot(sim),saved,'Summary and highlights change no saved state');
  const restored=restoreSimulationSnapshot(saved);assert.deepEqual(snapshot(restored),saved);
  for(let step=0;step<6;step++){sim.update(null);restored.update(null)}
  assert.deepEqual(snapshot(restored),snapshot(sim),'Paid-born bodies and ecology continue exactly after restore');
  console.log(kind+': paid conception, '+ticks+' normal gestation ticks, '+children.length+' actual children, truthful highlights and exact continuation');
}
assert.ok(unchangedChildren>0,'The real litters include unchanged offspring with no promised upgrade; no per-litter outcome quota');
console.log('Paid capability feedback PASS: actual inherited climbing, swimming, insulation tradeoff and eyes; unchanged siblings, costs, real carrier counts, no forged offspring.');
