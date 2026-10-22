// Runs one natural planetary world under the read-only observatory.
// Usage: node tools/run-observatory.mjs <seed> <arm> <days> <out.ndjson> [originX originY]
// Arms: vision|control differ only in anatomical-vision/1; foraging|current
// differ only in aquatic-foraging/1; seeds|unbounded differ only in
// seed-viability/1 (all with today's other defaults). Seeds,
// regions and days are matched by the caller. No staging, selection or tuning.
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createObservatory} from './observatory.mjs';
const [seed,arm,daysArg,out,ox='0',oy='0']=process.argv.slice(2);
const ARMS={vision:{anatomicalVision:true},control:{anatomicalVision:false},foraging:{aquaticForaging:true},current:{aquaticForaging:false},seeds:{seedViability:true},unbounded:{seedViability:false}};
if(!seed||!ARMS[arm]||!out)throw Error('usage: <seed> <'+Object.keys(ARMS).join('|')+'> <days> <out> [ox oy]');
const days=Number(daysArg);
const sim=new Simulation(seed,{player:false,worldGenerator:'planetary/1',planetOrigin:{x:Number(ox),y:Number(oy)},...ARMS[arm]});
const obs=createObservatory(sim,{out,label:seed,arm});
for(let d=0;d<days;d++){for(let i=0;i<CFG.dayTicks;i++)sim.update(null);obs.onDay();if(!sim.animals.some(a=>a.alive))break}
const f=obs.finish();console.log(JSON.stringify({seed,arm,day:f.day,seconds:f.seconds,deathsByCause:f.deathsByCause}));
