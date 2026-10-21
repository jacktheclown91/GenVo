import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]),root=path.resolve(process.argv[3]);fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1024,height:768}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill('PLANET-B0-A');await page.locator('#newWorldName').fill('Reconciled planetary walking');assert.equal(await page.locator('#newWorldGeography').inputValue(),'planetary/1');await page.locator('#newWorldCreature').selectOption('starter-jump');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());await page.evaluate(async()=>{window.__GENVO8__.sim.paused=true;await window.__GENVO8__.audio.unlock()});await page.waitForFunction(()=>!!window.__GENVO8__.audio.noiseBuffer);

 const prepared=await page.evaluate(async()=>{
  const g=window.__GENVO8__,m=g.saveManager;await m.saveNow('recovery-proof');const db=await m.db(),slot=m.activeSlotId;
  const encode=x=>JSON.stringify(x,(_k,v)=>ArrayBuffer.isView(v)?Array.from(v):v),before=encode(await m.loadSnapshot());
  const reader=await m.openRegionalReader(slot,{capacity:1}),lease=await reader.acquire('active',reader.manifest.regionalPersistence.active.key),published=reader.beginStage();
  const publishedRef=await published.stage('active',lease.payload);await published.publish();lease.release();reader.close();
  if(encode(await m.loadSnapshot())!==before)throw Error('Published reference changed the complete saved state');
  const fresh=await m.openRegionalReader(slot,{capacity:1}),active=await fresh.acquire('active',fresh.manifest.regionalPersistence.active.key),live=fresh.beginStage(),candidate=await live.stage('active',active.payload);
  const legacyID=slot+'|active|'+candidate.key+'|legacy-unprotected',tx=db.transaction('regions','readwrite');tx.objectStore('regions').put({schema:1,slot,kind:'active',key:candidate.key,capture:'legacy-unprotected',payload:active.payload},legacyID);await new Promise((r,j)=>{tx.oncomplete=r;tx.onabort=()=>j(tx.error)});active.release();fresh.close();window.recoveryProof={live,before,slot,publishedRef,candidate,legacyID};
  return{slot,published:publishedRef.id,candidate:candidate.id,legacyID,before};
 });
 const observer=await context.newPage();observer.on('pageerror',e=>errors.push(e.message));await observer.goto('http://127.0.0.1:'+server.address().port+'/');await observer.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 const live=await observer.evaluate(async proof=>{const m=window.__GENVO8__.saveManager;await m.db();const inventory=await m.inspectRegionalStorage();if(m.regionalRecovery.deleted||m.regionalRecovery.live!==1||!inventory.unreferenced.some(e=>e.id===proof.candidate)||inventory.missing.length)throw Error('Another tab reclaimed an active stage');return m.regionalRecovery},prepared);
 // Closing the owner releases the browser lock without calling stage.abort().
 await page.close();await observer.waitForFunction(async()=>!(await navigator.locks.query()).held.some(lock=>lock.name.startsWith('genvo-regional-stage|')));
 const recovered=await observer.evaluate(async proof=>{
  const m=window.__GENVO8__.saveManager,db=await m.db(),{recoverRegionalStages}=await import('/src/persistence/regional-records.js');
  const remove=IDBObjectStore.prototype.delete;let failed=false;IDBObjectStore.prototype.delete=function(key){if(this.name==='regions')throw Error('Controlled recovery failure');return remove.call(this,key)};
  try{await recoverRegionalStages(db)}catch(error){failed=/Controlled recovery/.test(error.message)}finally{IDBObjectStore.prototype.delete=remove}
  const getKey=key=>new Promise((r,j)=>{const q=db.transaction('regions','readonly').objectStore('regions').getKey(key);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});
  if(!failed||await getKey(proof.candidate)!==proof.candidate||await getKey(proof.published)!==proof.published)throw Error('Failed cleanup preservation: '+JSON.stringify({failed,candidate:await getKey(proof.candidate),published:await getKey(proof.published),proof}));
  db.close();m.dbPromise=null;await m.db();const result=m.regionalRecovery,inventory=await m.inspectRegionalStorage();if(result.deleted!==1||result.live||inventory.missing.length||inventory.unreferenced.some(e=>e.id===proof.candidate)||!inventory.unreferenced.some(e=>e.id===proof.legacyID))throw Error('Startup failed to reclaim exactly the abandoned protected record');
  const encode=x=>JSON.stringify(x,(_k,v)=>ArrayBuffer.isView(v)?Array.from(v):v);const snapshot=await m.loadSnapshot(proof.slot);if(encode(snapshot)!==proof.before)throw Error('Recovery changed the complete saved checkpoint');
  const again=await recoverRegionalStages(await m.db());if(again.deleted||again.live)throw Error('Repeated recovery changed storage');
  Object.defineProperty(navigator,'locks',{value:undefined,configurable:true});let unsupported;try{unsupported=await recoverRegionalStages(await m.db())}finally{delete navigator.locks}if(!unsupported.unsupported||unsupported.deleted)throw Error('Unsupported lock fallback reclaimed records');
  return{...result,failureAtomic:failed,publishedPreserved:true,legacyRetained:true,idempotent:true,unsupportedSkipped:true,inventory:{records:inventory.records,referenced:inventory.referenced,unreferenced:inventory.unreferenced.length}};
 },prepared);
 // Compare against the independent serialized checkpoint retained in Node.
 // The published candidate used the exact original active payload; after
 // recovery, the full indexed load must still equal that same checkpoint.
 delete prepared.before;assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({prepared,live,recovered,errors,scope:'Actual native authored start, real indexed active record, published capture retention, live second-tab exclusion, owner-context close without abort, failed cleanup rollback, startup recovery, legacy retention and unsupported-lock fallback. No live eviction or seamless presentation claim.'},null,2));console.log('Regional stage recovery Chromium PASS: live-tab exclusion, owner-close recovery, failed cleanup atomicity, published/legacy retention, idempotence and unsupported fallback.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
