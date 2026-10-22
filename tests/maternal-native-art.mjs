import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const ids=['egg-chamber','live-womb','brood-pouch'];
for(const id of ids){
 const file='assets/art/parts/'+id+'.json',old=JSON.parse(execFileSync('git',['show','3aac22a:'+file])),now=JSON.parse(fs.readFileSync(file));
 const metadata=s=>Object.fromEntries(Object.entries(s).filter(([key])=>!['frames','version','authorship','maternalSurface'].includes(key)));
 assert.deepEqual(metadata(now),metadata(old),id+' changed mounting, rig or pigment metadata');
 assert.equal(now.frames.length,16);assert.equal(now.version,old.version+1);
 const bytes=fs.readFileSync('assets/art/production-review/maternal-surfaces-v1/'+id+'-master.png');assert.equal(createHash('sha256').update(bytes).digest('hex'),now.maternalSurface.masterSha256);
 const compiled=await compileSourceRgbaPart({...now,frames:now.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
 const protectedStart=compiled.regions.find(r=>r.protected).offset;let opaque=0;
 for(let f=0;f<now.frames.length;f++){
  const {rgbaBase64:oldRgba,...oldMeta}=old.frames[f],{rgbaBase64,...newMeta}=now.frames[f];assert.deepEqual(newMeta,oldMeta,id+' changed frame keys or timing');
  const pix=Buffer.from(rgbaBase64,'base64'),indices=compiled.frames[f].indices;
  for(let i=0;i<1024;i++)if(pix[i*4+3]){assert.ok(indices[i]<protectedStart,'External opaque skin must inherit body pigment, not depict exposed shell/embryo colors');opaque++}
  assert.ok(Buffer.from(recolorIndexedFrame(compiled,compiled.frames[f].key)).equals(pix),'Compiled RGBA differs');
 }
 assert.ok(opaque>500,id+' lost native tissue');
 for(let dir=0;dir<8;dir++)assert.notDeepEqual(recolorIndexedFrame(compiled,'idle:'+dir+':0'),recolorIndexedFrame(compiled,'idle:'+dir+':1'),'Lost rest-frame movement');
}
console.log('Maternal native art PASS: unchanged mounts, rigs, pigment regions, all directional/timing metadata, inherited opaque skin, distinct rest frames and source/compiled identity.');
