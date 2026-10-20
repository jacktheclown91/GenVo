import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SaveManager,createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {adoptMovementRules,restoreMovementRuleHistory} from '../src/lineage/movement-rule-migration.js';
import {adoptClimbingRules} from '../src/lineage/climbing-rules.js';
import {CLIMBING} from '../src/lineage/climbing.js';
import {adoptBurrowingRules} from '../src/lineage/burrowing-rules.js';
import {BURROWING} from '../src/lineage/burrowing.js';
import {excavatePassage,excavationSite} from '../src/world/subsurface.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {GLIDING} from '../src/lineage/gliding.js';
import {JUMP} from '../src/lineage/jumping.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';

// Small atomic IndexedDB adapter: writes are staged, cloning occurs at add/put,
// and an abort publishes none of a transaction's pending store operations.
const stores=new Map([['saves',new Map()],['meta',new Map()]]);let failAdd=0;
const db={transaction(){let ended=false,adds=0;const pending=[];
 const tx={oncomplete:null,onabort:null,onerror:null,error:null,
  abort(){if(ended)return;ended=true;queueMicrotask(()=>tx.onabort?.())},
  objectStore(name){return{
   get(key){const r={};queueMicrotask(()=>{r.result=structuredClone(stores.get(name).get(key));r.onsuccess?.()});return r},
   getAll(){const r={};queueMicrotask(()=>{r.result=structuredClone([...stores.get(name).values()]);r.onsuccess?.()});return r},
   put(value,key){pending.push({name,key,value:structuredClone(value)});return{}},
   add(value,key){if(++adds===failAdd)throw Error('Injected backup transport failure');if(stores.get(name).has(key))throw Error('Duplicate key');pending.push({name,key,value:structuredClone(value)});return{}},
   delete(key){pending.push({name,key,remove:true});return{}}
  }}
 };setTimeout(()=>{if(ended)return;ended=true;for(const p of pending){if(p.remove)stores.get(p.name).delete(p.key);else stores.get(p.name).set(p.key,p.value)}tx.oncomplete?.()},4);return tx;
}};
let current=new Simulation('MOVEMENT-ADOPTION');delete current.glidingRules;delete current.jumpingRules;delete current.burrowingRules;delete current.world.subsurface;delete current.climbingRules;delete current.divingRules;delete current.world.divingBathymetry;
current.player().bodyPlan=makePlan(current.player().bodyPlan.nodes.map(n=>['limb.3','limb.5'].includes(n.socket)?{...n,partId:'spring-leg'}:n));current.player().age=40;
const manager=new SaveManager({getSim:()=>current});manager.available=true;manager.db=async()=>db;
await manager.saveNow('historical-source');const source=await manager.loadSnapshot(),sourceCopy=structuredClone(source),originalSlot=manager.activeSlotId;
let candidate=restoreSimulationSnapshot(structuredClone(source));
assert.equal(candidate.jumpStatus().enabled,false);
const before=structuredClone(createSimulationSnapshot(candidate,{savedAt:'fixed'}));
failAdd=4;await assert.rejects(()=>manager.storeMovementContinuation(candidate,source,{name:'Failed continuation',source:'fork:'+originalSlot}),/Injected/);
assert.equal(manager.activeSlotId,originalSlot);assert.equal(stores.get('saves').size,1);assert.equal(stores.get('meta').size,1);
assert.deepEqual(structuredClone(createSimulationSnapshot(candidate,{savedAt:'fixed'})),before,'failed transaction restores every candidate policy field');
assert.deepEqual(await manager.loadSnapshot(),sourceCopy,'failed migration preserves the actual source save');
failAdd=0;const result=await manager.storeMovementContinuation(candidate,source,{name:'New movement',source:'fork:'+originalSlot});
assert.equal(manager.activeSlotId,originalSlot,'storage commit does not activate an old getSim into a new slot');
assert.equal(stores.get('saves').size,3);assert.equal(stores.get('meta').size,3);
assert.deepEqual(await manager.loadSnapshot(result.backupSlot),sourceCopy,'backup is the complete untouched original snapshot');
assert.deepEqual(await manager.loadSnapshot(originalSlot),sourceCopy,'original slot is untouched');assert.deepEqual(source,sourceCopy,'input checkpoint is untouched');
assert.equal(candidate.glidingRules,GLIDING.policy);assert.equal(candidate.jumpingRules,JUMP.policy);assert.equal(candidate.movementRuleMigrations[0].backupSlot,result.backupSlot);
assert.deepEqual(candidate.animals,before.animals);assert.equal(candidate.rng.state,source.rngState);assert.equal(candidate.tickCount,source.core.tickCount);
const stored=await manager.loadSnapshot(result.slotId),played=restoreSimulationSnapshot(structuredClone(stored));
assert.deepEqual(played.movementRuleMigrations,candidate.movementRuleMigrations);assert.equal(played.glidingRules,GLIDING.policy);assert.equal(played.jumpingRules,JUMP.policy);
const again=adoptMovementRules(played,{source:'already-current fork',backupSlot:'world-00000001-adoption'});assert.equal(again.changed,false);assert.equal(played.movementRuleMigrations.length,2);restoreMovementRuleHistory(played,played);
await assert.rejects(()=>manager.storeMovementContinuation(candidate,{...source,world:null},{name:'No source',source:'invalid'}),/complete validated/);
const normalize=s=>{const n=structuredClone(s);for(const key of ['glidingRules','jumpingRules','movementRuleMigrations','divingRules','divingRuleMigrations','climbingRules','climbingRuleMigrations','burrowingRules','burrowingRuleMigrations'])delete n.core[key];delete n.world.subsurface;delete n.world.divingBathymetry;for(const key of ['savedAt','reason']){delete n[key];delete n.meta[key]}for(const key of ['key','worldName','movementAdopted','movementBackup'])delete n.meta[key];return n};
assert.deepEqual(normalize(stored),normalize(before),'rules, provenance and bed geometry are the only changes to the full simulation');
manager.setActiveSlot(result.backupSlot);await assert.rejects(()=>manager.saveNow('forbidden'),/read-only/);await assert.rejects(()=>manager.clear(),/read-only/);await assert.rejects(()=>manager.load(result.backupSlot),/read-only/);
assert.deepEqual(await manager.loadSnapshot(result.backupSlot),sourceCopy,'normal save/load/clear cannot overwrite a backup');
const invalid=structuredClone(stored);invalid.core.movementRuleMigrations[0].to.jumpingRules='unknown';assert.throws(()=>restoreSimulationSnapshot(invalid),/adoption record/);
const missing=structuredClone(stored);delete missing.core.jumpingRules;assert.throws(()=>restoreSimulationSnapshot(missing),/contradict/);
const stub=()=>({tickCount:10,animals:[],planetaryTravel:{sessions:[{biologicalMode:'canonical-ticks/1',snapshot:{core:{tickCount:10},animals:[]}}]}}),backupSlot='world-00000000-adoption';
const remote=stub();adoptMovementRules(remote,{source:'regional fixture',backupSlot});assert.equal(remote.planetaryTravel.sessions[0].snapshot.core.jumpingRules,JUMP.policy);restoreMovementRuleHistory(remote,remote);
const debt=stub();debt.planetaryTravel.sessions[0].snapshot.core.tickCount=9;const debtBefore=structuredClone(debt);assert.throws(()=>adoptMovementRules(debt,{source:'clock fixture',backupSlot}),/catchup/);assert.deepEqual(debt,debtBefore,'clock refusal cannot partly migrate active or remote regions');
const frozen=stub();delete frozen.planetaryTravel.sessions[0].biologicalMode;assert.throws(()=>adoptMovementRules(frozen,{source:'clock fixture',backupSlot}),/clock conversion/);
const attack=restoreSimulationSnapshot(structuredClone(source));attack.player().attackAction={pounce:true,phase:'leap'};assert.throws(()=>adoptMovementRules(attack,{source:'pending',backupSlot}),/pending pounce/);
// Real visited-region inventories, canonical archive clocks and actual travel.
let regional=new Simulation('MOVEMENT-REGIONAL-ADOPTION',{worldGenerator:'planetary/1'});delete regional.burrowingRules;delete regional.world.subsurface;delete regional.climbingRules;delete regional.glidingRules;delete regional.jumpingRules;
const frontier=(sim,x,direction)=>{const a=sim.player();for(let y=10.5;y<118.5;y++){a.x=x;a.y=y;const status=planetaryTravelAvailability(sim);if(status.enabled&&status.direction===direction)return true}return false};
assert.ok(frontier(regional,125.2,'east'));let crossed=crossPlanetaryBorder(regional);assert.ok(crossed.ok,crossed.message);regional=crossed.simulation;
assert.equal(regional.planetaryTravel.sessions.length,1);assert.equal(regional.jumpingRules,undefined);
const originalRegional=structuredClone(createSimulationSnapshot(regional,{savedAt:'regional'}));
adoptMovementRules(regional,{source:'real regional fixture',backupSlot:'world-00000002-adoption'});
adoptClimbingRules(regional,{source:'real regional fixture',backupSlot:'world-00000002-adoption'});
adoptBurrowingRules(regional,{source:'real regional fixture',backupSlot:'world-00000002-adoption'});
const loadedRegional=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(regional,{savedAt:'regional'})));
assert.equal(loadedRegional.planetaryTravel.sessions[0].snapshot.core.jumpingRules,JUMP.policy);
assert.equal(loadedRegional.planetaryTravel.sessions[0].snapshot.core.climbingRules,CLIMBING.policy);
assert.equal(loadedRegional.planetaryTravel.sessions[0].snapshot.core.burrowingRules,BURROWING.policy);assert.equal(loadedRegional.planetaryTravel.sessions[0].snapshot.world.subsurface.passages.size,0);
assert.deepEqual(loadedRegional.planetaryTravel.sessions[0].snapshot.animals,originalRegional.core.planetaryTravel.sessions[0].snapshot.animals,'regional adoption leaves every archived organism unchanged');
const excavation=loadedRegional.world.terrain.elevation.findIndex((h,i)=>i%128>20&&i%128<100&&(i/128|0)>20&&(i/128|0)<100&&excavationSite(loadedRegional.world,i));assert.ok(excavation>=0);assert.ok(excavatePassage(loadedRegional.world,excavation,{entry:true}));const regionalGeometry=structuredClone(loadedRegional.world.subsurface);
assert.ok(frontier(loadedRegional,2.8,'west'));crossed=crossPlanetaryBorder(loadedRegional);assert.ok(crossed.ok,crossed.message);
const returned=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(crossed.simulation)));
assert.equal(returned.jumpingRules,JUMP.policy);assert.deepEqual(returned.movementRuleMigrations,regional.movementRuleMigrations,'migration provenance survives returning to the actual visited region');
assert.equal(returned.climbingRules,CLIMBING.policy);assert.deepEqual(returned.climbingRuleMigrations,regional.climbingRuleMigrations);
assert.equal(returned.burrowingRules,BURROWING.policy);assert.deepEqual(returned.burrowingRuleMigrations,regional.burrowingRuleMigrations);
assert.ok(frontier(returned,125.2,'east'));const revisit=crossPlanetaryBorder(returned);assert.ok(revisit.ok,revisit.message);assert.deepEqual(revisit.simulation.world.subsurface,regionalGeometry,'actual excavated geometry survives leaving and revisiting the region');
console.log('Movement adoption PASS: whole-state preservation, exact read-only backup, atomic failure/rollback/retry, no premature activation, future policy receipts, regional agreement and clock/pounce refusal.');
