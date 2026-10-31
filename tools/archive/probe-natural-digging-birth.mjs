import fs from 'node:fs';import assert from 'node:assert/strict';import {deserialize} from 'node:v8';import {createHash} from 'node:crypto';import {isDeepStrictEqual} from 'node:util';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../../src/persistence/save-manager.js';import {SPECIES} from '../../src/organisms/species.js';
const [input,birthReceipt,out]=process.argv.slice(2);assert.ok(input&&birthReceipt&&out&&!fs.existsSync(out));const bytes=fs.readFileSync(input),saved=deserialize(Buffer.from(bytes)),births=JSON.parse(fs.readFileSync(birthReceipt));assert.equal(createHash('sha256').update(bytes).digest('hex'),births.inputSha256);
const regions=[{key:'active',snapshot:saved},...(saved.core.planetaryTravel?.sessions||[])];let chosen=null;
for(const row of births.rows.filter(r=>r.newParts.includes('digging-forelimb'))){
 const local=regions.find(r=>r.snapshot.animals.some(a=>a.id===row.id)),sim=restoreSimulationSnapshot(structuredClone(local.snapshot)),child=sim.animals.find(a=>a.id===row.id);
 if(!child?.alive||child.energy>=SPECIES[child.species].maxEnergy-1)continue;
 for(let y=8;y<sim.world.n-8&&!chosen;y++)for(let x=8;x<sim.world.n-8;x++){
  child.x=x+.5;child.y=y+.5;
  if(!sim.world.isPlayable(child.x,child.y)||sim.world.water[sim.world.idx(child.x,child.y)]||sim.discovery.mound(child,{restock:false})||!sim.partAbilities.digAvailability(child).enabled)continue;
  chosen={row,local,point:{x:child.x,y:child.y}};break;
 }if(chosen)break;
}
assert.ok(chosen,'actual novel digger and existing dry, unmounded diggable ground required');const results=[];
for(const id of [...chosen.row.parentIds,chosen.row.id]){
 const sim=restoreSimulationSnapshot(structuredClone(chosen.local.snapshot)),a=sim.animals.find(a=>a.id===id);Object.assign(a,chosen.point);
 const bodyBefore=JSON.stringify({body:a.bodyPlan,genes:a.genes,age:a.age}),snapshot=createSimulationSnapshot(sim),physicalBefore=structuredClone(snapshot.world),dispersalBefore=structuredClone(snapshot.controllers.dispersal),energyBefore=a.energy,waterBefore=a.hydration;
 const result=sim.partAbilities.dig(a),after=createSimulationSnapshot(sim);
 assert.equal(JSON.stringify({body:a.bodyPlan,genes:a.genes,age:a.age}),bodyBefore,'no anatomy, genes or age edited');
 results.push({id,bodyId:a.bodyPlan.id,point:chosen.point,energyBefore,energyAfter:a.energy,hydrationBefore:waterBefore,hydrationAfter:a.hydration,result,physicalWorldUnchanged:isDeepStrictEqual(physicalBefore,after.world),floraControllerUnchanged:isDeepStrictEqual(dispersalBefore,after.controllers.dispersal)});
}
assert.ok(results.slice(0,2).every(r=>!r.result.ok),'both recorded parents lack the new action');assert.ok(results[2].result.ok,'naturally born digger executes actual action');
const child=results[2],unfunded=child.energyAfter>child.energyBefore&&child.physicalWorldUnchanged&&child.floraControllerUnchanged;
const report={status:unfunded?'resource-accounting-gap-observed':'action-observed-resource-audit-needed',scope:'Controlled placement of actual natural offspring and both matching retained parents on existing dry ground; actual dig action, no genotype/age/reserve edits. Physical-world/flora equality tests resource debits. No whole-ecosystem balance acceptance is claimed.',input,inputSha256:births.inputSha256,birthReceipt,child:chosen.row.id,birthDay:chosen.row.birthDay,parentIds:chosen.row.parentIds,results};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
