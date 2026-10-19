#!/usr/bin/env node
// E5 compare visibly different insulating coats on the REAL browser gameplay renderer. This is
// an automated visual capture, not a substitute for creator art approval.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let playwright;try{playwright=require('playwright')}catch{playwright=require(path.join(process.env.USERPROFILE||'', '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const {chromium}=playwright;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const expectedParts=JSON.parse(fs.readFileSync(path.join(root,'assets/art/catalog.json'))).parts.length;
const output=path.join(root,'docs/test-runs/e5-coat-review');
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{
 let name;
 try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
 const file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,args:['--disable-gpu-sandbox']}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1360,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:'+server.address().port+'/index.html';
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__GENVO8__?.editor,{timeout:45000});
 await page.getByRole('button',{name:/New World/}).click();
 await page.locator('#newWorldSeed').fill('E5-COAT-SILHOUETTES');
 await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForFunction(count=>window.__GENVO8__?.nativeArtStatus?.().installed===count,expectedParts,{timeout:60000});
 const report=await page.evaluate(async()=>{
  const g=window.__GENVO8__,{founderPlan}=await import('/src/lineage/body-inheritance.js'),{makePlan,validatePlan}=await import('/src/lineage/body-plan.js'),{drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{phenotypeFor}=await import('/src/organisms/species.js');
  const ids=['filament-tuft','fur-mantle','feather-mantle','proto-wing','climber-leg','hook-pad'];
  const normal=founderPlan(),base=normal.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),
   paint=document.createElement('canvas');paint.width=8*172;paint.height=6*178;
  paint.id='e5-review-contact-sheet';paint.style='position:fixed';paint.style='top:0';paint.style='left:0';paint.style='z-index:999999';paint.style.background='#19232a';
  document.body.append(paint);
  const c=paint.getContext('2d',{willReadFrequently:true}),rows=[];
  const make=id=>{
   const next=base.filter(n=>!(id==='climber-leg'&&n.parent==='root'&&n.socket==='limb.1')&&!(id==='hook-pad'&&n.parent==='root/limb.1'&&n.socket==='spur')&&!(id!=='hook-pad'&&id!=='climber-leg'&&n.parent==='root'&&n.socket==='dorsal'));
   if(id==='climber-leg')next.push({partId:id,parent:'root',socket:'limb.1'});
   else if(id==='hook-pad')next.push({partId:id,parent:'root/limb.1',socket:'spur'});
   else next.push({partId:id,parent:'root',socket:'dorsal'});
   const plan=makePlan(next);if(!validatePlan(plan).ok)throw Error('Invalid review body '+id+' '+JSON.stringify(validatePlan(plan).errors));return plan;
  };
  for(let j=0;j<ids.length;j++){
   const id=ids[j],plan=make(id),digests=[];
   for(let d=0;d<8;d++){
    const x=d*172+86,y=j*178+88;const animal={id:1000+j,age:36,alive:true,health:100,energy:95,hydration:95,species:'genvo',genes:{},anatomy:{},adaptations:[],bodyPlan:plan,dir:d};
    c.save();c.translate(x,y);
    drawGenvoSprite(c,{animal,phenotype:phenotypeFor(animal),scale:6,frame:1,moving:false,palette:{body:'#86b0c4',shade:'#31556c',light:'#d3ebeb'},pose:{dir:d,action:'court',life:{breath:.5},behavior:{crestSpread:.85}}});
    c.restore();c.fillStyle='#d8e2e6';c.font='12px monospace';c.fillText(id,d*172+5,j*178+169);
    const pixels=c.getImageData(d*172+8,j*178+8,154,150).data;
    let n=0,hash=2166136261;for(let k=0;k<pixels.length;k+=4){if(pixels[k+3])n++;hash=Math.imul(hash^pixels[k],16777619);hash=Math.imul(hash^pixels[k+1],16777619);hash=Math.imul(hash^pixels[k+2],16777619);hash=Math.imul(hash^pixels[k+3],16777619)}
    if(n<70)throw Error(id+' missing rendered pixels facing '+d);
    digests.push(hash>>>0);
   }
   if(new Set(digests).size<4)throw Error(id+' insufficient directional rendered variation');
   rows.push({part:id,plan:plan.id,directions:digests.length,uniqueDirectionalRenders:new Set(digests).size});
  }
  const status=g.nativeArtStatus();
  return{scope:'Actual Chromium GenVo game boot, catalog-complete native part packs, six valid reviewed actual mounted bodies, eight true top-down facings, in-game renderer. Controlled screenshot is a preview, not a naturally evolved lineage or subjective art approval.',nativeArt:status,rows};
 });
 const contactPng=await page.locator('#e5-review-contact-sheet').evaluate(el=>el.toDataURL('image/png').split(',')[1]);
 fs.writeFileSync(path.join(output,'e5-all-inherited-parts-8-directions.png'),Buffer.from(contactPng,'base64'));
 // A pure canvas export avoids game HUD/toasts overlapping the review sheet.
 await page.evaluate(()=>document.querySelector('#e5-review-contact-sheet').remove());
 await page.screenshot({path:path.join(output,'real-game-e5-world.png')});
 if(errors.length)throw Error('Browser page errors: '+errors.join('; '));
 assert.equal(report.nativeArt.installed,expectedParts);
 assert.equal(report.rows.length,6);
 fs.writeFileSync(path.join(output,'review.json'),JSON.stringify({...report,pageErrors:errors},null,2));
 console.log('E5 real Chromium native art: catalog-complete packs loaded, six distinct mounted parts × 8 facings, real world screenshot, zero page errors PASS');
}finally{await browser.close();await new Promise(r=>server.close(r))}
