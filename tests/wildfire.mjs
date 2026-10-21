import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {igniteWildfire,advanceWildfire,fireFuel,fireDanger,fireEscapeDecision,audibleWildfire,WILDFIRE} from '../src/ecology/wildfire.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {lightningProposal} from '../src/ecology/thunderstorms.js';
import {fireDryness} from '../src/ecology/wildfire.js';
const s=new Simulation('FIRE-CONTRACT',{naturalCaves:false}),w=s.world,p=s.player();s.climate={temp:1,rain:0};
const i=Array.from({length:w.len},(_,i)=>i).find(i=>w.isPlayable(i%w.n+.5,(i/w.n|0)+.5)&&!w.water[i]&&w.moisture[i]<.55&&fireFuel(s,i)>.08);assert.ok(Number.isInteger(i));Object.assign(p,{x:i%w.n+.5,y:(i/w.n|0)+.5});
const rng=s.rng.state,fuel=fireFuel(s,i),min=w.plantResources.minerals[i],health=p.health;assert.equal(igniteWildfire(s,i),true);assert.equal(igniteWildfire(s,i),false);s.tickCount++;advanceWildfire(s);
assert.ok(fireFuel(s,i)<fuel);assert.ok(p.health<health);assert.equal(p.injuryCare.damageCause,'burning vegetation');assert.equal(s.rng.state,rng);assert.equal(s.wildfire.burned,fuel-fireFuel(s,i));assert.ok(Math.abs(w.plantResources.minerals[i]-min-s.wildfire.mineralReturn)<1e-14);assert.ok(Math.abs(s.wildfire.burned-s.wildfire.mineralReturn-s.wildfire.atmosphericExport)<1e-14);
assert.ok(audibleWildfire(s,p));assert.equal(audibleWildfire(s,{...p,x:p.x+100}),null);
const burn=s.wildfire.burned;advanceWildfire(s);assert.equal(s.wildfire.burned,burn,'duplicate clock cannot burn twice');
const snap=createSimulationSnapshot(s,{savedAt:'fire'}),record=structuredClone(snap.core.wildfire);s.tickCount++;advanceWildfire(s);assert.deepEqual(snap.core.wildfire,record,'captured fire state is independent');
const restored=restoreSimulationSnapshot(structuredClone(snap));assert.deepEqual(restored.wildfire,record);assert.equal(restored.fireRules,WILDFIRE.policy);
const old=structuredClone(snap);delete old.core.fireRules;delete old.core.wildfire;const historical=restoreSimulationSnapshot(old);assert.equal(Object.hasOwn(historical,'fireRules'),false);assert.equal(Object.hasOwn(historical,'wildfire'),false);
const invalid=structuredClone(snap);invalid.core.wildfire.atmosphericExport+=1;assert.throws(()=>restoreSimulationSnapshot(invalid),/wildfire/);
assert.equal(fireDanger(s,{...p,airborne:true}),0);assert.equal(fireDanger(s,{...p,diveDepth:1}),0);
s.playerAutonomy=true;const decision=fireEscapeDecision(s,p);assert.ok(decision,'actual visible reachable escape exists');if(decision){assert.equal(decision.intent,'escape');assert.equal(fireDanger(s,{...p,...decision.target}),0);assert.ok(s.canReach(p,decision.target.x,decision.target.y));}
s.climate.rain=3;s.tickCount++;advanceWildfire(s);assert.equal(s.wildfire.cells.size,0,'heavy rain extinguishes existing fire');assert.equal(igniteWildfire(s,i),false,'wet ground cannot ignite');
const live=new Simulation('FIRE-CONTINUATION');for(let k=0;k<24;k++)live.update(null);const other=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(live)));for(let k=0;k<16;k++){live.update(null);other.update(null)}assert.deepEqual(createSimulationSnapshot(other,{savedAt:'same'}),createSimulationSnapshot(live,{savedAt:'same'}));
// Controlled clock/weather isolates the real lightning-to-fire update seam;
// it does not measure natural ignition frequency or long-term ecology.
const lightning=new Simulation('FIRE-LIGHTNING');lightning.climate={temp:1,rain:1.2};let strike;
for(let t=16;t<=8192;t+=16){const q=lightningProposal(lightning,t);if(q&&fireDryness(lightning,q.i)>=.35&&fireFuel(lightning,q.i)>.04){strike=q;break}}
assert.ok(strike,'actual deterministic dry fueled lightning site');lightning.tickCount=strike.tick-1;lightning.update(null);assert.equal(lightning.thunderstorms.events.at(-1).i,strike.i);assert.ok(lightning.wildfire.cells.has(strike.i),'ordinary update connects lightning to finite fire');assert.ok(lightning.wildfire.burned>0);
console.log('Wildfire PASS: finite plant debit/mineral-export closure, real injury, duplicate guards, rain extinction, escape queries and exact versioned saves.');
