// diurnal-temperature/1: air warms by day and cools by night around each cell's
// daily mean, widely on dry ground and little over water. Metabolism's 8 daily
// samples average back to the mean exactly; animals feel the hour (afternoon heat
// costs more water than night on hot dry ground); recorded worlds are unchanged.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {dayTicksFor,BIO_STEPS_PER_DAY} from '../src/sim/day-clock.js';
import {DIURNAL,timeOfDay,diurnalOffset,airTemperature,dayPhaseOf} from '../src/ecology/diurnal-temperature.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const close=(x,y,label,tol=1e-12)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${label}: ${x} vs ${y}`);
const opts={player:true,dayClock:true,metabolism:true,aridPhysiology:true};
const sim=new Simulation('DIURNAL',{...opts,diurnal:true}),w=sim.world,day=dayTicksFor(sim);
assert.equal(sim.diurnalRules,DIURNAL.policy);assert.throws(()=>new Simulation('DIURNAL-BAD',{...opts,diurnal:'x'}),/Unknown diurnal/);
const at=f=>{sim.tickCount=Math.round(f*day)};
// 1. Shape: warmest mid-afternoon, coldest before dawn; dry ground swings widely, water little.
{
 const land=[...Array(w.len).keys()].find(i=>!w.water[i]),wet=[...Array(w.len).keys()].find(i=>w.water[i]);
 w.moisture[land]=0;at(DIURNAL.peak);close(diurnalOffset(sim,land),DIURNAL.wetAmplitude+DIURNAL.dryAmplitude,'dry afternoon peak',1e-4);
 at(DIURNAL.peak+.5);close(diurnalOffset(sim,land),-(DIURNAL.wetAmplitude+DIURNAL.dryAmplitude),'dry pre-dawn low',1e-4);
 w.moisture[land]=1;at(DIURNAL.peak);close(diurnalOffset(sim,land),DIURNAL.wetAmplitude,'wet ground swings little',1e-4);
 if(wet!==undefined){w.moisture[wet]=1;close(diurnalOffset(sim,wet),DIURNAL.wetAmplitude*DIURNAL.waterShare,'open water swings least',1e-4)}
 // The day's eight biological samples average to the daily mean exactly.
 w.moisture[land]=.2;let sum=0;for(let k=0;k<BIO_STEPS_PER_DAY;k++){sim.tickCount=k*day/BIO_STEPS_PER_DAY;sum+=airTemperature(sim,land)}
 close(sum/BIO_STEPS_PER_DAY,w.temperature[land],'daily mean exposure unchanged',1e-6);
 // Day phase (read-only for presentation).
 at(.5);const noon=dayPhaseOf(sim);assert.ok(Object.isFrozen(noon)&&!noon.night);close(noon.daylight,1,'noon');at(.1);assert.ok(dayPhaseOf(sim).night&&dayPhaseOf(sim).daylight===0);
 close(timeOfDay(sim),Math.round(.1*day)/day,'time of day from the tick count');
}
// 2. Animals feel the hour: on hot, dry, waterless ground an afternoon costs more water than a night.
{
 w.water.fill(0);w.buildLandRegions();w.buildHydrology();sim.phaseClimate();
 const a=sim.animals.find(x=>x.alive&&!x.player);sim.animals=[a];a.genes.climate=1;
 Object.assign(a,{age:SPECIES[a.species].maturity+2,health:100,energy:SPECIES[a.species].maxEnergy*.9,intent:'idle',target:null});
 const i=w.idx(a.x,a.y),loss=f=>{at(f);w.temperature[i]=.7;w.moisture[i]=.05;a.hydration=SPECIES[a.species].maxHydration*.8;const h=a.hydration;sim.phaseMetabolism();return h-a.hydration};
 const afternoon=loss(DIURNAL.peak),night=loss(DIURNAL.peak+.5);
 assert.ok(afternoon>night*1.5,`afternoon heat costs more water than night: ${afternoon.toFixed(2)} vs ${night.toFixed(2)}`);
}
// 3. Saves keep the rule; recorded worlds feel only the daily mean.
{
 const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'diurnal'}));assert.equal(restoreSimulationSnapshot(structuredClone(snap)).diurnalRules,DIURNAL.policy);
 snap.core.diurnalRules='diurnal-temperature/9';assert.throws(()=>restoreSimulationSnapshot(snap),/diurnal/);
 const plain=new Simulation('DIURNAL',opts);assert.equal(plain.diurnalRules,undefined);
 for(const f of [.1,.58,.9]){plain.tickCount=Math.round(f*day);assert.equal(airTemperature(plain,5),plain.world.temperature[5]);assert.equal(diurnalOffset(plain,5),0)}
}
console.log('Diurnal temperature /1 PASS: afternoon peak and pre-dawn low, dry ground swings up to +/-0.18, water a quarter as much, eight daily samples average to the mean, day phase, afternoon heat costs more water than night, saves, recorded worlds unchanged');
