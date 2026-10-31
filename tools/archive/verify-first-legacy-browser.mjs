import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-first-legacy-browser.mjs <evidence dir> <exported build>
// The First Legacy in the exported game: a native New World, the founder lives
// and breeds under AUTO, and control passes to a grown child through the real
// H chooser. The only staging is time acceleration (whole simulated days run in
// the page instead of at 1x); no offspring, mutation or history is created.
const output=path.resolve(process.argv[2]),root=path.resolve(process.argv[3]);if(fs.existsSync(output)&&fs.readdirSync(output).length)throw Error('Preserve previous evidence.');fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});let page;const report={};
try{
 // Seeds are tried in order; a founder whose young do not survive is a natural
 // outcome, recorded in the report, and the next seed is tried.
 const errors=[];report.attempts=[];
 for(const seed of ['PLANET-B0-A','PLANET-OBS-3','PLANET-OBS-2']){
 await page?.close();page=await browser.newPage({viewport:{width:1600,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill(seed);await page.locator('#newWorldName').fill('First Legacy');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 // The opening tutorial is skipped (the in-game Skip action); legacy guidance
 // appears once the opening is complete or skipped.
 await page.evaluate(()=>{const t=window.__GENVO8__.tutorial;if(t.stage!=='done')t.begin(true)});await page.waitForTimeout(800);
 report.start=await page.evaluate(()=>{const s=window.__GENVO8__.sim;return{day:s.day,pill:document.querySelector('#tutorial .objective-step')?.textContent,legacy:s.legacyMilestones??null}});
 // Accelerated natural play: AUTO (the game's own toggle) drives the founder;
 // whole days run in-page in ten-day chunks, up to 300 days (30 min at 1x).
 report.run={seed,...await page.evaluate(async()=>{const g=window.__GENVO8__,founder=g.sim.player().id;g.sim.setPlayerAutonomy(true);const t={},sims=new Set([g.sim]);let s=g.sim;
  // A region crossing installs a new Simulation; always advance the live one.
  for(let d=0;d<300&&!t.heir&&s.player()?.id===founder;d++){for(let i=0;i<g.CFG.dayTicks;i++){s=g.sim;if(!sims.has(s)){sims.add(s);s.setPlayerAutonomy(true)}s.update(null)}
   if(!t.birth&&s.animals.some(a=>a.parentIds?.includes(founder)))t.birth=s.day;if(s.lineage.eligibleHeirs({fromId:founder}).length)t.heir=s.day;if(d%10===9)await new Promise(r=>setTimeout(r,0));
   // The Creature Lab opens on a pregnancy and pauses play; the player here
   // keeps the old body (no design), so inheritance alone shapes the young.
   const lab=document.querySelector('#creatureEditor');if(lab&&!lab.hidden){lab.querySelector('[data-act="cancel"]')?.click();t.labKept=(t.labKept||0)+1;if(s.paused)throw Error('Creature Lab left play paused')}}
  s.setPlayerAutonomy(false);const overlays=[...document.querySelectorAll('section[role=dialog],.transition,#briefing,#welcome')].filter(e=>!e.hidden).map(e=>e.id+':'+(e.textContent||'').trim().slice(0,160));return{founder,...t,paused:s.paused,overlays,simulations:sims.size,day:s.day,founderAlive:!!s.player()?.alive&&s.player().id===founder,children:s.animals.filter(a=>a.parentIds?.includes(founder)).length}})};
 report.attempts.push(report.run);if(report.run.heir&&report.run.founderAlive)break}
 assert.ok(report.run.heir&&report.run.founderAlive,'the founder raised a grown heir');
 await page.waitForTimeout(1500);report.pill=await page.locator('#tutorial .objective-step').textContent();assert.match(report.pill,/^Legacy [0-3]\/3$/);
 await page.screenshot({path:path.join(output,'goal-pill.png')});
 // The real H chooser: open, then confirm.
 await page.locator('canvas').first().click({position:{x:800,y:450}}).catch(()=>{});await page.keyboard.press('KeyH');await page.waitForTimeout(400);await page.screenshot({path:path.join(output,'heir-chooser.png')});await page.keyboard.press('KeyH');
 await page.waitForFunction(()=>!document.querySelector('#transition').hidden,{}, {timeout:20000});await page.waitForTimeout(400);await page.screenshot({path:path.join(output,'generation-reveal.png')});
 report.handoff=await page.evaluate(()=>{const s=window.__GENVO8__.sim,h=s.lineage.handoffs.at(-1);return{reason:h.reason,legacy:h.legacy,record:s.legacyMilestones?.firstLegacy}});
 assert.deepEqual(report.handoff.legacy,['firstLegacy']);assert.equal(report.handoff.record.from.id,report.run.founder);
 await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#legacySummary')&&!document.querySelector('#legacySummary').hidden,{}, {timeout:10000});await page.waitForTimeout(300);
 report.summary=await page.evaluate(()=>{const el=document.querySelector('#legacySummary');return{title:el.querySelector('h2').textContent,kicker:el.querySelector('.transition-kicker').textContent,rows:[...el.querySelectorAll('.legacy-grid > div')].map(r=>[r.querySelector('b').textContent,r.querySelector('span').textContent]),buttons:[...el.querySelectorAll('button')].map(b=>b.textContent),focused:document.activeElement?.textContent,paused:window.__GENVO8__.sim.paused}});
 assert.equal(report.summary.title,'Your Legacy Begins');assert.deepEqual(report.summary.buttons,['Continue Evolving','Begin a New World']);assert.equal(report.summary.paused,true);
 await page.screenshot({path:path.join(output,'legacy-summary.png')});
 await page.locator('#legacySummary [data-legacy="continue"]').click();await page.waitForTimeout(1500);
 report.after=await page.evaluate(()=>{const s=window.__GENVO8__.sim;return{hidden:document.querySelector('#legacySummary').hidden,paused:s.paused,day:s.day,player:s.player()?.id,generation:s.player()?.generation,pill:document.querySelector('#tutorial .objective-step')?.textContent}});
 assert.equal(report.after.hidden,true);assert.equal(report.after.paused,false);
 await page.screenshot({path:path.join(output,'continue-evolving.png')});
 // Begin a New World opens the world-creation screen.
 await page.evaluate(()=>window.__GENVO8__.tutorial.onLegacy('firstLegacy'));await page.locator('#legacySummary [data-legacy="new"]').click();await page.waitForTimeout(600);
 report.newWorld=await page.evaluate(()=>({frontEnd:!document.querySelector('#frontEnd').hidden,newScreen:!document.querySelector('.menu-view[data-screen="new"]')?.hidden}));assert.ok(report.newWorld.frontEnd&&report.newWorld.newScreen);
 await page.screenshot({path:path.join(output,'begin-new-world.png')});
 report.errors=errors;assert.deepEqual(errors,[]);
}finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close()}
console.log(JSON.stringify(report,null,1));
