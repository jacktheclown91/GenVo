// Soil-water cycle rules (roadmap stage W, src/ecology/soil-water.js): the daily budget is closed, dry soil
// regains moisture from ordinary rain, wet and dry starts settle at the same climate equilibrium instead of a floor,
// open water wets the neighbouring ground through groundwater, removing rain produces a drought, plant uptake leaves
// the soil, and the simulation is deterministic for a seed. ?soilWater=0 restores the previous rule exactly.
import assert from 'node:assert/strict';
import {SOIL_WATER,initializeSoilWater,advanceSoilWater,advanceSoilDay,plantAvailableWater} from '../src/ecology/soil-water.js';

// A small synthetic world: a river along column 0, uniform generated wetness elsewhere.
function makeWorld(n=16,wet=.5){const len=n*n,w={n,len,moisture:new Float32Array(len),water:new Uint8Array(len)};
  for(let i=0;i<len;i++){if(i%n===0){w.water[i]=1;w.moisture[i]=1}else w.moisture[i]=wet}return w}
const typical={rain:.41,temp:.55};
const landMean=w=>{let s=0,c=0;for(let i=0;i<w.len;i++)if(!w.water[i]){s+=w.moisture[i];c++}return s/c};
const store=w=>{let s=0;for(let i=0;i<w.len;i++)if(!w.water[i])s+=w.moisture[i]+w.soilWater.groundwater[i];return s};
const run=(w,days,climate=typical)=>{for(let d=0;d<days;d++)advanceSoilWater(w,typeof climate==='function'?climate(d):climate,d)};

// 1. Closed budget: storage change equals infiltration - evaporation - deep drainage + inflow from open water - overflow.
{const w=makeWorld();initializeSoilWater(w);const before=store(w);run(w,90,d=>({rain:d%7<3?.7:.1,temp:.3+.4*(d%11)/10}));
  const t=w.soilWater.totals,expected=before+t.infiltration-t.evaporation-t.deepDrainage+t.lateral-t.overflow;
  assert.ok(Math.abs(store(w)-expected)<1e-3,`soil water budget closes: ${store(w)} vs ${expected}`);
  assert.ok(Math.abs(t.rain-t.infiltration-t.runoff)<1e-6,'rain is split into infiltration and runoff');}

// 2. Dry soil regains moisture under ordinary rain (the previous rule could only remove water at this climate).
{const w=makeWorld(16,.05);initializeSoilWater(w);const far=15+8*16,m0=w.moisture[far];run(w,8);
  assert.ok(w.moisture[far]>m0+.02,`rain returns moisture to dry ground (${m0} -> ${w.moisture[far]})`);}

// 3. Equilibrium, not a floor: wet and dry starts on the same soil converge, well above the old 0.05 floor.
{const wet=makeWorld(16,.5),dry=makeWorld(16,.5);initializeSoilWater(wet);initializeSoilWater(dry);
  for(let i=0;i<dry.len;i++)if(!dry.water[i]){dry.moisture[i]=.05;dry.soilWater.groundwater[i]=.05}
  run(wet,600);run(dry,600);const far=15+8*16;
  assert.ok(Math.abs(wet.moisture[far]-dry.moisture[far])<.01,`starts converge (${wet.moisture[far]} vs ${dry.moisture[far]})`);
  assert.ok(wet.moisture[far]>.15&&wet.moisture[far]<.6,`climate equilibrium is moderate (${wet.moisture[far]})`);
  // 4. Open water wets its banks through groundwater: moisture falls with distance from the river.
  const row=8*16;assert.ok(wet.moisture[row+1]>wet.moisture[row+4]&&wet.moisture[row+4]>=wet.moisture[row+15],'bank moisture declines away from water');
  assert.ok(wet.moisture[row+1]-wet.moisture[row+15]>.1,`banks are clearly wetter (${wet.moisture[row+1]} vs ${wet.moisture[row+15]})`);
  // 5. Drought: 40 rainless warm days dry the far ground substantially; banks stay wetter; rain restores it.
  const far0=wet.moisture[far];run(wet,40,{rain:0,temp:.7});
  assert.ok(wet.moisture[far]<far0*.5,`drought dries soil (${far0} -> ${wet.moisture[far]})`);
  assert.ok(wet.moisture[row+1]>wet.moisture[far]+.1,'banks resist drought');
  run(wet,200);assert.ok(Math.abs(wet.moisture[far]-far0)<.02,`soil recovers after drought (${wet.moisture[far]} vs ${far0})`);}

// 6. Plant uptake leaves the soil, never below the wilting point.
{const w=makeWorld();initializeSoilWater(w);const i=5+5*16,cap=2,m0=w.moisture[i];
  const r={water:new Float64Array(w.len),soilWaterLinked:true};for(let k=0;k<w.len;k++)r.water[k]=plantAvailableWater(w,k,cap);w.plantResources=r;
  r.water[i]-=.2;advanceSoilDay(w,{rain:0,temp:0},1);
  assert.ok(Math.abs(w.soilWater.totals.uptake-.1)<1e-6,'0.2 plant water units = 0.1 moisture withdrawn');
  assert.ok(w.moisture[i]<m0-.1+1e-6,'uptake lowered the soil');assert.equal(r.soilWaterLinked,false,'uptake is applied once');
  r.water[i]=0;r.soilWaterLinked=true;advanceSoilDay(w,{rain:0,temp:0},2);assert.ok(w.moisture[i]>=SOIL_WATER.wiltingPoint-1e-6,'wilting point bounds uptake');}

// 7. Simulation: deterministic for a seed, and ?soilWater=0 reproduces the previous rule.
{const {Simulation}=await import('../src/sim/simulation.js');
  const day=(sim,n)=>{for(let d=0;d<n;d++){const d0=sim.day;while(sim.day===d0)sim.update(null)}};
  const make=()=>{const s=new Simulation('SOIL-WATER',{player:false});s.animals=[];s.rebuildSpatial();return s};
  const a=make(),b=make();day(a,12);day(b,12);
  assert.deepEqual([...a.world.moisture],[...b.world.moisture],'moisture is deterministic');
  assert.deepEqual([...a.world.soilWater.groundwater],[...b.world.soilWater.groundwater],'groundwater is deterministic');
  SOIL_WATER.enabled=false;try{const o=make(),w=o.world,ps=o.phaseSoil.bind(o);let checked=0;
    // Recompute the previous rule for every daily soil step from the climate it saw.
    o.phaseSoil=()=>{const daily=o.tickCount%48===0,before=daily?Float32Array.from(w.moisture):null,c={...o.climate};ps();if(!daily)return;
      for(let i=0;i<w.len;i++){const weather=Math.max(.05,Math.min(1,before[i]+c.rain*.06-(.025+.035*c.temp))),expected=w.water[i]?1:Math.max(weather,(w.seepage[i]||0)*.72);
        if(Math.abs(w.moisture[i]-expected)>1e-6)assert.fail(`old rule at ${i}: ${w.moisture[i]} vs ${expected}`);checked++}};
    day(o,3);assert.ok(checked>3*w.len-1,'old rule checked on every cell for three days');
    assert.equal(o.world.soilWater,undefined,'the old rule keeps no soil-water state');
  }finally{SOIL_WATER.enabled=true}
  // The old rule, at this world's typical climate, only ever removes water from ground without seepage.
  const old=Math.max(.05,Math.min(1,.5+typical.rain*.06-(.025+.035*typical.temp)));assert.ok(old<.5,'old rule dries at typical climate');
  const w=makeWorld();initializeSoilWater(w);for(let i=0;i<w.len;i++)if(!w.water[i])w.moisture[i]=.2;run(w,1);assert.ok(landMean(w)>.2,'new rule wets dry soil at the same climate');}
console.log('soil-water: ok');
