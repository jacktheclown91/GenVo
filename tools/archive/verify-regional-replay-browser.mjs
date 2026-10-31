// Real game-loop/IndexedDB check with controlled legal frontier placement.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const out=process.argv[2];assert.ok(out&&!fs.existsSync(out),'fresh evidence folder required');fs.mkdirSync(out,{recursive:true});
const root=process.cwd(),types={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__GENVO8__?.saveManager);
 await page.evaluate(async()=>{
  const g=window.__GENVO8__;g.sim.paused=true;
  const {Simulation}=await import('/src/sim/simulation.js'),{SaveManager}=await import('/src/persistence/save-manager.js'),{planetaryTravelAvailability,crossPlanetaryBorder}=await import('/src/world/planetary-travel.js');
  let sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});const seen=new Set(['0,0']);
  for(let hop=0;hop<2;hop++){
   let found=false;for(const dir of ['east','south','north','west']){
    for(let c=8.5;c<118.5;c++){
     const a=sim.player();a.x=dir==='east'?125.2:dir==='west'?2.5:c;a.y=dir==='south'?125.2:dir==='north'?2.5:c;
     const z=planetaryTravelAvailability(sim);if(!z.enabled||seen.has(z.to.x+','+z.to.y))continue;
     const trip=crossPlanetaryBorder(sim);if(!trip.ok)throw Error(trip.message);sim=trip.simulation;seen.add(z.to.x+','+z.to.y);found=true;break;
    }if(found)break;
   }if(!found)throw Error('No actual frontier');
  }
  sim.paused=true;const manager=new SaveManager({getSim:()=>sim});await manager.allocateWorld('Regional replay browser diagnostic');await manager.saveNow('controlled-regional-fixture');g.saveManager.setActiveSlot(manager.activeSlotId);
  if(!await g.loadSavedLineage())throw Error('Actual IndexedDB/game install failed');
 });
 await page.waitForFunction(()=>window.__GENVO8__.renderer.sceneShown,{timeout:60000});
 await page.evaluate(()=>{
  const g=window.__GENVO8__;window.replayFrames=[];let running=true;
  window.stopReplaySampling=()=>running=false;
  const sample=now=>{if(!running)return;const s=g.sim;window.replayFrames.push({now,tick:s.tickCount,remote:s.planetaryTravel.sessions.map(r=>r.snapshot.core.tickCount),notice:document.querySelector('#processingCapacity')?.textContent||'',noticeVisible:!!document.querySelector('#processingCapacity:not([hidden])')?.getBoundingClientRect().width});requestAnimationFrame(sample)};
  requestAnimationFrame(sample);g.sim.paused=false;
 });
 await page.waitForFunction(()=>{const el=document.querySelector('#processingCapacity:not([hidden])');return !!el?.getBoundingClientRect().width&&el.textContent.includes('Local time waits')},{timeout:60000});
 await page.screenshot({path:path.join(out,'regional-catchup.png')});
 await page.waitForFunction(()=>window.__GENVO8__.sim.tickCount>=48,{timeout:90000});
 const report=await page.evaluate(async()=>{
  const g=window.__GENVO8__;g.sim.paused=true;window.stopReplaySampling();
  const {createSimulationSnapshot,restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js');
  const saved=createSimulationSnapshot(g.sim,{savedAt:'fixed',reason:'browser-replay'});await g.saveManager.saveNow('browser-replay-final');const actual=await g.saveManager.loadSnapshot(),restored=restoreSimulationSnapshot(structuredClone(actual));
  // Snapshots contain reference cycles (animal targets). Like the original JSON
  // comparison this is alias-insensitive; only an object reached again inside
  // itself becomes a cycle marker, and Maps/Sets/arrays keep their order. Plain
  // object fields compare by key: a restored Simulation assigns its own fields
  // in a different order from a constructed one (pre-existing, not a value change).
  const canonical=(v,path)=>{if(ArrayBuffer.isView(v))return{$view:v.constructor.name,values:Array.from(v)};if(!v||typeof v!=='object')return v===undefined?{$undefined:true}:Number.isNaN(v)?{$nan:true}:Object.is(v,-0)?{$negzero:true}:v;if(path.has(v))return{$cycle:true};path.add(v);let out;if(v instanceof Map)out={$map:[...v].map(([k,x])=>[canonical(k,path),canonical(x,path)])};else if(v instanceof Set)out={$set:[...v].map(x=>canonical(x,path))};else if(Array.isArray(v))out=v.map(x=>canonical(x,path));else{out={};for(const k of Object.keys(v).sort())out[k]=canonical(v[k],path)}path.delete(v);return out};
  const compare=s=>JSON.stringify(canonical(createSimulationSnapshot(s,{savedAt:'fixed',reason:'browser-replay'}),new Set()));
  const rows=window.replayFrames,held=[];for(let i=1;i<rows.length;i++)if(rows[i].tick===rows[i-1].tick&&rows[i].remote.some((v,j)=>v>rows[i-1].remote[j]))held.push(i);
  return{scope:'Actual main game loop and IndexedDB; controlled frontier placement, founded organisms, one active day, not human acceptance or mature planetary performance',policy:g.sim.regionalReplayPolicy,tick:g.sim.tickCount,remote:g.sim.planetaryTravel.sessions.map(r=>({key:r.key,tick:r.snapshot.core.tickCount,debt:g.sim.tickCount-r.snapshot.core.tickCount,mode:r.biologicalMode})),frames:rows,heldLocalFramesWithRemoteProgress:held.length,roundTripExact:compare(restored)===compare(g.sim),maxFrameGap:Math.max(...rows.slice(1).map((r,i)=>r.now-rows[i].now)),warningObserved:rows.some(r=>r.noticeVisible&&r.notice.includes('Local time waits'))};
 });
 assert.equal(report.policy,'synchronized-strides/1');assert.equal(report.remote.length,2);assert.ok(report.remote.every(r=>r.debt<=6));assert.ok(report.heldLocalFramesWithRemoteProgress>0);assert.ok(report.roundTripExact);assert.ok(report.warningObserved);assert.deepEqual(errors,[]);
 await page.screenshot({path:path.join(out,'regional-day1.png')});fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({...report,pageErrors:errors},null,2));console.log(JSON.stringify({...report,frames:report.frames.length,pageErrors:errors},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r))}
