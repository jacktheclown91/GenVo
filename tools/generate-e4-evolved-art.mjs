#!/usr/bin/env node
// E4 deterministic 32x32 source RGBA art for the six E3 biological body parts.
// Default reproduces E4; --physiology adds the six registered E6/E8/E10 parts.
// Installs only absent parts; existing candidate artwork is never overwritten.
// It refuses overwrite; canonical native source + compiled output + PNG preview
// are committed together. Art does not edit the biological part registry.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {PARTS} from '../src/lineage/part-registry.js';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';

const root=new URL('../assets/art/',import.meta.url),manifestPath=new URL('catalog.json',root);
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const physiology=process.argv.includes('--physiology');
const IDS=physiology?['arid-pad','wax-plates','flight-wing','heat-frill','endothermic-core','mammary-gland']:['filament-tuft','fur-mantle','feather-mantle','proto-wing','climber-leg','hook-pad'];
const existing=new Set(manifest.parts.map(p=>p.partId));
if(IDS.every(id=>existing.has(id))){console.log('E4 native art already installed; no overwrite');process.exit(0)}
if(IDS.some(id=>existing.has(id)||!PARTS[id]))throw Error('Partial E4 installation or unregistered part; manual review required.');

const colors={
 skin:[[22,36,46],[50,81,91],[92,140,150],[154,193,196],[219,232,224]],
 protected:[[100,90,73],[242,213,160],[238,237,222]]
};
const regionIds=['skin','protected-detail'],toneColor=n=>n<5?colors.skin[n]:colors.protected[n-5];
// Each canvas pixel stores a native tone index, alpha is an independent byte.
function painter(){
 const tones=new Uint8Array(1024),alpha=new Uint8Array(1024);
 const dot=(x,y,t,a=255)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=32||y>=32)return;const i=y*32+x;tones[i]=t;alpha[i]=a};
 const rect=(x,y,w,h,t)=>{for(let j=Math.round(y);j<y+h;j++)for(let i=Math.round(x);i<x+w;i++)dot(i,j,t)};
 const line=(x0,y0,x1,y1,t,r=.6)=>{
   const steps=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)*3));
   for(let k=0;k<=steps;k++){const x=x0+(x1-x0)*k/steps,y=y0+(y1-y0)*k/steps;
    for(let yy=Math.floor(y-r);yy<=Math.ceil(y+r);yy++)for(let xx=Math.floor(x-r);xx<=Math.ceil(x+r);xx++)
      if(Math.hypot(xx-x,yy-y)<=Math.max(.5,r))dot(xx,yy,t)}
 };
 const ellipse=(cx,cy,rx,ry,t)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)dot(x,y,t)};
 const poly=(pts,t)=>{const minY=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[1])))),maxY=Math.min(31,Math.ceil(Math.max(...pts.map(p=>p[1]))));
  for(let y=minY;y<=maxY;y++)for(let x=0;x<32;x++){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){
   const a=pts[i],b=pts[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }if(inside)dot(x,y,t)}};
 return{tones,alpha,dot,line,rect,ellipse,poly};
}
function draw(id,phase,facing=2){
 const c=painter(),{rect,line,ellipse,poly,dot}=c,b=phase?1:0;
 if(id==='arid-pad'){
  // Packed upper/lower clusters follow the canonical hip/knee/foot rig.
  line(4,8,25,8,0,3);line(4,7,25,7,2,2);line(5,6,23,6,3,1);
  ellipse(27,8,3.5,4,1);ellipse(27,7,2.5,2.5,3);
  line(4,24,23,24,0,2.3);line(4,23,22,23,2,1.3);
  ellipse(25,24,5.5,4.5-b*.5,0);ellipse(25,23,4.5,3.3-b*.4,2);
  line(22,21,28,21,4,1);for(let n=0;n<3;n++)line(24+n*2,25,24+n*2,27-b,6,.6);
  dot(8+facing%4,7,4);
 }else if(id==='wax-plates'){
  for(let n=-1;n<=1;n++){
   const x=16+n*4;
   poly([[x-3,12],[x+2,11],[x+4,16],[x+1,20],[x-3,19]],0);
   poly([[x-2,13],[x+1,12],[x+3,16],[x,19],[x-2,18]],2);
   line(x-1,13,x+1,13,6,.8);dot(x+b,15,7);
  }
 }else if(id==='flight-wing'){
  // Two panels and a narrow central root: tissue remains visibly rooted.
  rect(11,14,10,4,1);line(12,15,20,15,3,1);
  for(const side of [-1,1]){
   poly([[18,16+side*2],[18,16+side*5],[12-b,16+side*13],[5,16+side*11],[10,16+side*4]],0);
   poly([[17,16+side*2],[16,16+side*5],[11-b,16+side*12],[7,16+side*10],[11,16+side*4]],2);
   for(let n=0;n<5;n++)line(16,16+side*3,6+n*1.7,16+side*(10+n*.5-b),n%2?3:4,.65);
   line(17,16+side*2,11-b,16+side*12,6,.7);
  }
  dot(12+facing%4,15,4);
 }else if(id==='heat-frill'){
  ellipse(17,17,4,2.7,1);
  for(let n=-4;n<=4;n++){
   const y=16+n*1.5,x=15-Math.abs(n)*.4;
   poly([[18,16],[x,y-1],[7+b+Math.abs(n)*.4,y+n*.6],[x,y+1]],n%2?1:2);
   line(18,16,8+b+Math.abs(n)*.4,y+n*.6,6,.7);
   dot(8+b+Math.abs(n)*.4,y+n*.6,7);
  }
  ellipse(18,16,2.6,2,3);
 }else if(id==='endothermic-core'){
  // Skin-covered flank contour, not an exposed internal-organ icon.
  ellipse(16,16,6,4.5+b*.4,0);ellipse(16,15,5,3.8+b*.3,1);
  ellipse(15,14,3.8,2.5,2);line(13,13,17,13,3,1);
  line(12,17,18,18,5,.6);dot(18+b,15,6);
 }else if(id==='mammary-gland'){
  ellipse(16,16,6.3,3.7,0);ellipse(16,15,5.2,2.8,2);
  for(const n of [-1,1]){ellipse(16+n*2.5,16+b*.3,2.7,2.5,1);ellipse(16+n*2.5,15+b*.3,1.8,1.5,3);dot(16+n*2.5,18,5)}
  line(13,13,18,13,4,.7);
 }else if(id==='filament-tuft'){
  ellipse(16,16,5.5,3.8,1);ellipse(16,15,4.5,2.8,2);ellipse(15,15,2.7,1.4,3);
  for(let n=-3;n<=3;n++){const x=16+n*1.7,y=15+(Math.abs(n)%2);
   line(x,y,x-4-b*.6,y+n*.55,4,.55);dot(x-4,y+n*.55,6)}
  line(13,15,19,15,7,.5);
 }else if(id==='fur-mantle'){
  ellipse(16,16,9.5,7.6,0);ellipse(16,16,8.3,6.5,1);ellipse(15,15,6.7,5,2);
  ellipse(15,13,5.3,2.7,3);line(11,12,20,12,4,1.2);
  for(let n=0;n<12;n++){
   const a=n*Math.PI/6,xx=16+Math.cos(a)*8.1,yy=16+Math.sin(a)*6.4;
   line(xx,yy,xx+Math.cos(a)*(1.8+(n%3)*.4)+b*.2,yy+Math.sin(a)*1.7,n%2?3:6,.6);
  }
  for(let n=0;n<6;n++)line(9+n*2.5,17+n%2,12+n*2.2,14+n%2,3,.55);
 }else if(id==='feather-mantle'){
  ellipse(16,16,9,6.6,0);ellipse(16,16,7.8,5.6,1);
  for(let side of [-1,1])for(let n=0;n<4;n++){
   const sx=19-n*1.5,sy=16+side*(.8+n*.9);
   const tx=7-n*.2-b*.4,ty=16+side*(5+n*.5+b);
   poly([[sx,sy-1],[sx+2,sy],[tx,ty],[sx-1,sy+1]],n%2?2:3);
   line(sx,sy,tx,ty,4,.65);dot(tx,ty,7);
  }
  ellipse(18,16,3.1,2.3,2);line(16,15,20,14,4,.55);
 }else if(id==='proto-wing'){
  ellipse(17,16,4.6,3.4,0);ellipse(17,16,3,2,2);
  for(const side of [-1,1]){
   const s=side;
   poly([[16,16+s*1],[15,16+s*3],[9-b,16+s*(9+b)],[4-b,16+s*(10+b)],[9,16+s*3]],0);
   poly([[16,16+s*1],[14,16+s*3],[9-b,16+s*(8+b)],[6-b,16+s*(9+b)],[10,16+s*3]],1);
   for(let n=0;n<5;n++){
    const tx=5+n*1.7-b*.2,ty=16+s*(10-n*.9+b);
    line(16,16+s*.5,tx,ty,n%2?3:4,.7);
    dot(tx,ty,7);
   }
   line(15,16+s,7-b,16+s*(8+b),6,.6);
  }
  ellipse(17,16,2.7,2,3);line(15,15,19,15,4,.6);
 }else if(id==='climber-leg'){
  line(6,12,13,15,0,3.2);line(7,12,13,15,2,1.8);
  ellipse(13,15,3,3,0);ellipse(13,15,2,2,3);
  line(13,15,21,19+b,0,2.8);line(13,15,21,19+b,2,1.6);
  ellipse(22,19+b,2.5,2.3,1);line(21,18+b,24,18+b,4,.7);
  for(const side of [-1,1]){
   line(23,19+b,27,19+b+side*3,0,1.7);line(23,19+b,27,19+b+side*3,6,1);
   line(27,19+b+side*3,26,17+b+side*3,7,.7);
  }
 }else if(id==='hook-pad'){
  ellipse(14,17,5.5,3.4,0);ellipse(14,16,4.1,2.3,2);line(10,15,17,15,4,1);
  for(let n=-1;n<=1;n++){
   const y=17+n*2.4+b*.4;
   line(17,y,24,y+n*.9,0,2);line(17,y,24,y+n*.9,6,.9);
   line(24,y+n*.9,24.5,14+n*3,7,.8);
  }
 }
 // Rotate exact native pixel coordinates relative to torso facing. Reverse
 // sampling avoids 45-degree holes; frame 0/1 are distinct for EVERY facing.
 return Array.from({length:1024},(_,i)=>{
  const x=i%32,y=Math.floor(i/32);return{x,y};
 }).reduce((acc,{x,y},i)=>{acc.tones[i]=c.tones[i];acc.alpha[i]=c.alpha[i];return acc},{tones:new Uint8Array(1024),alpha:new Uint8Array(1024)});
}
function oriented(src,face){
 const angle=(face-2)*Math.PI/4,cos=Math.cos(angle),sin=Math.sin(angle);
 const out=new Uint8Array(4096);
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const dx=x-15.5,dy=y-15.5,
   xx=Math.round(15.5+cos*dx+sin*dy),yy=Math.round(15.5-sin*dx+cos*dy);
  const srcIdx=Math.max(0,Math.min(31,yy))*32+Math.max(0,Math.min(31,xx)),dst=(y*32+x)*4;
  const tone=src.tones[srcIdx],color=toneColor(tone);
  out[dst]=color[0];out[dst+1]=color[1];out[dst+2]=color[2];out[dst+3]=xx>=0&&xx<32&&yy>=0&&yy<32?src.alpha[srcIdx]:0;
 }
 return out;
}
function pngRGBA(pixels){
 const pngHeader=Buffer.from('89504e470d0a1a0a','hex'),ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(32,0);ihdr.writeUInt32BE(32,4);ihdr[8]=8;ihdr[9]=6;
 const scan=Buffer.alloc(32*(1+32*4));for(let row=0;row<32;row++)Buffer.from(pixels).copy(scan,row*129+1,row*128,(row+1)*128);
 const table=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
 const chunk=(type,data)=>{const name=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);
  len.writeUInt32BE(data.length);let check=0xffffffff;for(const byte of Buffer.concat([name,data]))check=table[(check^byte)&255]^(check>>>8);
  crc.writeUInt32BE((check^0xffffffff)>>>0);return Buffer.concat([len,name,data,crc])};
 return Buffer.concat([pngHeader,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
}
const pending=[];
for(const id of IDS){
 const frames=[],nativeFrames=[];
 for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
  const rgba=oriented(draw(id,index,facing),['arid-pad','flight-wing'].includes(id)?2:facing),metadata={state:'idle',facing,index,durationMs:320};
  frames.push({...metadata,rgbaBase64:Buffer.from(rgba).toString('base64')});
  nativeFrames.push({...metadata,rgba});
 }
 const source={schema:'genvo.native-part-source/1',partId:id,version:1,width:32,height:32,displayScale:1,
  rootAnchorPx:[16,16],...(id==='arid-pad'?{rig:{kind:'two-bone',upper:{rect:[0,0,32,16],start:[4,8],end:[27,8]},lower:{rect:[0,16,32,16],start:[4,24],end:[27,24]},jointSurface:{rect:[24,3,8,11],anchor:[28,8]}}}:id==='flight-wing'?{rig:{kind:'dorsal-display',rootRect:[0,14,32,4],panels:[[0,0,32,14],[0,18,32,14]],foldedExtent:.3}}:{}),regions:[
   {id:regionIds[0],protected:false,colors:colors.skin},
   {id:regionIds[1],protected:true,colors:colors.protected}
  ],frames,authorship:'AI-assisted procedural 32x32 top-down part art candidate. Creator art review pending.'};
 const compiled=await compileSourceRgbaPart({...source,frames:nativeFrames});
 for(let i=0;i<16;i++)if(!Buffer.from(recolorIndexedFrame(compiled,compiled.frames[i].key)).equals(Buffer.from(nativeFrames[i].rgba)))throw Error(id+' pixel identity mismatch '+i);
 if(nativeFrames.some(f=>!f.rgba.some((n,i)=>i%4===3&&n)))throw Error(id+' empty facing');
 for(let facing=0;facing<8;facing++)if(Buffer.from(nativeFrames[facing*2].rgba).equals(Buffer.from(nativeFrames[facing*2+1].rgba)))throw Error(id+' static frames '+facing);
 const sourceBuffer=Buffer.from(JSON.stringify(source)),hash=crypto.createHash('sha256').update(sourceBuffer).digest('hex');
 const entry={partId:id,path:'./parts/'+id+'.json',png:'./parts/'+id+'.png',
  checksumSha256:hash,status:physiology?'physiology-native-32px-review':'e4-procedural-native-32px-review',
  indexed:'./parts/'+id+'.indexed.json',compiledChecksum:compiled.checksum};
 pending.push({id,sourceBuffer,compiled,entry,png:pngRGBA(oriented(draw(id,0),2))});
}
for(const part of pending){
 fs.writeFileSync(new URL(part.entry.path,root),part.sourceBuffer);
 fs.writeFileSync(new URL(part.entry.indexed,root),JSON.stringify(part.compiled));
 fs.writeFileSync(new URL(part.entry.png,root),part.png);
 manifest.parts.push(part.entry);
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('Generated six complete 32px native part packs, 96 directional frames, exact roundtrip RGBA and manifest checksums.');
