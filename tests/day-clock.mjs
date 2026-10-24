import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {DAY_CLOCK,LEGACY_DAY_TICKS,bioFactor,BIO_STEPS_PER_DAY} from '../src/sim/day-clock.js';
import {OFFSCREEN_BIOLOGY} from '../src/world/planetary-offscreen-biology.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {thunderstormInterval} from '../src/ecology/thunderstorms.js';
import {wildfireSpreadInterval,wildfireClockScale} from '../src/ecology/wildfire.js';

// Day clock (creator decision 2026-10-23): 30-second days keep daily biology and real-time
// movement; recorded worlds keep the 6-second day exactly.
const IDLE=Object.freeze({up:false,down:false,left:false,right:false,sprint:false,brace:false});
const make=dayClock=>new Simulation('GENVO8-TEST-A',{player:true,dayClock,worldGenerator:'planetary/1'});
function restBudget(sim){
 const p=sim.player();for(let t=0;t<CFG.dayTicks;t++)sim.update(IDLE);const e=p.energy,w=p.hydration,age=p.age;for(let t=0;t<CFG.dayTicks*3;t++)sim.update(IDLE);
 return{energy:(e-p.energy)/3,water:(w-p.hydration)/3,age:(p.age-age)/3,ticks:CFG.dayTicks};
}
function walkTiles(sim){
 const p=sim.player();let dist=0;const ratio=CFG.controlHz/CFG.simHz;
 for(let t=0;t<CFG.dayTicks;t++){for(let k=0;k<ratio;k++){const x=p.x,y=p.y;sim.playerControlStep({...IDLE,right:(t>>4)%2===0,left:(t>>4)%2===1},CFG.controlHz);dist+=Math.hypot(p.x-x,p.y-y)}sim.update(IDLE)}
 return dist;
}

// 1. Recorded clock: the values every existing world and test relies on.
{
 const legacy=make(false);
 assert.equal(legacy.dayClockRules,undefined);assert.deepEqual([CFG.dayTicks,CFG.bioStride,CFG.lifeStride,bioFactor()],[LEGACY_DAY_TICKS,6,6,1],'recorded worlds keep the 6-second day exactly');
 assert.equal(OFFSCREEN_BIOLOGY.maxEntryTicks,48);
}
// 2. 30-second clock: same daily biology, five times the real time and ground.
{
 const old=restBudget(make(false)),now=restBudget(make(true));
 assert.equal(now.ticks,DAY_CLOCK.secondsPerDay*CFG.simHz);assert.equal(CFG.bioStride,now.ticks/BIO_STEPS_PER_DAY);assert.equal(OFFSCREEN_BIOLOGY.maxEntryTicks,now.ticks,'day-based limits follow the clock');
 assert.ok(Math.abs(now.energy/old.energy-1)<.02&&Math.abs(now.water/old.water-1)<.02,`resting costs per day are unchanged: ${old.energy.toFixed(3)}/${now.energy.toFixed(3)} energy, ${old.water.toFixed(3)}/${now.water.toFixed(3)} water`);
 assert.equal(now.age,old.age,'ageing per day is unchanged');
 const tilesOld=walkTiles(make(false)),tilesNew=walkTiles(make(true));
 assert.ok(tilesNew>tilesOld*4,`a day's walk covers far more ground: ${tilesOld.toFixed(1)} -> ${tilesNew.toFixed(1)} tiles`);
 console.log(`  rest per day ${old.energy.toFixed(3)} -> ${now.energy.toFixed(3)} energy; walk per day ${tilesOld.toFixed(1)} -> ${tilesNew.toFixed(1)} tiles`);
}
// 3. Saves keep each world's clock, and running one world re-applies its own clock.
{
 const fast=make(true);for(let t=0;t<CFG.dayTicks;t++)fast.update(IDLE);const day=fast.day;
 const back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(fast,{savedAt:'t',reason:'t'})));
 assert.equal(back.dayClockRules,DAY_CLOCK.policy);assert.equal(CFG.dayTicks,240);assert.equal(back.day,day);
 const old=make(false);assert.equal(CFG.dayTicks,48);back.update(IDLE);assert.equal(CFG.dayTicks,240,'advancing a world applies its own clock');
 const legacySnap=structuredClone(createSimulationSnapshot(old,{savedAt:'t',reason:'t'}));assert.equal(legacySnap.core.dayClockRules,undefined);
 assert.equal(restoreSimulationSnapshot(legacySnap).dayClockRules,undefined);assert.equal(CFG.dayTicks,48,'recorded worlds restore with their own day');
}
// 4. Wildfire and thunderstorms scale with the day clock to preserve biological disturbance rates.
{
 const legacy=make(false),current=make(true);
 assert.equal(thunderstormInterval(legacy),16,'legacy clock evaluates lightning 3 times per day');
 assert.equal(thunderstormInterval(current),80,'30s clock evaluates lightning 3 times per day');
 assert.equal(wildfireSpreadInterval(legacy),8,'legacy clock checks fire spread 6 times per day');
 assert.equal(wildfireSpreadInterval(current),40,'30s clock checks fire spread 6 times per day');
 assert.equal(wildfireClockScale(legacy),1);
 assert.equal(wildfireClockScale(current),0.2);
}
console.log('Day clock PASS: recorded worlds keep 48 ticks a day; 30-second days keep daily biology, cover more ground, and survive saves.');
