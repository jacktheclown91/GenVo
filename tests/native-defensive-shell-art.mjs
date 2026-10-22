import fs from 'node:fs';
import assert from 'node:assert/strict';
import {recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const root=new URL('../assets/art/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root))),old=read('production-review/defensive-shell-v1/shell-back-baseline.json'),source=read('parts/shell-back.json'),compiled=read('parts/shell-back.indexed.json');
const metadata=s=>Object.fromEntries(Object.entries(s).filter(([k])=>!['frames','version','authorship','shellPaint'].includes(k)));
assert.deepEqual(metadata(source),metadata(old));assert.equal(source.version,old.version+1);assert.equal(source.frames.length,16);assert.equal(compiled.frames.length,16);
let changed=0;
for(let i=0;i<16;i++){
 const a=source.frames[i],b=old.frames[i],rgba=Buffer.from(a.rgbaBase64,'base64'),prior=Buffer.from(b.rgbaBase64,'base64');assert.deepEqual({...a,rgbaBase64:null},{...b,rgbaBase64:null});assert.deepEqual(Buffer.from(recolorIndexedFrame(compiled,compiled.frames[i].key)),rgba);
 const tinted=recolorIndexedFrame(compiled,compiled.frames[i].key,{skin:[[15,20,30],[35,40,80],[60,80,120],[95,140,190],[180,210,245]]});let delta=0;
 for(let k=0;k<1024;k++){assert.equal(rgba[k*4+3],prior[k*4+3],'exact original alpha mask');assert.equal(tinted[k*4+3],rgba[k*4+3]);if(rgba[k*4+3]&&!rgba.subarray(k*4,k*4+3).equals(prior.subarray(k*4,k*4+3)))delta++}
 assert.ok(delta>30,'every directional phase has substantial new scute paint');assert.equal(rgba[(16*32+16)*4+3],255);changed+=delta;
}
console.log('Native shell scutes PASS: 16 exact compiled frames, unchanged source metadata/material roles/timings/roots and all original alpha masks; inherited recoloring alpha retained.',{changed});
