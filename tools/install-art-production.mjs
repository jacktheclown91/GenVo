// Install only the reviewed eye candidate through the existing canonical codec.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {compileSourceRgbaPart} from '../src/render/indexed-part-art.js';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'assets/art');
const id=process.argv[2]||'simple-eye',edition=process.argv[3]||'default';if(!['simple-eye','grazing-mouth','walking-leg','sail-fin'].includes(id))throw Error('Unreviewed or rejected part');
if(edition!=='default'&&edition!=='overhead-v1')throw Error('Unreviewed edition');
if(id==='sail-fin'&&edition!=='overhead-v1')throw Error('Sail-fin requires the reviewed overhead source');
// The earlier walking-leg.candidate.json is rejected. Only the new versioned source is eligible.
const draft=edition==='overhead-v1'?'production-review/overhead-v1/'+id+'.candidate.json':id==='walking-leg'?'production-review/walking-leg-v2/candidate.json':'production-review/'+id+'.candidate.json';
const sourceBytes=fs.readFileSync(path.join(dir,draft));
const source=JSON.parse(sourceBytes);
const compiled=await compileSourceRgbaPart({...source,frames:source.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
const before=path.join(root,'reports/visual-production/before-art');fs.mkdirSync(before,{recursive:true});
for(const rel of ['catalog.json','parts/'+id+'.json','parts/'+id+'.indexed.json','parts/'+id+'.png']){const dest=path.join(before,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.copyFileSync(path.join(dir,rel),dest)}
const catalog=JSON.parse(fs.readFileSync(path.join(dir,'catalog.json'))),entry=catalog.parts.find(p=>p.partId===id);
entry.checksumSha256=crypto.createHash('sha256').update(sourceBytes).digest('hex');entry.compiledChecksum=compiled.checksum;entry.status='imagegen-production-pilot-review';
fs.writeFileSync(path.join(dir,'parts/'+id+'.json'),sourceBytes);
fs.writeFileSync(path.join(dir,'parts/'+id+'.indexed.json'),JSON.stringify(compiled));
const preview=edition==='overhead-v1'?'overhead-v1/'+id+'.native.png':id==='walking-leg'?'walking-leg-v2/planted-native.png':id==='simple-eye'?'eye-native-0.png':'grazing-mouth-native-candidate.png';
fs.copyFileSync(path.join(dir,'production-review/'+preview),path.join(dir,'parts/'+id+'.png'));
fs.writeFileSync(path.join(dir,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
console.log('Installed generated '+id+' candidate through canonical native codec.');
