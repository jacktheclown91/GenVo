import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const folder=new URL('../assets/art/production-candidate-v1/',import.meta.url),oldRoot=new URL('../docs/wing-root-refinement-2026-10-29/before/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',folder))),before=JSON.parse(fs.readFileSync(new URL('catalog.json',oldRoot)));
let frames=0;
for(const entry of catalog.parts.filter(e=>!['balance-tail','paddle-tail'].includes(e.partId))){
  const oldEntry=before.parts.find(e=>e.partId===entry.partId&&e.resolution===entry.resolution);
  if(!['flight-wing','proto-wing'].includes(entry.partId)){assert.deepEqual(entry,oldEntry,'other34 non-tail variants remain exact');continue}
  const now=JSON.parse(gunzipSync(fs.readFileSync(new URL(entry.path,folder)))),old=JSON.parse(gunzipSync(fs.readFileSync(new URL(oldEntry.path,oldRoot))));
  assert.deepEqual(now.rig,old.rig);assert.deepEqual(now.rootAnchorPx,old.rootAnchorPx);assert.deepEqual(now.regions,old.regions);assert.equal(now.displayScale,old.displayScale);
  const ratio=entry.resolution/32;
  for(const frame of now.frames){
    const prior=old.frames.find(f=>f.facing===frame.facing&&f.index===frame.index),angle=(frame.facing-2)*Math.PI/4;
    assert.equal(frame.durationMs,prior.durationMs);
    let changed=0;
    for(let i=0;i<frame.alpha.length;i++){
      const dx=(i%entry.resolution+.5)/ratio-16,dy=(Math.floor(i/entry.resolution)+.5)/ratio-16,v=-dx*Math.sin(angle)+dy*Math.cos(angle);
      if(Math.abs(v)>6.05){assert.equal(frame.alpha[i],prior.alpha[i]);assert.equal(frame.indices[i],prior.indices[i],'outer feather tissue stays exact')}
      if(frame.alpha[i]!==prior.alpha[i]||frame.indices[i]!==prior.indices[i])changed++;
    }
    assert.ok(changed>entry.resolution,'actual proximal tissue changed');frames++;
  }
}
console.log('Wing root refinement PASS: '+frames+' changed proximal frames, exact outer feathers/rig/materials/timing registration and other34 retained non-tail variants.');
