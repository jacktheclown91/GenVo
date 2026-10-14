// Build immutable runtime indexed sheets from editable native RGBA source packs.
// The existing indexed codec is the single validation authority for tones, alpha and frame metadata.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const root=new URL('../assets/art/',import.meta.url);
const catalogPath=new URL('catalog.json',root);const manifest=JSON.parse(fs.readFileSync(catalogPath));
const results=[];
for(const entry of manifest.parts){
 const source=JSON.parse(fs.readFileSync(new URL(entry.path,root)));
 const sourceHash=crypto.createHash('sha256').update(fs.readFileSync(new URL(entry.path,root))).digest('hex');
 if(sourceHash!==entry.checksumSha256)throw Error(`Source changed without manifest update: ${entry.partId}`);
 const frames=source.frames.map(frame=>({...frame,rgba:[...Buffer.from(frame.rgbaBase64,'base64')]}));
 const compiled=await compileSourceRgbaPart({...source,frames});
 for(let i=0;i<compiled.frames.length;i++){
  const actual=recolorIndexedFrame(compiled,compiled.frames[i].key);
  if(!Buffer.from(actual).equals(Buffer.from(frames[i].rgba)))throw Error('Identity reproduction mismatch: '+entry.partId);
 }
 const rel='./parts/'+entry.partId+'.indexed.json';const temp=new URL(rel+'.tmp',root);fs.writeFileSync(temp,JSON.stringify(compiled));fs.renameSync(temp,new URL(rel,root));
 entry.indexed=rel;entry.compiledChecksum=compiled.checksum;results.push(`${entry.partId}: ${compiled.frames.length} frames`);
}
const catalogTemp=new URL('catalog.json.tmp',root);fs.writeFileSync(catalogTemp,JSON.stringify(manifest,null,2)+'\n');fs.renameSync(catalogTemp,catalogPath);
console.log(`Generated and identity-checked ${results.length} parts (${results.join(', ')})`);
