import fs from 'node:fs';
import assert from 'node:assert/strict';
import {recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {artMount} from '../src/render/part-sprites.js';
const root=new URL('../assets/art/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root))),metadata=s=>Object.fromEntries(Object.entries(s).filter(([k])=>!['frames','version','authorship','nativeCoatArt'].includes(k))),summary=[];
for(const id of ['fur-mantle','feather-mantle']){
 const old=read('production-review/coats-v1/'+id+'-baseline.json'),source=read('parts/'+id+'.json'),compiled=read('parts/'+id+'.indexed.json');assert.deepEqual(metadata(source),metadata(old));assert.equal(source.version,old.version+1);assert.equal(source.frames.length,16);assert.equal(compiled.frames.length,16);let skin=0,fixed=0;
 for(let f=0;f<16;f++){
  const frame=source.frames[f],prior=old.frames[f],rgba=Buffer.from(frame.rgbaBase64,'base64'),before=Buffer.from(prior.rgbaBase64,'base64');assert.deepEqual({...frame,rgbaBase64:null},{...prior,rgbaBase64:null});assert.notEqual(frame.rgbaBase64,prior.rgbaBase64);assert.deepEqual(Buffer.from(recolorIndexedFrame(compiled,compiled.frames[f].key)),rgba);
  const tint=recolorIndexedFrame(compiled,compiled.frames[f].key,{skin:[[12,18,30],[35,40,80],[60,80,120],[95,140,190],[180,210,245]]});let changed=0,protectedCount=0;
  for(let i=0;i<1024;i++){const x=i%32,y=i/32|0;assert.equal(tint[i*4+3],rgba[i*4+3]);if(x===0||x===31||y===0||y===31)assert.equal(rgba[i*4+3],0);if((x-16)**2+(y-16)**2<=36&&before[i*4+3]===0)assert.equal(rgba[i*4+3],0,'original inner-body opening stays clear');if(!rgba[i*4+3])continue;if(compiled.frames[f].indices[i]>=5){assert.deepEqual([...tint.slice(i*4,i*4+4)],[...rgba.slice(i*4,i*4+4)]);protectedCount++}else if(!rgba.subarray(i*4,i*4+3).equals(Buffer.from(tint.slice(i*4,i*4+3))))changed++}
  assert.equal(rgba[(16*32+16)*4+3],0);assert.ok(changed>30);assert.ok(protectedCount>0);if(id==='fur-mantle')assert.ok(changed>protectedCount,'fur primarily inherits coloration rather than becoming fixed white');skin+=changed;fixed+=protectedCount;
 }
 for(const density of [0,.5,1])for(let dir=0;dir<8;dir++){
  const fx=Math.cos(dir*Math.PI/4),fy=Math.sin(dir*Math.PI/4),at=artMount(id,{fx,fy,bx:0,by:0,bodyW:20,bodyH:16,coatDensity:density});assert.ok(Math.abs(at.scale-(id==='fur-mantle'?.51:.48)*(.78+.30*density))<1e-12);assert.equal(at.x,-fx*1.6||0);assert.equal(at.y,-fy*1.6||0);
 }
 summary.push({id,skin,fixed});
}
assert.deepEqual(fs.readFileSync(new URL('parts/filament-tuft.json',root)),fs.readFileSync(new URL('production-review/coats-v1/filament-tuft-baseline.json',root)),'primitive filament remains unchanged');
console.log('Native coat surfaces PASS: 32 source/compiled frames, original metadata, clear body apertures and margins, inherited fur/feather pigment, protected accents and 48 original density/mount cases.',summary);
