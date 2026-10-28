// Native browser frame timing with two archived mature regions. The bundled Day
// 100 world is crossed twice by controlled legal frontier placement (diagnostic
// intervention, never natural-evolution evidence), saved and loaded through the
// real game, then the unmodified requestAnimationFrame loop runs for SECONDS.
// Usage: node tools/measure-mature-regions-browser.mjs PUBLIC_ROOT OUTPUT.json [SECONDS]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const [rootArg,outArg,secondsArg='90']=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg),seconds=Number(secondsArg);
assert.ok(rootArg&&outArg&&!fs.existsSync(out)&&Number.isFinite(seconds)&&seconds>=10&&seconds<=900,'Use PUBLIC_ROOT fresh-OUTPUT.json [10..900 seconds]');
const types={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.ogg':'audio/ogg','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');fs.readFile(file,(error,bytes)=>{res.writeHead(error?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(error?'Missing':bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
const receipt={schema:'genvo.mature-regions-browser/1',root,seconds,started:new Date().toISOString(),scope:'Headless Chromium native loop; controlled frontier placement on the bundled Day 100 world; not GPU or creator acceptance',errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__GENVO8__?.saveManager);
 receipt.setup=await page.evaluate(async()=>{
  const g=window.__GENVO8__;g.sim.paused=true;
  const {openScenarioSnapshot}=await import('/src/persistence/scenario-library.js'),{SaveManager,restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{planetaryTravelAvailability,crossPlanetaryBorder}=await import('/src/world/planetary-travel.js');
  const body=(await fetch('/assets/scenarios/mature-valley-d100.json.gz')).body.pipeThrough(new DecompressionStream('gzip'));
  let sim=restoreSimulationSnapshot(openScenarioSnapshot(JSON.parse(await new Response(body).text())));const seen=new Set([sim.world.regionOrigin.x+','+sim.world.regionOrigin.y]);
  for(let hop=0;hop<2;hop++){let found=false;for(const dir of ['east','south','north','west']){for(let c=8.5;c<118.5&&!found;c++){const a=sim.player();a.x=dir==='east'?125.2:dir==='west'?2.5:c;a.y=dir==='south'?125.2:dir==='north'?2.5:c;const z=planetaryTravelAvailability(sim);if(!z.enabled||seen.has(z.to.x+','+z.to.y))continue;const trip=crossPlanetaryBorder(sim);if(!trip.ok)throw Error(trip.message);sim=trip.simulation;seen.add(z.to.x+','+z.to.y);found=true}if(found)break}if(!found)throw Error('No actual frontier')}
  sim.paused=true;const manager=new SaveManager({getSim:()=>sim});await manager.allocateWorld('Mature regional browser measurement');await manager.saveNow('controlled-mature-regions');g.saveManager.setActiveSlot(manager.activeSlotId);
  if(!await g.loadSavedLineage())throw Error('Actual IndexedDB/game install failed');
  return{policy:g.sim.regionalReplayPolicy,regions:g.sim.planetaryTravel.sessions.length,tick:g.sim.tickCount};
 });
 await page.waitForFunction(()=>window.__GENVO8__.renderer.sceneShown,{timeout:120000});
 await page.evaluate(()=>{const g=window.__GENVO8__,p=window.__regions={frames:[],longTasks:[],start:performance.now(),startTick:g.sim.tickCount,running:true};let previous;
  const frame=now=>{if(!p.running)return;if(previous!==undefined)p.frames.push(now-previous);previous=now;requestAnimationFrame(frame)};requestAnimationFrame(frame);
  p.observer=new PerformanceObserver(list=>{for(const e of list.getEntries())p.longTasks.push(e.duration)});p.observer.observe({type:'longtask'});
  for(const el of document.querySelectorAll('#tutorialContinue,#startGame'))if(el.offsetParent)el.click();g.sim.paused=false;});
 await page.waitForTimeout(seconds*1000);
 const r=await page.evaluate(()=>{const g=window.__GENVO8__,p=window.__regions;p.running=false;p.observer.disconnect();return{frames:p.frames,longTasks:p.longTasks,elapsedMs:performance.now()-p.start,ticks:g.sim.tickCount-p.startTick,paused:g.sim.paused,remote:g.sim.planetaryTravel.sessions.map(s=>s.snapshot.core.tickCount),tick:g.sim.tickCount}});
 const sorted=r.frames.slice().sort((a,b)=>a-b),at=q=>sorted[Math.min(sorted.length-1,Math.ceil(q*sorted.length)-1)]??null;
 Object.assign(receipt,{frameMs:{count:sorted.length,median:at(.5),p95:at(.95),p99:at(.99),worst:at(1)},framesOver:{ms250:sorted.filter(x=>x>250).length,ms1000:sorted.filter(x=>x>1000).length},longTaskWorst:Math.max(0,...r.longTasks),ticksAdvanced:r.ticks,elapsedMs:r.elapsedMs,ticksPerSecond:r.ticks*1000/r.elapsedMs,paused:r.paused,tick:r.tick,remote:r.remote});
 await page.screenshot({path:out+'.png'});
 console.log(JSON.stringify({frameMs:receipt.frameMs,framesOver:receipt.framesOver,longTaskWorst:receipt.longTaskWorst,ticksPerSecond:receipt.ticksPerSecond,ticksAdvanced:receipt.ticksAdvanced,remote:receipt.remote,tick:receipt.tick,paused:receipt.paused,errors:receipt.errors}));
}catch(error){receipt.failure=error.stack;throw error}
finally{fs.writeFileSync(out,JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
