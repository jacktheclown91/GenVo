import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let playwright;try{playwright=require('playwright')}catch{playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=process.cwd(),out=path.join(root,'assets/art/production-candidate-v1');
const refinement=process.argv.includes('--refine-coverings');
const previous=JSON.parse(fs.readFileSync(refinement?path.join(out,'catalog.json'):'assets/art/experiments/resolution-v1/catalog.json','utf8'));
const painted=new Set(refinement?['fur-mantle','feather-mantle','shell-back']:['fur-mantle','feather-mantle','shell-back','head-base','walking-leg','runner-leg','sturdy-leg']);
const catalog={schema:'genvo.part-art-variants/1',version:1,status:'production-candidate-creator-review',
  native32Fallback:true,author:'Built-in image_gen masters plus canonical indexed compilation; other first-batch anatomy retains the original code-authored studies.',
  generation:'Source atlases are preserved unmodified. Canonical north pose zero is registered once and rasterized at all eight facings; rigid shell uses one pose to avoid breathing rigid plates. No claim that generated atlas cells accurately depict all directions.',parts:[]};
if(refinement)Object.assign(catalog,{...previous,version:2,parts:[],refinement:'Three single-view covering masters, explicit fixed registration; preceding masters retained.'});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await playwright.chromium.launch();const page=await browser.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port+'/tools/art-resolution/index.html');
 const results=await page.evaluate(async({ids,refinement})=>{
  const {compileIndexedPart}=await import('/src/render/indexed-part-art.js');
  const results=[];
  for(const id of ids){
   const source=await (await fetch('/assets/art/parts/'+id+'.indexed.json')).json();
   const masterId=id.endsWith('-leg')?'walking-leg':id;
   const masterPath=(refinement?'refinement-v2/':'')+masterId+'-master.png';
   const response=await fetch('/assets/art/production-candidate-v1/source/'+masterPath);
   if(!response.ok)throw Error('Missing master '+masterPath);
   const image=await createImageBitmap(await response.blob());
   const cell=image.width/4;
   const reference=document.createElement('canvas');reference.width=image.width;reference.height=image.height;
   const rc=reference.getContext('2d',{willReadFrequently:true});rc.drawImage(image,0,0);
   const pixels=rc.getImageData(0,0,image.width,image.height).data;
   const bounds=(y0,y1)=>{
    let x0=image.width,x1=-1,top=y1,bottom=-1;
    for(let y=Math.floor(y0);y<Math.floor(y1);y++)for(let x=0;x<image.width;x++)if(pixels[(y*image.width+x)*4+3]>=80){x0=Math.min(x0,x);x1=Math.max(x1,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(x1<0)throw Error('Empty source tissue');return[x0,top,x1-x0+1,bottom-top+1];
   };
   const allBounds=id==='head-base'||refinement?bounds(0,image.height):null;
   const upperBounds=id.endsWith('-leg')?bounds(0,image.height/2):null;
   const lowerBounds=id.endsWith('-leg')?bounds(image.height/2,image.height):null;
   if(image.width!==image.height)throw Error('Master is not square');
   // A fixed source registration, never a frame-by-frame auto-crop. Select the
   // canonical north paint and transform its actual pixels, not inferred anatomy.
   for(const resolution of [64,128]){
    const ratio=resolution/32,frames=[],atlas=document.createElement('canvas');atlas.width=resolution*8;atlas.height=resolution*2;
    const ac=atlas.getContext('2d'),regions=source.regions.map(({id,protected:fixed,colors})=>({id,protected:fixed,colors}));
    const colors=regions.flatMap(r=>r.colors);
    for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
     const canvas=document.createElement('canvas');canvas.width=canvas.height=resolution;const c=canvas.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;
     if(id.endsWith('-leg')){
      const thick=id==='sturdy-leg'?[11,8.5]:id==='runner-leg'?[6.2,4.8]:[9,6.5];
      for(const [row,box] of [[0,upperBounds],[1,lowerBounds]]){
       const h=thick[row]*ratio,cy=(8+16*row)*ratio;
       c.drawImage(image,...box,.5*ratio,cy-h/2,31*ratio,h);
      }
     }else{
      c.translate(resolution/2,resolution/2);c.rotate(facing*Math.PI/4);
      if(id==='head-base'){
       const [w,h]=source.rig.bodyBoundsPx;c.drawImage(image,...allBounds,-w*ratio/2,-h*ratio/2,w*ratio,h*ratio);
      }else if(refinement){
       const size=26*ratio,max=Math.max(allBounds[2],allBounds[3]),w=size*allBounds[2]/max,h=size*allBounds[3]/max;
       c.drawImage(image,...allBounds,-w/2,-h/2,w,h);
      }else{
       const side=26*ratio;c.drawImage(image,0,0,cell,cell,-side/2,-side/2,side,side);
      }
     }
     const rgba=c.getImageData(0,0,resolution,resolution),indices=[],alpha=[];
     for(let p=0;p<resolution*resolution;p++){
      const j=p*4;
      // Keep the master's actual neck opening. A dense mounted coat covers
      // dorsal torso tissue; imposing the old study's large central hole
      // would discard the newly authored material and leave a thin ring.
      const opacity=rgba.data[j+3];
      const brightness=.2126*rgba.data[j]+.7152*rgba.data[j+1]+.0722*rgba.data[j+2];
      // Stable five-tone inherited ramp; bright guard hairs may use the
      // original protected accent. No new pigment authority is introduced.
      let tone=brightness<33?0:brightness<65?1:brightness<106?2:brightness<161?3:4;
      if(id!=='shell-back'&&regions[1].colors.length>2&&brightness>190&&rgba.data[j]>rgba.data[j+2]*1.18)tone=6;
      indices.push(tone);alpha.push(opacity<80?0:255);
      const rgb=colors[tone];rgba.data[j]=rgb[0];rgba.data[j+1]=rgb[1];rgba.data[j+2]=rgb[2];rgba.data[j+3]=alpha[p];
     }
     const frame={state:'idle',facing,index,durationMs:source.frames.find(f=>f.facing===facing&&f.index===index)?.durationMs||320,indices,alpha};frames.push(frame);
     ac.putImageData(rgba,facing*resolution,index*resolution);
    }
    const scaleRig=v=>Array.isArray(v)?v.map(scaleRig):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scaleRig(x)])):typeof v==='number'?v*ratio:v;
    const asset=await compileIndexedPart({...(source.rig?{rig:scaleRig(source.rig)}:{}),partId:id,version:2,width:resolution,height:resolution,displayScale:(source.displayScale??1)/ratio,rootAnchorPx:source.rootAnchorPx.map(v=>v*ratio),regions,frames});
    results.push({id,resolution,asset,png:atlas.toDataURL('image/png'),masterId,masterPath,masterWidth:image.width,sourceChecksum:source.checksum});
   }
   image.close();
  }
  return results;
 },{ids:[...painted],refinement});
 for(const entry of previous.parts){
  if(refinement&&!painted.has(entry.partId)){catalog.parts.push(entry);continue;}
  const {partId,resolution}=entry,file=partId+'-'+resolution+'.indexed.json.gz';let bytes,checksum,kind,master;
  if(painted.has(partId)){
   const r=results.find(r=>r.id===partId&&r.resolution===resolution);bytes=gzipSync(JSON.stringify(r.asset),{level:9});checksum=r.asset.checksum;kind='imagegen-indexed';
   fs.writeFileSync(path.join(out,partId+'-'+resolution+'.png'),Buffer.from(r.png.split(',')[1],'base64'));
   master={path:'./source/'+r.masterPath,sha256:createHash('sha256').update(fs.readFileSync(path.join(out,'source',r.masterPath))).digest('hex'),width:r.masterWidth,registration:refinement?'Single north-view tissue, alpha bounds registered once with preserved aspect ratio':partId.endsWith('-leg')?'Two registered tissue rows, canonical bone anchors preserved':partId==='head-base'?'Single canonical north surface, registered to existing head bounds':'Canonical north atlas cell zero, registered to existing dorsal pivot'};
  }else{
   bytes=fs.readFileSync(path.join(root,'assets/art/experiments/resolution-v1',entry.path));checksum=entry.checksum;kind='code-authored-indexed';
   fs.copyFileSync(path.join(root,'assets/art/experiments/resolution-v1',partId+'-'+resolution+'.png'),path.join(out,partId+'-'+resolution+'.png'));
  }
  fs.writeFileSync(path.join(out,file),bytes);
  catalog.parts.push({partId,resolution,path:'./'+file,checksum,bytes:bytes.length,decodedRgbaBytes:resolution*resolution*16*4,sourceChecksum:entry.sourceChecksum,kind,...(master?{master}:{}),coordinatePolicy:'Existing 32-unit pivot, registered physical display scale; no world-size change.'});
 }
 fs.writeFileSync(path.join(out,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
 console.log('Compiled production candidate: '+catalog.parts.length+' modular variants; registered imagegen-derived modular parts × 2 native resolutions; 32px untouched.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
