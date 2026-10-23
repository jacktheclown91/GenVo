import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {METABOLISM,basalScale,conditionSpeed,conditionRecovery,starvationDamage,thirstDamage} from '../src/ecology/metabolism-policy.js';
import {BIO_STEPS_PER_DAY} from '../src/sim/day-clock.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Real daily needs (creator decision 2026-10-23): a healthy resting adult starves in about 14-21
// days and dies of thirst in about 3-5, under shared physiology; penalties start before death;
// recorded worlds are unchanged. Physiology is measured directly (metabolism steps only), so
// behaviour cannot hide or cause the result.
const v1=()=>new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,worldGenerator:'planetary/1'});
// Days until death of the active adult at rest, refilling one resource each step to isolate the other.
function daysToDeath(sim,{refill}){
 for(let t=0;t<CFG.bioStride*2&&!sim.climate;t++)sim.update(null);const a=sim.player(),s=SPECIES[a.species];a.energy=s.maxEnergy*.9;a.hydration=s.maxHydration*.9;a.health=100;
 let steps=0;while(a.health>0&&steps<BIO_STEPS_PER_DAY*40){sim.climate.temp=.55;// comfortable, as in the reference
  if(refill==='water')a.hydration=s.maxHydration;else a.energy=s.maxEnergy;sim.phaseMetabolism();steps++}
 return steps/BIO_STEPS_PER_DAY;
}
// 1. Recorded worlds: exactly the old physiology.
{
 const old=new Simulation('GENVO8-TEST-A',{player:true,worldGenerator:'planetary/1'}),a=old.player();
 assert.deepEqual(basalScale(old,a),{energy:1,water:1});assert.deepEqual([starvationDamage(old),thirstDamage(old),conditionSpeed(old,a),conditionRecovery(old,a)],[1.1,1.55,1,1]);
}
// 2. Fasting limits at rest, from typical reserves.
{
 const food=daysToDeath(v1(),{refill:'water'}),water=daysToDeath(v1(),{refill:'energy'});
 assert.ok(food>=14&&food<=21,`starvation at rest in ${food.toFixed(1)} days`);
 assert.ok(water>=3&&water<=5,`thirst at rest in ${water.toFixed(1)} days`);
 console.log(`  resting adult from 90% reserves: starves in ${food.toFixed(1)} days, dies of thirst in ${water.toFixed(1)} days`);
}
// 3. Penalties before death, and the same rule for every organism.
{
 const sim=v1(),a=sim.player(),s=SPECIES[a.species];
 a.energy=s.maxEnergy*.9;a.hydration=s.maxHydration*.9;assert.equal(conditionSpeed(sim,a),1);assert.equal(conditionRecovery(sim,a),1);
 a.energy=s.maxEnergy*.1;assert.ok(conditionSpeed(sim,a)<1&&conditionRecovery(sim,a)<1,'a starving body is slower and recovers its breath more slowly');
 a.energy=0;assert.equal(conditionSpeed(sim,a),METABOLISM.weakSpeed);
 const wild=sim.animals.find(x=>x.alive&&!x.player&&x.species!=='genvo');wild.energy=0;assert.equal(conditionSpeed(sim,wild),METABOLISM.weakSpeed,'wildlife follows the same rule');
 assert.ok(basalScale(sim,wild).energy>1,'wild resting costs are raised too');
}
// 4. Saves keep the rules; recorded saves stay recorded.
{
 const sim=v1(),back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})));
 assert.equal(back.metabolismRules,METABOLISM.policy);
 const old=new Simulation('GENVO8-TEST-A',{player:true,worldGenerator:'planetary/1'});assert.equal(restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(old,{savedAt:'t',reason:'t'}))).metabolismRules,undefined);
}
console.log('Metabolism policy PASS: recorded physiology unchanged; resting fasting limits in range; penalties before death; shared by wildlife; saved.');
