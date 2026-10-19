import fs from 'node:fs';
import {deserialize} from 'node:v8';
import {restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const input=process.argv[2],output=process.argv[3];if(!input||!output||fs.existsSync(output))throw Error('Supply snapshot and fresh receipt');
const bytes=fs.readFileSync(input),left=restoreSimulationSnapshot(deserialize(Buffer.from(bytes))),right=restoreSimulationSnapshot(deserialize(Buffer.from(bytes)));
const fields=w=>({moisture:w.moisture,temperature:w.temperature,groundwater:w.soilWater.groundwater,water:w.plantResources.water,...Object.fromEntries(Object.entries(w.plants).map(([k,v])=>['plant-'+k,v]))});
const a=fields(left.world),b=fields(right.world),aliases=Object.fromEntries(Object.keys(a).map(k=>[k,a[k].buffer===b[k].buffer]));
const cell=(s,i)=>({day:s.day,tick:s.tickCount,rng:s.rng.state,climate:s.climate,moisture:s.world.moisture[i],temperature:s.world.temperature[i],groundwater:s.world.soilWater.groundwater[i],plantWater:s.world.plantResources.water[i],linked:s.world.plantResources.soilWaterLinked,plants:Object.fromEntries(Object.entries(s.world.plants).map(([k,v])=>[k,v[i]])),lastSoilDay:s.world.soilWater.lastDay});
let report={schema:'genvo.restore-independence/1',aliases,initialDay:left.day};
const day=left.day;
for(let step=0;left.day===day;step++){
 left.update(null);right.update(null);
 const af=fields(left.world),bf=fields(right.world);
 let mismatch=null;
 for(const k of Object.keys(af)){for(let i=0;i<af[k].length;i++)if(!Object.is(af[k][i],bf[k][i])){mismatch={field:k,cell:i};break}if(mismatch)break}
 if(mismatch){report={...report,status:'mismatch',step:step+1,...mismatch,left:cell(left,mismatch.cell),right:cell(right,mismatch.cell)};break}
}
report.status??='pass';fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
