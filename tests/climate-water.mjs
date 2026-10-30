// climate-water/1 (morphology S5): evaporation potential follows temperature above
// freezing instead of a fixed floor. Checks the law, that only worlds recording the
// rule carry it in their daily climate, that the real soil-water step stays
// conserved while cool, wet days now recharge groundwater and shed runoff, saves,
// and that recorded worlds keep the original formula exactly.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CLIMATE_WATER,SOIL_WATER,evaporationPotential,initializeSoilWater} from '../src/ecology/soil-water.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {boundaryOpenness} from '../src/world/planetary-boundary-water.js';

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
// 5. Scenario D, climate-water/2: a rainfall-runoff pool (funded inundation) evaporates on warm,
// dry days, closes its water ledger every day, and recedes back to land through the existing
// funded-channel recession. Under /1 the same pool does not evaporate.
{
 const pool=policy=>{
  const sim=new Simulation('CLIMATE-WATER-POOL',{...opts,climateWater:policy}),w=sim.world;sim.phaseClimate();
  let i=-1;for(let k=w.n*4;k<w.len-w.n*4&&i<0;k++){const x=k%w.n;if(x<4||x>w.n-5||w.water[k])continue;if(w.water[k-1]||w.water[k+1]||w.water[k-w.n]||w.water[k+w.n]){if(!(w.soilWater?.snowpack?.[k]>0))i=k}}
  assert.ok(i>=0,'a land cell beside water');w.environment.overland[i]=.2;w.setSurfaceWater([{i,water:1,depth:.2,salinity:0,source:'overland'}],{reason:'rainfall-runoff-inundation'});
  // Topology changes replace the environment record: always read the current one.
  assert.equal(w.environment.floodOrigin[i],1,'a runoff pool');const start=w.environment.volume[i];let evaporated=0,day=0,worst=0;
  for(;day<40&&w.water[i];day++){sim.climate={temp:.95,rain:.05,weatherFactor:1,...(sim.climateWaterRules?{evaporation:sim.climateWaterRules}:{})};sim.tickCount=0;sim.phaseSoil();
   const row=w.environment.lastDay;evaporated+=row.surfaceEvaporation||0;worst=Math.max(worst,Math.abs(row.waterClosure??0));sim.day++}
  return{start,evaporated,receded:!w.water[i],days:day,worst,volume:w.environment.volume[i]};
 };
 const two=pool(CLIMATE_WATER.pools),one=pool(CLIMATE_WATER.soil);
 assert.ok(two.evaporated>0,'the pool evaporates');assert.ok(two.receded,`the pool dries and recedes to land (${two.days} days)`);
 assert.ok(two.worst<1e-6,`open-water ledger closes every day (${two.worst.toExponential(1)})`);
 assert.equal(one.evaporated,0,'climate-water/1 pools do not evaporate');assert.ok(!one.receded||one.days>two.days,'and do not dry faster');
}
// 6. climate-water/3, river discharge: a runoff pool beside a river that leaves the region
// (the river fills a channel incised by its generated depth, so bankfull water is level with
// the bank)
// drains downstream with it and recedes on cool, dry days in a dry catchment, well before evaporation alone could
// dry it; the water and salt ledgers close every day. Under /2 the pool only evaporates.
{
 const drain=policy=>{
  const sim=new Simulation('CLIMATE-WATER-POOL',{...opts,climateWater:policy}),w=sim.world;sim.phaseClimate();
  // Water bodies (orthogonal neighbours) that reach an open border side.
  const e0=w.environment,body=new Int32Array(w.len).fill(-1),open=[];
  for(let s=0;s<w.len;s++){if(!w.water[s]||body[s]>=0)continue;const id=open.length;let out=false;const stack=[s];body[s]=id;
   while(stack.length){const i=stack.pop();if(e0.boundary[i]&&boundaryOpenness(e0,i,w))out=true;const x=i%w.n;for(const j of [x>0?i-1:-1,x<w.n-1?i+1:-1,i-w.n,i+w.n])if(j>=0&&j<w.len&&w.water[j]&&body[j]<0){body[j]=id;stack.push(j)}}
   open.push(out)}
  let i=-1;for(let k=w.n*4;k<w.len-w.n*4&&i<0;k++){const x=k%w.n;if(x<4||x>w.n-5||w.water[k])continue;
   const wet=[k-1,k+1,k-w.n,k+w.n].filter(j=>w.water[j]);if(wet.length&&wet.every(j=>open[body[j]])&&!(w.soilWater?.snowpack?.[k]>0))i=k}
  assert.ok(i>=0,'a land cell beside a river with an open outlet');
  // A dry catchment, so nothing but the river and the air touches the pool.
  if(!w.soilWater)initializeSoilWater(w);
  for(let k=0;k<w.len;k++)if(!w.water[k]){w.moisture[k]=0;w.soilWater.groundwater[k]=0;e0.overland[k]=0}
  w.environment.overland[i]=.2;
  w.setSurfaceWater([{i,water:1,depth:.2,salinity:0,source:'overland'}],{reason:'rainfall-runoff-inundation'});
  const e=w.environment;assert.equal(e.floodOrigin[i],1,'a runoff pool');let discharged=0,day=0,worst=0,worstSalt=0;
  for(;day<120&&w.water[i];day++){sim.climate={temp:.38,rain:0,weatherFactor:1,...(sim.climateWaterRules?{evaporation:sim.climateWaterRules}:{})};sim.tickCount=0;sim.phaseSoil();
   const row=w.environment.lastDay;discharged+=row.riverDischarge||0;
   worst=Math.max(worst,Math.abs(row.waterClosure??0));worstSalt=Math.max(worstSalt,Math.abs(row.closure));sim.day++}
  // The river body's net water above its generated levels never goes negative.
  const env=w.environment,river=body[[i-1,i+1,i-w.n,i+w.n].find(j=>w.water[j]&&body[j]>=0)];let net=0;for(let k=0;k<w.len;k++)if(w.water[k]&&body[k]===river&&env.floodOrigin[k]!==1)net+=env.volume[k]-(env.ice?.[k]||0)-env.depth[k];
  return{discharged,receded:!w.water[i],days:day,worst,worstSalt,net};
 };
 const three=drain(CLIMATE_WATER.discharge),two=drain(CLIMATE_WATER.pools);
 assert.ok(three.discharged>0,'water leaves downstream');assert.ok(three.receded,`the pool drains and recedes (${three.days} days)`);
 assert.ok(three.worst<1e-6&&three.worstSalt<1e-6,`water and salt ledgers close every day (${three.worst.toExponential(1)}, ${three.worstSalt.toExponential(1)})`);
 assert.ok(three.net>-1e-6,`the river keeps its generated water (${three.net.toExponential(1)})`);
 assert.equal(two.discharged,0,'climate-water/2 does not discharge');assert.ok(!two.receded||two.days>three.days*2,`and its pool lasts far longer (${two.days} days)`);
 console.log(`  discharge: pool receded after ${three.days} days (${two.receded?two.days+' days':'not in '+two.days} under /2), ${three.discharged.toFixed(2)} discharged, river net ${three.net.toFixed(3)} above its generated level`);
}
// 7. climate-water/4, ponded run-on: water ponded on dry land (overland water) evaporates and
// soaks into unsaturated soil instead of waiting indefinitely; saturated soil passes it on
// downhill. Both the soil ledger and the combined open-water and runoff ledger close. Under /3
// the same ponded water never enters the soil.
{
 const pond=policy=>{
  const sim=new Simulation('CLIMATE-WATER-POND',{...opts,climateWater:policy}),w=sim.world;sim.phaseClimate();if(!w.soilWater)initializeSoilWater(w);
  const e=w.environment,dry=[],wet=[];
  for(let k=w.n*4;k<w.len-w.n*4&&(dry.length<20||wet.length<20);k++){const x=k%w.n;if(x<4||x>w.n-5||w.water[k]||w.soilWater.snowpack?.[k]>0)continue;
   if([k-1,k+1,k-w.n,k+w.n].some(j=>w.water[j]))continue;(dry.length<=wet.length?dry:wet).push(k)}
  for(const k of dry){w.moisture[k]=.2;e.overland[k]=.3}
  for(const k of wet){w.moisture[k]=1;w.soilWater.groundwater[k]=1;e.overland[k]=.3}
  const m0=dry.map(k=>w.moisture[k]);
  sim.climate={temp:.5,rain:0,weatherFactor:1,...(sim.climateWaterRules?{evaporation:sim.climateWaterRules}:{})};sim.tickCount=0;sim.phaseSoil();
  const soil=w.soilWater.lastDay,row=w.environment.lastDay;
  return{gained:dry.reduce((s,k,j)=>s+w.moisture[k]-m0[j],0)/dry.length,dryLeft:dry.reduce((s,k)=>s+w.environment.overland[k],0)/dry.length,
   runoff:soil.runoff,runOn:soil.runOn||0,pondedRunOn:row.pondedRunOn||0,soilClosure:Math.abs(soil.closure),waterClosure:Math.abs(row.waterClosure)};
 };
 const four=pond(CLIMATE_WATER.policy),three=pond(CLIMATE_WATER.discharge),wetPonded=20*.3;
 assert.ok(four.runOn>0&&Math.abs(four.runOn-four.pondedRunOn)<1e-9,'ponded water leaves the open-water ledger into the soil ledger');
 assert.ok(four.gained>three.gained+.05,`dry soil takes up ponded water (${four.gained.toFixed(3)} against ${three.gained.toFixed(3)})`);
 assert.ok(four.dryLeft<three.dryLeft,`less water stays ponded on dry land (${four.dryLeft.toFixed(3)} against ${three.dryLeft.toFixed(3)})`);
 assert.ok(four.runoff-three.runoff>wetPonded*.5,`saturated soil passes ponded water on as runoff (${(four.runoff-three.runoff).toFixed(2)} of ${wetPonded.toFixed(1)})`);
 assert.ok(four.soilClosure<1e-5&&four.waterClosure<1e-6,`soil and open-water ledgers close (${four.soilClosure.toExponential(1)}, ${four.waterClosure.toExponential(1)})`);
 assert.equal(three.runOn,0,'climate-water/3 ponded water never enters the soil');
 console.log(`  run-on: dry soil +${four.gained.toFixed(3)} moisture, ponded water ${four.dryLeft.toFixed(3)} left on dry land against ${three.dryLeft.toFixed(3)} under /3`);
}
console.log('Climate water PASS (/1 soil, /2 runoff pools, /3 river discharge, /4 ponded run-on): evaporation zero at freezing and 0.085 per unit above, rule carried only by recording worlds, conserved soil days with less evaporation and more recharge and runoff on cool wet days, saves, recorded worlds unchanged; /2 runoff pools evaporate, close their ledger and recede (Scenario D); /3 runoff pools drain downstream with their rivers and recede on cool days, ledgers closed; /4 ponded water evaporates and soaks into unsaturated soil, saturated soil passes it on, ledgers closed');
