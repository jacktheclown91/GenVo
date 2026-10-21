import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {FounderDesign} from '../src/lineage/founder-design.js';
import {place} from '../src/lineage/evolution-draft.js';
import {advanceSurfaceIce,surfaceIceCovered,liquidVolume,fractureSurfaceIce,validateSurfaceIce} from '../src/world/surface-ice.js';
import {waterColumn,stepDiving,aquaticFoodAccessible,sameDepth,DIVING} from '../src/lineage/diving.js';
import {canOccupy,canReach,movementProfile} from '../src/lineage/lifestyle.js';
import {FRESHWATER_FOOD} from '../src/ecology/freshwater-food.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const s=new Simulation('THERMAL-REVIEW-3',{player:true,worldGenerator:'planetary/1',surfaceIce:true}),w=s.world,a=s.player();
const design=new FounderDesign('sandbox');for(const slot of ['limb.3','limb.5'])assert.ok(place(design.draft,'webbed-leg','root',slot).ok);
a.bodyPlan=design.draft.plan;a.age=40;a.health=100;a.energy=90;
const pond=w.water.findIndex((v,i)=>!v&&w.isPlayable(i%w.n+.5,(i/w.n|0)+.5));
w.setSurfaceWater([{i:pond,water:1,depth:1.5,salinity:0}],{reason:'Explicit imported pond for physical ice access fixture'});
const e=w.environment;
// Controlled cold forcing tests the physical access contract, not natural lineage history.
for(let day=1;day<=3;day++)advanceSurfaceIce(w,{temp:-.5,rain:0,frontDay:day},day);
let i=-1;for(let k=0;k<w.len;k++)if(w.water[k]&&surfaceIceCovered(e,k)&&liquidVolume(e,k)>.45&&w.isPlayable(k%w.n+.5,(k/w.n|0)+.5)){i=k;break}
assert.ok(i>=0);a.x=i%w.n+.5;a.y=(i/w.n|0)+.5;
assert.equal(waterColumn(w,a.x,a.y),liquidVolume(e,i),'frozen phase is unavailable to swimming depth');
w.buildHydrology();assert.equal(w.isDrinkable(a.x,a.y),false);assert.equal(s.diveStatus().enabled,false,'a surface animal cannot enter a sealed sheet');
assert.equal(aquaticFoodAccessible(s,a,a.x,a.y,FRESHWATER_FOOD.algae),false,'surface food is sealed');
assert.equal(aquaticFoodAccessible(s,a,a.x,a.y,FRESHWATER_FOOD.waterweed,{planning:true}),false,'surface forager must find an opening');
a.diveDepth=0;a.diveTarget=0;a.diveAir=10;stepDiving(s,a,.1);assert.equal(a.diveDepth,0,'old surface dive state cannot pull an ice-supported swimmer beneath a sheet');assert.ok(a.diveAir>10,'standing on supporting ice exposes lungs to air');
a.diveDepth=.4;a.diveTarget=0;a.diveAir=.05;
assert.equal(sameDepth(a,{...a,diveDepth:0},w),false,'the intact sheet blocks surface contact even at shallow depth');
assert.match(s.diveStatus().reason,/Ice blocks/);const health=a.health,volume=e.volume.slice(),salt=e.salt.slice(),ice=e.ice.slice();
for(let k=0;k<20;k++)stepDiving(s,a,.1);
assert.equal(a.diveAir,0);assert.ok(a.health<health,'an intact sheet cannot refill lung air');assert.ok(a.diveDepth>=DIVING.clearance,'ascent stops beneath the sheet');
assert.equal(aquaticFoodAccessible(s,a,a.x,a.y,FRESHWATER_FOOD.waterweed),false,'near-surface ascent does not reach deeper food');
const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(s,{savedAt:'ice-access'})));stepDiving(s,a,.1);stepDiving(restored,restored.player(),.1);assert.deepEqual(restored.player(),a,'exact under-ice respiration continuation');
const lungBody=a.bodyPlan;assert.ok(place(design.draft,'gill-slits','root','flank.left').ok);a.bodyPlan=design.draft.plan;a.diveDepth=.2;a.diveTarget=.2;const gillEnergy=a.energy;stepDiving(s,a,.1);assert.equal(a.diveAir,DIVING.airSeconds,'functional gills still respire in actual liquid under ice');assert.ok(a.energy<gillEnergy,'gill-supported immersion still costs metabolic work');a.bodyPlan=lungBody;a.diveAir=0;a.diveTarget=0;
assert.ok(fractureSurfaceIce(w,i,10000));assert.equal(surfaceIceCovered(e,i),false);assert.equal(w.isDrinkable(a.x,a.y),true,'the fracture exposes chemically fresh water');
for(let k=0;k<20;k++)stepDiving(s,a,.1);assert.equal(a.diveDepth,0);assert.ok(a.diveAir>0,'air refills at the actual opening');
assert.deepEqual(e.volume,volume);assert.deepEqual(e.salt,salt);assert.deepEqual(e.ice,ice,'opening a fracture never melts inventory');validateSurfaceIce(w);
// A liquid corridor fixture has deep endpoints and a frozen shallow middle.
const route={n:5,len:25,generator:'planetary/1',water:new Uint8Array(25),environment:{schema:6,icePolicy:e.icePolicy,volume:new Float64Array(25),ice:new Float64Array(25),iceBroken:new Uint8Array(25)},idx(x,y){return Math.floor(y)*5+Math.floor(x)},isPlayable(x,y){return x>=0&&y>=0&&x<5&&y<5}};
for(const j of [11,12,13]){route.water[j]=1;route.environment.volume[j]=1;route.environment.ice[j]=j===12?.9:.1}
const diver={...a,x:1.5,y:2.5,diveDepth:.3};assert.ok(canOccupy(diver,route,3.5,2.5));assert.equal(canReach(diver,route,3.5,2.5),false,'deep endpoint cannot bypass the frozen constriction');assert.equal(movementProfile(diver,route,{toX:3.5,toY:2.5}).allowed,false,'actual movement shares the swept clearance test');
console.log('Surface ice access PASS: liquid depth, sealed drinking/food, blocked ascent and finite air, exact save continuation and fracture breathing without melt.');
