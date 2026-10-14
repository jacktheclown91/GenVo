import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {observeFamilyDecisions} from '../tools/family-decision-observer.mjs';
const a=new Simulation('DECISION-OBSERVER',{player:true}),b=new Simulation('DECISION-OBSERVER',{player:true});a.setPlayerAutonomy(true);b.setPlayerAutonomy(true);const observer=observeFamilyDecisions(a);
for(let i=0;i<250;i++){a.update(null);b.update(null)}
observer.detach();const x=createSimulationSnapshot(a),y=createSimulationSnapshot(b);x.savedAt=y.savedAt;x.meta.savedAt=y.meta.savedAt;assert.deepEqual(x,y,'observation preserves full state and RNG');assert.ok(observer.records.size);for(const r of observer.records.values())assert.equal(Object.values(r.intents).reduce((n,v)=>n+v,0),r.decisions);
console.log('family selected-decision observation full-state/RNG equivalence PASS');
