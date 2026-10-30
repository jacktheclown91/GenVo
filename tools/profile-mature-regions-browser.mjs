// CPU profile of the native browser loop with two archived mature regions (performance
// pass, October 30); same setup as measure-mature-regions-browser.mjs.
// Native browser frame timing with two archived mature regions. The bundled Day
// 100 world is crossed twice by controlled legal frontier placement (diagnostic
// intervention, never natural-evolution evidence), saved and loaded through the
// real game, then the unmodified requestAnimationFrame loop runs for SECONDS.
// Usage: node tools/profile-mature-regions-browser.mjs PUBLIC_ROOT OUTPUT.json [SECONDS]
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
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});await cdp.send('Profiler.start');
 await page.waitForTimeout(seconds*1000);
 const {profile}=await cdp.send('Profiler.stop');{const byId=new Map(profile.nodes.map(n=>[n.id,n])),self=new Map(),files=new Map(),counts=new Map();for(const id of profile.samples)counts.set(id,(counts.get(id)||0)+1);const total=profile.samples.length;
  for(const [id,c] of counts){const f=byId.get(id).callFrame,file=f.url.replace(/^.*?\/(src|assets)\//,'$1/')||'(native)',key=(f.functionName||'(anon)')+' '+file+':'+(f.lineNumber+1);self.set(key,(self.get(key)||0)+c);files.set(file,(files.get(file)||0)+c)}
  const top=(m,n)=>[...m].sort((x,y)=>y[1]-x[1]).slice(0,n).map(([k,v])=>[k,+(100*v/total).toFixed(1)]);receipt.profile={topFunctions:top(self,40),topFiles:top(files,25)};
  // Long tasks: contiguous busy runs (no idle sample) over 250 ms, attributed by the
  // deepest application frame on each sample's stack.
  const parent=new Map();for(const n of profile.nodes)for(const c of n.children||[])parent.set(c,n.id);
  const appFrame=id=>{let cur=id;while(cur!==undefined){const f=byId.get(cur).callFrame;if(/\/(src|assets)\//.test(f.url))return (f.functionName||'(anon)')+' '+f.url.replace(/^.*?\/(src|assets)\//,'$1/')+':'+(f.lineNumber+1);cur=parent.get(cur)}return '(native)'};
  const rootApp=id=>{let cur=id,last='(native)';while(cur!==undefined){const f=byId.get(cur).callFrame;if(/\/(src|assets)\//.test(f.url))last=(f.functionName||'(anon)')+' '+f.url.replace(/^.*?\/(src|assets)\//,'$1/');cur=parent.get(cur)}return last};
  let t=0,run=[],runStart=0;const longRuns=[];const flush=end=>{if(run.length&&end-runStart>250){const by=new Map(),roots=new Map();for(const [id,dt] of run){const k=appFrame(id);by.set(k,(by.get(k)||0)+dt);const r=rootApp(id);roots.set(r,(roots.get(r)||0)+dt)}longRuns.push({ms:+((end-runStart)/1000).toFixed(0),top:[...by].sort((x,y)=>y[1]-x[1]).slice(0,6).map(([k,v])=>[k,+(v/1000).toFixed(0)]),roots:[...roots].sort((x,y)=>y[1]-x[1]).slice(0,4).map(([k,v])=>[k,+(v/1000).toFixed(0)])})}run=[]};
  for(let k=0;k<profile.samples.length;k++){t+=profile.timeDeltas[k];const id=profile.samples[k],name=byId.get(id).callFrame.functionName;if(name==='(idle)'){flush(t);runStart=t;continue}if(!run.length)runStart=t;run.push([id,profile.timeDeltas[k]])}flush(t);
  longRuns.sort((x,y)=>y.ms-x.ms);receipt.profile.longRuns=longRuns.slice(0,12);
  for(const r of longRuns.slice(0,8)){console.log('LONG',r.ms,'ms roots',JSON.stringify(r.roots));console.log('   top',JSON.stringify(r.top).slice(0,600))}
  for(const [k,v] of receipt.profile.topFunctions)console.log(String(v).padStart(5),'%',k.slice(0,150));console.log('-- files');for(const [k,v] of receipt.profile.topFiles)console.log(String(v).padStart(5),'%',k)}
 const r=await page.evaluate(()=>{const g=window.__GENVO8__,p=window.__regions;p.running=false;p.observer.disconnect();return{frames:p.frames,longTasks:p.longTasks,elapsedMs:performance.now()-p.start,ticks:g.sim.tickCount-p.startTick,paused:g.sim.paused,remote:g.sim.planetaryTravel.sessions.map(s=>s.snapshot.core.tickCount),tick:g.sim.tickCount}});
 const sorted=r.frames.slice().sort((a,b)=>a-b),at=q=>sorted[Math.min(sorted.length-1,Math.ceil(q*sorted.length)-1)]??null;
 Object.assign(receipt,{frameMs:{count:sorted.length,median:at(.5),p95:at(.95),p99:at(.99),worst:at(1)},framesOver:{ms250:sorted.filter(x=>x>250).length,ms1000:sorted.filter(x=>x>1000).length},longTaskWorst:Math.max(0,...r.longTasks),ticksAdvanced:r.ticks,elapsedMs:r.elapsedMs,ticksPerSecond:r.ticks*1000/r.elapsedMs,paused:r.paused,tick:r.tick,remote:r.remote});
 await page.screenshot({path:out+'.png'});
 console.log(JSON.stringify({frameMs:receipt.frameMs,framesOver:receipt.framesOver,longTaskWorst:receipt.longTaskWorst,ticksPerSecond:receipt.ticksPerSecond,ticksAdvanced:receipt.ticksAdvanced,remote:receipt.remote,tick:receipt.tick,paused:receipt.paused,errors:receipt.errors}));
}catch(error){receipt.failure=error.stack;throw error}
finally{fs.writeFileSync(out,JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
