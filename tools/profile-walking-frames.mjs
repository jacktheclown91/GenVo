// Usage: node tools/profile-walking-frames.mjs <exported build> <out.json> [seconds=40] [seed=GENVO8-TEST-A|random]
// Real-GPU walking-frame attribution: visible Chromium (GPU allowed), exported build, a fresh
// world walked by hand at 1x. Renderer methods and the simulation step are wrapped in the page
// (measurement only) so every frame records where its time went; long frames are reported with
// their breakdown, plus totals and percentiles.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const root=path.resolve(process.argv[2]),outFile=path.resolve(process.argv[3]),seconds=Number(process.argv[4]||40),seed=process.argv[5]||'GENVO8-TEST-A';
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip','.ogg':'audio/ogg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://l').pathname));const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw.chromium.launch({headless:false,args:['--ignore-gpu-blocklist','--window-size=1300,800']});
const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();if(seed!=='random')await page.locator('#newWorldSeed').fill(seed);
await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:180000});
const worldSeed=await page.evaluate(()=>window.__GENVO8__.sim.seed);
await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true);
 const P=Object.getPrototypeOf(g.renderer),acc=window.__acc={},depth={};
 const wrap=(obj,name,label=name)=>{const f=obj[name];if(typeof f!=='function')return;obj[name]=function(...a){const d=depth[label]=(depth[label]||0)+1,t=performance.now();try{return f.apply(this,a)}finally{depth[label]--;if(d===1)acc[label]=(acc[label]||0)+performance.now()-t}}};
 // The fps meter wraps several of these on the instance; wrap where the live function sits.
 for(const m of ['render','drawTerrainChunks','processTerrainRefreshQueue','queueTerrainWarmRing','drawTileDynamic','drawTile','drawLiveVegetationWindow','drawAnimal','visualWaterMask','staticLandTile','buildTerrainChunk','stepTerrainChunkWork','drawPendingTerrainChunk','drawHabitatScenes','drawHabitatTransitions','drawRegionalFocals','drawSites','drawForegroundHabitat','drawHabitatSceneForeground','drawSceneDepthForeground','drawWeatherOverlay','syncScene','drawEnvironmentalHistory','drawOrganicWaterMotion','drawLandDetailLive','drawCarrion','drawPredatorChargeTell'])wrap(Object.hasOwn(g.renderer,m)?g.renderer:P,m);
 wrap(g.frameStepper,'advance','sim');wrap(g.frameStepper,'resume','sim-resume');
 for(const [obj,ms] of [['planetaryPreparation',['observe']],['regionalResidency',['observe']],['borderPreparation',['observe']],['farRegions',['observe']],['planetaryWork',['frame']],['contextTray',['update']],['courtshipTray',['update']],['tutorial',['update']],['fieldGuide',['refresh']],['audio',['update']],['youngSummary',['check']],['worldStory',['observe']],['journal',['update']],['leadershipWheel',['sync']]])for(const m of ms)if(g[obj])wrap(g[obj],m,obj+'.'+m);
 if(g.tutorial?.notifications)wrap(g.tutorial.notifications,'layout','notifications.layout');
 wrap(g.renderer,'renderOrPrepare','renderOrPrepare');
 const s=g.sim;for(const [obj,m] of [[s.lineage,'refreshSelection'],[s.reproduction,'refreshSelection'],[g.renderer,'setPlayerPresentation'],[s.evolutionEditor,'pending'],[s.playerCombat,'consumeResult'],[g.saveManager,'saveNow'],[g.saveManager,'autosave'],[g.tutorial,'showToast']])if(obj)wrap(obj,m,(obj===s.lineage?'lineage':obj===s.reproduction?'reproduction':obj===g.renderer?'renderer':obj===g.saveManager?'save':obj===g.tutorial?'tutorial':m)+'.'+m);
 const origRaf=window.requestAnimationFrame;
 // performance.now(), not the shared frame timestamp: this callback runs after the game's frame in the
 // same batch, so each record holds that batch's own work.
 window.__frames=[];let prev=performance.now();const tick=()=>{const now=performance.now();window.__frames.push({ms:now-prev,...acc});for(const k in acc)acc[k]=0;prev=now;requestAnimationFrame(tick)};requestAnimationFrame(tick)});
await page.waitForTimeout(3000);await page.evaluate(()=>{window.__frames.length=0});
const end=Date.now()+seconds*1000;const keys=['KeyD','KeyS','KeyA','KeyW'];let k=0;while(Date.now()<end){const key=keys[k++%4];await page.keyboard.down(key);await page.waitForTimeout(1400);await page.keyboard.up(key)}
const frames=await page.evaluate(()=>window.__frames);await browser.close();server.close();
const ms=frames.map(f=>f.ms).sort((a,b)=>a-b),q=p=>+ms[Math.min(ms.length-1,Math.floor(ms.length*p))].toFixed(1);
const keysAll=[...new Set(frames.flatMap(f=>Object.keys(f)).filter(k=>k!=='ms'))];
const sum=(list,k)=>+list.reduce((t,f)=>t+(f[k]||0),0).toFixed(0);
const long=frames.filter(f=>f.ms>50);
const report={seed:worldSeed,seconds,frames:frames.length,fps:+(frames.length/seconds).toFixed(1),p50:q(.5),p95:q(.95),p99:q(.99),max:+ms.at(-1).toFixed(0),over50:long.length,over100:frames.filter(f=>f.ms>100).length,
 longFrameTotals:Object.fromEntries(keysAll.map(k=>[k,sum(long,k)]).sort((a,b)=>b[1]-a[1])),longFrameMs:sum(long,'ms'),
 allFrameTotals:Object.fromEntries(keysAll.map(k=>[k,sum(frames,k)]).sort((a,b)=>b[1]-a[1])),
 worst:long.sort((a,b)=>b.ms-a.ms).slice(0,12).map(f=>Object.fromEntries(Object.entries(f).filter(([k,v])=>v>=1).map(([k,v])=>[k,+v.toFixed(0)]))),errors};
fs.writeFileSync(outFile,JSON.stringify(report,null,1));console.log(JSON.stringify({...report,worst:report.worst.slice(0,6)}));
