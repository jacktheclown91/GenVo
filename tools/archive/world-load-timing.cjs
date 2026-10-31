// World start / load timing (measurement only). Headed Chromium (the path players use). Records, from the click:
//   - every main-thread long task (> 50 ms; PerformanceObserver 'longtask') and the longest gap between animation
//     frames, to tell a blocked main thread from a paused or loading screen;
//   - every change of the on-screen status text (#saveStatus) with its time;
//   - when the world is live (native art ready, unpaused, ticks advancing) and when frames are presented again.
// Then, in the same page, times the individual steps on the same seed: building the world (new Simulation),
// snapshotting it (createSimulationSnapshot), the structured clone IndexedDB performs, restoring a snapshot, and
// the snapshot's size. Scenario 'new' starts a new world from the menu; 'continue' reloads and continues the
// world just saved.
// Usage: node tools/world-load-timing.cjs [seed=PHASE4-ORDINARY] [out.json]
const path=require('path'),fs=require('fs');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const [seed='PHASE4-ORDINARY',out=null]=process.argv.slice(2),root=path.resolve(__dirname,'../..');
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const probe=()=>{window.__lt=[];window.__status=[];window.__frames=[];
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push([+e.startTime.toFixed(0),+e.duration.toFixed(0)])}).observe({type:'longtask',buffered:true})}catch{}
  const watch=()=>{const el=document.getElementById('saveStatus');if(!el)return setTimeout(watch,50);const rec=()=>window.__status.push([+performance.now().toFixed(0),el.hidden?'(hidden)':el.textContent]);new MutationObserver(rec).observe(el,{attributes:true,childList:true,characterData:true,subtree:true})};watch();
  const loop=t=>{window.__frames.push(+t.toFixed(0));requestAnimationFrame(loop)};requestAnimationFrame(loop)};
async function measure(page,t0,label){
  const live=await page.evaluate(async t0=>{const G=window.__GENVO8__;const start=performance.now();
    while(performance.now()-start<120000){const s=G?.sim;if(G?.nativeArtStatus?.().status==='ready'&&s&&!s.paused&&s.player?.()){const k=s.tickCount;await new Promise(r=>setTimeout(r,300));if(G.sim.tickCount>k)break}else await new Promise(r=>setTimeout(r,50))}
    return performance.now()},t0);
  await page.waitForTimeout(3000);
  return page.evaluate(({t0,live,label})=>{const f=window.__frames.filter(x=>x>=t0);let gap=0,gapAt=null;for(let i=1;i<f.length;i++)if(f[i]-f[i-1]>gap){gap=f[i]-f[i-1];gapAt=f[i-1]-t0}
    const lt=window.__lt.filter(([s])=>s>=t0-50).map(([s,d])=>[s-Math.round(t0),d]);
    return{label,liveAfterMs:Math.round(live-t0),longTasks:lt,longTaskTotalMs:lt.reduce((a,x)=>a+x[1],0),longestTaskMs:lt.reduce((a,x)=>Math.max(a,x[1]),0),longestFrameGapMs:Math.round(gap),longestFrameGapStartsAtMs:gapAt==null?null:Math.round(gapAt),
      statusText:window.__status.filter(([t])=>t>=t0).map(([t,s])=>[Math.round(t-t0),s])}},{t0,live,label});
}
(async()=>{const browser=await chromium.launch({headless:false,args:['--ignore-gpu-blocklist']});const ctx=await browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ctx.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!fs.existsSync(p))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(p),contentType:TYPES[path.extname(p)]||'application/octet-stream'})});
  await ctx.addInitScript(probe);
  const tBoot=Date.now();await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray,null,{timeout:120000});const bootMs=Date.now()-tBoot;
  await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill(seed);
  const t0=await page.evaluate(()=>performance.now());await page.getByRole('button',{name:'Begin World',exact:true}).click();
  const fresh=await measure(page,t0,'new world');
  // Step timings in the same page, same seed.
  const steps=await page.evaluate(async seed=>{const {Simulation}=await import('/src/sim/simulation.js');const {createSimulationSnapshot,restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js');
    let t=performance.now();const s=new Simulation(seed,{player:true});const build=performance.now()-t;
    t=performance.now();const snap=createSimulationSnapshot(s,{reason:'timing'});const snapshot=performance.now()-t;
    t=performance.now();const clone=structuredClone(snap);const cloneMs=performance.now()-t;
    t=performance.now();restoreSimulationSnapshot(structuredClone(snap));const restore=performance.now()-t-cloneMs;
    let bytes=0;const walk=v=>{if(v&&typeof v==='object'){if(ArrayBuffer.isView(v)){bytes+=v.byteLength;return}if(Array.isArray(v)){for(const x of v)walk(x);return}for(const k in v)walk(v[k])}else if(typeof v==='string')bytes+=v.length*2;else bytes+=8};walk(clone);
    return{buildWorldMs:Math.round(build),snapshotMs:Math.round(snapshot),structuredCloneMs:Math.round(cloneMs),restoreMs:Math.round(restore),snapshotApproxMB:+(bytes/1048576).toFixed(1),animals:s.animals.length}},seed);
  // Continue the saved world after a reload.
  await page.waitForTimeout(2500);await page.reload();await page.waitForFunction(()=>window.__GENVO8__?.contextTray,null,{timeout:120000});
  const cont=page.locator('[data-action="continue"]').first();let resumed=null;
  if(await cont.isVisible().catch(()=>false)){const t1=await page.evaluate(()=>performance.now());await cont.click();resumed=await measure(page,t1,'continue saved world')}
  const res={seed,bootMs,fresh,steps,resumed,errors};if(out)fs.writeFileSync(out,JSON.stringify(res,null,1));console.log(JSON.stringify(res));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
