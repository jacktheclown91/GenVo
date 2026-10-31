import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-first-young-browser.mjs <exported build> <evidence dir> [seed] [creature]
// First-generation arc in the exported game: a fresh world plays (whole days
// advanced in the page under AUTO; the Creature Lab is left with "Keep the old
// body") until the first young are born. The "Your First Young" card must
// appear, pause play, list each newborn's real inheritance, resume on "Raise
// them", and not reappear after a save and reload.
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),seed=process.argv[4]||'PLANET-OBS-3',creature=process.argv[5]||'starter-jump';
fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch();const report={seed,creature};
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldCreature').selectOption(creature);await page.locator('#newWorldSeed').fill(seed);
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:120000});
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true)});
 report.birth=await page.evaluate(async()=>{const g=window.__GENVO8__,founder=g.sim.player().id;g.sim.setPlayerAutonomy(true);
  for(let d=0;d<45;d++){const s=g.sim;if(s.animals.some(a=>a.parentIds?.includes(founder)))break;for(let i=0;i<g.CFG.dayTicks;i++){if(s.paused)break;s.update(null);if(s.animals.some(a=>a.parentIds?.includes(founder)))break}
   const lab=document.querySelector('#creatureEditor');if(lab&&!lab.hidden)lab.querySelector('[data-act="cancel"]')?.click();await new Promise(r=>setTimeout(r,0))}
  g.sim.setPlayerAutonomy(false);return{day:g.sim.day,young:g.sim.animals.filter(a=>a.parentIds?.includes(founder)).map(a=>a.id)}});
 assert.ok(report.birth.young.length,'a natural birth');
 await page.waitForFunction(()=>!document.querySelector('#youngSummary')?.hidden,{},{timeout:10000});await page.waitForTimeout(300);
 report.card=await page.evaluate(()=>{const el=document.querySelector('#youngSummary');return{title:el.querySelector('h2').textContent,kicker:el.querySelector('.transition-kicker').textContent,lead:el.querySelector('.transition-lead').textContent,
  young:[...el.querySelectorAll('.young-cell')].map(c=>({head:c.querySelector('b').textContent,lines:[...c.querySelectorAll('li')].map(l=>l.textContent),portrait:(()=>{const cv=c.querySelector('canvas'),d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n})()})),
  notes:[...el.querySelectorAll('.legacy-note')].map(n=>n.textContent),paused:window.__GENVO8__.sim.paused}});
 await page.screenshot({path:path.join(out,'first-young-card.png')});
 assert.equal(report.card.title,'Your First Young');assert.equal(report.card.paused,true,'the card pauses play');
 assert.ok(report.card.young.length>0&&report.card.young.every(y=>y.lines.length>0&&y.portrait>50),'each young has a portrait and inheritance lines');
 await page.locator('#youngSummary [data-young="continue"]').click();await page.waitForTimeout(600);
 report.after=await page.evaluate(()=>({hidden:document.querySelector('#youngSummary').hidden,paused:window.__GENVO8__.sim.paused,flag:window.__GENVO8__.sim.uiFirstYoungShown}));
 assert.equal(report.after.hidden,true);assert.equal(report.after.paused,false,'Raise them resumes play');assert.equal(report.after.flag,true);
 // Shown once per world, across a save and reload.
 for(let i=0;i<8;i++){if(await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').isVisible())break;await page.keyboard.press('Escape');await page.waitForTimeout(700)}
 await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').click();await page.waitForFunction(()=>/Saved/.test(document.querySelector('#saveStatus')?.textContent||''),{},{timeout:60000});
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:120000});await page.waitForTimeout(2500);
 report.reloaded=await page.evaluate(()=>({cardHidden:document.querySelector('#youngSummary').hidden,flag:window.__GENVO8__.sim.uiFirstYoungShown}));
 assert.equal(report.reloaded.cardHidden,true,'the card does not reappear after reload');assert.equal(report.reloaded.flag,true);
 report.errors=errors;assert.deepEqual(errors,[]);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close()}
console.log(JSON.stringify(report.card,null,1));
