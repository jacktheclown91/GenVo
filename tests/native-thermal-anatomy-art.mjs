import fs from 'node:fs';
import assert from 'node:assert/strict';
import {recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const root=new URL('../assets/art/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root))),summary=[];
const metadata=s=>Object.fromEntries(Object.entries(s).filter(([k])=>!['frames','version','authorship','nativeThermalArt'].includes(k)));
for(const id of ['wax-plates','heat-frill','endothermic-core']){
 const old=read('production-review/thermal-anatomy-v1/'+id+'-baseline.json'),source=read('parts/'+id+'.json'),compiled=read('parts/'+id+'.indexed.json');assert.deepEqual(metadata(source),metadata(old));assert.equal(source.version,old.version+1);assert.equal(source.frames.length,16);assert.equal(compiled.frames.length,16);let fixed=0,skin=0;
 for(let f=0;f<16;f++){
  const frame=source.frames[f],prior=old.frames[f],rgba=Buffer.from(frame.rgbaBase64,'base64');assert.deepEqual({...frame,rgbaBase64:null},{...prior,rgbaBase64:null});assert.deepEqual(Buffer.from(recolorIndexedFrame(compiled,compiled.frames[f].key)),rgba);assert.notEqual(frame.rgbaBase64,prior.rgbaBase64);
  const tint=recolorIndexedFrame(compiled,compiled.frames[f].key,{skin:[[12,18,30],[35,40,80],[60,80,120],[95,140,190],[180,210,245]]});let tips=0,changedSkin=0;
  for(let k=0;k<1024;k++){const x=k%32,y=k/32|0;assert.equal(tint[k*4+3],rgba[k*4+3]);if(x===0||x===31||y===0||y===31)assert.equal(rgba[k*4+3],0,'unclipped native margin');if(!rgba[k*4+3])continue;if(compiled.frames[f].indices[k]>=5){assert.deepEqual([...tint.slice(k*4,k*4+4)],[...rgba.slice(k*4,k*4+4)]);tips++}else if(!rgba.subarray(k*4,k*4+3).equals(Buffer.from(tint.slice(k*4,k*4+3))))changedSkin++}
  const reached=new Set(),todo=[16*32+16];while(todo.length){const k=todo.pop();if(reached.has(k)||!rgba[k*4+3])continue;reached.add(k);const x=k%32,y=k/32|0;for(const dx of [-1,0,1])for(const dy of [-1,0,1])if((dx||dy)&&x+dx>=0&&x+dx<32&&y+dy>=0&&y+dy<32)todo.push((y+dy)*32+x+dx)}assert.equal(reached.size,compiled.frames[f].alpha.filter(a=>a>0).length,'every opaque sample attached to original root');assert.ok(tips>0,'protected structural accents in every facing/phase');assert.ok(changedSkin>30,'substantial inherited skin remains');assert.equal(rgba[(16*32+16)*4+3],255,'original root remains opaque');fixed+=tips;skin+=changedSkin;
 }
 for(let dir=0;dir<8;dir++)assert.notDeepEqual(recolorIndexedFrame(compiled,'idle:'+dir+':0'),recolorIndexedFrame(compiled,'idle:'+dir+':1'));
 summary.push({id,fixed,skin})
}
console.log('Native thermal anatomy PASS: 48 source/compiled-identical frames, exact original roots/metadata/material definitions/timing, protected structural accents and inherited skin across all headings/phases, transparent margins.',summary);

// Verify existing flare transforms without manufacturing a simulation display record.
const {artMount,drawPart}=await import('../src/render/part-sprites.js'),{prepareIndexedPartRenderer}=await import('../src/render/indexed-part-renderer.js');
let allocations=0;const prepared=prepareIndexedPartRenderer(read('parts/heat-frill.indexed.json'),{createCanvas(){allocations++;return{getContext(){return{createImageData(){return{data:new Uint8ClampedArray(4096)}},putImageData(){}}}}}});const initial=allocations;
for(let dir=0;dir<8;dir++)for(let frame=0;frame<2;frame++)for(const spread of [0,.5,1]){
 const angle=(dir-2)*Math.PI/4,fx=Math.cos(angle),fy=Math.sin(angle),calls=[],c=Object.fromEntries(['save','restore','translate','rotate','scale','drawImage'].map(n=>[n,(...a)=>calls.push([n,...a])]));const k={s:2,p:{},bx:0,by:0,originX:0,originY:0,bodyW:20,bodyH:16,fx,fy,perp:{x:-fy,y:fx},L:{dorsal:{x:-fx,y:-fy}},behavior:{crestSpread:spread},authoredParts:{'heat-frill':prepared},authoredFacing:dir,authoredFrameIndex:frame,authoredState:'idle'};
 const at=artMount('heat-frill',k);assert.equal(at.x,(-fx)||0);assert.equal(at.y,(-fy)||0);assert.ok(Math.abs(at.scale-.31*(1+spread))<1e-12);assert.equal(drawPart(c,'heat-frill',k),true);assert.deepEqual(calls.find(x=>x[0]==='translate'),['translate',(-2*fx)||0,(-2*fy)||0]);assert.deepEqual(calls.find(x=>x[0]==='drawImage').slice(2),[-16,-16]);assert.ok(calls.some(x=>x[0]==='scale'&&Math.abs(x[1]-.62*(1+spread))<1e-12));
}
assert.equal(allocations,initial,'flare reuses prepared native frames');console.log('Existing flare mount transform PASS: both native phases, eight directions, 0/half/full spread with fixed pivot and no draw-time canvas allocation.');
