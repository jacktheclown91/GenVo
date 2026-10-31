// Compare candidate source to the recorded pre-pass baseline, never to a mutable worktree.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const ids=['gill-slits','silt-fin','filter-mouth','reed-sieve-mouth'];
for(const id of ids){
 const filename='assets/art/parts/'+id+'.json',before=JSON.parse(execFileSync('git',['show','983a95a:'+filename])),after=JSON.parse(fs.readFileSync(filename));
 const metadata=s=>Object.fromEntries(Object.entries(s).filter(([k])=>!['frames','version','surfaceRefinement'].includes(k)));
 assert.deepEqual(metadata(after),metadata(before),id+' changed mount, palette, rig or other metadata');
 assert.equal(after.frames.length,before.frames.length);
 const skin=new Set(before.regions[0].colors.map(c=>c.join(',')));let changed=0;
 for(let f=0;f<before.frames.length;f++){
  const a=before.frames[f],b=after.frames[f],meta=({rgbaBase64,...rest})=>rest;
  assert.deepEqual(meta(b),meta(a),id+' changed directional keys or animation timing');
  const x=Buffer.from(a.rgbaBase64,'base64'),y=Buffer.from(b.rgbaBase64,'base64');
  assert.equal(x.length,y.length);
  for(let k=0;k<x.length;k+=4){assert.equal(y[k+3],x[k+3],id+' changed silhouette/alpha');
   if(!skin.has([...x.subarray(k,k+3)].join(',')))assert.deepEqual(y.subarray(k,k+4),x.subarray(k,k+4),id+' changed protected material');
   if(!x.subarray(k,k+4).equals(y.subarray(k,k+4)))changed++;
  }
 }
 assert.equal(changed,after.surfaceRefinement.changedSkinPixels);assert.ok(changed>0);
}
console.log('Aquatic surfaces: exact original alpha, protected materials, rigs, mounts, pigment regions, directional frames and timing preserved PASS');
