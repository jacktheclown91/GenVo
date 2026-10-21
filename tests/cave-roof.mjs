import assert from 'node:assert/strict';
import {CAVE_ROOF,caveRoofSupport} from '../src/world/cave-roof.js';
import {emptySubsurface,batchExcavation,excavatePassage,refreshPassages,solidTerrainTotal,validateSubsurface} from '../src/world/subsurface.js';
import {CAVES} from '../src/world/cave-policy.js';
import {Simulation} from '../src/sim/simulation.js';
import {stepUndergroundCondition} from '../src/lineage/burrowing.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Controlled flat geological strata isolate support law from habitat frequency.
function cavity(width){
 const n=11,w={n,len:n*n,water:new Uint8Array(n*n),moisture:new Float32Array(n*n),terrain:{schema:1,elevation:new Float32Array(n*n).fill(.3)},subsurface:emptySubsurface(),isPlayable:()=>true,idx:(x,y)=>Math.floor(y)*n+Math.floor(x),buildHydrology(){}};
 const lo=5-(width-1)/2,hi=5+(width-1)/2,cells=[];
 for(let y=lo;y<=hi;y++)for(let x=lo;x<=hi;x++)cells.push(y*n+x);
 const sinks=Array.from({length:w.len},(_,i)=>i).filter(i=>!cells.includes(i));
 const mass=solidTerrainTotal(w);
 batchExcavation(w,()=>{for(const i of cells){const receiver=[...sinks].sort((a,b)=>w.terrain.elevation[a]-w.terrain.elevation[b])[0];assert.ok(excavatePassage(w,i,{origin:CAVES.policy,receiver}))}});
 assert.ok(Math.abs(solidTerrainTotal(w)-mass)<1e-7);return w;
}
const narrow=cavity(3),broad=cavity(7),i=60;
assert.equal(caveRoofSupport(narrow,narrow.subsurface.passages.get(i)).span,3);
assert.equal(caveRoofSupport(narrow,narrow.subsurface.passages.get(i)).unstable,false);
assert.equal(caveRoofSupport(broad,broad.subsurface.passages.get(i)).span,7);
assert.equal(caveRoofSupport(broad,broad.subsurface.passages.get(i)).unstable,true,'equal roofs cannot support arbitrarily broad voids');
const wet=cavity(5),center=wet.subsurface.passages.get(i);
assert.equal(caveRoofSupport(wet,center).unstable,false);wet.moisture[i]=1;
assert.equal(caveRoofSupport(wet,center).unstable,true,'actual moisture weakens the material');
const queryBefore=structuredClone(wet.subsurface);caveRoofSupport(wet,center);assert.deepEqual(wet.subsurface,queryBefore,'support queries are read-only');
const reversed=cavity(7);reversed.subsurface.passages=new Map([...reversed.subsurface.passages].reverse());
const before=solidTerrainTotal(broad),collapsed=refreshPassages(broad),other=refreshPassages(reversed);
assert.ok(collapsed.has(i));assert.deepEqual([...collapsed].sort(),[...other].sort(),'collapse batch is independent of passage insertion order');
assert.ok(Math.abs(solidTerrainTotal(broad)-before)<1e-7);validateSubsurface(broad,true);
const trapped={underground:true,x:5.5,y:5.5,health:100};stepUndergroundCondition({world:broad},trapped,1);
assert.equal(trapped.burrowAir,11,'collapse connects to actual finite-air consequences');
const historical=cavity(7);delete historical.subsurface.roofPolicy;refreshPassages(historical);assert.equal(historical.subsurface.passages.get(i).closed,false,'missing historical policy retains original thickness-only mechanics');
const sim=new Simulation('ROOF-CONTINUITY'),snapshot=createSimulationSnapshot(sim,{savedAt:'fixed'}),restored=restoreSimulationSnapshot(structuredClone(snapshot));
assert.equal(restored.world.subsurface.roofPolicy,CAVE_ROOF.policy);
sim.update(null);restored.update(null);assert.deepEqual(createSimulationSnapshot(restored,{savedAt:'fixed'}),createSimulationSnapshot(sim,{savedAt:'fixed'}),'structural continuation is exact');
const old=structuredClone(snapshot);delete old.world.subsurface.roofPolicy;assert.equal(Object.hasOwn(restoreSimulationSnapshot(old).world.subsurface,'roofPolicy'),false);
const bad=structuredClone(snapshot);bad.world.subsurface.roofPolicy='unknown';assert.throws(()=>restoreSimulationSnapshot(bad),/roof policy/);
// An explicitly staged thin roof exercises the ordinary simulation tick and
// player incident path, not just the pure structural kernel.
const live=new Simulation('ROOF-INCIDENT'),actor=live.player(),lw=live.world;
const occupied=[...lw.subsurface.passages.values()].find(p=>!p.closed&&!p.entry);
assert.ok(occupied);actor.x=occupied.i%lw.n+.5;actor.y=(occupied.i/lw.n|0)+.5;actor.underground=true;actor.burrowSince=live.tickCount;
lw.terrain.elevation[occupied.i]=occupied.floor/20+occupied.void+.011;
const collapseMass=solidTerrainTotal(lw);live.update(null);
assert.equal(occupied.closed,true);assert.equal(actor.lastBurrowIncident.type,'burrow-collapse');assert.ok(actor.burrowAir<12);
assert.ok(Math.abs(solidTerrainTotal(lw)-collapseMass)<1e-7,'normal occupied collapse conserves physical material');
console.log('Cave roof PASS: actual span/thickness/wetness, simultaneous conserved collapse, finite trapped air and exact versioned historical/new continuation.');
