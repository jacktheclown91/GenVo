import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deserialize} from 'node:v8';
import {createHash} from 'node:crypto';
import {restoreSimulationSnapshot} from '../../src/persistence/save-manager.js';
import {canSwim} from '../../src/lineage/lifestyle.js';
import {CFG} from '../../src/sim/config.js';
const [input,birthReceipt,out]=process.argv.slice(2);assert.ok(input&&birthReceipt&&out&&!fs.existsSync(out));
const bytes=fs.readFileSync(input),saved=deserialize(Buffer.from(bytes)),observed=JSON.parse(fs.readFileSync(birthReceipt));assert.equal(createHash('sha256').update(bytes).digest('hex'),observed.inputSha256);
const regions=[{key:'active',snapshot:saved},...(saved.core.planetaryTravel?.sessions||[])];let candidate=null;const checked=[];
for(const row of observed.rows.filter(r=>r.newParts.includes('webbed-leg'))){
 const local=regions.find(r=>r.snapshot.animals.some(a=>a.id===row.id));const actors=[...row.parentIds,row.id].map(id=>local.snapshot.animals.find(a=>a.id===id));
 if(actors.some(a=>!a?.alive)||actors.slice(0,2).some(canSwim)||!canSwim(actors[2]))continue;
 const test=restoreSimulationSnapshot(structuredClone(local.snapshot)),w=test.world;let bank=null;
 for(let y=2;y<w.n-2&&!bank;y++)for(let x=2;x<w.n-2&&!bank;x++)for(const dir of [{dx:1,dy:0,input:{right:true}},{dx:-1,dy:0,input:{left:true}},{dx:0,dy:1,input:{down:true}},{dx:0,dy:-1,input:{up:true}}])if(w.isPlayable(x+dir.dx*2+.5,y+dir.dy*2+.5)&&!w.water[w.idx(x,y)]&&w.water[w.idx(x+dir.dx,y+dir.dy)]&&w.water[w.idx(x+dir.dx*2,y+dir.dy*2)]){bank={x:x+.5,y:y+.5,...dir};break}
 checked.push({id:row.id,parentIds:row.parentIds,childCanSwim:canSwim(actors[2]),parentsCanSwim:actors.slice(0,2).map(canSwim),bankFound:!!bank,playableWaterTiles:w.water.reduce((n,v,i)=>n+(v&&w.isPlayable(i%w.n+.5,Math.floor(i/w.n)+.5)?1:0),0)});
 if(bank){candidate={row,local,bank};break}
}
if(!candidate){const negative={status:'traversal-not-demonstrated',scope:'No qualifying two-tile water edge in the declared scan window of retained candidate regions; no anatomy/terrain edits made. Swim gates alone do not prove crossing.',input,inputSha256:observed.inputSha256,birthReceipt,checked};fs.writeFileSync(out,JSON.stringify(negative,null,2));console.log(JSON.stringify(negative,null,2));process.exit(0)}
assert.ok(candidate,'retained naturally born swimmer, both nonswimming parents and actual two-tile water edge required');
const results=[];
for(const id of [...candidate.row.parentIds,candidate.row.id]){
 const sim=restoreSimulationSnapshot(structuredClone(candidate.local.snapshot)),actor=sim.animals.find(a=>a.id===id),before=JSON.stringify({body:actor.bodyPlan,genes:actor.genes,anatomy:actor.anatomy,adaptations:actor.adaptations,age:actor.age});
 for(const a of sim.animals)a.player=false;actor.player=true;sim.playerId=id;sim.playerEnabled=true;sim.playerAutonomy=false;actor.x=candidate.bank.x;actor.y=candidate.bank.y;sim.rebuildSpatial();
 const energyBefore=actor.energy,trace=[];let firstWater=null;
 for(let step=0;step<256;step++){sim.playerControlStep(candidate.bank.input,CFG.controlHz);const wet=!!sim.world.water[sim.world.idx(actor.x,actor.y)];if(wet&&firstWater===null)firstWater=step+1;if(step%16===0)trace.push({step:step+1,x:actor.x,y:actor.y,wet,energy:actor.energy})}
 assert.equal(JSON.stringify({body:actor.bodyPlan,genes:actor.genes,anatomy:actor.anatomy,adaptations:actor.adaptations,age:actor.age}),before,'no biological editing');
 results.push({id,age:actor.age,canSwim:canSwim(actor),start:candidate.bank,end:{x:actor.x,y:actor.y},energyBefore,energyAfter:actor.energy,firstWater,trace});
}
assert.ok(results.slice(0,2).every(r=>r.firstWater===null),'both actual parents stop at bank');assert.ok(results[2].firstWater>0,'naturally born child enters existing water');assert.ok(results[2].energyAfter<results[2].energyBefore,'real movement costs reserve energy');
const report={scope:'Controlled locomotion from naturally recorded autonomous birth. Existing child and both matching birth-parent bodies are relocated to the same real water edge and temporarily directly controlled. No anatomy/genome/age/reserve editing or resource rescue. Not natural route choice, a simple-origin trial, long survival, descendant reproduction or browser visual acceptance.',input,inputSha256:observed.inputSha256,birthReceipt,region:candidate.local.key,child:candidate.row.id,parentIds:candidate.row.parentIds,birthDay:candidate.row.birthDay,birthTick:candidate.row.birthTick,bodyVariation:candidate.row.mutation,results};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:results.map(({trace,...r})=>r)},null,2));
