// Explicit procedural fallback sheet, plus ordinary native Lab import verification.
// Usage: node tools/review-part-mirroring.mjs <source root> <fresh output> [seed] [creature]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright')}catch{
  playwright=require(path.join(process.env.USERPROFILE,
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
if(!process.argv[2]||!process.argv[3])throw Error('Supply source root and fresh evidence directory');
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
const seed=process.argv[4]||'GENVO8-TEST-A',creature=process.argv[5]||'recorded';
if(fs.existsSync(out))throw Error('Never overwrite an earlier review');
fs.mkdirSync(out,{recursive:true});
const mime={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json',
  '.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml',
  '.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://local').pathname);
  const file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return}
  const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
  fs.readFile(target,(error,bytes)=>{
    if(error){response.writeHead(404);response.end();return}
    response.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
    response.end(bytes);
  });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await playwright.chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/tools/creature-lab/index.html');
 await page.waitForFunction(()=>window.__GENVO_LAB_ASSEMBLY__?.plan&&document.querySelector('#assemblyArtResolution'));
 const evidence=await page.evaluate(async()=>{
  const {artForPart}=await import('/src/render/runtime-part-art.js'),{serializePlan}=await import('/src/lineage/body-plan.js'),{drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{phenotypeFor}=await import('/src/organisms/species.js'),{attachPart,starterPlan}=await import('/tools/creature-lab/assembly-model.js'),{loadPartArtVariant}=await import('/src/render/part-art-variants.js');
  let plan=starterPlan('small-torso');for(const side of ['left','right'])plan=attachPart(plan,'root','flank.'+side,'armor-plate');
  for(const n of [...plan.nodes])if(n.socket?.startsWith('limb.'))plan=attachPart(plan,n.id,'spur','claw');
  const timings=[];const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=660;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  for(let row=0;row<3;row++){
   const resolution=[32,64,128][row],loaded=resolution===32?undefined:Object.fromEntries((await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution})).parts);
   const art={...loaded,...Object.fromEntries(['walking-leg','runner-leg','sturdy-leg'].map(id=>[id,{drawLimb(){return false}}]))};
   for(let dir=0;dir<8;dir++){
    const x=dir*180,y=row*220;c.fillStyle='#14251d';c.fillRect(x,y,180,220);c.fillStyle='#ddd3b8';c.font='14px sans-serif';c.fillText(resolution+'px '+['N','NE','E','SE','S','SW','W','NW'][dir],x+8,y+20);
    const animal={id:12,bodyPlan:plan,species:'genvo',alive:true,age:60,genes:{body:1,motion:1,senses:1,temperament:1},adaptations:[]};
    c.save();c.translate(x+90,y+110);drawGenvoSprite(c,{animal,phenotype:phenotypeFor(animal),scale:5,palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'},authoredParts:art,pose:{dir,action:'idle'}});c.restore();
   }
  }
  // Compare actual same-rig painting against the preceding default transforms.
  for(const resolution of [32,64,128]){
   const parts=resolution===32?{}:Object.fromEntries((await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution})).parts);
   const animal={id:12,bodyPlan:plan,species:'genvo',alive:true,age:60,genes:{body:1,motion:1,senses:1,temperament:1},adaptations:[]};
   for(const corrected of [false,true]){
    const authoredParts={...parts};
    for(const id of ['walking-leg','runner-leg','sturdy-leg']){const art=parts[id]||artForPart(id);authoredParts[id]={...art,drawLimb(ctx,options){return art.drawLimb(ctx,corrected?options:{...options,mirrorTransverse:false,footForward:null});}};}
    const samples=[],scratch=document.createElement('canvas');scratch.width=scratch.height=256;const dc=scratch.getContext('2d');
    for(let i=0;i<36;i++){const start=performance.now();for(const dir of [0,1,2,3]){dc.clearRect(0,0,256,256);drawGenvoSprite(dc,{animal,phenotype:phenotypeFor(animal),scale:3,authoredParts,palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'},pose:{dir,action:'idle'}});}if(i>=6)samples.push(performance.now()-start);}
    samples.sort((a,b)=>a-b);timings.push({resolution,corrected,medianMs:samples[15],p95Ms:samples[28],samples:samples.length,spritesPerSample:4});
   }
  }
  return{png:canvas.toDataURL(),plan,serialized:serializePlan(plan),timings};
 });
 fs.writeFileSync(path.join(out,'mirroring-'+(process.argv[4]||'current')+'.png'),Buffer.from(evidence.png.split(',')[1],'base64'));delete evidence.png;
 fs.writeFileSync(path.join(out,'fixture.json'),JSON.stringify(evidence,null,2));
 await page.getByRole('button',{name:'Creature assembly',exact:true}).click();
 await page.locator('#importAssembly').setInputFiles({name:'paired-part-review.json',mimeType:'application/json',buffer:Buffer.from(evidence.serialized)});
 await page.waitForFunction(id=>window.__GENVO_LAB_ASSEMBLY__.plan.id===id,evidence.plan.id);
 await page.locator('#showAssemblyGuides').uncheck();await page.locator('#previewDirection').selectOption('1');
 const rows=[];
 for(const resolution of ['32','64','128']){
  await page.locator('#assemblyArtResolution').selectOption(resolution);
  await page.waitForFunction(r=>document.querySelector('#assemblyArtStatus').textContent.startsWith(r==='32'?'Native32 stable artwork':r+'px modular'),resolution);
  await page.locator('#creaturePreview').screenshot({path:path.join(out,'lab-limbs-'+resolution+'.png')});
  const exact=await page.evaluate(plan=>JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan)===JSON.stringify(plan),evidence.plan);if(!exact)throw Error('Mirroring altered the body plan');rows.push({resolution,planExact:true});
 }
 await page.screenshot({path:path.join(out,'native-lab.png')});if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',rows,errors,timings:evidence.timings,timingScope:'Matched uncached four-sprite CPU composition; reused diagnostic canvas. Not full-world FPS.',scope:'Eight-facing sheet deliberately forces procedural limb fallback through the canonical compositor; Lab screenshots separately verify ordinary indexed artwork, not forced fallback. Actual public import and resolution controls, unchanged plans.',creatorAcceptance:false},null,2));

 await page.close();await context.close();
}finally{await browser?.close();await new Promise(r=>server.close(r));}
