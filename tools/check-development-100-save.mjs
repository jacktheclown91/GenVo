// Read-only horizon/save diagnostic. Large checkpoints stay ignored; retain the compact receipt.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {serialize,deserialize} from 'node:v8';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {observeNaturalWorld} from './ecological-observation.mjs';
const args=process.argv.slice(2),opt=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1]};
const days=Number(opt('--days','100')),generator=opt('--generator','default'),seed=opt('--seed','GENVO8-TEST-A'),origin={x:Number(opt('--origin-x','0')),y:Number(opt('--origin-y','0'))};
assert.ok(generator==='planetary/1'||origin.x===0&&origin.y===0,'Nonzero origin requires planetary geography');
assert.ok(Number.isSafeInteger(days)&&days>0&&days<=100);
const out=path.resolve(opt('--out','docs/test-runs/artifacts/save-'+new Date().toISOString().replace(/[:.]/g,'-')));
assert.ok(!fs.existsSync(out)||fs.readdirSync(out).length===0,'Refuse to overwrite earlier save evidence');fs.mkdirSync(out,{recursive:true});
// Omission uses the real current default; explicit planetary mode stays opt-in.
const sim=new Simulation(seed,{player:false,...(generator==='default'?{}:{worldGenerator:generator,planetOrigin:origin})});
const sum=field=>{let n=0;for(const v of field||[])n+=v;return n};
const physicalAudit={initialSalt:sum(sim.world.environment?.salt),daily:[]};
if(args.includes('--require-salt'))assert.ok(physicalAudit.initialSalt>0,'This diagnostic requires a genuinely saline region');
const onDay=()=>{
 const soil=sim.world.soilWater?.lastDay,salt=sim.world.environment?.lastDay;
 assert.ok(soil&&soil.day===sim.day-1&&Number.isFinite(soil.closure)&&Math.abs(soil.closure)<=1e-6*soil.storageBefore+1e-3,'Every completed day needs a conserved soil-water budget');
 if(sim.world.environment)assert.ok(salt&&salt.day===sim.day-1&&Number.isFinite(salt.closure)&&Math.abs(salt.closure)<=1e-5,'Every completed day needs a conserved salt budget');
 physicalAudit.daily.push({day:sim.day-1,soilClosure:soil.closure,...(salt?{saltClosure:salt.closure,saltInput:salt.input,saltOutput:salt.output}:{})});
};
const result=await observeNaturalWorld({sim,days,onDay,checkpoints:[1,10,30,60,100].filter(d=>d<=days),collectGc:true,onSample(row){console.log('SAVE_PROBE '+JSON.stringify({completedDays:row.completedDays,heap:row.memory.heapUsed,living:row.structures.living}))}});
fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify(result,null,2));
assert.equal(physicalAudit.daily.length,days);physicalAudit.finalSalt=sum(sim.world.environment?.salt);physicalAudit.saltInput=sim.world.environment?.totals.saltInput||0;physicalAudit.saltOutput=sim.world.environment?.totals.saltOutput||0;
physicalAudit.cumulativeSaltClosure=physicalAudit.saltInput-physicalAudit.saltOutput-(physicalAudit.finalSalt-physicalAudit.initialSalt);
assert.ok(Math.abs(physicalAudit.cumulativeSaltClosure)<=1e-5,'Full-horizon salt budget must close');
fs.writeFileSync(path.join(out,'physical-audit.json'),JSON.stringify(physicalAudit,null,2));
const metrics={schema:'genvo.horizon-save-probe/1',seed,requestedDays:days,actualGenerator:sim.world.generator,origin:sim.world.regionOrigin||null,physicalAuditDays:physicalAudit.daily.length,calendarDay:sim.day,integrity:result.integrity,scope:'Headless autonomous default founders; exact complete snapshot and one full-day continuation',beforeSnapshot:process.memoryUsage()};
const snapshot=()=>createSimulationSnapshot(sim,{savedAt:'2000-01-01T00:00:00.000Z',reason:'horizon-save-probe'});
let started=performance.now();let saved=snapshot();metrics.snapshotMs=performance.now()-started;
started=performance.now();let bytes=serialize(saved);metrics.v8EncodingMs=performance.now()-started;metrics.snapshotBytes=bytes.length;
metrics.snapshotSha256=createHash('sha256').update(bytes).digest('hex');metrics.snapshotHashScope='Artifact identity only; V8 encoding is not a canonical state hash';
fs.writeFileSync(path.join(out,'day'+days+'.snapshot.bin'),bytes);
started=performance.now();const restored=restoreSimulationSnapshot(deserialize(bytes));metrics.restoreMs=performance.now()-started;
let restoredSaved=createSimulationSnapshot(restored,{savedAt:'2000-01-01T00:00:00.000Z',reason:'horizon-save-probe'});
assert.ok(isDeepStrictEqual(restoredSaved,saved),'Whole snapshot must match after binary transport and restore');metrics.exactRoundtrip=true;
metrics.componentV8Bytes={seedColumns:serialize(saved.controllers.dispersal.floraState.seeds).length,floraGenomes:serialize(saved.controllers.dispersal.floraState.genomes).length,botanical:serialize(saved.controllers.dispersal.botanical).length};
saved=null;bytes=null;restoredSaved=null;if(global.gc)global.gc();metrics.afterRestore=process.memoryUsage();
const d=sim.day;while(sim.day===d){sim.update(null);restored.update(null)}
assert.ok(isDeepStrictEqual(createSimulationSnapshot(restored,{savedAt:'fixed',reason:'continuation'}),createSimulationSnapshot(sim,{savedAt:'fixed',reason:'continuation'})),'Whole saved state must continue exactly for a full day');
metrics.exactFullDayContinuation=true;metrics.finalCalendarDay=sim.day;metrics.afterContinuation=process.memoryUsage();
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(metrics,null,2));console.log(JSON.stringify({receipt:path.join(out,'receipt.json'),...metrics},null,2));
