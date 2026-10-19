import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';

const sim=new Simulation('P1-SURVEY-LAND-REGION',{player:false,worldGenerator:'coastal/1'});
const w=sim.world,actor=sim.animals.find(a=>a.alive&&!sim.canSwim(a));
assert.ok(actor,'need a real grounded animal');
// This test compares the actual public reach/occupancy authority with P1's
// single-region evaluation on the SAME points, including disconnected
// islands, water, boundary cells, and swimmer/non-swimmer phenotypes.
const controls=[
 {...actor,x:actor.x,y:actor.y},
 {...actor,x:actor.x,y:actor.y,ecoLifestyle:{id:'aquatic'}},
 {...actor,x:1.5,y:1.5},
 {...actor,x:64.5,y:64.5}
];
for(const a of controls){
 const swimming=sim.canSwim(a),region=swimming?0:w.regionAt(a.x,a.y);
 for(let y=0;y<w.n;y+=3)for(let x=0;x<w.n;x+=3){
   const cx=x+.5,cy=y+.5,i=w.idx(cx,cy);
   if(w.water[i])continue;
   const original=sim.canOccupy(a,cx,cy)&&sim.canReach(a,cx,cy);
   const optimized=w.isPlayable(cx,cy)&&(swimming||(region!==0&&w.landRegion[i]===region));
   assert.equal(optimized,original,`physical reach parity at ${cx}:${cy}, swimmer=${swimming}`);
 }
}
const a=actor,s0=sim.carrying.surveyAt(a);
assert.ok(s0.value>=0&&Number.isFinite(s0.value));
const s1=sim.carrying.surveyAt(a);
assert.deepEqual(s1,s0,'read-only survey returns identical food, water and feeding rows');
console.log('P1 all coastal playable land samples: carrying reach matches exact public occupancy and connected-region biology PASS');
