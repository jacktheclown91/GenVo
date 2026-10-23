import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {WINTER_WATER,iceBreakLoad,winterWaterTarget,resolveWinterWater} from '../src/ecology/winter-water.js';
import {iceCapacity,surfaceIceCovered} from '../src/world/surface-ice.js';
import {initializeSoilWater} from '../src/ecology/soil-water.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Winter water (creator direction 2026-10-23): when water is frozen, life breaks thin ice or eats
// snow at a real cost, from the world's own ice and snow; thick ice holds; the same rules apply to
// every organism; recorded worlds are unchanged.
const make=(winterWater=true)=>{const sim=new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,winterWater,worldGenerator:'planetary/1'});sim.world.soilWater||initializeSoilWater(sim.world);return sim};
const freeze=(sim,i,thickness)=>{const e=sim.world.environment,t=Math.min(thickness,e.volume[i]-.02);e.iceTotals.frozen+=t-e.ice[i];e.ice[i]=t;e.iceBroken[i]=0;return t};
// A water cell with a playable land cell beside it.
function shore(sim){const w=sim.world;for(let y=4;y<w.n-4;y++)for(let x=4;x<w.n-4;x++){const i=w.idx(x,y);if(!w.water[i]||!(w.environment.volume[i]>.1))continue;
 for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]])if(!w.water[w.idx(x+ox,y+oy)]&&w.isPlayable(x+ox+.5,y+oy+.5))return{i,x,y,lx:x+ox+.5,ly:y+oy+.5}}}
const place=(a,x,y)=>{a.x=x;a.y=y};

// 1. Thin ice gives under a body's load at an energy cost and opens drinkable water.
{
 const sim=make(),w=sim.world,c=shore(sim),a=sim.animals.find(x=>x.alive&&!x.player);
 freeze(sim,c.i,.05);w.buildHydrology();assert.ok(surfaceIceCovered(w.environment,c.i)&&!w.isDrinkable(c.x+.5,c.y+.5),'the sheet seals the water');
 assert.ok(iceBreakLoad(a)>iceCapacity(w.environment,c.i),'a body can break thin ice');
 place(a,c.lx,c.ly);const t=winterWaterTarget(sim,a);assert.equal(t?.breakIce,c.i,'a thirsty animal works the frozen edge');
 a.target=t;a.intent='drink';const energy=a.energy;sim.resolveInteraction(a);
 assert.ok(!surfaceIceCovered(w.environment,c.i)&&w.isDrinkable(c.x+.5,c.y+.5),'the broken ice opens drinkable water');
 assert.ok(Math.abs(energy-a.energy-WINTER_WATER.breakEnergy)<1e-9,'breaking costs effort');assert.equal(sim.stats.winterWater.iceBreaks,1);
}
// 2. Thick midwinter ice holds; the animal pays the attempt, gives up on that sheet for the day and turns to snow.
{
 const sim=make(),w=sim.world,c=shore(sim),a=sim.animals.find(x=>x.alive&&!x.player);
 const t0=freeze(sim,c.i,.3);w.buildHydrology();assert.ok(iceCapacity(w.environment,c.i)>iceBreakLoad(a),'thick ice outweighs the body: '+t0);
 place(a,c.lx,c.ly);a.target=winterWaterTarget(sim,a);a.intent='drink';const energy=a.energy;sim.resolveInteraction(a);
 assert.ok(surfaceIceCovered(w.environment,c.i)&&a.energy<energy,'thick ice holds, the attempt still costs');
 const j=w.idx(c.lx,c.ly);w.soilWater.snowpack[j]=.2;const next=winterWaterTarget(sim,a);assert.ok(next?.snow&&next.breakIce==null,'with that sheet refused it eats snow');
}
// 3. Snow is finite water: what the body gains leaves the snowpack, and melting it costs food energy.
{
 const sim=make(),w=sim.world,a=sim.animals.find(x=>x.alive&&!x.player),s=SPECIES[a.species],j=w.idx(a.x,a.y);
 w.soilWater.snowpack[j]=.05;a.hydration=s.maxHydration*.2;const water=a.hydration,energy=a.energy,snow=.05;
 a.target={x:Math.floor(a.x)+.5,y:Math.floor(a.y)+.5,snow:true};a.intent='drink';place(a,a.target.x,a.target.y);
 assert.ok(resolveWinterWater(sim,a));const gained=a.hydration-water,taken=snow-w.soilWater.snowpack[j];
 assert.ok(gained>0&&Math.abs(gained-taken*WINTER_WATER.hydrationPerSnow)<1e-9,'every unit of hydration came out of the snowpack');
 assert.ok(Math.abs(energy-a.energy-gained*WINTER_WATER.meltEnergyPerWater)<1e-9,'melting snow costs energy in proportion');
 for(let k=0;k<20;k++)resolveWinterWater(sim,{...a,hydration:0,target:{...a.target}});assert.ok(w.soilWater.snowpack[j]>=0,'snow never goes below empty');
 // The daily soil-water ledger counts eaten snow as an output and still closes.
 const eaten=w.soilWater.pendingSnowEaten;assert.ok(Math.abs(eaten-.05+w.soilWater.snowpack[j])<1e-12);
 const d0=w.soilWater.lastDay?.day;for(let t=0;t<CFG.dayTicks*2&&w.soilWater.lastDay?.day===d0;t++)sim.update(null);assert.ok(Math.abs(w.soilWater.lastDay.snowEaten-eaten)<1e-12&&Math.abs(w.soilWater.lastDay.closure)<1e-6,'soil-water closure holds: '+w.soilWater.lastDay.closure);
}
// 4. In a frozen world, thirsty animals find water in ice and snow through the ordinary water route.
{
 const sim=make(),w=sim.world,e=w.environment;sim.setPlayerAutonomy(true);
 for(let i=0;i<w.len;i++)if(w.water[i]&&e.volume[i]>.04)freeze(sim,i,.3);
 for(let i=0;i<w.len;i++)if(!w.water[i])w.soilWater.snowpack[i]=.08;w.buildHydrology();
 const drinkable=()=>{let n=0;for(let i=0;i<w.len;i++)if(w.water[i]&&w.isDrinkable(i%w.n+.5,(i/w.n|0)+.5))n++;return n};
 for(const a of sim.animals)if(a.alive)a.hydration=SPECIES[a.species].maxHydration*.25;
 for(let t=0;t<CFG.dayTicks;t++)sim.update(null);
 const l=sim.stats.winterWater||{};
 assert.ok(l.snowWater>0,'animals eat snow when water is frozen');assert.ok(l.iceAttempts<sim.animals.length*2,'animals do not hammer thick ice all day: '+l.iceAttempts);
 console.log(`  1 frozen day: ${(l.snowWater||0).toFixed(0)} water from snow, ${l.iceAttempts||0} ice attempts, ${l.iceBreaks||0} breaks, open water cells ${drinkable()}, thirst deaths ${sim.stats.byCause?.dehydration||0}`);
}
// 5. Saves keep the policy; worlds without it never break ice or eat snow.
{
 const sim=make(),back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})));assert.equal(back.winterWaterRules,WINTER_WATER.policy);
 const old=make(false),a=old.animals.find(x=>x.alive&&!x.player);old.world.soilWater.snowpack[old.world.idx(a.x,a.y)]=.2;assert.equal(winterWaterTarget(old,a),null);
 assert.equal(restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(old,{savedAt:'t',reason:'t'}))).winterWaterRules,undefined);
}
console.log('Winter water PASS: thin ice breaks at a cost, thick ice holds, snow water is finite and costs energy to melt, saved, recorded worlds unchanged.');
