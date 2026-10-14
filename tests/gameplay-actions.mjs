import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {combatActions} from '../src/ui/gameplay-actions.js';
const sim=new Simulation('MOUSE-ACTION-ADAPTER',{player:true}),p=sim.player(),before=sim.rng.state;
const actions=combatActions(sim);assert.equal(sim.rng.state,before);assert.equal(actions[0].enabled,true);assert.equal(actions[1].enabled,false);assert.match(actions[1].reason,/tendons/);
sim.paused=true;assert.equal(actions[0].invoke().ok,false,'a stale enabled descriptor cannot bypass pause');assert.equal(p.attackAction,undefined);
sim.paused=false;const r=actions[0].invoke();assert.equal(r.ok,true);assert.equal(p.attackAction.phase,'windup');assert.equal(combatActions(sim)[0].enabled,false);assert.equal(actions[0].invoke().ok,false,'repeat clicks cannot restart windup');
console.log('Canonical combat availability, read-only descriptors, stale state and repeat-click guards PASS');
