// climate-water/1 (morphology S5): evaporation potential follows temperature above
// freezing instead of a fixed floor. Checks the law, that only worlds recording the
// rule carry it in their daily climate, that the real soil-water step stays
// conserved while cool, wet days now recharge groundwater and shed runoff, saves,
// and that recorded worlds keep the original formula exactly.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CLIMATE_WATER,SOIL_WATER,evaporationPotential} from '../src/ecology/soil-water.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const close=(x,y,label,tol=1e-12)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${label}: ${x} vs ${y}`);
// 1. The law: nothing evaporates at or below freezing; 0.085 per temperature unit above it.
{
 const rule={evaporation:CLIMATE_WATER.policy};
 assert.equal(evaporationPotential(rule,.2),0);assert.equal(evaporationPotential(rule,CLIMATE_WATER.freezing),0);
 close(evaporationPotential(rule,.8),.085*.5,'warm day');close(evaporationPotential(rule,1),.085*.7,'equatorial summer');
 close(evaporationPotential({},.5),SOIL_WATER.potentialBase+SOIL_WATER.potentialTemp*.5,'original formula without the rule');
 assert.ok(evaporationPotential(rule,.55)<evaporationPotential({},.55),'a temperate day evaporates less than the fixed floor allowed');
}
// 2. Only worlds recording the rule carry it in their daily climate.
const opts={player:true,dayClock:true,metabolism:true,worldGenerator:'planetary/1'};
const plain=new Simulation('CLIMATE-WATER',opts),ruled=new Simulation('CLIMATE-WATER',{...opts,climateWater:true});
plain.phaseClimate();ruled.phaseClimate();
assert.equal(plain.climateWaterRules,undefined);assert.equal(plain.climate.evaporation,undefined,'recorded worlds keep an unchanged climate');
assert.equal(ruled.climateWaterRules,CLIMATE_WATER.policy);assert.equal(ruled.climate.evaporation,CLIMATE_WATER.policy);
assert.deepEqual({...ruled.climate,evaporation:undefined},{...plain.climate,evaporation:undefined},'the rule changes nothing else about the weather');
assert.throws(()=>new Simulation('CLIMATE-WATER-BAD',{...opts,climateWater:'climate-water/9'}),/Unknown climate water policy/);
// 3. The real soil step: the same cool, wet days on identical worlds. With the rule less water
// evaporates, more percolates to groundwater and more leaves as runoff; every day still closes.
{
 const run=climate=>{const sim=new Simulation('CLIMATE-WATER-SOIL',opts),w=sim.world,rows=[];
  for(let d=0;d<20;d++){sim.climate={...climate};sim.tickCount=0;sim.phaseSoil();rows.push(w.soilWater.lastDay);sim.day++}
  const sum=k=>rows.reduce((t,r)=>t+(r[k]||0),0);return{rows,evaporation:sum('evaporation'),percolation:sum('percolation'),runoff:sum('runoff'),rain:sum('rain'),maxClosure:Math.max(...rows.map(r=>Math.abs(r.closure)))}};
 const base={temp:.45,rain:.9,weatherFactor:1},old=run(base),now=run({...base,evaporation:CLIMATE_WATER.policy});
 close(now.rain,old.rain,'same rain',1e-9);
 assert.ok(now.evaporation<old.evaporation*.6,`less evaporation on cool days: ${now.evaporation.toFixed(1)} vs ${old.evaporation.toFixed(1)}`);
 assert.ok(now.percolation>old.percolation&&now.runoff>old.runoff,'surplus recharges groundwater and runs off');
 assert.ok(now.maxClosure<1e-5&&old.maxClosure<1e-5,`daily water balance closes (${now.maxClosure.toExponential(1)})`);
 // Below freezing nothing evaporates from the soil at all.
 const frozen=run({temp:.1,rain:.5,weatherFactor:1,evaporation:CLIMATE_WATER.policy});assert.equal(frozen.evaporation,0);
}
// 4. Saves keep the rule; a climate that disagrees with its rule, or an unknown rule, is refused.
{
 const snap=structuredClone(createSimulationSnapshot(ruled,{savedAt:'fixed',reason:'climate-water'})),back=restoreSimulationSnapshot(structuredClone(snap));
 assert.equal(back.climateWaterRules,CLIMATE_WATER.policy);assert.equal(back.climate.evaporation,CLIMATE_WATER.policy);
 const bad=structuredClone(snap);bad.core.climateWaterRules='climate-water/9';assert.throws(()=>restoreSimulationSnapshot(bad),/climate water/);
 const plainSnap=structuredClone(createSimulationSnapshot(plain,{savedAt:'fixed',reason:'climate-water'}));plainSnap.core.climate={...plainSnap.core.climate,evaporation:CLIMATE_WATER.policy};
 assert.throws(()=>restoreSimulationSnapshot(plainSnap),/disagrees with its recorded climate water rule/);
}
console.log('Climate water /1 PASS: evaporation zero at freezing and 0.085 per unit above, rule carried only by recording worlds, conserved soil days with less evaporation and more recharge and runoff on cool wet days, saves, recorded worlds unchanged');
