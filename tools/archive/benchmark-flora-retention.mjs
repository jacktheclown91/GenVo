// Actual immutable bundled mature ecology; no seeded replacement cohorts.
import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {openScenarioSnapshot} from '../../src/persistence/scenario-library.js';
import {restoreSimulationSnapshot,createSimulationSnapshot} from '../../src/persistence/save-manager.js';
const reference=new URL('../../docs/performance/flora-genome-lifetime-before-2026-10-21.txt',import.meta.url);
const source=fs.readFileSync(reference,'utf8');assert.equal(createHash('sha256').update(source).digest('hex'),'f09e87f5b78f3c9a448e9eee87d5551fe1bc92c016c9119013707126a3eca264');
const historical=source.replace("'./flora-genotype.js'",JSON.stringify(new URL('../../src/ecology/flora-genotype.js',import.meta.url).href));
const {pruneUnusedFloraGenomes:before}=await import('data:text/javascript;base64,'+Buffer.from(historical).toString('base64'));
import {pruneUnusedFloraGenomes as after} from '../../src/ecology/flora-genome-lifetime.js';
import {serialize,deserialize} from 'node:v8';import {isDeepStrictEqual} from 'node:util';
const out=process.argv[2];assert.ok(out&&!fs.existsSync(out));
const file='assets/scenarios/mature-valley-d100.json.gz',bytes=fs.readFileSync(file),sim=restoreSimulationSnapshot(openScenarioSnapshot(JSON.parse(gunzipSync(bytes)))),d=sim.dispersal;
const initial=before(d),expected=deserialize(serialize(createSimulationSnapshot(sim,{savedAt:'fixed'}))),rows={before:[],after:[]};
let cohorts=0,positive=0;for(const cells of Object.values(d.floraState.seeds))for(const records of cells.values())for(const r of records.values()){cohorts++;if(r.amount>0)positive++}
for(const label of ['before','after','after','before','before','after','after','before']){const start=performance.now(),result=({before,after})[label](d);rows[label].push(performance.now()-start);assert.equal(result.removed,0);assert.equal(result.retained,initial.retained)}
assert.ok(isDeepStrictEqual(createSimulationSnapshot(sim,{savedAt:'fixed'}),expected),'all physical and biological state remains identical after both scans');
const receipt={scope:'Actual mature bundled checkpoint, unchanged retained cohorts and provenance; isolated collection scan only, not browser frame acceptance',sourceHashes:Object.fromEntries(['src/ecology/flora-genome-lifetime.js','docs/performance/flora-genome-lifetime-before-2026-10-21.txt'].map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')])),inputSha256:createHash('sha256').update(bytes).digest('hex'),cohorts,positive,retained:initial.retained,samplesMs:rows,meanMs:Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length])),exactWholeState:true};
fs.writeFileSync(out,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
