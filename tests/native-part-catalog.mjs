import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {PARTS} from '../src/lineage/part-registry.js';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {PART_SPRITES} from '../src/render/part-sprites.js';
const dir=new URL('../assets/art/',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',dir)));
const ids=new Set();let frames=0;
assert.equal(catalog.parts.length,Object.keys(PARTS).length);
for(const part of catalog.parts){
 assert.ok(PARTS[part.partId],'unknown biological part '+part.partId);
 assert.ok(PART_SPRITES[part.partId],'missing fallback '+part.partId);
 assert.equal(ids.has(part.partId),false,'duplicate art '+part.partId);ids.add(part.partId);
 const buf=fs.readFileSync(new URL(part.path,dir));assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),part.checksumSha256);
 const source=JSON.parse(buf);assert.equal(source.width,32);assert.equal(source.height,32);assert.equal(source.frames.length,16);
 const canonical=await compileSourceRgbaPart({...source,frames:source.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
 const published=JSON.parse(fs.readFileSync(new URL(part.indexed,dir)));
 assert.equal(canonical.checksum,published.checksum);assert.equal(canonical.checksum,part.compiledChecksum);
 assert.deepEqual(canonical.frames.map(x=>x.key),published.frames.map(x=>x.key));
 for(let facing=0;facing<8;facing++)for(let i=0;i<2;i++){
  const key=`idle:${facing}:${i}`,data=recolorIndexedFrame(published,key);const original=source.frames.find(f=>f.facing===facing&&f.index===i);
  assert.ok(original,key);assert.ok(Buffer.from(data).equals(Buffer.from(original.rgbaBase64,'base64')),`${part.partId} ${key} lost pixels`);
  frames++;
 }
}
assert.equal(frames,Object.keys(PARTS).length*16);assert.equal(Object.keys(PARTS).length-ids.size,0);
console.log(`native-part-catalog: ${ids.size} indexed assets, ${frames} exact RGBA frames, eight facings, 0 missing native art packs PASS`);
