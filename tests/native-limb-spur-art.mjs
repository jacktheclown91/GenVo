import fs from 'node:fs';
import assert from 'node:assert/strict';
import {recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const root=new URL('../assets/art/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root))),summary=[];
const metadata=s=>Object.fromEntries(Object.entries(s).filter(([k])=>!['frames','version','authorship','nativeLimbSpurArt'].includes(k)));
for(const id of ['claw','barb','hook-spur']){
 const old=read('production-review/limb-spurs-v1/'+id+'-baseline.json'),source=read('parts/'+id+'.json'),compiled=read('parts/'+id+'.indexed.json');assert.deepEqual(metadata(source),metadata(old));assert.equal(source.version,old.version+1);assert.equal(source.frames.length,16);assert.equal(compiled.frames.length,16);let fixed=0,skin=0;
 for(let f=0;f<16;f++){
  const frame=source.frames[f],prior=old.frames[f],rgba=Buffer.from(frame.rgbaBase64,'base64');assert.deepEqual({...frame,rgbaBase64:null},{...prior,rgbaBase64:null});assert.deepEqual(Buffer.from(recolorIndexedFrame(compiled,compiled.frames[f].key)),rgba);assert.notEqual(frame.rgbaBase64,prior.rgbaBase64);
  const tint=recolorIndexedFrame(compiled,compiled.frames[f].key,{skin:[[12,18,30],[35,40,80],[60,80,120],[95,140,190],[180,210,245]]});let tips=0,changedSkin=0;
  for(let k=0;k<1024;k++){const x=k%32,y=k/32|0;assert.equal(tint[k*4+3],rgba[k*4+3]);if(x===0||x===31||y===0||y===31)assert.equal(rgba[k*4+3],0,'unclipped native margin');if(!rgba[k*4+3])continue;if(compiled.frames[f].indices[k]>=5){assert.deepEqual([...tint.slice(k*4,k*4+4)],[...rgba.slice(k*4,k*4+4)]);tips++}else if(!rgba.subarray(k*4,k*4+3).equals(Buffer.from(tint.slice(k*4,k*4+3))))changedSkin++}
  const reached=new Set(),todo=[16*32+16];while(todo.length){const k=todo.pop();if(reached.has(k)||!rgba[k*4+3])continue;reached.add(k);const x=k%32,y=k/32|0;for(const dx of [-1,0,1])for(const dy of [-1,0,1])if((dx||dy)&&x+dx>=0&&x+dx<32&&y+dy>=0&&y+dy<32)todo.push((y+dy)*32+x+dx)}assert.equal(reached.size,compiled.frames[f].alpha.filter(a=>a>0).length,'every opaque sample attached to original root');assert.ok(tips>0,'protected structural accents in every facing/phase');assert.ok(changedSkin>30,'substantial inherited skin remains');assert.equal(rgba[(16*32+16)*4+3],255,'original root remains opaque');fixed+=tips;skin+=changedSkin;
 }
 for(let dir=0;dir<8;dir++)assert.notDeepEqual(recolorIndexedFrame(compiled,'idle:'+dir+':0'),recolorIndexedFrame(compiled,'idle:'+dir+':1'));
 summary.push({id,fixed,skin})
}
console.log('Native limb spur anatomy PASS: 48 source/compiled-identical frames, exact original roots/metadata/material definitions/timing, protected structural accents and inherited skin across all headings/phases, transparent margins.',summary);

// Existing source mounts must continue following the actual articulated segment.
const {artMount}=await import('../src/render/part-sprites.js');let mountCases=0;
for(const id of ['claw','barb','hook-spur'])for(let dir=0;dir<8;dir++)for(const side of [-1,1])for(const reach of [2,4,7]){
 const angle=dir*Math.PI/4,dx=Math.cos(angle)*reach,dy=Math.sin(angle)*reach,knee={x:3,y:-2},foot={x:knee.x+dx,y:knee.y+dy};
 const at=artMount(id,{knee,foot,leg:{side},bodyW:20,bodyH:16,bx:0,by:0});const length=Math.hypot(dx,dy)||1,fraction=id==='claw'?1:0;
 assert.ok(Math.abs(at.x-(knee.x+dx*fraction-dx/length*.25))<1e-12);assert.ok(Math.abs(at.y-(knee.y+dy*fraction-dy/length*.25))<1e-12);assert.equal(at.scale,.22);assert.equal(at.mirrorX,side<0);mountCases++;
}
console.log('Existing articulated spur mounts PASS:',mountCases,'foot/knee, mirrored-side and changing-reach cases.');
