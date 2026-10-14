import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtimeFiles=[path.join(root,'index.html')];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(?:js|html)$/.test(entry.name))runtimeFiles.push(full)}}
walk(path.join(root,'src'));
const offenders=[];
for(const file of runtimeFiles){const text=fs.readFileSync(file,'utf8');if(text.includes('—'))offenders.push(path.relative(root,file));}
assert.deepEqual(offenders,[],'player-facing runtime source should not contain em dashes');
console.log('player copy style checks: PASS');
