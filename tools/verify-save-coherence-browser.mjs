// Real game-loop/IndexedDB check with controlled legal frontier placement.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const out=process.argv[2];assert.ok(out&&!fs.existsSync(out),'fresh evidence folder required');fs.mkdirSync(out,{recursive:true});
const root=process.cwd(),types={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1000,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__GENVO8__?.saveManager);
 const report=await page.evaluate(async()=>{
  window.__GENVO8__.sim.paused=true;
  const {Simulation}=await import('/src/sim/simulation.js'),{SaveManager,createSimulationSnapshot,restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js');
  const s=new Simulation('BROWSER-SAVE-COHERENCE',{player:true}),manager=new SaveManager({getSim:()=>s});await manager.allocateWorld('Save coherence diagnostic');
  const p=s.player(),victim=s.animals.find(a=>a.alive&&!a.player&&!a.lineage&&!s.world.water[s.world.idx(a.x,a.y)]);if(!victim)throw Error('Missing mortality fixture');
  if(s.discovery.spawnCarcass(p)!==false)throw Error('Discovery created food before a death');
  s.kill(victim,'controlled-browser-fixture');p.x=victim.x;p.y=victim.y;const cell=s.world.idx(victim.x,victim.y),food=s.world.carrion[cell];
  if(!s.discovery.spawnCarcass(p)||s.world.carrion[cell]!==food)throw Error('Death-funded discovery changed food');
  const db=await manager.db(),defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}},metadata=defer(),database=defer(),requested=defer();
  manager.metadata=()=>metadata.promise;manager.db=()=>{requested.resolve();return database.promise};
  const pending=manager.saveNow('browser-delayed-save');for(let t=0;t<6;t++)s.update({});metadata.resolve({worldName:'Save coherence diagnostic'});await requested.promise;
  for(let t=0;t<6;t++)s.update({});const expectedTick=s.tickCount,signature=manager.signature(s);
  const canonical=x=>JSON.stringify(createSimulationSnapshot(x,{savedAt:'fixed',reason:'coherence-parity'}),(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v instanceof Map?[...v]:v instanceof Set?[...v]:v),expected=canonical(s);
  database.resolve(db);await pending;
  const transported=await manager.loadSnapshot(),restored=restoreSimulationSnapshot(structuredClone(transported));
  if(transported.core.tickCount!==expectedTick||manager.lastSavedTick!==expectedTick||manager.lastObservedSignature!==signature||canonical(restored)!==expected)throw Error('Actual IndexedDB capture/restore differs');
  return{scope:'Real Chromium main-page/module boot and actual IndexedDB transport. Independent controlled Simulation, setup barriers, canonical ticks and controlled mortality; no main-loop scheduling, human playability, mature-save scale or natural death-rate claim.',expectedTick,storedTick:transported.core.tickCount,lastSavedTick:manager.lastSavedTick,exactRestoredState:true,carcassRule:restored.carcassRules,diggingRule:restored.diggingRules,foodBeforeDiscovery:food,discoveryPreservesFood:true,restoredCarcassMarkers:restored.discovery.sites.filter(v=>v.kind==='carcass').length};
 });
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({...report,pageErrors:errors},null,2));console.log(JSON.stringify({...report,pageErrors:errors},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r))}
