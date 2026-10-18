// Moves full review recordings out of the repository (kept outside Git history) and writes a
// reproducible manifest with SHA-256 checksums into docs/. Curated screenshots, capture.json
// measurements and reports stay in the repository.
// Usage: node tools/archive-review-artifacts.mjs [YYYY-MM-DD]
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const date=process.argv[2]||new Date().toISOString().slice(0,10);
const store=path.resolve(root,'..','genvo-review-artifacts',date);
const SOURCES=['docs/integrated-gameplay','docs/gait-cadence-comparison','docs/anatomy-locomotion'];
const manifestPath=path.join(root,'docs',`review-artifacts-${date}.json`);
const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{schema:'genvo.review-artifacts/1',date,store:path.relative(root,store).replace(/\\/g,'/'),note:'Full recordings live outside the repository; verify with sha256 before review.',files:[]};
const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]):[];
let moved=0;
for(const src of SOURCES)for(const file of walk(path.join(root,src)).filter(f=>f.endsWith('.webm'))){
 const rel=path.relative(root,file).replace(/\\/g,'/'),dest=path.join(store,rel),data=fs.readFileSync(file);
 const entry={path:rel,sha256:crypto.createHash('sha256').update(data).digest('hex'),bytes:data.length,capturedBy:src==='docs/integrated-gameplay'?'tools/capture-integrated-gameplay.cjs':src==='docs/gait-cadence-comparison'?'tools/capture-gait-cadence-comparison.cjs':'tools/capture-anatomy-locomotion.cjs'};
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);
 if(crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex')!==entry.sha256)throw Error('copy verification failed: '+rel);
 fs.unlinkSync(file);manifest.files=manifest.files.filter(f=>f.path!==rel);manifest.files.push(entry);moved++;
}
manifest.files.sort((a,b)=>a.path.localeCompare(b.path));manifest.totalBytes=manifest.files.reduce((s,f)=>s+f.bytes,0);
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,1)+'\n');
console.log(`moved ${moved} recordings (${(manifest.totalBytes/1048576).toFixed(1)} MB total in manifest) to ${store}; manifest ${path.relative(root,manifestPath)}`);
