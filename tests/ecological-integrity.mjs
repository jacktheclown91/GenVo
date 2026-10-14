import assert from 'node:assert/strict';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';
function fixture(){return {day:1,animals:[{alive:true,id:1,x:1,y:1,age:1,energy:1,hydration:1,health:1}],stats:{births:0,deaths:0},world:{plants:{grass:new Float32Array([1,1])},freshwaterFood:{algae:new Float32Array([1,1])},carrion:new Float32Array([0,0])},population(){return {survivor:this.animals.filter(a=>a.alive).length,extinct:0}}};}
checkEcologicalIntegrity(fixture(),1);
const dead=fixture();dead.animals[0].alive=false;dead.stats.deaths=1;checkEcologicalIntegrity(dead,1); // Accounted extinction is permissible.
for(const corrupt of [s=>s.world.plants.grass[1]=NaN,s=>s.world.freshwaterFood.algae[1]=-1,s=>s.world.carrion[1]=Infinity,s=>s.stats.births++,s=>s.animals[0].energy=NaN,s=>{s.animals.push({...s.animals[0]});s.stats.births++;},s=>s.population=()=>({survivor:99})]){const s=fixture();corrupt(s);assert.throws(()=>checkEcologicalIntegrity(s,1));}
console.log('integrity gates accept accounted extinction and reject corrupted stock, identities and census PASS');
