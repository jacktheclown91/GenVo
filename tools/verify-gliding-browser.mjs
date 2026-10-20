// Automated Chromium input, explicitly not human playtesting. Legal imported
// sandbox founder; only position/facing are staged at an actual generated ridge.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../src/lineage/founder-design.js';
import {place} from '../src/lineage/evolution-draft.js';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'docs/test-runs/gliding-browser'),root=path.resolve(process.argv[3]||'.');fs.mkdirSync(output,{recursive:true});
const design=new FounderDesign('sandbox');
for(const socket of ['limb.1','limb.7'])assert.ok(place(design.draft,'climber-leg','root',socket).ok);
for(const side of ['left','right'])assert.ok(place(design.draft,'patagium','root','flank.'+side).ok);
const finished=design.finish();assert.ok(finished.ok);
const designFile=path.join(output,'gliding-founder.json');fs.writeFileSync(designFile,JSON.stringify({format:'genvo.authored-creature/1',design:finished.record}));
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 await page.locator('#newWorldSeed').fill('GLIDE-BROWSER');await page.locator('#newWorldName').fill('Gliding shared physics review');await page.locator('#newWorldCreature').selectOption('sandbox');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 const editor=page.locator('#founderEditor');await editor.waitFor({state:'visible',timeout:60000});
 const chooser=page.waitForEvent('filechooser');await editor.locator('[data-act="import-design"]').click();await(await chooser).setFiles(designFile);
 await page.waitForFunction(()=>document.querySelector('#founderEditor .ed-message')?.textContent.includes('design restored'));
 await page.screenshot({path:path.join(output,'membrane-founder-editor.png')});
 await editor.locator('[data-act="commit"]').click();await editor.locator('[data-act="commit"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.creatureStart?.mode==='sandbox',{}, {timeout:60000});
 const ridge=await page.evaluate(()=>{
  const g=window.__GENVO8__,s=g.sim,w=s.world,p=s.player();let best=null;
  for(let y=8;y<w.n-8;y++)for(let x=8;x<w.n-8;x++){
   const i=w.idx(x,y),j=w.idx(x+1,y);if(w.water[i]||w.water[j])continue;
   const drop=(w.terrain.elevation[i]-w.terrain.elevation[j])*20;
   if(drop>.8&&(!best||drop>best.drop))best={x:x+.9,y:y+.5,drop,from:w.terrain.elevation[i],to:w.terrain.elevation[j]};
  }
  if(!best)throw Error('No genuine generated ridge for glide review.');
  p.x=best.x;p.y=best.y;p.dir=2;p.target=null;g.renderer.sceneReady();g.renderer.zoom=4;
  return{...best,energy:p.energy,body:p.bodyPlan.id,policy:s.glidingRules,age:p.age};
 });
 const glide=page.locator('[data-command="glide"]');await glide.waitFor({state:'visible'});
 await page.waitForFunction(()=>!document.querySelector('[data-command="glide"]').disabled);
 await glide.click();await page.waitForFunction(()=>window.__GENVO8__.sim.player()?.aerialMode==='glide');
 const flight=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;return{x:p.x,y:p.y,z:p.glideAltitude,energy:p.energy,airborne:p.airborne,mode:p.aerialMode,health:p.health}});
 assert.ok(flight.x>ridge.x&&flight.energy<ridge.energy,'real button launches and unsteered motion spends food');
 await page.screenshot({path:path.join(output,'ridge-glide.png')});
 await page.evaluate(async()=>window.__GENVO8__.saveManager.saveNow('gliding-browser-midair'));
 const saved=await page.evaluate(async()=>{const g=window.__GENVO8__,snapshot=await g.saveManager.loadSnapshot(),p=snapshot.animals.find(a=>a.id===snapshot.core.playerId);return{playerId:p.id,z:p.glideAltitude,x:p.x,mode:p.aerialMode,policy:snapshot.core.glidingRules}});
 assert.equal(saved.mode,'glide');assert.equal(saved.z,flight.z);
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('[data-action="continue"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.player()?.aerialMode==='glide',{}, {timeout:60000});
 const reload=await page.evaluate(()=>{const g=window.__GENVO8__;g.sim.paused=true;const p=g.sim.player();return{id:p.id,z:p.glideAltitude,x:p.x,mode:p.aerialMode,policy:g.sim.glidingRules,art:g.nativeArtStatus}});
 assert.equal(reload.id,saved.playerId);assert.ok(reload.z<=saved.z&&reload.x>=saved.x);assert.equal(reload.policy,saved.policy);
 await page.evaluate(async()=>{const g=window.__GENVO8__;g.renderer.zoom=4;await g.renderer.sceneReady();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
 await page.screenshot({path:path.join(output,'restored-glide.png')});
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=false});await page.keyboard.down('ArrowDown');
 await page.waitForFunction(()=>Math.abs(window.__GENVO8__.sim.player()?.glideHeading||0)>.05);
 await page.keyboard.up('ArrowDown');
 const steered=await page.evaluate(()=>({heading:window.__GENVO8__.sim.player().glideHeading,energy:window.__GENVO8__.sim.player().energy}));
 await page.waitForFunction(()=>!window.__GENVO8__.sim.player()?.airborne,{}, {timeout:15000});
 const landed=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;return{x:p.x,y:p.y,health:p.health,energy:p.energy,mode:p.aerialMode??null,water:!!g.sim.world.water[g.sim.world.idx(p.x,p.y)],incident:p.lastFlightIncident}});
 assert.equal(landed.mode,null);assert.ok(landed.energy<flight.energy);
 await page.screenshot({path:path.join(output,'landed-glide.png')});
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({kind:'automated Chromium input; authored sandbox anatomy; staged position/facing on unmodified generated ridge; not human or naturally evolved evidence',ridge,flight,saved,reload,steered,landed,errors},null,2));
 console.log('Gliding Chromium PASS: native imported membrane founder, real ridge, mouse Glide action, steering and descent to landing, charged energy, IndexedDB midair save and Continue reload.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
