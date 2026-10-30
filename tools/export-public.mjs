#!/usr/bin/env node
// Export a browser-only folder from the canonical source. Does not build/modify the game.
// Usage: node tools/export-public.mjs /absolute/output/directory
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceGraph} from './source-graph.mjs';
import {createHash} from 'node:crypto';
import {validateScenarioCatalog} from '../src/persistence/scenario-library.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.argv[2]&&path.resolve(process.argv[2]);
if(!out||out===root||out.startsWith(root+path.sep))throw Error('Supply a destination directory OUTSIDE the source tree.');
const {reachable,missing,graph}=sourceGraph(root);
// The optional Creature Lab is shipped with its actual source dependencies.
for(const name of fs.readdirSync(path.join(root,'tools/creature-lab')).filter(n=>n.endsWith('.js'))){const code=fs.readFileSync(path.join(root,'tools/creature-lab',name),'utf8');for(const match of code.matchAll(/from\s*['"](\.\.\/\.\.\/src\/[^'"]+)['"]/g)){const todo=[path.posix.normalize(path.posix.join('tools/creature-lab',match[1]))];while(todo.length){const next=todo.pop();if(reachable.has(next))continue;reachable.add(next);todo.push(...(graph.get(next)||[]))}}}
if(missing.length)throw Error(`Missing dependencies: ${missing.join('; ')}`);
if(!reachable.has('src/main.js'))throw Error('Game entry module missing');
if(fs.existsSync(out)&&fs.readdirSync(out).length)throw Error('Destination must be empty (no destructive overwrite)');
const files=['index.html','styles.css',...reachable];
// Fetch-loaded checkpoints are not ES-module dependencies. Ship only the
// validated catalog and its exact recorded assets, never request files or
// unrelated local snapshots. Verify all inputs before writing any output.
const catalogPath='assets/scenarios/catalog.json';
const scenarios=validateScenarioCatalog(JSON.parse(fs.readFileSync(path.join(root,catalogPath),'utf8')));
files.push(catalogPath);
for(const scenario of scenarios){
 const bytes=fs.readFileSync(path.join(root,scenario.file));
 if(createHash('sha256').update(bytes).digest('hex')!==scenario.sha256)
  throw Error(`Scenario file integrity check failed: ${scenario.id}`);
 files.push(scenario.file);
}
// Review frames, resolution experiments and per-part PNG previews are authoring
// material: the game loads compiled indexed art and the Lab loads part JSON.
for(const dirname of ['assets/audio','assets/ui','assets/art','tools/creature-lab']){
 function walk(rel){for(const e of fs.readdirSync(path.join(root,rel),{withFileTypes:true})){const p=path.posix.join(rel,e.name);if(p==='assets/art/production-review'||p==='assets/art/experiments'||/^assets\/art\/parts\/[^/]+\.png$/.test(p))continue;if(e.isDirectory())walk(p);else if(e.isFile())files.push(p)}}
 walk(dirname);
}
for(const rel of files){const src=path.join(root,rel),dst=path.join(out,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst)}
console.log(JSON.stringify({schema:'genvo8.public-export/1',files:files.length,sourceModules:reachable.size,output:out},null,2));
