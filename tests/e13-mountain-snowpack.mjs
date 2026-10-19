import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SOIL_WATER,advanceSoilDay,soilWaterStorage} from '../src/ecology/soil-water.js';
import {localTemperature} from '../src/world/environment.js';
import {snowDepth,snowCover,snowFraction,snowFooting,snowGrowthFactor,snowLightFactor,coldSurfaceExchange,validateSnowpack} from '../src/world/snowpack.js';
import {movementProfile} from '../src/lineage/lifestyle.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {Renderer} from '../src/render/renderer.js';

const sim=new Simulation('E13-MOUNTAIN-WATER',{player:true,bootstrap:false,worldGenerator:'coastal/1'}),w=sim.world;
assert.equal(w.generator,'coastal/1');
assert.ok(w.environment&&w.terrain&&w.terrain.travelEnabled);
const winter={temp:.35,rain:.75,frontDay:1},summer={temp:.98,rain:0,frontDay:20};
let mountain=-1,lowland=-1;
for(let i=0;i<w.len;i++){
 const x=i%w.n+.5,y=(i/w.n|0)+.5;if(!w.isPlayable(x,y)||w.water[i])continue;
 const temp=localTemperature(w,winter,i),height=w.terrain.elevation[i];
 if(temp<.25&&height>.49&&(mountain<0||height>w.terrain.elevation[mountain])&&localTemperature(w,summer,i)>.33)mountain=i;
 if(lowland<0||temp>localTemperature(w,winter,lowland))lowland=i;
}
assert.ok(mountain>=0,'real mountainous cold altitude must be present');
assert.ok(lowland>=0,'real warm lowland must remain');
assert.ok(localTemperature(w,winter,mountain)<localTemperature(w,winter,lowland),'altitude creates colder air');
assert.equal(snowFraction(.49),0);
assert.equal(snowFraction(.08),1);
assert.equal(snowFraction(.35)>.0,true);
const prior=soilWaterStorage(w);
for(let day=1;day<=10;day++){
 advanceSoilDay(w,{...winter,frontDay:day},day);
 assert.ok(Math.abs(w.soilWater.lastDay.closure)<.30,'combined snow+ground water ledger must close, got '+w.soilWater.lastDay.closure);
}
// Soil moisture is the liquid soil field; frozen surface water belongs only
// in total storage. A snow-covered world must not report snow as wet soil.
let liquidSum=0,landCells=0;
for(let i=0;i<w.len;i++)if(!w.water[i]){liquidSum+=w.moisture[i];landCells++}
assert.ok(Math.abs(w.soilWater.lastDay.meanMoisture-liquidSum/landCells)<1e-10,'daily soil moisture excludes stored snow and groundwater');
const deep=snowDepth(w,mountain);
assert.ok(deep>.08,'real cold summit must accumulate delayed precipitation');
assert.ok(snowDepth(w,lowland)<deep,'warmer valleys accumulate less snow than cold mountain slopes');
assert.ok(snowCover(w,mountain)>0);
assert.ok(snowLightFactor(w,mountain)<.9,'buried plants receive less actual sunlight');
assert.ok(snowGrowthFactor(w,mountain)<1,'snow cover reduces living plant growth without instantly deleting biomass');
assert.ok(w.soilWater.lastDay.snowfall>0,'snow water included in daily climate receipts');
assert.ok(w.soilWater.totals.snowfall>0);
assert.ok(Math.abs(prior-soilWaterStorage(w))>0);
const x=mountain%w.n+.5,y=(mountain/w.n|0)+.5;
const ordinary={alive:true,bodyPlan:founderPlan()};
const snowTravel=movementProfile(ordinary,w,{fromX:x,fromY:y,toX:x+.1,toY:y+.1});
assert.ok(snowTravel.speed<1&&snowTravel.energy>1,'ground snow affects real movement budget');
const regular=snowFooting(ordinary,w,x,y);
const padded={alive:true,bodyPlan:makePlan([...founderPlan().nodes.filter(n=>n.partId!=='walking-leg'),{partId:'padded-leg',parent:'root',socket:'limb.1'},{partId:'padded-leg',parent:'root',socket:'limb.5'}])};
const wide=snowFooting(padded,w,x,y);
assert.ok(wide.speed>regular.speed&&wide.energy<regular.energy,'inherited wide pads offset snow sinking rather than a species bonus');

const snapshot=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'e13'}));
const restored=restoreSimulationSnapshot(snapshot);
assert.equal(restored.world.soilWater.snowpack.length,w.len);
assert.equal(snowDepth(restored.world,mountain),deep,'persistent water-equivalent snow survives save/load exactly');
assert.ok(Math.abs(restored.world.soilWater.totals.snowfall-w.soilWater.totals.snowfall)<1e-9);
assert.throws(()=>validateSnowpack(w,new Float64Array(7)),/Invalid persistent snowpack/);
const old=structuredClone(snapshot);delete old.world.soilWater.snowpack;
const migrated=restoreSimulationSnapshot(old);
assert.equal(snowDepth(migrated.world,mountain),0,'older worlds do not gain invented historical snow');
assert.equal(migrated.world.soilWater.snowpack.length,w.len);

const savedDepth=snowDepth(w,mountain),beforeWarm=soilWaterStorage(w);
for(let day=11;day<=21;day++){
 advanceSoilDay(w,{...summer,frontDay:day},day);
 assert.ok(Math.abs(w.soilWater.lastDay.closure)<.30,'thaw retains the water ledger');
}
assert.ok(snowDepth(w,mountain)<savedDepth,'summer melt consumes real earlier winter snow');
assert.ok(w.soilWater.totals.snowmelt>0,'snowmelt has an auditable physical receipt');
assert.ok(w.soilWater.totals.snowmelt<=w.soilWater.totals.snowfall+1e-8,'cumulative melt cannot exceed physically deposited snowfall');
assert.ok(soilWaterStorage(w)<beforeWarm,'warm-season runoff and evaporation remove water, not create it; daily closures were verified above');
const beforeRender=snowDepth(restored.world,mountain);
let rectangles=0;
const fake={ctx:{save(){},restore(){},fillRect(){rectangles++},set fillStyle(v){},set globalAlpha(v){},get globalAlpha(){return 1}},sim:{world:restored.world},camera:{x:x,y:y},w:800,h:600};
const visible=Renderer.prototype.drawSnowWindow.call(fake,16,Math.floor(x)-2,Math.floor(y)-2,6,6);
assert.ok(visible>0&&rectangles>0,'real snow depth draws dynamic overhead snow, not a fixed winter tint');
assert.equal(snowDepth(restored.world,mountain),beforeRender,'presentation must not mutate simulation snow');

// Do not create rain, or melt, on an artificial dry cell. Snow never supplies free water.
const noRain={soilWater:{snowpack:new Float64Array(1)},water:new Uint8Array(1)};
assert.deepEqual(coldSurfaceExchange(noRain,0,0,.93),{snowfall:0,melt:0,rain:0,before:0,after:0});
console.log('E13 snowpack: cold mountain precipitation, conserved rain/snow/melt accounting, altitude contrast, snow shading, traversal anatomy, save and legacy migration, overhead art PASS');
