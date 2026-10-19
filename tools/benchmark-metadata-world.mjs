// Isolate only the codec copy change inside otherwise identical restore authorities.
import fs from 'node:fs';import assert from 'node:assert/strict';import {deserialize} from 'node:v8';import {isDeepStrictEqual} from 'node:util';import {createHash} from 'node:crypto';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const [input,out]=process.argv.slice(2);assert.ok(input&&out&&!fs.existsSync(out));
const codec=fs.readFileSync('docs/performance/flora-seed-codec-before-metadata-copy.txt','utf8');assert.equal(createHash('sha256').update(codec).digest('hex'),'6290803b5bca29ab1c397c506660f55e069f459fd7c3c0fd983a4ffa813802b0');
const codecUrl='data:text/javascript;base64,'+Buffer.from(codec+'\n//# sourceURL=metadata-codec-reference.js').toString('base64');
const manager=fs.readFileSync('src/persistence/save-manager.js','utf8'),base=new URL('../src/persistence/save-manager.js',import.meta.url);
const referenceSource=manager.replace(/from '([^']+)'/g,(_,s)=>'from '+JSON.stringify(s==='./flora-seed-codec.js'?codecUrl:new URL(s,base).href));
const reference=await import('data:text/javascript;base64,'+Buffer.from(referenceSource+'\n//# sourceURL=metadata-world-reference.js').toString('base64'));
const bytes=fs.readFileSync(input),load=()=>deserialize(Buffer.from(bytes)),snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'metadata-world-parity'}));
const expected=snap(reference.restoreSimulationSnapshot(load())),rows=[];
for(const label of ['before','after','after','before']){global.gc?.();const data=load(),at=performance.now(),s=(label==='before'?reference.restoreSimulationSnapshot:restoreSimulationSnapshot)(data),ms=performance.now()-at;assert.ok(isDeepStrictEqual(snap(s),expected),'complete restored world differs '+label);rows.push({label,ms});console.log(JSON.stringify(rows.at(-1)))}
global.gc?.();const before=reference.restoreSimulationSnapshot(load()),after=restoreSimulationSnapshot(load()),day=before.day;
while(before.day===day){before.update(null);after.update(null)}
assert.ok(isDeepStrictEqual(snap(before),snap(after)),'full active and archived next-day state differs');
const mean=label=>{const a=rows.filter(r=>r.label===label);return a.reduce((n,r)=>n+r.ms,0)/a.length};
const report={scope:'One actual checkpoint, alternating warm-process restore with explicit GC outside timing. Only reference codec differs; full current/archived state and next canonical day compared. Independent transport buffers. Not general speed, mature frame pacing, browser save timing or ecological acceptance.',input,inputSha256:createHash('sha256').update(bytes).digest('hex'),inputBytes:bytes.length,rows,beforeMeanMs:mean('before'),afterMeanMs:mean('after'),exactCheckpointState:true,exactNextDayState:true,archives:before.planetaryTravel?.sessions.length||0};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
