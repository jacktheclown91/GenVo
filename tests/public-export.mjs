import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {sourceGraph} from '../tools/source-graph.mjs';
import {createHash} from 'node:crypto';
import {validateScenarioCatalog} from '../src/persistence/scenario-library.js';
const root=fileURLToPath(new URL('../',import.meta.url)),temp=fs.mkdtempSync(path.join(os.tmpdir(),'genvo8-public-'));
try{
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('../tools/export-public.mjs',import.meta.url)),temp],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stdout+result.stderr);
 const {reachable}=sourceGraph(root);
 for(const p of reachable)assert.equal(fs.readFileSync(path.join(temp,p)).compare(fs.readFileSync(path.join(root,p))),0,p);
 assert.equal(fs.existsSync(path.join(temp,'src/lineage/phenotype-resolver.js')),false,'src/lineage/phenotype-resolver.js is tool-only');
 // The exporter ships the optional Creature Lab with its real dependencies (tools/export-public.mjs), so the
 // draft compiler is present as a Lab dependency, but it must never be part of the game's own runtime graph.
 assert.equal(reachable.has('src/render/authored-draft-compiler.js'),false,'authored-draft-compiler is not reachable from the game entry');
 assert.ok(fs.readFileSync(path.join(root,'tools/creature-lab/app.js'),'utf8').includes('authored-draft-compiler'),'it ships only because the Creature Lab imports it');
 assert.equal(fs.existsSync(path.join(temp,'references/generated-sprite-sheets/genvo8-walk.png')),false,'derived sprites not shipped');
 assert.equal(fs.existsSync(path.join(temp,'assets/audio-source')),false,'lossless audio sources are not browser assets');
 assert.equal(fs.existsSync(path.join(temp,'assets/art/catalog.json')),true,'installed native part artwork must be in public build');
 // itch.io HTML5 limit: at most 1,000 extracted files (itch.io/docs/creators/html5).
 const shipped=[];(function walk(rel){for(const e of fs.readdirSync(path.join(temp,rel),{withFileTypes:true})){const p=path.posix.join(rel,e.name);e.isDirectory()?walk(p):shipped.push(p)}})('.');
 assert.ok(shipped.length<=1000,`itch.io HTML5 ZIPs hold at most 1,000 files; the export has ${shipped.length}`);
 // Authoring art stays out, and nothing the game or Lab runs asks for it.
 assert.equal(fs.existsSync(path.join(temp,'assets/art/experiments')),false,'resolution experiments are not shipped');
 assert.equal(shipped.some(p=>/^assets\/art\/parts\/[^/]+\.png$/.test(p)),false,'per-part PNG previews are not shipped');
 const runtime=[...reachable,...fs.readdirSync(path.join(root,'tools/creature-lab')).filter(n=>n.endsWith('.js')).map(n=>'tools/creature-lab/'+n)].filter(p=>p.endsWith('.js')).map(p=>fs.readFileSync(path.join(root,p),'utf8')).join(' ');
 assert.equal(/experiments\/|entry\.png|part\.png|\.png\b['"]?\s*\]/.test(runtime),false,'no shipped code reads an excluded authoring file');
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/art/catalog.json'),'utf8'));
 for(const entry of catalog.parts)for(const key of ['indexed','path'])assert.ok(fs.existsSync(path.join(temp,'assets/art',entry[key])),entry.partId+' '+key+' is shipped');
 const catalogPath='assets/scenarios/catalog.json';
 assert.deepEqual(fs.readFileSync(path.join(temp,catalogPath)),fs.readFileSync(path.join(root,catalogPath)),'export the exact curated catalog');
 const scenarios=validateScenarioCatalog(JSON.parse(fs.readFileSync(path.join(temp,catalogPath),'utf8')));
 for(const entry of scenarios){
  const bytes=fs.readFileSync(path.join(temp,entry.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.id+' packaged checkpoint integrity');
 }
 assert.deepEqual(fs.readdirSync(path.join(temp,'assets/scenarios')).sort(),['catalog.json',...new Set(scenarios.map(s=>path.basename(s.file)))].sort(),'ship catalogued checkpoints only');
 console.log('public-export: exact reachable modules and runtime assets only PASS');
} finally {fs.rmSync(temp,{recursive:true,force:true})}
