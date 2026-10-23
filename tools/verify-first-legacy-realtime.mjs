import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-first-legacy-realtime.mjs <evidence dir> <exported build> [seed] [maxMinutes=35]
// The First Legacy at 1x in real time, through the exported game's own UI: a
// fresh New World, the opening played (not skipped), AUTO switched on with its
// button, no time acceleration and no state edits. The Creature Lab, when a
// pregnancy opens it, is left with "Keep the old body". When a descendant is
// grown, H opens the chooser and H confirms. Frame intervals and long tasks are
// recorded throughout and matched to what the game was doing (region crossing,
// saving, overlays), so the run doubles as a gameplay stall profile.
// This is automated evidence, not creator acceptance by manual play.
const output=path.resolve(process.argv[2]),root=path.resolve(process.argv[3]),seed=process.argv[4]||'PLANET-B0-A',maxMinutes=Number(process.argv[5]||35);
if(fs.existsSync(output)&&fs.readdirSync(output).length)throw Error('Preserve previous evidence.');fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
const report={seed,maxMinutes,events:[],samples:[]};const t0=Date.now(),mins=()=>+((Date.now()-t0)/60000).toFixed(2);const note=(e,extra={})=>{report.events.push({at:mins(),e,...extra});console.log(mins(),e,JSON.stringify(extra).slice(0,200))};
const page=await browser.newPage({viewport:{width:1600,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const shot=name=>page.screenshot({path:path.join(output,name+'.png')});
// AUTO lives in the in-game Menu (the quick menu): open it, press Auto, close it.
const toggleAuto=async()=>{const menu=page.locator('#stageUtilities button[aria-label="Game utilities"]');if(await menu.isVisible())await menu.click();await page.locator('#quickMenu button[data-action="autonomy"]').click();if(await page.locator('#quickMenu').isVisible()&&await menu.isVisible())await menu.click()};
try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 // Frame and long-task recorder (page time, ms).
 await page.evaluate(()=>{const f=window.__frames={dts:[],long:[],marks:[]};let last=performance.now();const loop=now=>{f.dts.push(now-last);last=now;requestAnimationFrame(loop)};requestAnimationFrame(loop);
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())f.long.push({start:e.startTime,dur:e.duration})}).observe({type:'longtask',buffered:true})}catch{}});
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill(seed);await page.locator('#newWorldName').fill('First Legacy 1x');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:90000});note('world ready');
 // The opening as a player meets it: welcome, then the briefing pages.
 for(let i=0;i<20;i++){const stage=await page.evaluate(()=>window.__GENVO8__.tutorial.stage);if(stage!=='welcome'&&stage!=='briefing')break;
  const begin=page.locator('#welcome:not([hidden]) button:not(#skipTutorial)').first();if(stage==='welcome'&&await begin.count())await begin.click();else await page.keyboard.press('Enter');await page.waitForTimeout(500)}
 note('opening',await page.evaluate(()=>({stage:window.__GENVO8__.tutorial.stage,title:document.querySelector('#tutorial strong')?.textContent})));await shot('opening');
 await toggleAuto();note('AUTO',{on:await page.evaluate(()=>window.__GENVO8__.sim.playerAutonomy)});
 const founder=await page.evaluate(()=>window.__GENVO8__.sim.player().id);let heir=null,lastStage='',lastPill='',lastRegion='';
 while(mins()<maxMinutes){await page.waitForTimeout(2000);
  const s=await page.evaluate(f=>{const g=window.__GENVO8__,sim=g.sim,p=sim.player(),lab=document.querySelector('#creatureEditor'),vis=sel=>{const e=document.querySelector(sel);return!!e&&!e.hidden};
   return{pt:performance.now(),day:sim.day,paused:sim.paused,stage:g.tutorial.stage,pill:document.querySelector('#tutorial .objective-step')?.textContent,title:document.querySelector('#tutorial strong')?.textContent,
    region:String(sim.world.regionOrigin?.x??0)+','+String(sim.world.regionOrigin?.y??0),saving:vis('#saveStatus')?document.querySelector('#saveStatus').textContent:'',lab:!!lab&&!lab.hidden,transition:vis('#transition'),
    player:p?.id,alive:!!p?.alive,auto:sim.playerAutonomy,children:sim.animals.filter(a=>a.parentIds?.includes(f)).length,pregnant:!!sim.animals.find(a=>a.id===f)?.pregnant,heirs:sim.lineage.eligibleHeirs({fromId:f}).length}},founder);
  report.samples.push(s);
  if(s.stage!==lastStage){note('stage',{stage:s.stage,title:s.title});lastStage=s.stage}
  if(s.pill!==lastPill){note('pill',{pill:s.pill,title:s.title});lastPill=s.pill}
  if(s.region!==lastRegion){if(lastRegion)note('region',{from:lastRegion,to:s.region});lastRegion=s.region}
  if(s.lab){note('creature lab: keep the old body',{day:s.day});await page.locator('#creatureEditor [data-act="cancel"]').click();continue}
  if(s.transition){note('transition shown',{day:s.day});await shot('transition-'+s.day);await page.keyboard.press('Enter');continue}
  if(s.paused&&!s.lab&&!s.transition){note('paused without a known overlay',{day:s.day,overlays:await page.evaluate(()=>[...document.querySelectorAll('section[role=dialog],.transition,[aria-modal=true]')].filter(e=>!e.hidden).map(e=>e.id))});await shot('paused-'+s.day)}
  if(!s.alive||s.player!==founder){note('founder lost before an heir',s);break}
  if(s.heirs){heir=s;note('heir eligible',{day:s.day,children:s.children});break}}
 report.heir=heir;
 if(heir){await shot('before-handoff');
  // Manual control for the handoff (H works only while unpaused).
  await toggleAuto();await page.keyboard.press('KeyH');await page.waitForTimeout(500);await shot('heir-chooser');await page.keyboard.press('KeyH');
  await page.waitForFunction(()=>!document.querySelector('#transition').hidden,{}, {timeout:20000});await page.waitForTimeout(500);await shot('generation-reveal');await page.keyboard.press('Enter');
  const summary=await page.waitForFunction(()=>!document.querySelector('#legacySummary')?.hidden,{}, {timeout:10000}).then(()=>true,()=>false);await page.waitForTimeout(400);await shot('legacy-summary');
  report.summary=summary?await page.evaluate(()=>({title:document.querySelector('#legacySummary h2').textContent,rows:[...document.querySelectorAll('#legacySummary .legacy-grid > div')].map(r=>r.textContent)})):null;note('summary',{shown:summary});
  if(summary){await page.locator('#legacySummary [data-legacy="continue"]').click();await page.waitForTimeout(60000);await shot('continued');note('continued',await page.evaluate(()=>({day:window.__GENVO8__.sim.day,generation:window.__GENVO8__.sim.player()?.generation,paused:window.__GENVO8__.sim.paused,pill:document.querySelector('#tutorial .objective-step')?.textContent})))}}
 else await shot('no-heir');
 // Frame statistics and the circumstances of each stall.
 const f=await page.evaluate(()=>window.__frames);const d=f.dts.slice(30).sort((a,b)=>a-b),q=p=>+d[Math.min(d.length-1,Math.floor(p*d.length))].toFixed(1);
 const near=(t,w=1500)=>{const prev=report.samples.filter(s=>s.pt<=t+w).at(-1),next=report.samples.find(s=>s.pt>=t-w);return{day:prev?.day,region:prev?.region,regionChange:!!(prev&&next&&prev.region!==next.region),saving:[prev?.saving,next?.saving].filter(Boolean).join('|'),paused:prev?.paused}};
 report.frames={count:d.length,median:q(.5),p95:q(.95),p99:q(.99),max:+d.at(-1).toFixed(1),over100:d.filter(x=>x>100).length,over250:d.filter(x=>x>250).length};
 report.longTasks={count:f.long.length,over200:f.long.filter(x=>x.dur>200).length,worst:f.long.sort((a,b)=>b.dur-a.dur).slice(0,25).map(x=>({dur:Math.round(x.dur),atMin:+((x.start-report.samples[0]?.pt||0)/60000).toFixed(2),...near(x.start)}))};
 report.errors=errors;
}finally{report.minutes=mins();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close()}
console.log(JSON.stringify({heir:report.heir&&{day:report.heir.day,children:report.heir.children},minutes:report.minutes,summary:report.summary?.title,frames:report.frames,longTasks:{count:report.longTasks?.count,over200:report.longTasks?.over200,worst:report.longTasks?.worst?.slice(0,8)},errors:report.errors},null,1));
