// Real Chromium controls on an explicitly constructed mature-tree fixture.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../src/lineage/founder-design.js';
import {place} from '../src/lineage/evolution-draft.js';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'docs/test-runs/climbing-browser'),root=path.resolve(process.argv[3]||'.');fs.mkdirSync(output,{recursive:true});
const design=new FounderDesign('sandbox');for(const socket of ['limb.1','limb.7'])assert.ok(place(design.draft,'climber-leg','root',socket).ok);
const finished=design.finish();assert.ok(finished.ok);const file=path.join(output,'climbing-founder.json');fs.writeFileSync(file,JSON.stringify({format:'genvo.authored-creature/1',design:finished.record}));
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 await page.locator('#newWorldSeed').fill('CLIMBING-BROWSER');await page.locator('#newWorldName').fill('Continuous climbing review');await page.locator('#newWorldCreature').selectOption('sandbox');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 const editor=page.locator('#founderEditor');await editor.waitFor({state:'visible',timeout:60000});const chooser=page.waitForEvent('filechooser');await editor.locator('[data-act="import-design"]').click();await(await chooser).setFiles(file);
 await page.waitForFunction(()=>document.querySelector('#founderEditor .ed-message')?.textContent.includes('design restored'));
 await editor.locator('[data-act="commit"]').click();await editor.locator('[data-act="commit"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.creatureStart?.mode==='sandbox',{}, {timeout:60000});
 await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const site=await page.evaluate(()=>{
  const g=window.__GENVO8__,s=g.sim,w=s.world,p=s.player();let i=-1;
  for(let j=0;j<w.len;j++)if(w.plants.woodspire[j]>.05&&!w.water[j]&&w.isPlayable(j%w.n+.5,(j/w.n|0)+.5)&&j%w.n>10&&j%w.n<w.n-10&&(j/w.n|0)>10&&(j/w.n|0)<w.n-10){i=j;break}
  if(i<0)throw Error('No tree fixture site');const before=w.plants.woodspire[i];w.plants.woodspire[i]=1.6;s.dispersal.noteGrowth('woodspire',i,before,1.6);
  p.x=i%w.n+.5;p.y=(i/w.n|0)+.5;p.target=null;g.renderer.zoom=4;
  return{i,x:p.x,y:p.y,before,fixtureStand:1.6,energy:p.energy,policy:s.climbingRules};
 });
 const button=page.locator('[data-command="roost"]');await button.waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('[data-command="roost"]').disabled);await button.click();
 await page.waitForFunction(()=>window.__GENVO8__.sim.player().climb?.height>.7);
 const middle=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;return{climb:structuredClone(p.climb),energy:p.energy,id:p.id,x:p.x,y:p.y,canFeed:g.sim.canopyFoodAvailability(p).enabled}});
 assert.equal(middle.canFeed,false);assert.ok(middle.energy<site.energy);assert.equal(middle.x,site.x);assert.equal(middle.y,site.y);
 await page.screenshot({path:path.join(output,'mid-climb.png')});await page.evaluate(async()=>window.__GENVO8__.saveManager.saveNow('climb-browser-middle'));
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const restored=await page.evaluate(()=>{const s=window.__GENVO8__.sim;s.paused=true;return{id:s.player().id,climb:structuredClone(s.player().climb),policy:s.climbingRules}});assert.equal(restored.id,middle.id);assert.ok(restored.climb.height>=middle.climb.height-.001);
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=false});await page.waitForFunction(()=>{const p=window.__GENVO8__.sim.player();return p.perched&&!p.climb});
 const top=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();s.paused=true;return{energy:p.energy,x:p.x,y:p.y,perched:p.perched,incident:p.lastClimbIncident}});assert.equal(top.incident.type,'climb-top');assert.equal(top.x,site.x);assert.equal(top.y,site.y);
 await page.waitForFunction(()=>document.querySelector('[data-command="roost"] span').textContent==='Descend');await page.screenshot({path:path.join(output,'canopy-top.png')});await page.evaluate(()=>{window.__GENVO8__.sim.paused=false;document.activeElement?.blur()});await page.keyboard.press('Digit7');
 await page.waitForFunction(()=>{const c=window.__GENVO8__.sim.player().climb;return c&&c.height<2.5&&c.height>0});
 await page.waitForFunction(()=>{const p=window.__GENVO8__.sim.player();return !p.climb&&!p.perched});
 const ground=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();s.paused=true;return{energy:p.energy,x:p.x,y:p.y,incident:p.lastClimbIncident}});assert.equal(ground.incident.type,'climb-ground');assert.equal(ground.x,site.x);assert.equal(ground.y,site.y);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({kind:'automated controls; explicit mature-tree physiology fixture, not natural maturation or creator acceptance',site,middle,restored,top,ground,errors},null,2));
 console.log('Climbing Chromium PASS: legal imported anatomy, mouse ascent, native height/grips, IndexedDB mid-trunk continuation and keyboard descent on an explicit mature-tree fixture.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
