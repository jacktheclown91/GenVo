// Install only the reviewed eye candidate through the existing canonical codec.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {compileSourceRgbaPart} from '../src/render/indexed-part-art.js';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'assets/art');
const id=process.argv[2]||'simple-eye';if(!['simple-eye','grazing-mouth'].includes(id))throw Error('Unreviewed or rejected part');
const sourceBytes=fs.readFileSync(path.join(dir,'production-review/'+id+'.candidate.json'));
const source=JSON.parse(sourceBytes);
const compiled=await compileSourceRgbaPart({...source,frames:source.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
const before=path.join(root,'reports/visual-production/before-art');fs.mkdirSync(before,{recursive:true});
for(const rel of ['catalog.json','parts/'+id+'.json','parts/'+id+'.indexed.json','parts/'+id+'.png']){const dest=path.join(before,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.copyFileSync(path.join(dir,rel),dest)}
const catalog=JSON.parse(fs.readFileSync(path.join(dir,'catalog.json'))),entry=catalog.parts.find(p=>p.partId===id);
entry.checksumSha256=crypto.createHash('sha256').update(sourceBytes).digest('hex');entry.compiledChecksum=compiled.checksum;entry.status='imagegen-production-pilot-review';
fs.writeFileSync(path.join(dir,'parts/'+id+'.json'),sourceBytes);
fs.writeFileSync(path.join(dir,'parts/'+id+'.indexed.json'),JSON.stringify(compiled));
fs.copyFileSync(path.join(dir,'production-review/'+(id==='simple-eye'?'eye-native-0.png':'grazing-mouth-native-candidate.png')),path.join(dir,'parts/'+id+'.png'));
fs.writeFileSync(path.join(dir,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
console.log('Installed generated '+id+' candidate through canonical native codec.');
