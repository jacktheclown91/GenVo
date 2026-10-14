import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PARTS} from '../src/lineage/part-registry.js';
import {recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/art/catalog.json',import.meta.url)));
const newParts=['beak-mouth','sucker-mouth','gape-mouth','tusk-jaw','display-eye','eyespot','horn-crest','echo-crest','water-hump','sensory-quills','armored-hide','fat-pad','scent-gland','egg-chamber','live-womb','grip-pad','kick-spur'];
assert.equal(catalog.parts.length,Object.keys(PARTS).length);
assert.equal(new Set(catalog.parts.map(p=>p.partId)).size,catalog.parts.length);
let testedFrames=0;
for(const id of newParts){
 const found=catalog.parts.find(p=>p.partId===id);assert.ok(found,id);
 const native=JSON.parse(fs.readFileSync(new URL('../assets/art/'+found.indexed,import.meta.url)));
 assert.equal(native.frames.length,16,id);
 assert.ok(native.regions.some(region=>!region.protected));
 assert.ok(native.regions.some(region=>region.protected));
 const original=native.regions.find(region=>!region.protected);
 const adjusted=original.colors.map(color=>color.map(channel=>Math.max(0,Math.min(255,Math.round(channel*.83)))));
 for(let facing=0;facing<8;facing++){
  const a=recolorIndexedFrame(native,`idle:${facing}:0`),b=recolorIndexedFrame(native,`idle:${facing}:1`);
  assert.equal(a.length,4096);assert.equal(b.length,4096);
  assert.ok(Buffer.from(a).some(x=>x!==0),'empty '+id);
  assert.notDeepEqual(a,b,`static frames ${id} facing ${facing}`);
  // Different inherited body pigment should change exposed flesh while protected details stay identical.
  const modified=recolorIndexedFrame(native,`idle:${facing}:0`,{[original.id]:adjusted});
  const selected=new Set(Array.from({length:original.colors.length},(_,i)=>original.offset+i));
  const indices=native.frames.find(f=>f.key===`idle:${facing}:0`).indices;
  let recolored=0;
  for(let px=0;px<1024;px++){
   const j=4*px;if(indices[px]===undefined)throw Error('missing index');
   if(selected.has(indices[px])&&a[j+3]){if(a[j]!==modified[j]||a[j+1]!==modified[j+1]||a[j+2]!==modified[j+2])recolored++;}
   else if(a[j+3])assert.deepEqual([...a.slice(j,j+4)],[...modified.slice(j,j+4)],'protected color modified for '+id);
  }
  assert.ok(recolored>0,'inherited pigment missing for '+id);
  testedFrames+=2;
 }
}
console.log(`native-specialty-wave: ${newParts.length} complete parts, ${testedFrames} animation/directional frames, editable pigmentation/protected accents PASS`);
