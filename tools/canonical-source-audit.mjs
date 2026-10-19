#!/usr/bin/env node
// Conservative runtime reachability + single-authority audit.
// A source file unused by gameplay is NOT presumed dead: it may be a test/tool dependency.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {sourceGraph} from './source-graph.mjs';
import {PARTS} from '../src/lineage/part-registry.js';
import {PART_SPRITES,hasComponent} from '../src/render/part-sprites.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'design/governance/implementation-authorities.json'),'utf8'));
const rel=p=>path.relative(root,p).split(path.sep).join('/');
const exists=p=>fs.existsSync(path.join(root,p));
const files=(dir,ext)=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`,ext):e.isFile()&&e.name.endsWith(ext)?[`${dir}/${e.name}`]:[]).sort();
const errors=[];
const {all,reachable,missing}=sourceGraph(root,{entry:manifest.gameEntrypoint});
for(const x of missing)errors.push(`Missing import: ${x}`);
const nonRuntime=all.filter(p=>!reachable.has(p));
for(const p of nonRuntime)if(!manifest.nonRuntimeModules[p])errors.push(`Unclassified non-runtime source module: ${p}`);
for(const p of Object.keys(manifest.nonRuntimeModules))if(!nonRuntime.includes(p))errors.push(`Non-runtime classification drift: ${p} is now reachable (review publication)`);
for(const [name,{authority,consumers}] of Object.entries(manifest.systems)){
 if(!exists(authority))errors.push(`${name}: missing authority ${authority}`);
 if(!reachable.has(authority))errors.push(`${name}: claimed live authority is not runtime-reachable (${authority})`);
 for(const consumer of consumers)if(!exists(consumer))errors.push(`${name}: missing declared consumer ${consumer}`);
}
const partIds=Object.keys(PARTS).sort(),spriteIds=Object.keys(PART_SPRITES).sort();
for(const p of partIds)if(!PART_SPRITES[p]||!hasComponent(p))errors.push(`Registered part has no canonical procedural drawing: ${p}`);
for(const p of spriteIds)if(!PARTS[p])errors.push(`Orphan procedural part art: ${p}`);
const duplicateSourceHashes=new Map();
for(const p of all){const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');const a=duplicateSourceHashes.get(sha)||[];a.push(p);duplicateSourceHashes.set(sha,a)}
const identicalSources=[...duplicateSourceHashes.values()].filter(a=>a.length>1);
for(const items of identicalSources)errors.push(`Identical JS source copies: ${items.join(', ')}`);
if(exists('assets/spritesheets'))errors.push('Generated sprite-sheet exports must not live inside runtime assets/spritesheets');
if(!exists('references/generated-sprite-sheets/manifest.json'))errors.push('Expected derived sprite sheet reference manifest missing');
for(const source of all){const code=fs.readFileSync(path.join(root,source),'utf8');if(code.includes('assets/spritesheets/'))errors.push(`Runtime source refers to duplicate generated sprite output: ${source}`)}
// Validate source decoding as UTF-8 rather than silently accepting corrupt replacement characters.
for(const p of all){const data=fs.readFileSync(path.join(root,p));const decoded=new TextDecoder('utf-8',{fatal:true});try{decoded.decode(data)}catch{errors.push(`Invalid UTF-8 source: ${p}`)}}
const summary={schema:'genvo8.canonical-audit/1',status:errors.length?'FAIL':'PASS',entrypoint:manifest.gameEntrypoint,totalSourceModules:all.length,runtimeReachableModules:all.filter(p=>reachable.has(p)).length,runtimeDependencyFiles:reachable.size,toolOrTestModules:nonRuntime,registeredParts:partIds.length,proceduralSpriteIds:spriteIds.length,identicalSourceCopies:identicalSources,errors};
console.log(JSON.stringify(summary,null,2));if(errors.length)process.exitCode=1;
