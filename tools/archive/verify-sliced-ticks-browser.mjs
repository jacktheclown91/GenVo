import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-sliced-ticks-browser.mjs <exported build>
// Day-boundary slicing in the exported game: a day-boundary tick runs across
// several frames, a real key pressed while it is pending is held (no effect) and
// replayed once it completes, and the world keeps advancing afterwards.
const root=path.resolve(process.argv[2]);
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});const report={};
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill('PLANET-B0-A');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:90000});
 await page.evaluate(()=>{const g=window.__GENVO8__;g.tutorial.begin(true);g.sim.setPlayerAutonomy(true)});
 // Count the frames each day-boundary tick spans, at 1x.
 await page.evaluate(()=>{const g=window.__GENVO8__,f=window.__slices={ticks:[],cur:0};const loop=()=>{if(g.sim.tickInProgress)f.cur++;else if(f.cur){f.ticks.push(f.cur);f.cur=0}requestAnimationFrame(loop)};requestAnimationFrame(loop)});
 // Wait for a pending tick, then press backquote (toggles the frame meter) for real.
 await page.waitForFunction(()=>window.__GENVO8__.sim.tickInProgress,{polling:'raf'},{timeout:120000});
 const before=await page.evaluate(()=>({meter:!document.querySelector('#fpsMeter').hidden,pending:window.__GENVO8__.sim.tickInProgress,tick:window.__GENVO8__.sim.tickCount}));
 await page.keyboard.press('Backquote');
 const held=await page.evaluate(()=>({meter:!document.querySelector('#fpsMeter').hidden,queued:window.__GENVO8__.heldInput.queue.length,pending:window.__GENVO8__.sim.tickInProgress}));
 await page.waitForFunction(()=>!window.__GENVO8__.sim.tickInProgress,{polling:'raf'},{timeout:10000});await page.waitForTimeout(100);
 const after=await page.evaluate(()=>({meter:!document.querySelector('#fpsMeter').hidden,queued:window.__GENVO8__.heldInput.queue.length}));
 report.input={before,held,after};
 if(held.pending){assert.equal(held.meter,before.meter,'a key pressed mid-tick has no effect yet');assert.ok(held.queued>=1,'and is held')}
 assert.equal(after.meter,!before.meter,'the held key is replayed once the tick completes');assert.equal(after.queued,0);
 await page.waitForTimeout(30000);
 report.slices=await page.evaluate(()=>window.__slices.ticks);report.day=await page.evaluate(()=>window.__GENVO8__.sim.day);report.errors=errors;
 assert.ok(report.slices.some(n=>n>1),'day-boundary ticks span several frames');assert.deepEqual(errors,[]);
}finally{await browser.close();server.close()}
console.log(JSON.stringify(report));
