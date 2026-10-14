import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function auditArrivalReproduction(result,radius=2){
 if(!Number.isFinite(radius)||radius<=0)throw Error('Radius must be finite and positive');
 const observations=[];
 for(const conception of result.conceptions||[])for(let i=0;i<conception.ids.length;i++){
  const arrival=conception.priorArrivals?.[i],position=conception.positions?.[i];
  if(!arrival||!position||arrival.id!==conception.ids[i]||conception.day<arrival.day)continue;
  const distance=Math.hypot(position.x-arrival.x,position.y-arrival.y);
  if(distance<=radius)observations.push({id:arrival.id,species:conception.species,arrivalDay:arrival.day,conceptionDay:conception.day,daysAfterArrival:conception.day-arrival.day,distanceFromArrival:distance,arrivalRegion:arrival.region,parentIds:conception.ids});
 }
 return {seed:result.seed,day:result.day,complete:result.complete,sourceFingerprint:result.sourceFingerprint,radius,
  scope:'Actual conception parent participations near recorded physical arrival positions. Endpoints do not establish continuous residence, successful birth, persistent colonies or route integrity.',
  uniqueParents:new Set(observations.map(row=>row.id)).size,
  species:Object.fromEntries([...new Set(observations.map(row=>row.species))].map(species=>[species,{participations:observations.filter(row=>row.species===species).length,uniqueParents:new Set(observations.filter(row=>row.species===species).map(row=>row.id)).size}])),observations};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Expected observation JSON and report output');
 const report=auditArrivalReproduction(JSON.parse(fs.readFileSync(input,'utf8')));
 fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify({seed:report.seed,uniqueParents:report.uniqueParents,species:report.species}));
}
