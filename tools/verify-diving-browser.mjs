// Automated real Chromium controls; only actor position is staged in generated water.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../src/lineage/founder-design.js';
import {place} from '../src/lineage/evolution-draft.js';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'docs/test-runs/diving-browser'),root=path.resolve(process.argv[3]||'.');fs.mkdirSync(output,{recursive:true});
const design=new FounderDesign('sandbox');for(const socket of ['limb.3','limb.5'])assert.ok(place(design.draft,'webbed-leg','root',socket).ok);
const finished=design.finish();assert.ok(finished.ok);const file=path.join(output,'diving-founder.json');fs.writeFileSync(file,JSON.stringify({format:'genvo.authored-creature/1',design:finished.record}));
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 await page.locator('#newWorldSeed').fill('DIVING-BROWSER');await page.locator('#newWorldName').fill('Depth and respiration review');await page.locator('#newWorldCreature').selectOption('sandbox');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 const editor=page.locator('#founderEditor');await editor.waitFor({state:'visible',timeout:60000});const chooser=page.waitForEvent('filechooser');await editor.locator('[data-act="import-design"]').click();await(await chooser).setFiles(file);
 await page.waitForFunction(()=>document.querySelector('#founderEditor .ed-message')?.textContent.includes('design restored'));
 await editor.locator('[data-act="commit"]').click();await editor.locator('[data-act="commit"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.creatureStart?.mode==='sandbox',{}, {timeout:60000});
 const start=await page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,w=s.world,p=s.player();let i=-1;for(let j=0;j<w.len;j++)if(w.water[j]&&w.divingBathymetry[j]>.6&&w.freshwaterFood.waterweed[j]>0&&w.isPlayable(j%w.n+.5,(j/w.n|0)+.5)){i=j;break}if(i<0)throw Error('No generated underwater feeding site');p.x=i%w.n+.5;p.y=(i/w.n|0)+.5;p.target=null;g.renderer.sceneReady();g.renderer.zoom=4;return{x:p.x,y:p.y,depth:w.divingBathymetry[i],food:w.freshwaterFood.waterweed[i],energy:p.energy,policy:s.divingRules}});
 const button=page.locator('[data-command="dive"]');await button.waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('[data-command="dive"]').disabled);await button.click();
 await page.waitForFunction(()=>window.__GENVO8__.sim.player().diveDepth>.4);
 const under=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;return{depth:p.diveDepth,target:p.diveTarget,air:p.diveAir,energy:p.energy,id:p.id,x:p.x,y:p.y}});
 assert.ok(under.air<24&&under.energy<start.energy);await page.screenshot({path:path.join(output,'submerged.png')});
 const beforeFood=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();s.paused=false;document.activeElement?.blur();return s.world.freshwaterFood.waterweed[s.world.idx(p.x,p.y)]});
 await page.keyboard.press('e');
 const feeding=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();s.paused=true;return{meal:s.foraging.states.get(p.id)?.lastMeal,remaining:s.world.freshwaterFood.waterweed[s.world.idx(p.x,p.y)]}});
 assert.equal(feeding.meal?.kind,'waterweed');assert.ok(feeding.meal.energyGain>0&&feeding.remaining<beforeFood);
 await page.evaluate(async()=>window.__GENVO8__.saveManager.saveNow('diving-browser-submerged'));
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);
 const restored=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;return{depth:p.diveDepth,air:p.diveAir,id:p.id,policy:g.sim.divingRules,art:g.nativeArtStatus}});
 assert.equal(restored.id,under.id);assert.ok(restored.depth>.35);assert.equal(restored.policy,start.policy);
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=false;document.activeElement?.blur()});await page.keyboard.press('PageUp');await page.waitForFunction(()=>window.__GENVO8__.sim.player().diveDepth===0);
 const surface=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();s.paused=true;return{depth:p.diveDepth,air:p.diveAir,energy:p.energy,incident:p.lastDiveIncident}});assert.equal(surface.depth,0);
 await page.screenshot({path:path.join(output,'surfaced.png')});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({kind:'automated Chromium, not creator acceptance',start,under,feeding,restored,surface,errors},null,2));
 console.log('Diving Chromium PASS: legal imported swimmer, generated water, mouse submersion, held-air/energy cost, IndexedDB continuation and keyboard ascent.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
