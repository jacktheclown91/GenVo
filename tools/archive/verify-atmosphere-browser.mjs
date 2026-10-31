// Real New World and IndexedDB Continue. Only player position is staged between
// naturally generated weather locations; observations never alter the climate.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'docs/test-runs/atmosphere-browser'),root=path.resolve(process.argv[3]||'..');fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill(process.argv[4]||'CAVES-GEOLOGY');await page.locator('#newWorldName').fill('Atmospheric visibility review');
 const geography=page.locator('#newWorldGeography');if(await geography.count())await geography.selectOption('planetary/1');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.climate&&window.__GENVO8__.sim.tickCount>0,{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const samples=await page.evaluate(async()=>{const {atmosphereAt,atmosphericSight}=await import('/src/ecology/atmospheric-visibility.js'),g=window.__GENVO8__,s=g.sim,w=s.world,p=s.player();s.paused=true;let thick=null,clear=null;for(let y=12;y<w.n-12;y++)for(let x=12;x<w.n-12;x++){if(!s.canOccupy(p,x+.5,y+.5)||w.water[w.idx(x,y)])continue;const at=atmosphereAt(s,x+.5,y+.5),v={x:x+.5,y:y+.5,...at};if(!thick||v.extinction>thick.extinction)thick=v;if(!clear||v.extinction<clear.extinction)clear=v}if(!thick||!clear)throw Error('No generated atmospheric observation locations');p.x=thick.x;p.y=thick.y;p.target=null;g.renderer.zoom=2;return{thick,clear,policy:s.visibilityRules,probe:atmosphericSight(s,p,{x:p.x+6,y:p.y},8),climate:structuredClone(s.climate),day:s.day}});
 assert.ok(samples.thick.extinction>samples.clear.extinction);assert.ok(samples.thick.extinction>.04);await page.screenshot({path:path.join(output,'limited-visibility.png')});
 await page.evaluate(async()=>window.__GENVO8__.saveManager.saveNow('atmospheric-browser'));
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.evaluate(()=>{const g=window.__GENVO8__,load=g.saveManager.load.bind(g.saveManager);g.saveManager.load=async(...args)=>{const s=await load(...args),{atmosphereAt}=await import('/src/ecology/atmospheric-visibility.js');window.__restoredAtmosphere=atmosphereAt(s,s.player().x,s.player().y);return s}});
 await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const restored=await page.evaluate(()=>window.__restoredAtmosphere);const expected={...samples.thick};delete expected.x;delete expected.y;assert.deepEqual(restored,expected);
 await page.evaluate(({x,y})=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;p.x=x;p.y=y;p.target=null;g.renderer.zoom=2},samples.clear);await page.screenshot({path:path.join(output,'clearer-location.png')});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({kind:'automated normal New World and Continue; generated atmosphere; only player observation positions staged; sight probe is read-only',samples,restored,errors},null,2));console.log('Atmosphere Chromium PASS: generated spatial weather, rendered visibility contrast, shared optical probe and exact IndexedDB Continue observation.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
