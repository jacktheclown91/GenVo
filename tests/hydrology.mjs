import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SOIL_WATER} from '../src/ecology/soil-water.js';
const sim=new Simulation('GENVO8-TEST-A',{player:false}),w=sim.world;
assert.ok(w.landRegionCount>=2,'expected water to split the terrestrial map into multiple connected regions');
let start=-1,max=0;for(let i=0;i<w.len;i++){const d=w.waterDistance[i];if(!w.water[i]&&d<65535&&d>max){max=d;start=i}}
assert.ok(start>=0&&max>10,'expected inland tiles with a non-trivial route to water');
let x=(start%w.n)+.5,y=((start/w.n)|0)+.5,last=w.waterDistance[start];
for(let step=0;step<max+3&&!w.isDrinkable(x,y);step++){
  const t=w.nextDrinkStep(x,y);assert.ok(t,'thirst route should find a reachable shoreline step');
  const next=w.waterDistance[w.idx(t.x,t.y)];assert.ok(next<last,`water route failed to descend: ${next} !< ${last}`);assert.equal(w.water[w.idx(t.x,t.y)],0,'water route stepped onto blocked water');
  x=t.x;y=t.y;last=next;
}
assert.ok(w.isDrinkable(x,y),'water-distance route should terminate on a drinkable bank');
const shore=[...w.seepage].findIndex((v,i)=>v>=.7&&!w.water[i]);assert.ok(shore>=0,'expected a high-seepage shoreline tile');
// The physical model replaces the legacy moisture floor with budgeted inflow from open water.
// Check that mechanism on the same generated world, including every daily budget during the run.
let checkedDays=0;
while(sim.day<=96){const day=sim.day;sim.update(null);if(sim.day===day)continue;
  const budget=w.soilWater.lastDay;assert.ok(budget,'daily water budget is recorded');
  assert.ok(Math.abs(budget.closure)<1e-3,`generated-world water budget closes: ${budget.closure}`);checkedDays++;
}
assert.ok(checkedDays>=96,'water budget checked throughout climate drying');
let bank=0,inland=0,banks=0,inlands=0;
for(let i=0;i<w.len;i++){if(w.water[i])continue;if(w.seepage[i]>=.7){bank+=w.moisture[i];banks++}if(w.waterDistance[i]>10){inland+=w.moisture[i];inlands++}}
assert.ok(banks>0&&inlands>0,'generated world supplies shoreline and inland comparison cells');
assert.ok(bank/banks>inland/inlands,'open-water banks remain wetter than inland ground');
assert.ok(w.soilWater.totals.lateral>0,'open water supplies measured groundwater inflow');
// Keep the original fixed-floor contract for the legacy switch. Isolate soil steps so this
// checks 96 rainless hot days without simulating a second population or changing ecology budgets.
SOIL_WATER.enabled=false;
try{w.moisture[shore]=0;sim.climate={rain:0,temp:1};
  for(let d=0;d<96;d++){sim.phaseSoil();assert.ok(w.moisture[shore]>=w.seepage[shore]*.72-1e-5,'legacy shore groundwater floor should persist through climate drying')}
}finally{SOIL_WATER.enabled=true}
console.log('hydrology + terrestrial reachability checks: PASS');
