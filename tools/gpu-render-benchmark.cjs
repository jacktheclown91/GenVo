// Real-GPU render benchmark (Phase 3L, measurement only). Runs the playable client in a HEADED Chromium window
// with hardware acceleration and refuses to measure if the browser reports a software renderer (SwiftShader), the
// headless default that hid the GPU cost in Phases 3H-3K. A fresh world on a fixed seed is advanced N days with
// ordinary updates (the player on AUTO during the skip, as in profile-population-frames.cjs); measurement needs a
// live, unpaused world with the player alive, and the simulation keeps running while the player walks a fixed
// keyboard square. Per frame: presented interval (requestAnimationFrame), whole render, creature preparation and
// creature composition (Renderer.frameStats), simulation (update + control steps) and the remainder (UI, HUD,
// browser). Also: freshly drawn creature sprites per frame (SPRITE_STATS), canvases created, JS heap.
// --moving N stages a workload-curve scene: N extra mosskip are placed inside the view and kept walking
// back and forth (their decisions are held to 'explore' toward alternating targets; benchmark scene only).
// Usage: node tools/gpu-render-benchmark.cjs --res 1440x900 --day 120 --seconds 20 [--query "?a=1"] [--moving N]
//        [--seed PHASE4-ORDINARY] [--out file.json] [--allow-software]
const path=require('path'),fs=require('fs');
const {showFastForward,hideFastForward}=require('./fast-forward-overlay.cjs');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d};
const [vw,vh]=arg('res','1440x900').split('x').map(Number),days=Number(arg('day','120')),seconds=Number(arg('seconds','20')),query=arg('query',''),moving=Number(arg('moving','0')),seed=arg('seed','PHASE4-ORDINARY'),out=arg('out',null),allowSoftware=process.argv.includes('--allow-software');
const root=path.resolve(__dirname,'..'),TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
(async()=>{
 const browser=await chromium.launch({headless:false,args:['--ignore-gpu-blocklist',`--window-size=${vw+16},${vh+120}`]});
 const page=await browser.newPage({viewport:{width:vw,height:vh}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(p),contentType:TYPES[path.extname(p)]||'application/octet-stream'})});
 // Count canvases created from the first script on (staging, sprite caches, terrain).
 await page.addInitScript(()=>{window.__canvasCreated=0;const ce=Document.prototype.createElement;Document.prototype.createElement=function(t,...r){if(String(t).toLowerCase()==='canvas'){window.__canvasCreated++;if(window.__canvasSources){const st=(new Error().stack||'').split('\n').slice(2,5).map(l=>l.trim().replace(/^at /,'').replace(/https:\/\/genvo\.review\//g,'').replace(/:\d+\)?$/,'')).join(' < ');window.__canvasSources[st]=(window.__canvasSources[st]||0)+1}}return ce.call(this,t,...r)};if(typeof OffscreenCanvas!=='undefined'){const O=OffscreenCanvas;window.OffscreenCanvas=class extends O{constructor(...a){super(...a);window.__canvasCreated++}}}});
 // --probe-draws: count drawImage calls and their synchronous time by source kind and destination size (measurement only).
 if(process.argv.includes('--probe-draws'))await page.addInitScript(()=>{const P=CanvasRenderingContext2D.prototype,d0=P.drawImage;window.__draws={};window.__drawsOn=false;P.drawImage=function(src,...r){if(!window.__drawsOn)return d0.call(this,src,...r);const t=performance.now();try{return d0.call(this,src,...r)}finally{const k=(src?.constructor?.name||'?')+(src?.width?'('+src.width+')':'')+'->'+this.canvas.width;const e=window.__draws[k]||=[0,0];e[0]++;e[1]+=performance.now()-t}}});
 await page.goto('https://genvo.review/index.html'+query);
 const gpu=await page.evaluate(()=>{const g=document.createElement('canvas').getContext('webgl');const d=g&&g.getExtension('WEBGL_debug_renderer_info');return g?String(g.getParameter(d?d.UNMASKED_RENDERER_WEBGL:g.RENDERER)):'no webgl'});
 const software=/swiftshader|software|llvmpipe|basic render/i.test(gpu);
 if(software&&!allowSoftware){console.log(JSON.stringify({error:'software renderer',gpu}));await browser.close();process.exit(4)}
 await page.waitForFunction(()=>window.__GENVO8__?.contextTray);await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill(seed);await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:60000});
 await showFastForward(page,days);const pop=await page.evaluate(d=>{const s=window.__GENVO8__.sim;if(d>0){s.setPlayerAutonomy?.(true);const d0=s.day;let guard=0;while(s.day<d0+d&&guard++<d*400)s.update(null);s.setPlayerAutonomy?.(false)}return{day:s.day,animals:s.animals.filter(a=>a.alive).length,playerAlive:!!s.player(),paused:!!s.paused}},days);await hideFastForward(page);
 if(!pop.playerAlive||pop.paused){console.log(JSON.stringify({error:'world not live after skip',...pop}));await browser.close();process.exit(3)}
 if(moving>0)await page.evaluate(n=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),staged=new Set();
   for(let i=0;i<n*4&&staged.size<n;i++){const x=p.x+(Math.random()*2-1)*12,y=p.y+(Math.random()*2-1)*7;if(!s.canOccupy({species:'mosskip'},x,y))continue;const a=s.spawnAnimal('mosskip',x,y);if(a){a.age=Math.max(a.age,20);staged.add(a.id)}}
   const dec=s.phaseDecision.bind(s);s.phaseDecision=(...r)=>{const v=dec(...r);for(const a of s.animals)if(staged.has(a.id)&&a.alive){a.__dirx??=(a.id%2?1:-1);if(!a.target||Math.abs(a.target.x-a.x)<.6)a.__dirx*=-1;a.intent='explore';a.target={x:a.x+a.__dirx*5,y:a.y}}return v};window.__staged=staged;s.rebuildSpatial()},moving);
 await page.evaluate(async()=>{const g=window.__GENVO8__,R=g.renderer,s=g.sim;const m=await import('/src/render/genvo-draw.js');const st=m.SPRITE_STATS;
   const acc={render:0,sim:0};window.__rows=[];const r0=R.render.bind(R);R.render=(...a)=>{const t=performance.now();try{return r0(...a)}finally{acc.render+=performance.now()-t}};
   const u0=s.update;s.update=function(...a){const t=performance.now();try{return u0.apply(this,a)}finally{acc.sim+=performance.now()-t}};const pc0=s.playerControlStep;s.playerControlStep=function(...a){const t=performance.now();try{return pc0.apply(this,a)}finally{acc.sim+=performance.now()-t}};
   let last=performance.now(),snap={...acc},fresh0=st.misses+st.uncached+st.pending,canv0=window.__canvasCreated;
   const loop=t=>{const fsx=R.frameStats||{},vis=R.visibleAnimals||[];let mv=0;for(const a of vis)if(s.tickCount-(a.movedTick??-1e9)<4)mv++;const fresh=st.misses+st.uncached+st.pending;
     window.__rows.push([t-last,acc.render-snap.render,acc.sim-snap.sim,fsx.creaturePrep||0,fsx.creatureCompose||0,vis.length,mv,fresh-fresh0,window.__canvasCreated-canv0,R.terrainRefreshAt||0,performance.memory?performance.memory.usedJSHeapSize:0]);snap={...acc};last=t;fresh0=fresh;canv0=window.__canvasCreated;requestAnimationFrame(loop)};requestAnimationFrame(loop);
   // Saves during the measured window (reason, synchronous duration of the save call until its first await, total).
   window.__saves=[];const SM=g.saveManager;if(SM?.saveNow){const sv=SM.saveNow.bind(SM);SM.saveNow=async(reason)=>{const t=performance.now();const pr=sv(reason);const sync=performance.now()-t;try{return await pr}finally{window.__saves.push({reason,syncMs:+sync.toFixed(1),totalMs:+(performance.now()-t).toFixed(1)})}}}
   window.__heap0=performance.memory?performance.memory.usedJSHeapSize:null});
 if(process.argv.includes('--probe-draws'))await page.evaluate(()=>{window.__draws={};window.__drawsOn=true});
 // --canvas-sources: aggregate where canvases are created during the measured walk (top 3 stack frames).
 if(process.argv.includes('--canvas-sources'))await page.evaluate(()=>{window.__canvasSources={}});
 const legs=['KeyD','KeyS','KeyA','KeyW'];const t0=Date.now();let i=0;while(Date.now()-t0<seconds*1000){const k=legs[i++%4];await page.keyboard.down(k);await page.waitForTimeout(1800);await page.keyboard.up(k)}
 const r=await page.evaluate(sec=>{const rows=window.__rows.slice(20),col=j=>rows.map(x=>x[j]).sort((a,b)=>a-b),q=(v,p)=>v.length?+v[Math.min(v.length-1,Math.floor(p*(v.length-1)))].toFixed(1):null,mean=v=>v.length?+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):null;
   const dt=col(0),stat=j=>{const v=col(j);return{mean:mean(v),p50:q(v,.5),p95:q(v,.95)}};const other=rows.map(x=>Math.max(0,x[0]-x[1]-x[2])).sort((a,b)=>a-b);
   const s=window.__GENVO8__.sim,p=s.player();
   return{frames:rows.length,presentedFps:+(rows.length/(rows.reduce((a,x)=>a+x[0],0)/1000)).toFixed(1),frameMs:{mean:mean(dt),p50:q(dt,.5),p95:q(dt,.95),p99:q(dt,.99),max:+dt[dt.length-1].toFixed(1)},
     renderMs:stat(1),simMs:stat(2),creaturePrepMs:stat(3),creatureComposeMs:stat(4),otherMs:{p50:q(other,.5),p95:q(other,.95)},visibleCreatures:stat(5),movingVisible:stat(6),freshSpritesPerFrame:stat(7),
     canvasesCreatedPerSecond:+(rows.reduce((a,x)=>a+x[8],0)/(rows.reduce((a,x)=>a+x[0],0)/1000)).toFixed(2),heapMB:{start:window.__heap0?+(window.__heap0/1048576).toFixed(1):null,end:performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):null},
     drawsPerFrame:window.__drawsOn?Object.fromEntries(Object.entries(window.__draws).sort((a,b)=>b[1][1]-a[1][1]).slice(0,14).map(([k,v])=>[k,{calls:+(v[0]/rows.length).toFixed(1),ms:+(v[1]/rows.length).toFixed(2)}])):null,stalls:{over250ms:rows.filter(x=>x[0]>250).length,over500ms:rows.filter(x=>x[0]>500).length,secondsLost:+(rows.filter(x=>x[0]>250).reduce((t,x)=>t+x[0],0)/1000).toFixed(1)},worstFrames:rows.map((x,i)=>({i,ms:+x[0].toFixed(1),render:+x[1].toFixed(1),sim:+x[2].toFixed(1),terrainRefresh:i>0&&x[9]!==rows[i-1][9],heapDropMB:i>0?+((rows[i-1][10]-x[10])/1048576).toFixed(1):0,canvases:x[8]})).sort((a,b)=>b.ms-a.ms).slice(0,6),saves:window.__saves,canvasSources:window.__canvasSources?Object.entries(window.__canvasSources).sort((a,b)=>b[1]-a[1]).slice(0,10):null,live:{paused:!!s.paused,playerAlive:!!p,day:s.day,animals:s.animals.filter(a=>a.alive).length}}},seconds);
 const res={res:`${vw}x${vh}`,seed,dayAdvanced:days,query,moving,gpu,software,...pop,...r,errors};if(out)fs.writeFileSync(out,JSON.stringify(res,null,1));console.log(JSON.stringify(res));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
