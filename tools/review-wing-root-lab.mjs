import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../src/lineage/founder-design.js';
import {place} from '../src/lineage/evolution-draft.js';
import {serializePlan} from '../src/lineage/body-plan.js';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=process.cwd(),out=path.resolve(process.argv[2]||'docs/wing-root-refinement-2026-10-29/lab');
if(fs.existsSync(out))throw Error('Use a fresh evidence directory');fs.mkdirSync(out,{recursive:true});
const baseline=execFileSync('git',['show','736eca42:src/render/creature-footprint.js']);
fs.writeFileSync(path.join(out,'before-creature-footprint.js'),baseline);
const study=JSON.parse(fs.readFileSync('docs/wing-root-refinement-2026-10-29/native/receipt.json')).comparison.study;
const precursor=new FounderDesign('sandbox');assert.ok(place(precursor.draft,'proto-wing','root','dorsal').ok);
const server=http.createServer((req,res)=>{
 const f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
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
 for(const resolution of ['64','128']){
  await page.locator('#assemblyArtResolution').selectOption(resolution);await page.waitForFunction(r=>document.querySelector('#assemblyArtStatus').textContent.includes(r+'px'),resolution);
  for(const old of [true,false]){
   if(old)await page.evaluate(async resolution=>{const {loadPartArtVariant}=await import('/src/render/part-art-variants.js'),prior=await loadPartArtVariant(new URL('/docs/wing-root-refinement-2026-10-29/before/wing-catalog.json',location.href),{resolution:Number(resolution)});for(const part of prior.parts.values())window.dispatchEvent(new CustomEvent('genvo8-lab-authored-renderer',{detail:part}))},resolution);
   else await page.locator('#clearAuthored').click();
   for(let dir=0;dir<8;dir++){
    await page.locator('#previewDirection').selectOption(String(dir));
    for(let frame=0;frame<8;frame++){
     await page.locator('#previewFrame').fill(String(frame));await page.locator('#previewFrame').dispatchEvent('input');
     const view=await page.evaluate(()=>{const c=document.querySelector('#creaturePreview'),d=c.getContext('2d').getImageData(0,0,384,384).data;let edge=0;for(let i=0;i<384;i++)edge+=d[i*4+3]+d[(383*384+i)*4+3]+d[i*384*4+3]+d[(i*384+383)*4+3];return {edge,plan:window.__GENVO_LAB_ASSEMBLY__.plan.id}});
     assert.equal(view.edge,0);assert.equal(view.plan,study.animal.bodyPlan.id);receipt.frames.push({resolution,old,dir,frame});
     if(dir===2&&frame===2)await page.locator('#creaturePreview').screenshot({path:path.join(out,(old?'before':'current')+'-'+resolution+'.png')});
    }
   }
  }
 }
 assert.equal(await page.evaluate(()=>JSON.stringify({plan:window.__GENVO_LAB_ASSEMBLY__.plan,study:window.__GENVO_LAB_ASSEMBLY__.study})),original);
 await page.locator('#importAssembly').setInputFiles({name:'controlled-precursor.json',mimeType:'application/json',buffer:Buffer.from(serializePlan(precursor.draft.plan))});await page.waitForFunction(()=>!window.__GENVO_LAB_ASSEMBLY__.study);
 await page.locator('#previewAction').selectOption('court');await page.locator('#previewDirection').selectOption('2');
 await page.locator('#creaturePreview').screenshot({path:path.join(out,'controlled-precursor-current128.png')});
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS';receipt.exactImportedStudy=true;receipt.scope='Actual public-import light-flier study,256 paired before/current64/128 wing-motion orientations/phases with unchanged imported data and unclipped raster. Separate controlled precursor draft displays inherited tissue, never enters Simulation or acquires powered flight.';
 fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log('Wing-root Lab PASS:256 paired directional/stroke views, exact actual organism study, no clipping and controlled precursor display.');
}catch(error){receipt.failure=error.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(receipt,null,2));throw error}finally{await browser.close();await new Promise(r=>server.close(r))}
