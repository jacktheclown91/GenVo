import {Simulation} from '../src/sim/simulation.js';
import {thunderstormAt} from '../src/ecology/thunderstorms.js';
import fs from 'node:fs';
fs.mkdirSync('reports/storm-readout-seed-probe',{recursive:true});const rows=[];
for(let k=0;k<32;k++){const seed=k===0?'STORM-ART-428':'STORM-READOUT-'+k,s=new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true});s.phaseClimate();const p=s.player(),r=thunderstormAt(s,s.world.idx(p.x,p.y));rows.push({seed,intensity:r.intensity,rain:r.rain,temperature:r.temperature,player:{id:p.id,x:p.x,y:p.y},scope:'Seed availability only; generated initial climate at actual initial player, not elapsed gameplay.'});fs.writeFileSync('reports/storm-readout-seed-probe/receipt.json',JSON.stringify(rows,null,2));if(r.intensity>.4){console.log(JSON.stringify(rows.at(-1)));break}}
console.log('Seed probe finished',rows.length,'worlds');
