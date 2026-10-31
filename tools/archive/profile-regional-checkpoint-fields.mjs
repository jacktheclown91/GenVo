// Read-only attribution. Separately encoded field sizes are diagnostic, not additive byte accounting.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {deserialize,serialize} from 'node:v8';import {createHash} from 'node:crypto';
const [input,out]=process.argv.slice(2);assert.ok(input&&out&&!fs.existsSync(out));
const bytes=fs.readFileSync(input),saved=deserialize(Buffer.from(bytes));
const size=v=>serialize(v).length,rank=o=>Object.entries(o||{}).map(([field,value])=>({field,bytes:size(value)})).sort((a,b)=>b.bytes-a.bytes);
const regions=[];
for(const {key,snapshot:s} of [{key:'active',snapshot:saved},...(saved.core.planetaryTravel?.sessions||[])]){
 const {planetaryTravel,...core}=s.core;
 const controllerFields=rank(s.controllers),dispersalFields=rank(s.controllers?.dispersal),worldFields=rank(s.world);
 const floraStateFields=rank(s.controllers?.dispersal?.floraState),botanicalFields=rank(s.controllers?.dispersal?.botanical);
 regions.push({key,tick:s.core.tickCount,animals:s.animals.length,topLevel:rank({...s,core,regionalWorlds:undefined}),controllerFields,dispersalFields,floraStateFields,botanicalFields,worldFields});
}
const report={scope:'Read-only V8 snapshot field attribution. Each field is separately encoded, so shared references and encoding overhead mean sizes cannot be added to recover the original artifact byte count. No restore, simulation, filtering, variant removal or source edits. Archive nesting excluded from active core to avoid counting the planet recursively.',input,inputBytes:bytes.length,inputSha256:createHash('sha256').update(bytes).digest('hex'),regions};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({inputBytes:bytes.length,regions:regions.map(r=>({key:r.key,animals:r.animals,top:r.topLevel.slice(0,3),dispersal:r.dispersalFields.slice(0,4),floraState:r.floraStateFields.slice(0,3),botanical:r.botanicalFields.slice(0,3)}))},null,2));
