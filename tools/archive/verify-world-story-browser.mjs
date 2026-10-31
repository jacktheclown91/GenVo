import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-world-story-browser.mjs <exported build> <evidence dir> [seed] [minutes=5] [creature]
// Early ecological drama in the exported game at 1x: a fresh world plays under
// AUTO (the Creature Lab left with "Keep the old body"; the first-young card
// closed with "Raise them") and every story beat the game shows is recorded,
// with screenshots of the first beats on screen. Observation only: the toast
// call is wrapped to log, never to change what is shown.
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),seed=process.argv[4]||'PLANET-OBS-2',minutes=Number(process.argv[5]||5),creature=process.argv[6]||'starter-dive';
fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch();const report={seed,minutes,beats:[]};
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldCreature').selectOption(creature);await page.locator('#newWorldSeed').fill(seed);
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:120000});
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true);g.sim.setPlayerAutonomy(true);
  const story=g.worldStory,observe=story.observe.bind(story);window.__beats=[];story.observe=sim=>{const b=observe(sim);if(b)window.__beats.push({day:sim.day,...b});return b}});
 const t0=Date.now();let shots=0;
 while(Date.now()-t0<minutes*60000){await page.waitForTimeout(1500);
  const lab=page.locator('#creatureEditor:not([hidden]) [data-act="cancel"]');if(await lab.count())await lab.click();
  const young=page.locator('#youngSummary:not([hidden]) [data-young="continue"]');if(await young.count())await young.click();
  const beats=await page.evaluate(()=>window.__beats.length);
  if(beats>shots&&shots<3){const visible=await page.evaluate(()=>[...document.querySelectorAll('#notificationStack *')].some(e=>!e.hidden&&window.__beats.some(b=>e.textContent===b.text)));if(visible){await page.screenshot({path:path.join(out,`beat-${shots+1}.png`)});shots++}}}
 report.beats=await page.evaluate(()=>window.__beats);report.day=await page.evaluate(()=>window.__GENVO8__.sim.day);report.errors=errors;
 assert.ok(report.beats.length>=3,'story beats appear in the first minutes of play: '+report.beats.length);assert.deepEqual(errors,[]);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close()}
console.log(`day ${report.day}: ${report.beats.length} beats`);for(const b of report.beats)console.log(` d${b.day} [${b.kind}] ${b.text}`);
