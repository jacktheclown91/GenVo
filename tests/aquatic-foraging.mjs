import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {AQUATIC_FORAGING} from '../src/ecology/aquatic-foraging.js';
import {FRESHWATER_FOOD,freshwaterField} from '../src/ecology/freshwater-food.js';
import {submerged,waterColumn,aquaticFoodAccessible} from '../src/lineage/diving.js';
import {hasGills} from '../src/lineage/aquatic.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// aquatic-foraging/1 (creator direction 2026-10-22), from the bankjaw and
// rillsifter extinction diagnosis.
const world=on=>new Simulation('PLANET-OBS-2',{player:false,worldGenerator:'planetary/1',aquaticForaging:on});
const fresh=world(true),classic=new Simulation('GENVO8-AQ-FORAGE',{player:false});
assert.equal(fresh.aquaticForagingRules,AQUATIC_FORAGING.policy);assert.equal(classic.aquaticForagingRules,undefined);
assert.equal(world(false).aquaticForagingRules,undefined);

// A deep, open river cell with a deep, open neighbour.
const deepCell=sim=>{const w=sim.world;for(let i=0;i<w.len;i++){const x=i%w.n+.5,y=(i/w.n|0)+.5;if(w.water[i]&&w.isPlayable(x,y)&&waterColumn(w,x,y)>.18&&w.water[w.idx(x+1,y)]&&waterColumn(w,x+1,y)>.18)return{x,y,i,j:w.idx(x+1,y)}}throw Error('no deep water')};

// 1. Foraging dive: a hungry bankjaw beside underwater fry dives and eats it;
//    without the policy it abandons the meal at the surface.
function forage(on){
 const sim=world(on),w=sim.world,c=deepCell(sim),a=sim.animals.find(b=>b.alive&&b.species==='bankjaw');
 for(const b of sim.animals)if(b!==a&&b.alive&&Math.hypot(b.x-c.x,b.y-c.y)<14){b.x=1.5;b.y=1.5}
 a.x=c.x;a.y=c.y;a.energy=SPECIES.bankjaw.maxEnergy*.4;a.diveDepth=0;a.diveAir=24;freshwaterField(w,'fry')[c.j]=.6;sim.rebuildSpatial();
 let meals=0,maxDepth=0;for(let t=0;t<CFG.simHz*30;t++){sim.update(null);maxDepth=Math.max(maxDepth,a.diveDepth||0);if(a.lastFreshwaterMeal?.kind==='fry'&&a.lastFreshwaterMeal.tick===sim.tickCount)meals++}
 return{meals,maxDepth};
}
const dive=forage(true),stay=forage(false);
assert.ok(dive.meals>0&&dive.maxDepth>.08,'the policy carries a swimmer down to underwater food: '+JSON.stringify(dive));
assert.equal(stay.meals,0,'current behaviour never reaches it: '+JSON.stringify(stay));

// 2. Life under ice: a gilled rillsifter stays below a new sheet, can move
//    under it and reach underwater food; surface food stays sealed; an
//    air-breathing swimmer is not put under the ice.
{const sim=world(true),w=sim.world,e=w.environment,c=deepCell(sim),r=sim.animals.find(b=>b.alive&&b.species==='rillsifter'),k=sim.animals.find(b=>b.alive&&b.species==='bankjaw');
 assert.ok(hasGills(r)&&!hasGills(k));
 r.x=c.x;r.y=c.y;r.diveDepth=0;k.x=c.x+1;k.y=c.y;k.diveDepth=0;
 for(const i of [c.i,c.j]){e.ice[i]=.03;e.iceBroken[i]=0}sim.rebuildSpatial(); // thin sheet over deep water
 sim.update(null);
 assert.equal(submerged(r),true,'the gilled water dweller is beneath the ice');
 assert.equal(sim.canOccupy(r,c.x+1,c.y),true,'and can move under the sheet');
 assert.equal(aquaticFoodAccessible(sim,{...r,diveDepth:.5},c.x+1,c.y,FRESHWATER_FOOD.larvae),true,'underwater food is reachable at depth');
 assert.equal(aquaticFoodAccessible(sim,r,c.x,c.y,FRESHWATER_FOOD.algae),false,'surface food stays sealed under ice');
 assert.equal(!!(k.diveDepth>.03),false,'an air-breather is not placed under the ice');
 const historic=world(false),hc=deepCell(historic),hr=historic.animals.find(b=>b.alive&&b.species==='rillsifter');hr.x=hc.x;hr.y=hc.y;hr.diveDepth=0;historic.world.environment.ice[hc.i]=.03;historic.world.environment.iceBroken[hc.i]=0;historic.rebuildSpatial();historic.update(null);
 assert.equal(submerged(hr),false,'historical worlds keep the old behaviour')}

// 3. Water-dweller forage is scored over usable water, not diluted by land.
{const on=world(true),off=world(false);
 const r1=on.animals.find(b=>b.alive&&b.species==='rillsifter'),r0=off.animals.find(b=>b.id===r1.id),s1=on.carrying.surveyAt(r1),s0=off.carrying.surveyAt(r0);
 assert.ok(s1.rows.every(row=>row.wet),'only water food is counted');assert.ok(s1.value>s0.value,'and is no longer averaged over land: '+s1.value.toFixed(2)+' vs '+s0.value.toFixed(2));
 const m1=on.animals.find(b=>b.alive&&b.species==='mosskip'),m0=off.animals.find(b=>b.id===m1.id);
 assert.equal(on.carrying.surveyAt(m1).value,off.carrying.surveyAt(m0).value,'land animals are unchanged')}

// Saves: exact round trip and continuation; historical saves stay without the policy.
{const sim=world(true);for(let t=0;t<CFG.dayTicks*2;t++)sim.update(null);
 const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})),back=restoreSimulationSnapshot(structuredClone(snap));
 assert.equal(back.aquaticForagingRules,AQUATIC_FORAGING.policy);assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),snap);
 for(let t=0;t<CFG.lifeStride;t++){sim.update(null);back.update(null)}
 assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})));
 const old=structuredClone(snap);delete old.core.aquaticForagingRules;assert.equal(restoreSimulationSnapshot(old).aquaticForagingRules,undefined);
 const bad=structuredClone(snap);bad.core.aquaticForagingRules='free-food/9';assert.throws(()=>restoreSimulationSnapshot(bad),/Unknown aquatic foraging/)}
console.log('Aquatic foraging PASS: foraging dives reach underwater food ('+dive.meals+' fry meals vs 0), gilled bodies live under ice with surface food sealed and air-breathers unchanged, water-only forage scoring with land animals unchanged, exact save/continuation and historical policy.');
