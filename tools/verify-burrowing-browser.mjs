// Automated real Chromium controls; only actor position is staged in generated ground.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../src/lineage/founder-design.js';
import {place} from '../src/lineage/evolution-draft.js';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'docs/test-runs/burrowing-browser'),root=path.resolve(process.argv[3]||'.');fs.mkdirSync(output,{recursive:true});
const design=new FounderDesign('sandbox');for(const socket of ['limb.1','limb.7'])assert.ok(place(design.draft,'digging-forelimb','root',socket).ok);
const finished=design.finish();assert.ok(finished.ok);const file=path.join(output,'burrowing-founder.json');fs.writeFileSync(file,JSON.stringify({format:'genvo.authored-creature/1',design:finished.record}));
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 await page.locator('#newWorldSeed').fill('BURROWING-BROWSER');await page.locator('#newWorldName').fill('Connected underground review');await page.locator('#newWorldCreature').selectOption('sandbox');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 const editor=page.locator('#founderEditor');await editor.waitFor({state:'visible',timeout:60000});const chooser=page.waitForEvent('filechooser');await editor.locator('[data-act="import-design"]').click();await(await chooser).setFiles(file);
 await page.waitForFunction(()=>document.querySelector('#founderEditor .ed-message')?.textContent.includes('design restored'));
 await editor.locator('[data-act="commit"]').click();await editor.locator('[data-act="commit"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.creatureStart?.mode==='sandbox',{}, {timeout:60000});
 await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const start=await page.evaluate(async()=>{
  const {excavationSite,solidTerrainTotal}=await import('/src/world/subsurface.js');const g=window.__GENVO8__,s=g.sim,w=s.world,p=s.player();let site=null;
  for(let y=20;y<w.n-20&&!site;y++)for(let x=20;x<w.n-20;x++){const i=w.idx(x,y),a=excavationSite(w,i),b=excavationSite(w,i-w.n);if(a&&b&&Math.abs(a.floor-b.floor)<.2){site={i,x:x+.5,y:y+.5};break}}
  if(!site)throw Error('No generated excavation corridor');p.x=site.x;p.y=site.y;p.target=null;g.renderer.zoom=4;window.__burrowSite=site;
  return{...site,total:solidTerrainTotal(w),energy:p.energy,policy:s.burrowingRules};
 });
 const button=page.locator('[data-command="burrow"]');await button.waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('[data-command="burrow"]').disabled);await button.click();
 await page.waitForFunction(()=>window.__GENVO8__.sim.player().burrowWork?.elapsed>.5);await page.screenshot({path:path.join(output,'excavating.png')});
 await page.waitForFunction(()=>window.__GENVO8__.sim.player().underground);await page.keyboard.down('ArrowUp');
 await page.waitForFunction(()=>{const s=window.__GENVO8__.sim,p=s.player(),i=window.__burrowSite.i-s.world.n;return s.world.subsurface.passages.has(i)&&s.world.idx(p.x,p.y)===i&&p.lastBurrowIncident?.type==='burrow-dug'&&p.lastBurrowIncident.i===i});await page.keyboard.up('ArrowUp');
 const digging=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;return{energy:p.energy,underground:p.underground,passages:g.sim.world.subsurface.passages.size,incident:p.lastBurrowIncident,cell:g.sim.world.idx(p.x,p.y),x:p.x,y:p.y,id:p.id}});assert.ok(digging.energy<start.energy);
 await page.screenshot({path:path.join(output,'underground.png')});await page.evaluate(async()=>window.__GENVO8__.saveManager.saveNow('burrow-browser-underground'));
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const restored=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;g.renderer.zoom=4;return{id:p.id,underground:p.underground,passages:g.sim.world.subsurface.passages.size}});assert.equal(restored.id,digging.id);assert.ok(restored.underground&&restored.passages>=2);
 // The saved character may still be at the entrance boundary when excavation completes.
 const atEntry=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();return !!s.world.subsurface.passages.get(s.world.idx(p.x,p.y))?.entry});
 if(!atEntry){await page.evaluate(()=>{window.__GENVO8__.sim.paused=false;document.activeElement?.blur()});await page.keyboard.down('ArrowDown');await page.waitForFunction(()=>{const s=window.__GENVO8__.sim,p=s.player();return s.world.subsurface.passages.get(s.world.idx(p.x,p.y))?.entry});await page.keyboard.up('ArrowDown')}
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=false});await page.waitForFunction(()=>!document.querySelector('[data-command="burrow"]').disabled);await button.click();await page.waitForFunction(()=>!window.__GENVO8__.sim.player().underground);
 const exit=await page.evaluate(async()=>{const {solidTerrainTotal}=await import('/src/world/subsurface.js'),s=window.__GENVO8__.sim;s.paused=true;return{total:solidTerrainTotal(s.world),energy:s.player().energy,underground:!!s.player().underground,geometry:s.world.subsurface.excavated}});
 assert.ok(Math.abs(exit.total-start.total)<1e-6,'solid terrain less excavated void is conserved in live gameplay');await page.screenshot({path:path.join(output,'entrance-exit.png')});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({kind:'automated controls; legal imported anatomy and generated terrain, actor position staged only',start,digging,restored,exit,errors},null,2));
 console.log('Burrowing Chromium PASS: normal mouse excavation, keyboard tunnel work, cutaway, solid-material conservation, IndexedDB underground reload and actual entrance exit.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
