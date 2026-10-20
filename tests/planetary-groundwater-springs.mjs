// Springs convert genuine stored groundwater into overland runoff.
// They do not import water or create plant biomass, and old worlds do not
// acquire spring rules through missing-controller initialization.
import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {initializeSoilWater,advanceSoilDay,soilWaterStorage,validateSoilWater} from '../src/ecology/soil-water.js';
import {advanceEnvironmentWater,validateEnvironment} from '../src/world/environment.js';
import {advanceGroundwaterSprings,GROUNDWATER_SPRINGS} from '../src/world/groundwater-springs.js';
import {totalPlanetarySurfaceWater} from '../src/world/planetary-runoff.js';
import {biomeAt} from '../src/world/biomes.js';

// An isolated funded outlet permits exact assertions without synthesizing
// physical stocks at a remote archive or running a large fauna simulation.
const len=16,cell=5;
function isolated(){
 const groundwater=new Float32Array(len),moisture=new Float32Array(len).fill(.8),
  temperature=new Float32Array(len).fill(.7),downstream=new Int32Array(len).fill(-1),
  runoff=new Float64Array(len);
 groundwater[cell]=.96;downstream[cell]=6;
 const soil={schema:1,springPolicy:GROUNDWATER_SPRINGS.policy,groundwater,
  snowpack:new Float64Array(len),totals:{springDischarge:0},daily:[]};
 const world={generator:'planetary/1',n:4,len,
  water:new Uint8Array(len),moisture,temperature,
  terrain:{downstream},
  environment:{schema:6,springEligibility:GROUNDWATER_SPRINGS.policy,lastDay:{day:1}},
  soilWater:soil};
 return{world,runoff};
}
const {world:w,runoff}=isolated(),before=w.soilWater.groundwater[cell];
const record=advanceGroundwaterSprings(w,runoff,1);
assert.equal(record.sites,1);
assert.ok(record.discharged>0&&record.discharged<=GROUNDWATER_SPRINGS.maxDischargePerCell);
assert.equal(before-w.soilWater.groundwater[cell],runoff[cell]);
assert.equal(runoff[cell],w.soilWater.totals.springDischarge);
assert.equal(advanceGroundwaterSprings({...w,soilWater:{...w.soilWater,springPolicy:undefined}},new Float64Array(len),1).discharged,0);
const frozen=isolated();frozen.world.temperature[cell]=.1;
assert.equal(advanceGroundwaterSprings(frozen.world,frozen.runoff,1).discharged,0);
const stopped=isolated();stopped.world.terrain.downstream[cell]=-1;
assert.equal(advanceGroundwaterSprings(stopped.world,stopped.runoff,1).discharged,0);
const old=isolated();delete old.world.environment.springEligibility;
delete old.world.soilWater.springPolicy;
assert.equal(advanceGroundwaterSprings(old.world,old.runoff,1).discharged,0);
const invalid=isolated();invalid.world.soilWater.springPolicy='future-spring/3';
assert.throws(()=>advanceGroundwaterSprings(invalid.world,invalid.runoff,1),/Invalid funded groundwater-spring policy|Invalid funded spring handoff/);

// One real planetary World and one true physical day exercise the existing
// soil budget and the existing surface runoff handoff with spring discharge.
const real=new World('GENVO8-TEST-A',{generator:'planetary/1',planetOrigin:{x:0,y:2560}});
const soil=initializeSoilWater(real);
assert.equal(soil.springPolicy,GROUNDWATER_SPRINGS.policy);
assert.equal(real.environment.springEligibility,GROUNDWATER_SPRINGS.policy);
const n=real.n;
let site=-1;
for(let y=8;y<n-8&&site<0;y++)for(let x=8;x<n-8;x++){
 const i=y*n+x;
 if(!real.water[i]&&real.terrain.downstream[i]>=0&&real.temperature[i]>=.4&&
    real.seepage[i]<.5&&(real.plants.marshroot?.[i]||0)<.16){
  site=i;break;
 }
}
assert.ok(site>=0,'natural planetary terrain contains a warm downhill groundwater outlet');
// A controlled wet aquifer is a valid physical starting condition, not a
// generated spring reward. Adjacent cells prevent artificial lateral loss.
const x=site%n,y=Math.floor(site/n);
for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
 const nx=x+dx,ny=y+dy,i=ny*n+nx;
 if(real.water[i])continue;
 soil.groundwater[i]=Math.fround(.99);
 real.moisture[i]=Math.fround(.9);
 real.temperature[i]=Math.fround(.7);
}
const climate={temp:.7,rain:0};
advanceEnvironmentWater(real,climate,1);
const physicalBefore=soilWaterStorage(real)+totalPlanetarySurfaceWater(real);
const day=advanceSoilDay(real,climate,1);
const physicalAfter=soilWaterStorage(real)+totalPlanetarySurfaceWater(real);
assert.ok(day.lastDay.springDischarge>0,'the saturated real aquifer physically released groundwater');
assert.ok(Math.abs(day.lastDay.closure)<1,'real soil budget balances within preexisting Float32 tolerance');
assert.ok(Math.abs(real.environment.lastDay.waterClosure)<1e-5,'existing runoff water ledger still closes');
assert.ok(Math.abs(day.lastDay.surfaceRunoffCaptured-day.lastDay.springDischarge-
 (day.lastDay.runoff+day.lastDay.overflow))<1e-3,
 'the surface sink contains rainfall runoff, rejected groundwater and funded spring water only');
assert.ok(day.lastDay.outputs>=day.lastDay.springDischarge);
assert.ok(Number.isFinite(physicalAfter-physicalBefore));
validateSoilWater(real,soil);
validateEnvironment(real,real.environment);

// Biome identity responds to the actual stored runoff and groundwater.
// If water dissipates, there is no permanent hard-coded spring biome.
const biomeIndex=site;
const wet=real.environment.overland[biomeIndex],ground=soil.groundwater[biomeIndex];
real.environment.overland[biomeIndex]=Math.max(.02,wet);
soil.groundwater[biomeIndex]=Math.fround(.9);
real.moisture[biomeIndex]=Math.fround(.82);
const label=biomeAt(real,biomeIndex,{temp:.7,rain:.7});
assert.equal(label.code,'wetland');
real.environment.overland[biomeIndex]=0;
const dried=biomeAt(real,biomeIndex,{temp:.7,rain:.7});
assert.notEqual(dried.code,'wetland','wetland depends on present physical water');
real.environment.overland[biomeIndex]=wet;
soil.groundwater[biomeIndex]=ground;
console.log('Funded groundwater springs: physical debit, routed discharge, frozen/closed refusal, budgets, emergent wetland and historical opt-out PASS');
