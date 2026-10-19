import {provideRootFood} from './helpers/finite-root-food.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {SOIL_DISTURBANCE,pruneRecoveredSoil,recordSoilDig} from '../src/ecology/soil-disturbance.js';
import {drawDisturbedSoil} from '../src/render/soil-activity.js';
import {CFG} from '../src/sim/config.js';

function pairedWorld(seed){
 const candidate=new Simulation(seed,{player:false});
 const actor=candidate.animals.find(a=>a.alive&&a.species==='rootling');
 assert.ok(actor,'An autonomous digger exists');
 const w=candidate.world;
 const x=48,y=48,i=w.idx(x,y);
 assert.equal(w.water[i],0,'The experimental cell must be exposed land');
 actor.x=x+.2;actor.y=y+.2;actor.energy=10;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const k=w.idx(x+dx,y+dy);
  w.plants.thistlepod[k]=0;w.seedBank.thistlepod[k]=0;
  candidate.dispersal.active.thistlepod.delete(k);
 }
 w.moisture[i]=.25;w.fertility[i]=.80;candidate.climate={temp:.58,rain:.4};
 const snapshot=structuredClone(createSimulationSnapshot(candidate));
 return{engineered:restoreSimulationSnapshot(structuredClone(snapshot)),control:restoreSimulationSnapshot(structuredClone(snapshot)),x,y,i,actorId:actor.id};
}

const results=[];
for(const seed of ['SOIL-PILOT-A','SOIL-PILOT-B']){
 const {engineered,control,x,y,i,actorId}=pairedWorld(seed);
 const baselineRng=engineered.rng.state;
 let successfulDigs=0;
 for(let day=1;day<=13;day++){
  for(const sim of [engineered,control]){sim.day=day;sim.tickCount=day*CFG.dayTicks}
  if(day===1||day===7||day===13){
   const digger=engineered.animals.find(a=>a.id===actorId);
   // Matched externally supplied food fixture isolates soil work from nutrition.
   // Both arms consume the same finite meal; only the digger disturbs soil.
   const ordinary=control.animals.find(a=>a.id===actorId);
   for(const [sim,actor] of [[engineered,digger],[control,ordinary]])provideRootFood(sim,actor);
   const normalMeal=control.partAbilities.rootMealAt(ordinary);assert.ok(normalMeal);assert.ok(control.foraging.consume(ordinary,normalMeal).ok);
   const result=engineered.partAbilities.dig(digger);
   assert.equal(result.ok,true,`Actual anatomy-gated dig at day ${day}: ${result.message}`);
   successfulDigs++;
  }
  if(day===13){
   for(const sim of [engineered,control]){
    assert.equal(sim.world.seedBank.thistlepod[i],0,'Experimental patch still seedless before arrival');
    assert.ok(sim.dispersal.deposit('thistlepod',x,y,1)>0,'Propagules are introduced by canonical dispersal');
   }
  }
  engineered.phaseVegetation();control.phaseVegetation();
 }
 const strength=engineered.partAbilities.disturbedSoilAt(x,y);
 assert.ok(strength>0&&strength<1,'Repeated completed work maintains a finite habitat modifier');
 const engineeredPlant=engineered.world.plants.thistlepod[i],controlPlant=control.world.plants.thistlepod[i];
 const engineeredBank=engineered.world.seedBank.thistlepod[i],controlBank=control.world.seedBank.thistlepod[i];
 assert.ok(engineeredPlant>controlPlant,`Plant establishment must rise with digging: ${engineeredPlant} vs ${controlPlant}`);
 assert.ok(engineeredBank<controlBank,'Germination spends additional real deposited seed, not invented resources');
 assert.ok(engineeredBank>=0&&controlBank>=0);
 assert.equal(engineered.rng.state,baselineRng,'Digging and vegetation need no main simulation RNG');
 assert.equal(control.rng.state,baselineRng);
 const snapshot=structuredClone(createSimulationSnapshot(engineered));
 const restored=restoreSimulationSnapshot(snapshot);
 assert.equal(restored.partAbilities.disturbedSoilAt(x,y),strength,'Soil response survives the world snapshot');
 assert.equal(restored.world.plants.thistlepod[i],engineeredPlant);

 const calls=[];
 const c={save:()=>calls.push('save'),restore:()=>calls.push('restore'),fillRect:(...r)=>calls.push(r),set fillStyle(value){calls.push(value)}};
 assert.equal(drawDisturbedSoil(c,{records:engineered.partAbilities.soilDisturbance,cell:i,day:13,x,y,px:0,py:0,u:2}),true,'Live sprite presents canonical disturbance');
 assert.ok(calls.length>4);
 const noRng=engineered.rng.state;
 const noState=structuredClone(engineered.partAbilities.soilDisturbance);
 assert.equal(drawDisturbedSoil(c,{records:engineered.partAbilities.soilDisturbance,cell:i,day:140,x,y,px:0,py:0,u:2}),false,'Fully recovered ground has no visible excavation');
 assert.deepEqual(engineered.partAbilities.soilDisturbance,noState,'Rendering is observational');
 assert.equal(engineered.rng.state,noRng);
 restored.day=140;
 restored.partAbilities.advanceSoilDay();
 assert.equal(restored.partAbilities.disturbedSoilAt(x,y),0);
 assert.equal(restored.partAbilities.soilDisturbance.has(i),false,'Expired soil patches are retired from saves');
 results.push({seed,digs:successfulDigs,disturbance:Number(strength.toFixed(3)),establishmentGainPct:Number(((engineeredPlant/controlPlant-1)*100).toFixed(3)),seedDebitGain:Number((controlBank-engineeredBank).toFixed(6))});
}
const records=new Map();
recordSoilDig(records,8,2,1);assert.equal(pruneRecoveredSoil(records,2),0);
assert.equal(pruneRecoveredSoil(records,2+SOIL_DISTURBANCE.recoveryDays),1);
assert.equal(pruneRecoveredSoil(records,100),0,'Pruning is idempotent');
assert.equal(pruneRecoveredSoil(undefined,100),0,'Migrated controllers may have no soil map');
console.log('multi-seed paired successful digging, seed-funded plant response, no RNG, visual decay, save/resume and pruning: PASS');
console.log(JSON.stringify(results,null,2));
