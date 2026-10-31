import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../../src/lineage/founder-design.js';
import {place} from '../../src/lineage/evolution-draft.js';
import {serializePlan} from '../../src/lineage/body-plan.js';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=process.cwd(),out=path.resolve(process.argv[2]||'docs/lab-wing-study-2026-10-29/final');
if(fs.existsSync(out))throw Error('Use a fresh evidence directory');fs.mkdirSync(out,{recursive:true});
const baseline=execFileSync('git',['show','736eca42:src/render/creature-footprint.js']);
fs.writeFileSync(path.join(out,'before-creature-footprint.js'),baseline);
const study=JSON.parse(fs.readFileSync('docs/body-form-detail-2026-10-29/flight/receipt.json')).comparison.study;
const precursor=new FounderDesign('sandbox');assert.ok(place(precursor.draft,'proto-wing','root','dorsal').ok);
const server=http.createServer((req,res)=>{
 const f=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
 if(path.basename(f)==='__before-footprint.js'){res.setHeader('Content-Type','text/javascript');return res.end(baseline)}
 fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.gz':'application/gzip','.css':'text/css','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(b)});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
const receipt={errors:[],creatorAcceptance:false,frames:[],layouts:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/tools/creature-lab/index.html');await page.waitForFunction(()=>window.__GENVO_LAB_ASSEMBLY__);
 receipt.initial=await page.locator('#previewAction option[value="wing-study"]').evaluate(el=>({disabled:el.disabled,title:el.title}));
 assert.equal(receipt.initial.disabled,true);
 await page.locator('#importAssembly').setInputFiles({name:'actual-flier-study.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(study))});
 await page.waitForFunction(()=>!!window.__GENVO_LAB_ASSEMBLY__.study);
 const original=await page.evaluate(()=>JSON.stringify({plan:window.__GENVO_LAB_ASSEMBLY__.plan,study:window.__GENVO_LAB_ASSEMBLY__.study}));
 await page.locator('#showAssemblyGuides').uncheck();await page.locator('#previewAction').selectOption('wing-study');
 for(const resolution of ['32','64','128']){
  await page.locator('#assemblyArtResolution').selectOption(resolution);
  if(resolution!=='32')await page.waitForFunction(r=>document.querySelector('#assemblyArtStatus').textContent.includes(r+'px'),resolution);
  for(let dir=0;dir<8;dir++){
   await page.locator('#previewDirection').selectOption(String(dir));
   for(let frame=0;frame<8;frame++){
    await page.locator('#previewFrame').fill(String(frame));await page.locator('#previewFrame').dispatchEvent('input');
    const view=await page.evaluate(()=>{
     const c=document.querySelector('#creaturePreview'),data=c.getContext('2d').getImageData(0,0,384,384).data;let edge=0;
     for(let i=0;i<384;i++)edge+=data[i*4+3]+data[((383*384)+i)*4+3]+data[(i*384)*4+3]+data[(i*384+383)*4+3];
     return {edge,plan:window.__GENVO_LAB_ASSEMBLY__.plan.id,view:window.__GENVO_LAB_ASSEMBLY__.view};
    });
    assert.equal(view.edge,0,'full stroke fits the actual native preview raster');assert.equal(view.plan,study.animal.bodyPlan.id);
    receipt.frames.push({resolution,dir,frame,...view});
   }
   if(dir===2)await page.locator('#creaturePreview').screenshot({path:path.join(out,'wing-study-'+resolution+'.png')});
  }
 }
 assert.equal(await page.evaluate(()=>JSON.stringify({plan:window.__GENVO_LAB_ASSEMBLY__.plan,study:window.__GENVO_LAB_ASSEMBLY__.study})),original);
 receipt.exactImportedStudy=true;
 receipt.defaultFootprint=await page.evaluate(async()=>{
  const {creatureFootprint}=await import('/src/render/creature-footprint.js'),{creatureFootprint:before}=await import('/src/render/__before-footprint.js'),{loadPartArtVariant}=await import('/src/render/part-art-variants.js');
  const a=window.__GENVO_LAB_ASSEMBLY__.study.animal,parts=Object.fromEntries((await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:128})).parts);
  const preceding=before(a,2,{authoredParts:parts}),current=creatureFootprint(a,2,{authoredParts:parts}),noop=creatureFootprint(a,2,{authoredParts:parts,poseForFrame:()=>null});
  if(JSON.stringify(preceding)!==JSON.stringify(current)||JSON.stringify(preceding)!==JSON.stringify(noop))throw Error('Default framing differs from untouched736eca42');
  return {exact:true,before:preceding,current};
 });

 for(let frame=0;frame<8;frame++){await page.locator('#previewFrame').fill(String(frame));await page.locator('#previewFrame').dispatchEvent('input')}
 await page.evaluate(()=>{window.__canvasCount=0;const original=document.createElement.bind(document);document.createElement=function(name,...args){if(name==='canvas')window.__canvasCount++;return original(name,...args)};window.__restoreCreate=()=>document.createElement=original});
 for(let frame=0;frame<8;frame++){await page.locator('#previewFrame').fill(String(frame));await page.locator('#previewFrame').dispatchEvent('input')}
 receipt.repeatCanvasAllocations=await page.evaluate(()=>{const n=window.__canvasCount;window.__restoreCreate();return n});assert.equal(receipt.repeatCanvasAllocations,0);
 await page.locator('#assemblyPreviewAge').fill('0');await page.locator('#assemblyPreviewAge').dispatchEvent('input');await page.locator('#creaturePreview').screenshot({path:path.join(out,'newborn-grounded.png')});
 await page.locator('#assemblyPreviewAge').fill('100');await page.locator('#assemblyPreviewAge').dispatchEvent('input');
 for(const [width,height] of [[1440,1000],[1280,800],[960,720],[480,800]]){
  await page.setViewportSize({width,height});
  const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth,notice:document.querySelector('#assemblyWingStatus').textContent,visible:!document.querySelector('#assemblyWingStatus').hidden}));
  assert.ok(layout.scrollWidth<=width+1,'no horizontal overflow');assert.equal(layout.visible,true);
  receipt.layouts.push({width,height,...layout});await page.screenshot({path:path.join(out,'layout-'+width+'.png')});
 }
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Pin reference',exact:true}).click();
 await page.locator('#importAssembly').setInputFiles({name:'controlled-precursor-plan.json',mimeType:'application/json',buffer:Buffer.from(serializePlan(precursor.draft.plan))});
 await page.waitForFunction(()=>!window.__GENVO_LAB_ASSEMBLY__.study);
 assert.equal(await page.locator('#previewAction option[value="wing-study"]').evaluate(el=>el.disabled),false,'pinned real wing retains its independent articulation study');
 assert.match(await page.locator('#assemblyWingStatus').textContent(),/Pinned specimen/);
 await page.screenshot({path:path.join(out,'pinned-wing-precursor.png')});
 await page.getByRole('button',{name:'Clear reference',exact:true}).click();
 assert.equal(await page.locator('#previewAction option[value="wing-study"]').evaluate(el=>el.disabled),true);
 assert.equal(await page.locator('#previewAction').inputValue(),'idle');receipt.precursorExcluded=true;
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS';receipt.scope='Actual recorded public-flier study imported through Lab controls.192 native phase/facing/resolution views, no raster clipping, four layouts, age0 grounded study, pinned independence, precursor exclusion and exact imported study. Controlled precursor draft never entered Simulation; no takeoff eligibility claim.';
 fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));
 console.log('Lab wing study native PASS:192 phase/facing/resolution views, no clipping, four layouts, exact study, grounded age preview, independent pinned wing and precursor exclusion.');
}catch(error){receipt.failure=error.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(receipt,null,2));throw error}finally{await browser.close();await new Promise(r=>server.close(r))}
