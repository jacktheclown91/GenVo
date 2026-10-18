// Function-level CPU profile of real play (Phase 3H Milestone F, diagnostic). Same world and setup as
// profile-population-frames.cjs, then records a Chrome CPU profile while walking for S seconds and
// aggregates self time by function and source file (all game code, render and simulation).
// Usage: node tools/profile-cpu-functions.cjs <WxH> <days> <seconds> [out.json] [query]
const fs=require('node:fs'),path=require('node:path');
const {showFastForward,hideFastForward}=require('./fast-forward-overlay.cjs');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const [vw,vh]=(process.argv[2]||'1440x900').split('x').map(Number),days=Number(process.argv[3]||80),seconds=Number(process.argv[4]||20),out=process.argv[5];const root=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'};
(async()=>{const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:vw,height:vh}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(p),contentType:TYPES[path.extname(p)]||'application/octet-stream'})});
 await page.goto('https://genvo.review/index.html'+(process.argv[6]||''));await page.waitForFunction(()=>window.__GENVO8__?.contextTray);await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('PHASE4-ORDINARY');await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:30000});
 // Live world (Phase 3I fix): player on AUTO during the skip; refuse to measure a paused or player-less world.
 await showFastForward(page,days);const pop=await page.evaluate(d=>{const s=window.__GENVO8__.sim;s.setPlayerAutonomy?.(true);const d0=s.day;let guard=0;while(s.day<d0+d&&guard++<d*400)s.update(null);s.setPlayerAutonomy?.(false);return{day:s.day,animals:s.animals.filter(a=>a.alive).length,playerAlive:!!s.player(),paused:!!s.paused}},days);await hideFastForward(page);
 if(!pop.playerAlive||pop.paused){console.log(JSON.stringify({error:'world not live after skip',...pop}));await browser.close();process.exit(3)}
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:200});await cdp.send('Profiler.start');
 const legs=['KeyD','KeyS','KeyA','KeyW'];const t0=Date.now();let i=0;while(Date.now()-t0<seconds*1000){const k=legs[i++%4];await page.keyboard.down(k);await page.waitForTimeout(1800);await page.keyboard.up(k)}
 const {profile}=await cdp.send('Profiler.stop');const dt={};const ids=profile.samples;for(let k=0;k<ids.length;k++)dt[ids[k]]=(dt[ids[k]]||0)+(profile.timeDeltas[k]||0);
 const by={},files={};let total=0;for(const n of profile.nodes){const t=(dt[n.id]||0)/1000;total+=t;const f=n.callFrame,file=(f.url||'').replace(/^.*genvo\.review\//,'')||'(native)',key=(f.functionName||'(anon)')+' '+file+':'+(f.lineNumber+1);by[key]=(by[key]||0)+t;files[file]=(files[file]||0)+t}
 const sec=(Date.now()-t0)/1000,rows=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,120).map(([k,v])=>({fn:k.slice(0,90),msPerSec:+(v/sec).toFixed(1),pct:+(v/total*100).toFixed(1)}));
 const fileRows=Object.entries(files).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([k,v])=>({file:k,msPerSec:+(v/sec).toFixed(1),pct:+(v/total*100).toFixed(1)}));
 const res={viewport:`${vw}x${vh}`,advancedDays:days,...pop,seconds:sec,rows,files:fileRows,errors};if(out)fs.writeFileSync(out,JSON.stringify(res,null,1));console.table(fileRows);console.table(rows.slice(0,28));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
