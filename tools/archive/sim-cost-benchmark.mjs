// Simulation cost benchmark (Phase 3K): wall-clock milliseconds per simulated game day for a natural world
// (no rendering), with a chosen switch state. Usage: node tools/sim-cost-benchmark.mjs <seed> <days> [movementParity=1] [player=0]
import {MOVEMENT_PARITY} from '../../src/ecology/movement-parity.js';
const [seed='BENCH-A',daysArg='60',mp='1',pl='0']=process.argv.slice(2);MOVEMENT_PARITY.enabled=mp==='1';
const {Simulation}=await import('../../src/sim/simulation.js');const sim=new Simulation(seed,{player:pl==='1'});if(pl==='1'){sim.endOpeningGrace?.('bench');sim.setPlayerAutonomy(true)}
for(let i=0;i<48*5;i++)sim.update(null);const t0=performance.now(),d0=sim.day;while(sim.day<d0+Number(daysArg))sim.update(null);const ms=performance.now()-t0;
console.log(JSON.stringify({seed,movementParity:MOVEMENT_PARITY.enabled,player:pl==='1',days:Number(daysArg),msPerGameDay:+(ms/Number(daysArg)).toFixed(1),msPerTick:+(ms/Number(daysArg)/48).toFixed(3),alive:sim.animals.filter(a=>a.alive).length}));
