import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deserialize} from 'node:v8';
import {restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {canSwim} from '../src/lineage/lifestyle.js';
import {CFG} from '../src/sim/config.js';
const directory='docs/living-planet-architecture/accessibility-experiment';
const saved=deserialize(fs.readFileSync(`${directory}/candidate-birth.snapshot.bin`));
const original=restoreSimulationSnapshot(structuredClone(saved)),w=original.world;let bank=null;
for(let y=8;y<w.n-8&&!bank;y++)for(let x=8;x<w.n-10;x++)if(!w.water[w.idx(x,y)]&&w.water[w.idx(x+1,y)]&&w.water[w.idx(x+2,y)]){bank={x:x+.8,y:y+.5};break}
assert.ok(bank,'existing two-tile water edge');
const results=[];
for(const id of [1,4]){
 const sim=restoreSimulationSnapshot(structuredClone(saved)),actor=sim.animals.find(a=>a.id===id),body=JSON.stringify(actor.bodyPlan),genes=JSON.stringify(actor.genes);
 // Disclosed locomotion fixture only: identical existing bank and direct control.
 // Preserve all inherited structures and reserves; no biological aging or rescue.
 for(const a of sim.animals)a.player=false;actor.player=true;sim.playerId=id;sim.playerEnabled=true;sim.playerAutonomy=false;actor.x=bank.x;actor.y=bank.y;sim.rebuildSpatial();
 const energyBefore=actor.energy,trace=[];let firstWater=null;
 for(let step=0;step<256;step++){sim.playerControlStep({right:true},CFG.controlHz);const wet=!!w.water[w.idx(actor.x,actor.y)];if(wet&&firstWater===null)firstWater=step+1;if(step%16===0)trace.push({step:step+1,x:actor.x,y:actor.y,wet,energy:actor.energy})}
 assert.equal(JSON.stringify(actor.bodyPlan),body);assert.equal(JSON.stringify(actor.genes),genes);
 results.push({id,age:actor.age,canSwim:canSwim(actor),start:bank,end:{x:actor.x,y:actor.y},energyBefore,energyAfter:actor.energy,firstWater,trace});
}
assert.equal(results[0].firstWater,null,'simple parent cannot enter water');assert.ok(results[1].firstWater>0,'actual inherited offspring enters water');assert.ok(results[1].energyAfter<results[1].energyBefore,'movement has a real energy charge');
const report={scope:'Controlled locomotion comparison from archived real gestation/birth; parent and child relocated to the same existing water edge and temporarily directly controlled. Genomes, inherited bodies, age and reserves untouched. Not ordinary player succession or an ecological survival trial.',results};
fs.writeFileSync(`${directory}/movement.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(results.map(({trace,...r})=>r)));
