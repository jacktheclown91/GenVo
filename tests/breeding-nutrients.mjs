// grazing-nutrients/1 and breeding-support/2 (stabilization, October 30).
// Checks: digested plant minerals return to the soil only under the rule (crop
// coat and carried seeds excluded); a short field keeps far more minerals; the
// vegetation step records measured regrowth and breeding support reads it; each
// body's need follows its measured spending; save, restore and continuation are
// exact; worlds without the rules are unchanged.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {PLANTS} from '../src/sim/config.js';
import {GRAZING_NUTRIENTS} from '../src/ecology/grazing-nutrients.js';
import {BREEDING_SUPPORT,breedingNeed,renewableSupply} from '../src/ecology/breeding-support.js';
import {dailyMetabolicNeed} from '../src/ecology/resource-founding.js';
import {regrowthPerCell} from '../src/ecology/plant-regrowth.js';
import {toAbsolute} from '../src/organisms/body-size.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const base={player:true,worldGenerator:'planetary/1',regionalFrontier:true,autonomousPopulations:true,dayClock:true,metabolism:true,climateWater:true};
const both={...base,grazingNutrients:true,breedingSupport:BREEDING_SUPPORT.measured};
const days=(sim,n)=>{for(let d=0;d<n;d++){const day=sim.day;while(sim.day===day)sim.update(null)}};
const sum=a=>{let n=0;for(const v of a)n+=v;return n};
const ecosystemMinerals=sim=>{const w=sim.world;let plants=0;for(const k of Object.keys(PLANTS))if(w.plants[k])plants+=sum(w.plants[k]);return sum(w.plantResources.minerals)+(plants+sum(sim.dispersal.litter)+sum(w.carrion))*.1};

// 1. The rule: digested tissue returns its minerals where the animal fed; nothing without it.
{
 const ruled=new Simulation('NUTRIENTS-1',both),plain=new Simulation('NUTRIENTS-1',base);
 assert.equal(ruled.grazingNutrientRules,GRAZING_NUTRIENTS.policy);assert.equal(plain.grazingNutrientRules,undefined);
 for(const sim of [ruled,plain]){const w=sim.world,i=w.idx(40.5,40.5),before=w.plantResources.minerals[i];
  sim.history.notePlantConsumption('sunmoss',40.5,40.5,.2,.15);sim.history.notePlantConsumption('rotcap',40.5,40.5,.1);
  const gained=w.plantResources.minerals[i]-before;
  if(sim===ruled)assert.ok(Math.abs(gained-.025)<1e-12,`digested sunmoss and rotcap return 0.1 mineral per biomass (${gained})`);
  else assert.equal(gained,0,'without the rule nothing returns')}
}
// 2. A short field: the ecosystem keeps far more of its minerals with the rule.
{
 const loss=opts=>{const sim=new Simulation('NUTRIENTS-FIELD',opts);sim.setPlayerAutonomy(true);const start=ecosystemMinerals(sim);days(sim,20);return start-ecosystemMinerals(sim)};
 const without=loss(base),withRule=loss(both);
 assert.ok(without>0,`without the rule grazing drains minerals (${without.toFixed(1)})`);
 assert.ok(withRule<without*.5,`with it far less is lost (${withRule.toFixed(1)} against ${without.toFixed(1)} in 20 days)`);
 console.log(`  minerals lost in 20 days: ${without.toFixed(1)} without, ${withRule.toFixed(1)} with grazing nutrients`);
}
// 3. Measured regrowth and spending feed breeding support; 4. exact save and continuation.
{
 const sim=new Simulation('BREEDING-2',both);sim.setPlayerAutonomy(true);days(sim,4);
 const g=sim.world.plantResources.regrowth;assert.equal(sim.breedingSupportRules,BREEDING_SUPPORT.measured);
 assert.ok(g&&g.days>=3,'the vegetation step records measured regrowth');
 const a=sim.animals.find(x=>x.alive&&!x.player&&x.spendDays>0&&x.spendRate>0);assert.ok(a,'bodies measure their spending');
 assert.ok(Math.abs(breedingNeed(a,sim)-toAbsolute(a,a.spendRate)*BREEDING_SUPPORT.reproductiveMargin)<1e-9,'need is measured spending times the margin');
 assert.ok(breedingNeed(a,sim)<dailyMetabolicNeed(a.species,a,sim)*BREEDING_SUPPORT.reproductiveMargin,'which is below the /1 allowance');
 const supply=sim.carrying.surveyAt(a),row=supply.rows.find(r=>!r.wet&&PLANTS[r.kind]);
 assert.ok(row&&regrowthPerCell(sim.world,row.kind,row.x,row.y)!==null,'survey samples read measured regrowth');
 const measured=renewableSupply(sim,a,supply);sim.breedingSupportRules=BREEDING_SUPPORT.policy;const logistic=renewableSupply(sim,a,supply);sim.breedingSupportRules=BREEDING_SUPPORT.measured;
 assert.ok(Number.isFinite(measured)&&measured!==logistic,`production is measured, not the logistic estimate (${measured.toFixed(2)} against ${logistic.toFixed(2)})`);
 const snap=createSimulationSnapshot(sim,{savedAt:'fixed',reason:'breeding-nutrients'}),pristine=structuredClone(snap),back=restoreSimulationSnapshot(structuredClone(snap));
 assert.equal(back.grazingNutrientRules,GRAZING_NUTRIENTS.policy);assert.equal(back.breedingSupportRules,BREEDING_SUPPORT.measured);
 days(sim,2);days(back,2);
 assert.ok(isDeepStrictEqual(sim.world.plantResources.regrowth,back.world.plantResources.regrowth),'restored regrowth record continues exactly');
 assert.ok(sum(sim.world.plantResources.minerals)===sum(back.world.plantResources.minerals),'restored minerals continue exactly');
 const ids=sim.animals.filter(x=>x.alive).map(x=>[x.id,x.spendRate,x.spendDays]),backIds=back.animals.filter(x=>x.alive).map(x=>[x.id,x.spendRate,x.spendDays]);
 assert.deepEqual(backIds,ids,'restored spending continues exactly');
 const bad=structuredClone(pristine);bad.core.grazingNutrientRules='grazing-nutrients/9';assert.throws(()=>restoreSimulationSnapshot(bad),/grazing nutrient/);
}
// 5. Worlds without the rules keep no new state.
{
 const plain=new Simulation('BREEDING-2',base);plain.setPlayerAutonomy(true);days(plain,2);
 assert.equal(plain.world.plantResources.regrowth,undefined,'no regrowth record without breeding-support/2');
 assert.ok(plain.animals.every(a=>a.spendRate===undefined&&a.spendMark===undefined),'no spending fields without it');
 assert.equal(plain.world.plantResources.totals.excretedMinerals,undefined,'no excreted minerals without grazing nutrients');
}
console.log('Breeding nutrients PASS: digested minerals return under grazing-nutrients/1 and the ecosystem keeps them; breeding-support/2 reads measured regrowth and measured spending; exact save and continuation; unchanged without the rules');
