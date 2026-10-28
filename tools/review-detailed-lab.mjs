// Native controlled turn fixture, using real artwork and an unchanged world.
// Usage: node tools/review-detailed-lab.mjs <source root> <fresh output> [seed] [creature]
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
 const rows=[];
 for(const [name,root,material] of [['fur','soft-torso','fur-mantle'],['feathers','soft-torso','feather-mantle'],['shell','dome-torso','shell-back']]){
  await page.locator('#assemblyRoot').selectOption(root);
  await page.locator('#attachmentSocket').selectOption(JSON.stringify(['root','dorsal']));
  await page.locator('#attachmentPart').selectOption(material);await page.locator('#attach').click();
  await page.locator('#showAssemblyGuides').uncheck();
  const before=await page.evaluate(()=>JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan));
  for(const resolution of ['32','64','128']){
   await page.locator('#assemblyArtResolution').selectOption(resolution);
   await page.waitForFunction(r=>{const s=document.querySelector('#assemblyArtStatus').textContent;return r==='32'?s==='Native32 stable artwork':s.startsWith(r+'px modular');},resolution,{timeout:60000});
   await page.locator('#previewAction').selectOption('walk');
   await page.locator('#previewDirection').selectOption('2');
   await page.locator('#creaturePreview').screenshot({path:path.join(out,name+'-'+resolution+'.png')});
   for(const facing of ['0','1','2','3','4','5','6','7'])await page.locator('#previewDirection').selectOption(facing);
   if(await page.evaluate(()=>JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan))!==before)throw Error('Artwork changed the body plan');
   rows.push({name,resolution,planExact:true,view:await page.evaluate(()=>window.__GENVO_LAB_ASSEMBLY__.view)});
  }
 }
 // Real authoring controls compile a temporary native artist override.
 await page.getByRole('button',{name:'Artwork studio',exact:true}).click();
 await page.locator('#search').fill('fur-mantle');await page.locator('#library button').first().click();
 const disclosures=page.locator('summary');
 // The existing disclosure contains joint controls and catalog compilation.
 const summary=disclosures.filter({hasText:'Authored root joint'});if(await summary.count())await summary.click();
 await page.locator('#previewAsset').click();
 await page.waitForFunction(()=>document.querySelector('#authoredBindings').textContent.includes('Artist overrides:'));
 await page.getByRole('button',{name:'Creature assembly',exact:true}).click();
 await page.locator('#assemblyArtResolution').selectOption('64');
 await page.waitForFunction(()=>document.querySelector('#assemblyArtStatus').textContent.startsWith('64px modular'));
 if(!await page.locator('#authoredBindings').innerText().then(t=>t.includes('fur-mantle')))throw Error('Variant replaced the artist override');
 if(!await page.locator('#clearAuthored').isEnabled())throw Error('Artist override clear control lost');
 await page.locator('#clearAuthored').click();
 if(!await page.locator('#authoredBindings').innerText().then(t=>t.includes('Detailed modular artwork')))throw Error('Clearing artist override removed detailed variant');
 // Rapid switches cannot let a late response overwrite a newer stable choice.
 await page.locator('#assemblyArtResolution').selectOption('128');await page.locator('#assemblyArtResolution').selectOption('32');
 await page.waitForFunction(()=>document.querySelector('#assemblyArtStatus').textContent==='Native32 stable artwork');
 await page.locator('#assemblyArtResolution').selectOption('128');
 await page.waitForFunction(()=>document.querySelector('#assemblyArtStatus').textContent.startsWith('128px modular'));
 const layouts=[];
 for(const viewport of [{width:1440,height:900},{width:1024,height:768},{width:800,height:600}]){
  await page.setViewportSize(viewport);await page.screenshot({path:path.join(out,'lab-'+viewport.width+'.png')});
  layouts.push(await page.evaluate(()=>{const select=document.querySelector('#assemblyArtResolution').getBoundingClientRect(),canvas=document.querySelector('#creaturePreview').getBoundingClientRect();return{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,selector:{x:select.x,y:select.y,w:select.width,h:select.height},canvas:{x:canvas.x,y:canvas.y,w:canvas.width,h:canvas.height}};}));
 }
 if(layouts.some(r=>r.documentWidth>r.width+1||r.selector.x<0||r.selector.x+r.selector.w>r.width))throw Error('Resolution controls overflow viewport');
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',rows,layouts,artistOverridePreserved:true,stableRestoration:true,errors,creatorAcceptance:false},null,2));
 console.log('Native Lab PASS: real 32/64/128 assembled materials, eight facings, unchanged plans, artist override priority, restoration and responsive controls.');
 await page.close();await context.close();
}finally{await browser?.close();await new Promise(r=>server.close(r));}
