import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG,PLANTS} from '../src/sim/config.js';
import {PLANT_LIFECYCLE,lifecycleLosses,canFlower} from '../src/ecology/plant-lifecycle.js';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// plant-lifecycle/1 is an opt-in candidate (creator evaluation pending): it is
// not recorded by default and changes nothing unless enabled.
const world=on=>new Simulation('PLANET-OBS-2',{player:false,worldGenerator:'planetary/1',...(on?{plantLifecycle:true}:{})});
assert.equal(world(false).plantLifecycleRules,undefined,'default worlds do not adopt the candidate');
const sim=world(true);assert.equal(sim.plantLifecycleRules,PLANT_LIFECYCLE.policy);

// Mechanisms: drought stress follows moisture mismatch; senescence follows the
// plant's own growth rate; flowering needs a suitable site.
const p=PLANTS.marshroot;
assert.equal(lifecycleLosses(1,p,p.waterNeed).stress,0,'a plant in its own moisture is not stressed');
assert.ok(lifecycleLosses(1,p,p.waterNeed-.5).stress>lifecycleLosses(1,p,p.waterNeed-.2).stress,'stress grows with mismatch');
assert.ok(lifecycleLosses(1,PLANTS.sunmoss,.5).senescence>lifecycleLosses(1,PLANTS.woodspire,.5).senescence,'fast groundcover turns over faster than woody tissue');
assert.equal(canFlower('marshroot',p.waterNeed,p.waterNeed,.58),true);assert.equal(canFlower('marshroot',p.waterNeed,.05,.58),false,'no flowering on the wrong ground');

// Natural run: integrity holds; tissue turnover reaches litter.
const initial=sim.animals.filter(a=>a.alive).length;for(let d=0;d<8;d++){for(let t=0;t<CFG.dayTicks;t++)sim.update(null);checkEcologicalIntegrity(sim,initial)}
assert.ok(sim.world.plantResources.totals.senescence>0&&sim.world.plantResources.totals.plantLitter>0);

// Saves record the policy exactly; unknown values are rejected; absent stays absent.
const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})),back=restoreSimulationSnapshot(structuredClone(snap));
assert.equal(back.plantLifecycleRules,PLANT_LIFECYCLE.policy);assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),snap);
const old=structuredClone(snap);delete old.core.plantLifecycleRules;assert.equal(restoreSimulationSnapshot(old).plantLifecycleRules,undefined);
const bad=structuredClone(snap);bad.core.plantLifecycleRules='immortal/9';assert.throws(()=>restoreSimulationSnapshot(bad),/Unknown plant lifecycle/);
console.log('Plant lifecycle PASS: opt-in only, drought stress and growth-tied senescence, site-dependent flowering, natural integrity with tissue turnover, exact save and policy validation.');
