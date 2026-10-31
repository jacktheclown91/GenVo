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
  const file=path.resolve(root,'..'+pathname);
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
 const rows=[];await page.getByRole('button',{name:'Creature assembly',exact:true}).click();
 for(const [name,root,material] of [['fur','soft-torso','fur-mantle'],['feathers','long-torso','feather-mantle'],['shell','stout-torso','shell-back']]){
  await page.locator('#assemblyRoot').selectOption(root);await page.locator('#attachmentSocket').selectOption(JSON.stringify(['root','dorsal']));await page.locator('#attachmentPart').selectOption(material);await page.locator('#attach').click();await page.locator('#showAssemblyGuides').uncheck();await page.locator('#previewAction').selectOption('idle');await page.locator('#previewDirection').selectOption('2');
  const setAge=age=>page.locator('#assemblyPreviewAge').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},age);
  const before=await page.evaluate(()=>JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan));
  for(const resolution of ['32','64','128']){
   await page.locator('#assemblyArtResolution').selectOption(resolution);await page.waitForFunction(r=>document.querySelector('#assemblyArtStatus').textContent.startsWith(r==='32'?'Native32':r+'px modular'),resolution);await setAge(100);await page.getByRole('button',{name:'Pin reference',exact:true}).click();
   const reference=await page.locator('#referencePreview').evaluate(c=>c.toDataURL()),adultScale=await page.evaluate(()=>window.__GENVO_LAB_ASSEMBLY__.view.scale);
   for(const age of [0,30,70,100]){await setAge(age);const state=await page.evaluate(()=>({plan:JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan),scale:window.__GENVO_LAB_ASSEMBLY__.view.scale,status:document.querySelector('#assemblyAgeStatus').textContent,reference:document.querySelector('#referencePreview').toDataURL(),label:document.querySelector('#assemblyComparisonLabel').textContent}));if(state.plan!==before||state.reference!==reference||state.scale!==adultScale||!state.label.includes('pinned age 100%'))throw Error('Age preview changed the plan, reference age/pixels or adult framing');rows.push({name,resolution,age,status:state.status,scale:state.scale,planExact:true,referenceExact:true});if(resolution==='128'&&[0,100].includes(age))await page.screenshot({path:path.join(out,name+'-age-'+age+'.png')});}
   await page.getByRole('button',{name:'Clear reference',exact:true}).click();
   for(const facing of ['0','1','2','3','4','5','6','7']){await page.locator('#previewDirection').selectOption(facing);await setAge(30);}await page.locator('#previewDirection').selectOption('2');
  }
 }
 const layouts=[];for(const width of [1440,1024,800]){await page.setViewportSize({width,height:900});await page.screenshot({path:path.join(out,'lab-'+width+'.png')});const layout=await page.evaluate(()=>{const b=document.querySelector('#assemblyPreviewAge').getBoundingClientRect();return{width:innerWidth,documentWidth:document.documentElement.scrollWidth,slider:{x:b.x,width:b.width}};});if(layout.documentWidth>width+1||layout.slider.x<0||layout.slider.x+layout.slider.width>width)throw Error('Development controls overflow');layouts.push(layout);}
 if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',rows,layouts,errors,scope:'Public Lab root/attachment/resolution/age/reference controls; canonical developmentFor age previews, fixed adult framing, exact unchanged body plans and pinned adult pixels. Controlled previews, not observations of live juvenile organisms.',creatorAcceptance:false},null,2));console.log(JSON.stringify({status:'PASS',cases:rows.length,layouts,errors}));await page.close();await context.close();
}catch(error){fs.writeFileSync(path.join(out,'FAILED-OBSERVATION.json'),JSON.stringify({status:'FAILED',message:error.message},null,2));throw error;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
