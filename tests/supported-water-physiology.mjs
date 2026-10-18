import {birthRuleMigrationMessage} from '../src/lineage/birth-rules.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan,bodyPlanFromLegacy} from '../src/lineage/body-plan.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {canSwim} from '../src/lineage/lifestyle.js';
import {adaptationCarryChance} from '../src/lineage/heredity.js';
import {syncAnatomy,refreshExpression} from '../src/lineage/evolution.js';
import {paternalInheritance} from '../src/ecology/gestation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const parts=n=>n.bodyPlan.nodes.map(x=>x.partId),base=founderPlan();
const plan=(count,sacs=false)=>{let k=0;return makePlan([...base.nodes.map(n=>({...n,partId:n.socket?.startsWith('limb.')&&k++<count?'webbed-leg':n.partId})),...(sacs?[{partId:'storage-sac',parent:'root',socket:'flank.left'}]:[])])};
for(const [count,sacs] of [[0,false],[1,false],[2,false],[0,true],[2,true]]){
 const a={alive:true,adaptations:[],anatomy:{}};assert.ok(applyLineageTarget(a,plan(count,sacs)));syncAnatomy(a);refreshExpression(a);
 assert.equal(a.adaptations.includes('webbed-limbs'),count>=2);assert.equal(a.adaptations.includes('water-sacs'),sacs);assert.equal(canSwim(a),count>=2);
 assert.equal(bodyPlanFromLegacy(a).nodes.some(n=>n.partId==='storage-sac'),sacs,'fallback read adapter must honor independent physiology');
 assert.equal(adaptationCarryChance('water-sacs',a,a),sacs?1:0);
}
const sim=new Simulation('SUPPORTED-WATER-BIRTH',{player:false,bootstrap:false});sim.bodyVariationChance=0;
const m=sim.spawnAnimal('genvo',32,32),f=sim.spawnAnimal('genvo',33,32);for(const p of [m,f])applyLineageTarget(p,plan(2));
for(let generation=0;generation<3;generation++){
 const [a,b]=sim.spawnFundedOffspring(m,f,[m,f],{count:2,x:32,y:32,energyBudget:24,hydrationBudget:24});
 for(const c of [a,b]){assert.ok(canSwim(c));assert.equal(c.adaptations.includes('water-sacs'),false);assert.equal(parts(c).includes('storage-sac'),false);assert.deepEqual(c.legacyWaterPhysiology,[])}
 // Controlled inheritance probe, not normal growth/gestation proof.
 Object.assign(m,{bodyPlan:a.bodyPlan,anatomy:a.anatomy,adaptations:a.adaptations});Object.assign(f,{bodyPlan:b.bodyPlan,anatomy:b.anatomy,adaptations:b.adaptations});
}
// Historical anatomy-only physiology stays on existing organisms and can be inherited
// explicitly; it cannot manufacture a missing sac or webbed structure.
for(const p of [m,f]){p.bodyPlan=founderPlan();p.anatomy={waterBody:.9};p.adaptations=['water-sacs','webbed-limbs'];delete p.legacyWaterPhysiology}
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'supported-water'}));
const old=snapshot(sim);old.core.birthRules.anatomyProjection='legacy-axis/1';const original=structuredClone(old.animals),r=restoreSimulationSnapshot(old);assert.deepEqual(r.animals,original);assert.match(birthRuleMigrationMessage(r),/Future offspring/);
const [rm,rf]=r.animals;const [legacy]=r.spawnFundedOffspring(rm,rf,[paternalInheritance(rm),paternalInheritance(rf)],{count:1,x:32,y:32,energyBudget:12,hydrationBudget:12});
assert.ok(canSwim(legacy));assert.ok(legacy.adaptations.includes('water-sacs'));assert.deepEqual(new Set(legacy.legacyWaterPhysiology),new Set(['water-sacs','webbed-limbs']));assert.equal(parts(legacy).includes('storage-sac'),false);assert.equal(parts(legacy).includes('webbed-leg'),false,'legacy ability does not fabricate anatomy');
assert.deepEqual(paternalInheritance(legacy).legacyWaterPhysiology,legacy.legacyWaterPhysiology);
const resumed=restoreSimulationSnapshot(snapshot(r));assert.equal(birthRuleMigrationMessage(resumed),null,'current-rule reload does not repeat migration');for(let i=0;i<12;i++){r.update(null);resumed.update(null)}assert.deepEqual(snapshot(r),snapshot(resumed));
console.log('supported water physiology: independent structure/expression, repeated offspring without phantom organs, preserved explicit legacy inheritance and exact resume PASS');
