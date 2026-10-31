// Chrome performance trace of normal-speed walking (same scenario as profile-frame-stalls.cjs)
// to attribute long frames to script, GC, rasterization/GPU or other work.
// Usage: node tools/trace-frame-stalls.cjs [1440x900] [seconds] [label]
let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const [vw,vh]=(process.argv[2]||'1440x900').split('x').map(Number),seconds=Number(process.argv[3]||20),label=process.argv[4]||'current';
(async()=>{
 const root=path.resolve(__dirname,'../..');const browser=await chromium.launch({headless:true});activeBrowser=browser;const page=await browser.newPage({viewport:{width:vw,height:vh}});
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
 await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('STALL-PROFILE');await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:30000});await page.waitForTimeout(1500);await page.evaluate(()=>window.__GENVO8__.sim.endOpeningGrace?.('trace'));
 const out=path.join(root,'docs/frame-stalls');fs.mkdirSync(out,{recursive:true});const tracePath=path.join(require('node:os').tmpdir(),`genvo-trace-${label}.json`);
 await browser.startTracing(page,{path:tracePath,categories:['devtools.timeline','disabled-by-default-devtools.timeline','disabled-by-default-devtools.timeline.frame','v8','v8.gc','gpu','cc','blink.user_timing','toplevel']});
 const legs=[['KeyD'],['KeyS'],['KeyA'],['KeyW'],['KeyD','KeyS'],['KeyA','KeyW']];const t0=Date.now();let i=0;
 while(Date.now()-t0<seconds*1000){const keys=legs[i++%legs.length];for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(2500);for(const k of keys)await page.keyboard.up(k)}
 await browser.stopTracing();await browser.close();
 const tr=JSON.parse(fs.readFileSync(tracePath,'utf8')),ev=tr.traceEvents||tr;
 // Durations of top-level tasks on the renderer main thread, and what they contain.
 const main=ev.filter(e=>e.ph==='X'&&e.name==='RunTask'&&e.dur>50000);
 const within=(t,e)=>e.ts>=t.ts&&e.ts<=t.ts+t.dur&&e.tid===t.tid&&e.pid===t.pid;
 const kinds=['Layout','UpdateLayoutTree','RecalculateStyles','ScheduleStyleRecalculation','InvalidateLayout','ParseHTML','HitTest','PrePaint','FunctionCall','V8.GCScavenger','MajorGC','MinorGC','V8.GC_MARK_COMPACTOR','V8.GCFinalizeMC','BlinkGC.AtomicPhase','Paint','RasterTask','Commit','UpdateLayerTree','CompositeLayers','GPUTask','Canvas2DLayerBridge::flush','CanvasResourceProvider::Flush','v8.run'];
 const report=main.sort((a,b)=>b.dur-a.dur).slice(0,15).map(t=>{const parts={};for(const e of ev)if(e.ph==='X'&&within(t,e)&&e!==t){const k=kinds.includes(e.name)?e.name:/GC/.test(e.name)?'GC:'+e.name:/Raster|Paint|Canvas|GPU|Skia|Gr/.test(e.name)?'gfx:'+e.name:null;if(k)parts[k]=(parts[k]||0)+e.dur/1000}return{ms:+(t.dur/1000).toFixed(1),parts:Object.fromEntries(Object.entries(parts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>[k,+v.toFixed(1)]))}});
 const entry=main.sort((a,b)=>b.dur-a.dur).slice(0,15).map(t=>{const inner=ev.filter(e=>e.ph==='X'&&within(t,e)&&e!==t&&['FireAnimationFrame','TimerFire','EventDispatch','FireIdleCallback','FunctionCall','v8.callFunction','RunMicrotasks','HandlePostMessage','ParseHTML','EvaluateScript','v8.compile'].includes(e.name)).sort((a,b)=>b.dur-a.dur).slice(0,4).map(e=>({name:e.name,ms:+(e.dur/1000).toFixed(1),fn:e.args?.data?.functionName||e.args?.data?.type||'',at:(e.args?.data?.url||'').replace(/.*genvo\.review\//,'')+(e.args?.data?.lineNumber?':'+e.args.data.lineNumber:'')}));return{ms:+(t.dur/1000).toFixed(1),inner}});
 const gc=ev.filter(e=>e.ph==='X'&&/GC|Scavenge|MarkCompact/.test(e.name)&&e.dur>10000).map(e=>({name:e.name,ms:+(e.dur/1000).toFixed(1)})).sort((a,b)=>b.ms-a.ms).slice(0,10);
 const gpuLong=ev.filter(e=>e.ph==='X'&&e.dur>40000&&/Gpu|GPU|Raster|Skia|Canvas/.test(e.name)).map(e=>({name:e.name,ms:+(e.dur/1000).toFixed(1),tid:e.tid})).sort((a,b)=>b.ms-a.ms).slice(0,10);
 const summary={label,viewport:`${vw}x${vh}`,seconds,longMainTasks:main.length,longTaskEntries:entry,worstMainTasks:report,longGC:gc,longGraphics:gpuLong};
 fs.writeFileSync(path.join(out,`trace-summary-${label}-${vw}x${vh}.json`),JSON.stringify(summary,null,1));fs.unlinkSync(tracePath);
 console.log(JSON.stringify(summary).slice(0,3500));
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});
