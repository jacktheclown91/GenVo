#!/usr/bin/env node
// E5: deterministic 32x32 native art re-authoring for the three existing E3 coverings.
// Only edits existing E4 cover art from a known SHA-protected state; never alters biology.
// It refuses unrelated overwrite; canonical source + compiled output + PNG preview
// are committed together. Art does not edit the biological part registry.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {PARTS} from '../src/lineage/part-registry.js';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';

const root=new URL('../assets/art/',import.meta.url),manifestPath=new URL('catalog.json',root);
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const IDS=['filament-tuft','fur-mantle','feather-mantle'];
const records=IDS.map(id=>manifest.parts.find(p=>p.partId===id));
if(records.some((r,i)=>!r||!PARTS[IDS[i]]))throw Error('E5 requires three already installed E4 biological art parts.');
if(records.every(r=>r.status==='e5-native-coat-silhouette-review')){console.log('E5 cover art already installed; no changes');process.exit(0)}
if(records.some(r=>r.status!=='e4-procedural-native-32px-review'))throw Error('E5 partial or unexpected art version: fail closed.');
for(const r of records){
 const bytes=fs.readFileSync(new URL(r.path,root)),hash=crypto.createHash('sha256').update(bytes).digest('hex');
 if(hash!==r.checksumSha256)throw Error('E4 source art was modified outside canonical catalogue: '+r.partId);
}

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
function draw(id,phase){
 const c=painter(),{rect,line,ellipse,poly,dot}=c,b=phase?1:0;
 if(id==='filament-tuft'){
  // Sparse follicle tufts. Keep the back mostly visible: an ancestral covering,
  // NOT an already thick fur coat. Fine strands form a narrow directional comb.
  ellipse(16,16,5.8,3.5,1);ellipse(16,15.4,4.2,2.1,2);
  for(let n=-4;n<=4;n++){
   const x=16+n*1.30,y=15+(Math.abs(n)%3)*.45,reach=3.3+(n%3===0?1.7:.35)+b*.65;
   line(x,y,x-reach,y+n*.62, n%2?3:4,.40);
   dot(x-reach,y+n*.62,6);
  }
  for(let n=-2;n<=2;n++)line(17+n*.85,17+n%2,20+n*.45,18+n*.9,3,.42);
  line(14,14.3,19,14.3,7,.47);
 }else if(id==='fur-mantle'){
  // Thick continuous ragged silhouette. Guard hairs project beyond the body
  // on all sides, with warm cream tips visible even against dark vegetation.
  ellipse(16,16,10.8,9.6,0);
  ellipse(16,15.8,9.8,8.6,1);
  ellipse(16,15.6,8.5,7.4,2);
  ellipse(15.7,14.4,6.6,4.5,3);
  for(let n=0;n<24;n++){
   const a=n*Math.PI/12,rx=9.7,ry=8.6,x=16+Math.cos(a)*rx,y=16+Math.sin(a)*ry;
   const extend=1.7+(n%3)*.62+(b&&n%4===0?.6:0);
   line(x,y,x+Math.cos(a)*extend,y+Math.sin(a)*extend,n%4===0?6:3,n%4===0?1.0:.8);
   if(n%3===0)dot(x+Math.cos(a)*(extend+.5),y+Math.sin(a)*(extend+.5),7);
  }
  for(let n=0;n<8;n++){
   const x=9+n*2,y=12+(n%2)*2;
   line(x,y,x+2.5,y+3.5,n%3===0?6:4,.85);
  }
  for(let n=0;n<4;n++)line(12+n*2.3,9,11+n*2.5,6+b*.3,7,.7);
 }else if(id==='feather-mantle'){
  // Short, separate, tapered feather vanes. Anterior and posterior barbs open
  // the *side* silhouette into crisp independent quills, unlike fur's round
  // shaggy continuous halo. These are insulation feathers, not lift surfaces.
  ellipse(17,16,6.5,6.0,0);
  ellipse(17,15.5,5.3,5,2);
  for(let side of [-1,1])for(let n=0;n<5;n++){
   const rootX=19-n*1.9,rootY=16+side*(1.0+n*.7);
   const tipX=4+n*.82-b*.24,tipY=16+side*(5.2+n*.9+b*.55);
   poly([[rootX,rootY-1.1],[rootX+1.1,rootY],[tipX,tipY],[rootX-1.3,rootY+1.2]],n%2?1:3);
   line(rootX,rootY,tipX,tipY,4,.7);
   // Two cross-barbs per quill, visible on 32px without relying on blur.
   const cx=(rootX+tipX)*.52,cy=(rootY+tipY)*.52;
   line(cx,cy,cx-.7,cy+side*1.5,n%2?6:3,.46);
   line(cx+1,cy-1,cx+.3,cy-side*1.1,4,.43);
   dot(tipX,tipY,n%2?7:6);
  }
  ellipse(19,16,3.1,2.8,2);
  line(18,15,22,14,4,.65);
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
  const rgba=oriented(draw(id,index),facing),metadata={state:'idle',facing,index,durationMs:320};
  frames.push({...metadata,rgbaBase64:Buffer.from(rgba).toString('base64')});
  nativeFrames.push({...metadata,rgba});
 }
 const source={schema:'genvo.native-part-source/1',partId:id,version:2,width:32,height:32,displayScale:1,
  rootAnchorPx:[16,16],regions:[
   {id:regionIds[0],protected:false,colors:colors.skin},
   {id:regionIds[1],protected:true,colors:colors.protected}
  ],frames,authorship:'AI-assisted procedural 32x32 overhead coat silhouette revision. Creator readability and art review pending.'};
 const compiled=await compileSourceRgbaPart({...source,frames:nativeFrames});
 for(let i=0;i<16;i++)if(!Buffer.from(recolorIndexedFrame(compiled,compiled.frames[i].key)).equals(Buffer.from(nativeFrames[i].rgba)))throw Error(id+' pixel identity mismatch '+i);
 if(nativeFrames.some(f=>!f.rgba.some((n,i)=>i%4===3&&n)))throw Error(id+' empty facing');
 for(let facing=0;facing<8;facing++)if(Buffer.from(nativeFrames[facing*2].rgba).equals(Buffer.from(nativeFrames[facing*2+1].rgba)))throw Error(id+' static frames '+facing);
 const sourceBuffer=Buffer.from(JSON.stringify(source)),hash=crypto.createHash('sha256').update(sourceBuffer).digest('hex');
 const entry={partId:id,path:'./parts/'+id+'.json',png:'./parts/'+id+'.png',
  checksumSha256:hash,status:'e5-native-coat-silhouette-review',
  indexed:'./parts/'+id+'.indexed.json',compiledChecksum:compiled.checksum};
 pending.push({id,sourceBuffer,compiled,entry,png:pngRGBA(oriented(draw(id,0),2))});
}
for(const part of pending){
 fs.writeFileSync(new URL(part.entry.path,root),part.sourceBuffer);
 fs.writeFileSync(new URL(part.entry.indexed,root),JSON.stringify(part.compiled));
 fs.writeFileSync(new URL(part.entry.png,root),part.png);
 manifest.parts[manifest.parts.findIndex(row=>row.partId===part.id)]=part.entry;
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('Re-authored three E5 overhead native coats, 48 directional frames, exact full-RGBA roundtrip and checked catalogued source SHA.');
