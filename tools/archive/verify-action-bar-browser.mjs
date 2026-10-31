// Automated action-bar fixtures in real Chromium; anatomy/control swaps are explicitly staged.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../../src/lineage/founder-design.js';
import {place} from '../../src/lineage/evolution-draft.js';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'docs/test-runs/action-bar-browser'),root=path.resolve(process.argv[3]||'..');fs.mkdirSync(output,{recursive:true});
const design=new FounderDesign('sandbox');
const finished=design.finish();assert.ok(finished.ok);const file=path.join(output,'action-bar-founder.json');fs.writeFileSync(file,JSON.stringify({format:'genvo.authored-creature/1',design:finished.record}));
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 await page.locator('#newWorldSeed').fill('ACTION-BAR-BROWSER');await page.locator('#newWorldName').fill('Anatomy-aware action bar review');await page.locator('#newWorldCreature').selectOption('sandbox');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 const editor=page.locator('#founderEditor');await editor.waitFor({state:'visible',timeout:60000});const chooser=page.waitForEvent('filechooser');await editor.locator('[data-act="import-design"]').click();await(await chooser).setFiles(file);
 await page.waitForFunction(()=>document.querySelector('#founderEditor .ed-message')?.textContent.includes('design restored'));
 await editor.locator('[data-act="commit"]').click();await editor.locator('[data-act="commit"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.creatureStart?.mode==='sandbox',{}, {timeout:60000});
 await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const read=()=>page.evaluate(()=>[...document.querySelectorAll('.creature-stage-resources [data-command]')].filter(b=>!b.hidden).map(b=>({id:b.dataset.command,disabled:b.disabled,reason:b.title,left:b.getBoundingClientRect().left,right:b.getBoundingClientRect().right,top:b.getBoundingClientRect().top})));
 const base=await read();for(const id of ['flight','glide','jump','roost','dive','torpor','pounce'])assert.ok(!base.some(b=>b.id===id),id+' hidden without anatomy');
 await page.screenshot({path:path.join(output,'basic-body.png')});
 await page.evaluate(async()=>{
  const {FounderDesign}=await import('/src/lineage/founder-design.js'),{place}=await import('/src/lineage/evolution-draft.js');
  const d=new FounderDesign('sandbox');const put=(part,socket)=>{const r=place(d.draft,part,'root',socket);if(!r.ok)throw Error(JSON.stringify(r))};
  put('spring-leg','limb.3');put('patagium','flank.left');put('climber-leg','limb.1');window.__partialBody=structuredClone(d.draft.plan);
  put('spring-leg','limb.5');put('patagium','flank.right');put('climber-leg','limb.7');put('flight-wing','dorsal');put('fat-tail','tail');window.__capableBody=structuredClone(d.draft.plan);
  window.__GENVO8__.sim.player().bodyPlan=window.__partialBody;window.__fixtureTime=performance.now();
 });
 await page.waitForFunction(()=>window.__GENVO8__.contextTray.lastResourceAt>window.__fixtureTime);
 const partial=await read();for(const id of ['flight','glide','jump','roost','dive'])assert.ok(!partial.some(b=>b.id===id),id+' needs functional support');
 await page.evaluate(()=>{const p=window.__GENVO8__.sim.player();p.bodyPlan=window.__capableBody;p.energy=1;p.health=100;p.age=40});
 await page.waitForFunction(()=>!document.querySelector('[data-command="jump"]').hidden);
 const capable=await read();for(const id of ['flight','glide','jump','roost','torpor','pounce']){const b=capable.find(b=>b.id===id);assert.ok(b,id+' appears');assert.ok(b.disabled&&b.reason,id+' explains unavailability')}
 assert.deepEqual(capable.slice(0,4).map(b=>b.id),['interact','eat','drink','rest']);
 assert.ok(capable.every(b=>b.left>=0&&b.right<=1250),'no viewport overflow');
 await page.screenshot({path:path.join(output,'capable-disabled.png')});
 await page.setViewportSize({width:600,height:850});const narrow=await read();assert.ok(narrow.every(b=>b.left>=0&&b.right<=600),'narrow bar wraps without clipping');await page.screenshot({path:path.join(output,'narrow-bar.png')});await page.setViewportSize({width:1250,height:850});
 await page.evaluate(async()=>{const g=window.__GENVO8__;g.sim.paused=true;await g.saveManager.saveNow('action-bar-fixture')});
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);
 await page.waitForFunction(()=>!document.querySelector('[data-command="jump"]').hidden);const restored=await read();assert.ok(restored.some(b=>b.id==='glide'));
 await page.evaluate(()=>{const s=window.__GENVO8__.sim,other=s.animals.find(a=>a.alive&&a.id!==s.playerId&&a.bodyPlan);s.playerId=other.id;window.__newActor=other.id});
 await page.waitForFunction(async()=>{const g=window.__GENVO8__,{actionCapabilities,activeAction}=await import('/src/lineage/action-capabilities.js'),c=actionCapabilities(g.sim),p=g.sim.player();return[...document.querySelectorAll('.creature-stage-resources [data-command]')].every(b=>b.hidden===!(c[b.dataset.command]||activeAction(p,b.dataset.command)))});
 const controlChanged=await read();assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({kind:'automated UI fixtures; legal body swaps and control handoff are staged, not biological evolution evidence',base,partial,capable,narrow,restored,controlChanged,errors},null,2));
 console.log('Action bar Chromium PASS: anatomy thresholds, disabled explanations, common-action priority, wrapping, save reload and control handoff refresh.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
