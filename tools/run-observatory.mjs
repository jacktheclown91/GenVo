// Runs one natural planetary world under the read-only observatory.
// Usage: node tools/run-observatory.mjs <seed> <vision|control> <days> <out.ndjson> [originX originY]
// Arms differ only in whether anatomical-vision/1 is recorded; seeds, regions
// and days are matched by the caller. No staging, selection or tuning.
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createObservatory} from './observatory.mjs';
const [seed,arm,daysArg,out,ox='0',oy='0']=process.argv.slice(2);
if(!seed||!['vision','control'].includes(arm)||!out)throw Error('usage: <seed> <vision|control> <days> <out> [ox oy]');
const days=Number(daysArg);
const sim=new Simulation(seed,{player:false,worldGenerator:'planetary/1',planetOrigin:{x:Number(ox),y:Number(oy)},anatomicalVision:arm==='vision'});
const obs=createObservatory(sim,{out,label:seed,arm});
for(let d=0;d<days;d++){for(let i=0;i<CFG.dayTicks;i++)sim.update(null);obs.onDay();if(!sim.animals.some(a=>a.alive))break}
const f=obs.finish();console.log(JSON.stringify({seed,arm,day:f.day,seconds:f.seconds,deathsByCause:f.deathsByCause}));
