import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {sourceGraph} from '../tools/source-graph.mjs';
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
 console.log('public-export: exact reachable modules and runtime assets only PASS');
} finally {fs.rmSync(temp,{recursive:true,force:true})}
