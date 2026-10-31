// Uses only a newly launched nonpersistent browser and an explicit fresh context.
// No existing browser profile, storage state, or user autosave is opened.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const out=path.resolve('docs/frame-pacing/runtime');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:false,args:['--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[]}});
const page=await context.newPage(),errors=[];try{page.on('pageerror',e=>errors.push(e.message));
const cdp=await browser.newBrowserCDPSession();const gpu=(await cdp.send('SystemInfo.getInfo')).gpu;
const root=path.resolve(__dirname,'../..'),types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml'};
// Same in-process file transport as the repository's existing GPU/parity harnesses.
await context.route('https://genvo.review/**',async route=>{const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');if(!file.startsWith(root+path.sep))return route.abort();if(!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'})});
await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('GENVO8-TEST-A');await page.getByRole('button',{name:'Begin World',exact:true}).click();
await page.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus().status==='ready'&&window.__GENVO8__?.sim?.player(),null,{timeout:60000});await page.waitForTimeout(4000);
const sample=async milliseconds=>page.evaluate(async ms=>{const g=window.__GENVO8__,startTick=g.sim.tickCount,frames=[],start=performance.now();let previous=start;
await new Promise(resolve=>{function next(now){frames.push({ms:now-previous,workMs:g.frameStepper.last.workMs,pending:g.frameStepper.pendingSeconds,limited:g.frameStepper.last.budgetLimited});previous=now;if(now-start>=ms)resolve();else requestAnimationFrame(next)}requestAnimationFrame(next)});
const sorted=frames.map(f=>f.ms).sort((a,b)=>a-b),at=q=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))];return {elapsedMs:performance.now()-start,frames:frames.length,p50Ms:at(.5),p95Ms:at(.95),maxMs:sorted.at(-1),startTick,endTick:g.sim.tickCount,alive:g.sim.animals.filter(a=>a.alive).length,maxPending:Math.max(...frames.map(f=>f.pending)),budgetLimitedFrames:frames.filter(f=>f.limited).length,warning:document.querySelector('#processingCapacity')?.textContent||'',trace:frames};},milliseconds);
const baseline=await sample(2500);
await page.evaluate(()=>{const g=window.__GENVO8__;g.frameStepper.budgetMs=0;g.sim.setPlayerAutonomy(true);window.__pacingObserve=g.observer.observe;g.observer.observe=()=>null;g.observer.speed=4});
const stressed=await sample(2500);await page.screenshot({path:path.join(out,'queued-updates.png')});
await page.evaluate(()=>{const g=window.__GENVO8__;g.frameStepper.budgetMs=12;g.observer.speed=1;g.observer.observe=window.__pacingObserve});
const recovered=await sample(2000);await page.screenshot({path:path.join(out,'recovered.png')});
fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({scope:'Fresh current-map runtime sample, then deliberately restricted zero ms frame budget (one atomic step per frame) and forced 4x observer speed with automatic danger slowdown disabled only for this pacing fixture to verify visible queued updates and recovery. Not mature-world or continental performance acceptance.',baseline,stressed,recovered,errors},null,2));
console.log(JSON.stringify({baseline:{...baseline,trace:undefined},stressed:{...stressed,trace:undefined},recovered:{...recovered,trace:undefined},errors}));
if(errors.length||baseline.endTick<=baseline.startTick||stressed.maxPending<.25||!stressed.warning.includes('queued')||recovered.endTick<=stressed.endTick)process.exitCode=1;
}catch(error){await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});const state=await page.evaluate(()=>({status:window.__GENVO8__?.nativeArtStatus?.(),day:window.__GENVO8__?.sim?.day,body:document.body.innerText.slice(-3000)})).catch(()=>null);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,state,errors},null,2));throw error}finally{await context.close();await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});