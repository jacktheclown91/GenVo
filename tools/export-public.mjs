#!/usr/bin/env node
// Export a browser-only folder from the canonical source. Does not build/modify the game.
// Usage: node tools/export-public.mjs /absolute/output/directory
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceGraph} from './source-graph.mjs';
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
for(const dirname of ['assets/audio','assets/ui','assets/art','tools/creature-lab']){
 function walk(rel){for(const e of fs.readdirSync(path.join(root,rel),{withFileTypes:true})){const p=path.posix.join(rel,e.name);if(e.isDirectory())walk(p);else if(e.isFile())files.push(p)}}
 walk(dirname);
}
for(const rel of files){const src=path.join(root,rel),dst=path.join(out,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst)}
console.log(JSON.stringify({schema:'genvo8.public-export/1',files:files.length,sourceModules:reachable.size,output:out},null,2));
