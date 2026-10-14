import fs from 'node:fs';
import v8 from 'node:v8';
import assert from 'node:assert/strict';
const [input,output]=process.argv.slice(2);
assert.ok(input&&output,'Expected checkpoint and report path');
const saved=v8.deserialize(fs.readFileSync(input)),r=saved.result;
const actors=saved.snapshot.animals.filter(a=>a.alive&&!a.lineage&&!a.player);
const rows=r.records.filter(a=>!a.lineage);
const recordById=new Map(r.records.map(a=>[a.id,a]));
const displacedConceptions=[];
for(const conception of r.conceptions||[])for(let index=0;index<conception.ids.length;index++){
 const parent=recordById.get(conception.ids[index]),position=conception.positions?.[index],birth=parent?.birthObservation;
 if(!parent||parent.lineage||!position||!birth)continue;
 const distance=Math.hypot(position.x-birth.x,position.y-birth.y);
 if(distance<16)continue;
 const children=rows.filter(child=>child.parentIds?.length===conception.ids.length&&conception.ids.every(id=>child.parentIds.includes(id))&&child.bornDay>=conception.day);
 displacedConceptions.push({id:parent.id,species:parent.species,day:conception.day,distanceFromBirthObservation:distance,initialPopulation:birth.initialPopulation,
   birthRegion:birth.ecologicalRegionKey,conceptionRegion:conception.ecologicalRegionKeys?.[index],position,
   subsequentObservedChildren:children.map(child=>child.id)});
}
const countBy=(items,key)=>items.reduce((out,item)=>{const k=key(item);out[k]=(out[k]||0)+1;return out},{});
const species={};
for(const name of new Set(rows.map(a=>a.species))){
 const records=rows.filter(a=>a.species===name),living=actors.filter(a=>a.species===name),births=records.filter(a=>!a.birthObservation?.initialPopulation&&a.parentIds?.length);
 species[name]={initialObserved:records.filter(a=>a.birthObservation?.initialPopulation).length,living:living.length,observedBirths:births.length,
   birthRegions:countBy(births,a=>a.birthObservation?.ecologicalRegionKey??'unrecorded'),
   currentSpatialChunks:countBy(living,a=>Math.floor(a.x/16)+':'+Math.floor(a.y/16)),
   recordedMortality:countBy(records.filter(a=>!a.alive),a=>a.cause??'unrecorded'),
   livingParents:living.filter(a=>records.find(row=>row.id===a.id)?.children?.length).length};
}
fs.writeFileSync(output,JSON.stringify({seed:r.seed,day:r.day,complete:r.complete,sourceFingerprint:saved.sourceFingerprint,
 scope:'Ordinary non-player, non-lineage wildlife in a mixed-world checkpoint. Displaced conceptions establish observed reproduction away from first observation, not migration route integrity or persistent colonies. Subsequent children are matched by both parents and later birth, not assigned to a particular gestation. Birth regions and current 16-cell spatial chunks are descriptive; they do not prove migration arrivals or a player-free world.',species,displacedConceptions},null,2));
console.log(JSON.stringify({day:r.day,species}));
