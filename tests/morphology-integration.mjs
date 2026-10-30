// Morphology S9 integration: every new-game rule from the morphological-evolution
// brief active together (body-size/2, inertia, structural support, arid
// physiology, climate water, day-night temperature, founding /3, autonomous
// evolution /4) in a planetary world that crosses a real border, so the home
// region is archived and replayed off-screen. The same seed reproduces the same
// world, and a mid-run save restores and continues exactly.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {snapshotSignature} from '../tools/snapshot-signature.mjs';

const RULES={player:true,worldGenerator:'planetary/1',regionalFrontier:true,autonomousPopulations:true,courtshipSimilarity:true,
 regionalFounding:'regional-founding-templates/3',dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,winterWater:true,escapeLanding:true,
 tissueEnergy:true,perennialRegrowth:true,bodySize:'body-size/2',inertia:true,structuralSupport:true,aridPhysiology:true,climateWater:true,diurnal:true,autonomousEvolution:true};
const EXPECTED={bodySizeRules:'body-size/2',inertiaRules:'inertia/1',structuralSupportRules:'structural-support/1',aridPhysiologyRules:'arid-physiology/1',
 climateWaterRules:'climate-water/6',diurnalRules:'diurnal-temperature/1',regionalFoundingRules:'regional-founding-templates/3',autonomousEvolutionRules:'autonomous-evolution/4'};
let homeCount=0;
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'morphology-integration'}));
const sig=s=>snapshotSignature(snap(s));
const run=(s,ticks)=>{for(let k=0;k<ticks;k++)s.update(null);return s};
function journey(seed){
 let sim=new Simulation(seed,RULES);sim.setPlayerAutonomy(false);
 for(const [k,v] of Object.entries(EXPECTED))assert.equal(sim[k],v,`${k} recorded`);
 run(sim,CFG.dayTicks*2);
 // The rules are visible in the living home world, not only recorded.
 const home=sim.animals.filter(x=>x.alive&&!x.player);
 assert.ok(home.length>0&&home.every(x=>x.bodySize),'every home body carries inherited size');assert.ok(home.some(x=>x.motion),'bodies carry velocity');
 assert.equal(sim.climate?.evaporation,'climate-water/6','daily climate carries the evaporation rule');homeCount=home.length;
 const a=sim.player();let trip=null;
 for(let y=8.5;y<118.5&&!trip;y++){a.x=sim.world.n;a.y=y;sim.rebuildSpatial();const s=planetaryTravelAvailability(sim);if(s.enabled&&s.direction==='east'){const t=crossPlanetaryBorder(sim);if(t.ok)trip=t}}
 assert.ok(trip,'a real eastern crossing');sim=trip.simulation;sim.setPlayerAutonomy(true);
 for(const [k,v] of Object.entries(EXPECTED))assert.equal(sim[k],v,`${k} carried across the border`);
 assert.ok(sim.planetaryTravel?.sessions?.length>=1,'the home region is archived');
 return run(sim,CFG.dayTicks*3);
}
// 1. Determinism: the same seed and the same journey give the same world.
const first=journey('MORPHOLOGY-S9'),second=journey('MORPHOLOGY-S9');
assert.equal(sig(first),sig(second),'same seed, same journey, same world');
// 2. Exact save and continuation with every rule and an archived region replaying off-screen.
const saved=snap(first),back=restoreSimulationSnapshot(structuredClone(saved));
// Compared by value: a restored core lists its keys in a different order (pre-existing, not data).
assert.ok(isDeepStrictEqual(snap(back),saved),'restore is exact');
run(first,CFG.dayTicks*2);run(back,CFG.dayTicks*2);
assert.ok(isDeepStrictEqual(snap(back),snap(first)),'restored world continues identically for two days');
// 3. Wherever the new region holds animals, they carry inherited size too.
const living=first.animals.filter(a=>a.alive&&!a.player);assert.ok(living.every(a=>a.bodySize));
console.log(`Morphology integration PASS: all eight new-game rules recorded and carried across a real border, archived home region replayed off-screen, deterministic same-seed journey, exact save/restore and two-day continuation, ${homeCount} sized home bodies with velocity, ${living.length} non-player bodies in the new region`);
