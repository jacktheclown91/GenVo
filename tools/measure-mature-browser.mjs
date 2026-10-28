// Genuine checkpoint gameplay through native UI and requestAnimationFrame only.
// Usage: node tools/measure-mature-browser.mjs PUBLIC_ROOT OUTPUT.json SCENARIO [SECONDS]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let pw;
try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const [rootArg,outArg,scenario,secondsArg='180']=process.argv.slice(2);
const root=path.resolve(rootArg),out=path.resolve(outArg),seconds=Number(secondsArg);
const continueBirths=process.argv.includes('--continue-births');
if(!['established-valley-d30','mature-valley-d100'].includes(scenario)||!Number.isFinite(seconds)||seconds<10||seconds>1800)throw Error('Supply catalog scenario and 10..1800 seconds');
if(fs.existsSync(out))throw Error('Output already exists');
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname);
  let file=path.resolve(root,'.'+name);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  fs.readFile(file,(error,bytes)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(error?'Missing':bytes)});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
const receipt={schema:'genvo.mature-browser/1',root,scenario,seconds,continueBirths,started:new Date().toISOString(),mode:'headless Chromium native browser loop; not creator/GPU acceptance',errors:[],dismissals:[]};
try{
  browser=await pw.chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',error=>receipt.errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?day=30`);
  await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
  await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
  await page.locator(`#newWorldStartCards [data-start="catalog:${scenario}"]`).click();
  await page.locator('#newWorldName').fill('Mature performance observation');
  const start=Date.now();
  await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
  await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.player(),null,{timeout:90000});
  receipt.openMs=Date.now()-start;
  for(let i=0;i<16;i++){
    const stage=await page.evaluate(()=>window.__GENVO8__.tutorial.stage);
    if(!['welcome','briefing'].includes(stage))break;
    if(await page.locator('#startGame').isVisible())await page.locator('#startGame').click();
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
  }
  if(!await page.evaluate(()=>window.__GENVO8__.sim.playerAutonomy)){
    await page.locator('#stageUtilities button[aria-label="Game utilities"]').click();
    await page.locator('#quickMenu button[data-action="autonomy"]').click();
    if(await page.locator('#quickMenu').isVisible())await page.locator('#stageUtilities button[aria-label="Game utilities"]').click();
  }
  const cdp=await page.context().newCDPSession(page);
  receipt.browserVersion=browser.version();
  receipt.speed=await page.evaluate(()=>window.__GENVO8__.observer.speed);
  if(receipt.speed!==1)throw Error('Expected original native 1x speed');
  await cdp.send('Performance.enable');
  await cdp.send('HeapProfiler.collectGarbage');
  receipt.memoryBefore=await cdp.send('Performance.getMetrics');
  await page.evaluate(()=>{
    const state=()=>{const g=window.__GENVO8__,s=g.sim;return{tick:s.tickCount,day:s.day,live:s.animals.filter(a=>a.alive).length,auto:s.playerAutonomy,paused:s.paused,blocked:g.tutorial.worldInputBlocked(),stage:g.tutorial.stage,player:!!s.player()}};
    const p=window.__matureProfile={frames:[],longTasks:[],samples:[state()],saves:[],start:performance.now(),running:true};
    // Observe routine saves only: the wrapper times the unchanged method.
    const manager=window.__GENVO8__.saveManager,saveNow=manager.saveNow.bind(manager);
    manager.saveNow=async reason=>{const begin=performance.now();try{return await saveNow(reason)}finally{if(p.running)p.saves.push({reason,start:begin-p.start,ms:performance.now()-begin})}};
    let previous;
    const frame=now=>{if(!p.running)return;if(previous!==undefined)p.frames.push(now-previous);previous=now;requestAnimationFrame(frame)};
    requestAnimationFrame(frame);
    p.observer=new PerformanceObserver(list=>{for(const e of list.getEntries())p.longTasks.push({start:e.startTime,duration:e.duration})});
    p.observer.observe({type:'longtask'});
    p.timer=setInterval(()=>p.samples.push(state()),1000);
  });
  for(let elapsed=0;elapsed<seconds;elapsed+=5){
    await page.waitForTimeout(Math.min(5,seconds-elapsed)*1000);
    if(await page.locator('#tutorialContinue').isVisible()){
      receipt.dismissals.push({elapsed,action:'native tutorial continue'});
      await page.locator('#tutorialContinue').click();
    }
    if(continueBirths&&await page.locator('#youngSummary [data-young="continue"]').isVisible()){
      receipt.dismissals.push({elapsed,action:'native Raise them; no inherited choice altered'});
      await page.locator('#youngSummary [data-young="continue"]').click();
    }
  }
  receipt.profile=await page.evaluate(()=>{const p=window.__matureProfile;p.running=false;clearInterval(p.timer);p.observer.disconnect();return{frames:p.frames,longTasks:p.longTasks,samples:p.samples,saves:p.saves,elapsedMs:performance.now()-p.start}});
  const sorted=receipt.profile.frames.slice().sort((a,b)=>a-b),at=q=>sorted[Math.min(sorted.length-1,Math.ceil(q*sorted.length)-1)]??null;
  receipt.frameMs={count:sorted.length,median:at(.5),p95:at(.95),p99:at(.99),worst:at(1)};
  receipt.longTasksPerMinute=receipt.profile.longTasks.length*60000/receipt.profile.elapsedMs;
  receipt.framesOver={ms250:sorted.filter(ms=>ms>250).length,ms1000:sorted.filter(ms=>ms>1000).length};
  receipt.routineSaves={count:receipt.profile.saves.length,reasons:receipt.profile.saves.map(s=>s.reason),totalMs:receipt.profile.saves.reduce((a,s)=>a+s.ms,0)};
  await page.screenshot({path:out+'.png'});
  receipt.save=await page.evaluate(async()=>{const begin=performance.now();const result=await window.__GENVO8__.saveManager.saveNow('performance-observation');return{ms:performance.now()-begin,saved:!!result}});
  await cdp.send('HeapProfiler.collectGarbage');
  receipt.memoryAfter=await cdp.send('Performance.getMetrics');
  console.log(JSON.stringify({scenario,frameMs:receipt.frameMs,framesOver:receipt.framesOver,routineSaves:receipt.routineSaves,longTasksPerMinute:receipt.longTasksPerMinute,save:receipt.save,first:receipt.profile.samples[0],last:receipt.profile.samples.at(-1)}));
}catch(error){receipt.failure=error.stack;throw error}
finally{fs.writeFileSync(out,JSON.stringify(receipt,null,2));await browser?.close();await new Promise(resolve=>server.close(resolve))}
