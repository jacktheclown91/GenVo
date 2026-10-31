// Counts canvas creation by call site and samples a CPU profile during normal-speed walking.
// Usage: node tools/profile-canvas-churn.cjs [1440x900] [seconds] [label]
let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const [vw,vh]=(process.argv[2]||'1440x900').split('x').map(Number),seconds=Number(process.argv[3]||20),label=process.argv[4]||'current';
(async()=>{
 const root=path.resolve(__dirname,'../..');const browser=await chromium.launch({headless:true});activeBrowser=browser;const page=await browser.newPage({viewport:{width:vw,height:vh}});
 await page.addInitScript(()=>{const orig=Document.prototype.createElement;window.__canvasSites={};window.__canvasTotal=0;Document.prototype.createElement=function(tag,...a){if(String(tag).toLowerCase()==='canvas'&&window.__countCanvas){window.__canvasTotal++;const st=(new Error().stack||'').split('\n').slice(2,4).map(s=>s.trim().replace(/^at /,'').replace(/https:\/\/genvo\.review\//,'').replace(/\?.*?:/,':')).join(' < ');window.__canvasSites[st]=(window.__canvasSites[st]||0)+1}return orig.call(this,tag,...a)}});
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
 await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('STALL-PROFILE');await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:30000});await page.waitForTimeout(1500);await page.evaluate(()=>{window.__GENVO8__.sim.endOpeningGrace?.('profile');window.__countCanvas=true});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});await cdp.send('Profiler.start');
 const legs=[['KeyD'],['KeyS'],['KeyA'],['KeyW'],['KeyD','KeyS'],['KeyA','KeyW']];const t0=Date.now();let i=0;
 while(Date.now()-t0<seconds*1000){const keys=legs[i++%legs.length];for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(2500);for(const k of keys)await page.keyboard.up(k)}
 const {profile}=await cdp.send('Profiler.stop');const canvas=await page.evaluate(()=>({total:window.__canvasTotal,sites:Object.entries(window.__canvasSites).sort((a,b)=>b[1]-a[1]).slice(0,12)}));await browser.close();
 // Self time per function (ms).
 const byId=new Map(profile.nodes.map(n=>[n.id,n])),self=new Map();const dt=profile.timeDeltas;for(let k=0;k<profile.samples.length;k++){const n=byId.get(profile.samples[k]),f=n.callFrame,key=`${f.functionName||'(anon)'} ${f.url.replace(/.*genvo\.review\//,'')}:${f.lineNumber+1}`;self.set(key,(self.get(key)||0)+(dt[k]||0)/1000)}
 const top=[...self.entries()].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>[k,+v.toFixed(0)]);
 // Inclusive time: each sample is charged to every distinct function on its stack.
 const parent=new Map();for(const n of profile.nodes)for(const c of n.children||[])parent.set(c,n.id);const incl=new Map();
 for(let k=0;k<profile.samples.length;k++){const seen=new Set();let id=profile.samples[k];while(id!==undefined){const f=byId.get(id).callFrame,key=`${f.functionName||'(anon)'} ${f.url.replace(/.*genvo\.review\//,'')}:${f.lineNumber+1}`;if(!seen.has(key)){seen.add(key);incl.set(key,(incl.get(key)||0)+(dt[k]||0)/1000)}id=parent.get(id)}}
 // Long busy runs: consecutive non-idle samples spanning >150 ms, with inclusive functions in each run.
 const idle=new Set([...byId.values()].filter(n=>['(idle)','(program)'].includes(n.callFrame.functionName)).map(n=>n.id));const runs=[];let cur=null,tcur=profile.startTime;
 const stackKeys=id=>{const out=new Set();while(id!==undefined){const f=byId.get(id).callFrame;if(/src\//.test(f.url))out.add(`${f.functionName||'(anon)'} ${f.url.replace(/.*genvo\.review\//,'')}:${f.lineNumber+1}`);id=parent.get(id)}return out};
 for(let k=0;k<profile.samples.length;k++){tcur+=dt[k]||0;const busy=!idle.has(profile.samples[k]);if(busy){if(!cur)cur={start:tcur,end:tcur,fns:new Map()};cur.end=tcur;for(const key of stackKeys(profile.samples[k]))cur.fns.set(key,(cur.fns.get(key)||0)+(dt[k]||0)/1000)}else if(cur&&tcur-cur.end>4000){runs.push(cur);cur=null}}if(cur)runs.push(cur);
 const longRuns=runs.filter(r=>(r.end-r.start)/1000>150).sort((a,b)=>(b.end-b.start)-(a.end-a.start)).slice(0,8).map(r=>({ms:+((r.end-r.start)/1000).toFixed(0),top:[...r.fns.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>[k,+v.toFixed(0)])}));
 const inclusiveTop=[...incl.entries()].filter(([k])=>/src\//.test(k)).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([k,v])=>[k,+v.toFixed(0)]);
 const summary={label,viewport:`${vw}x${vh}`,seconds,canvasCreated:canvas.total,canvasPerSecond:+(canvas.total/seconds).toFixed(1),canvasSites:canvas.sites,cpuSelfMsTop:top,cpuInclusiveMsTop:inclusiveTop,longBusyRuns:longRuns};
 const out=path.join(root,'docs/frame-stalls');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,`churn-${label}-${vw}x${vh}.json`),JSON.stringify(summary,null,1));console.log(JSON.stringify(summary,null,0).slice(0,4500));
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});
