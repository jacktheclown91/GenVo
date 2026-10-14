import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
const seeds=['GENVO8-TEST-A','GENVO8-TEST-C','GENVO8-TEST-E'];
let failed=0;
for(const seed of seeds){
  const sim=new Simulation(seed,{player:false});
  const targetDays=640;
  while(sim.day<=targetDays){
    sim.update(null);
    const alive=sim.animals.filter(a=>a.alive).length;
    if(alive>CFG.maxAnimals+8) throw new Error('population ceiling violated');
  }
  const p=sim.population();
  const alive=Object.values(p).reduce((a,b)=>a+b,0);
  const finite=Object.values(p).every(Number.isFinite);
  const ecosystemAlive=alive>0 && finite;
  if(!ecosystemAlive) failed++;
  console.log(JSON.stringify({seed,year:sim.year,day:sim.day,pop:p,births:sim.stats.births,deaths:sim.stats.deaths,causes:sim.stats.byCause}));
}
if(failed){console.error(`${failed} ecosystem runs failed`);process.exit(1)}
