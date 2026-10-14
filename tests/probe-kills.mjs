import {Simulation} from '../src/sim/simulation.js';
import {SPECIES,canPreyOn} from '../src/organisms/species.js';
const sim=new Simulation('GENVO8-TEST-C',{player:false});let logs=0;
const old=sim.tryKill.bind(sim);sim.tryKill=(pred,prey)=>{const before=prey.alive;const pop=sim.population();let locals={};sim.forEachNearby(pred,26,b=>{if(b.alive&&canPreyOn(pred.species,b.species))locals[b.species]=(locals[b.species]||0)+1});const r=old(pred,prey);if(before&&!prey.alive&&sim.day>380&&(prey.species==='rootling'||prey.species==='genvo')){console.log(JSON.stringify({day:sim.day,prey:prey.species,pop,locals,predE:+(pred.energy/SPECIES[pred.species].maxEnergy).toFixed(2)}));if(++logs>80)process.exit(0)}return r};
while(sim.day<=640)sim.update(null);
