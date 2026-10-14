import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
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
while(sim.day<=96)sim.update(null);
assert.ok(w.moisture[shore]>=w.seepage[shore]*.72-1e-5,'shore groundwater floor should persist through climate drying');
console.log('hydrology + terrestrial reachability checks: PASS');
