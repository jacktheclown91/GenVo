import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-regional-residency-browser.mjs <evidence dir> <exported build>
const output=path.resolve(process.argv[2]),root=path.resolve(process.argv[3]);fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{let previous=0;window.__admissionProof={frames:0,maxBetweenPaints:0,started:0};const sample=()=>{const started=window.__GENVO8__?.planetaryWork?.stats.started||0,proof=window.__admissionProof;proof.frames++;proof.maxBetweenPaints=Math.max(proof.maxBetweenPaints,started-previous);proof.started=started;previous=started;requestAnimationFrame(sample)};requestAnimationFrame(sample)});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill('PLANET-B0-A');await page.locator('#newWorldName').fill('Residency proof');await page.locator('#newWorldCreature').selectOption('starter-jump');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 // Real held-key crossings. The observer is explicitly placed on genuine,
 // anatomically accessible ground beside the frontier; energy is topped up.
 async function cross(direction){
  const from=await page.evaluate(async direction=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),{planetaryTravelAvailability}=await import('/src/world/planetary-travel.js'),{SPECIES}=await import('/src/organisms/species.js');
   p.energy=SPECIES[p.species].maxEnergy*.95;p.hydration=SPECIES[p.species].maxHydration*.95;const edge=direction==='east'?125.2:2.8;
   for(let y=10.5;y<118.5;y++){const physical=s.world.frontierRules==='regional-frontier/1'&&!s.travelFamilyGroup;p.x=physical?(direction==='east'?s.world.n:0):edge;p.y=y;const status=planetaryTravelAvailability(s);if(status.enabled&&status.direction===direction){let walkable=true;if(physical)for(let k=0;k<=16;k++){const x=edge+(p.x-edge)*k/16;if(!s.canOccupy(p,x,y)){walkable=false;break}}if(!walkable)continue;p.x=edge;g.renderer.motion.clear();g.renderer.cameraReady=false;return s.world.regionOrigin.x}}
   throw Error('No accessible '+direction+' frontier: '+planetaryTravelAvailability(s).reason)},direction);
  await page.evaluate(()=>{window.__GENVO8__.sim.paused=false});const key=direction==='east'?'d':'a';await page.keyboard.down(key);
  await page.waitForFunction(from=>window.__GENVO8__.sim.world.regionOrigin.x!==from,from,{timeout:90000});await page.keyboard.up(key);
  await page.evaluate(async()=>{await window.__GENVO8__.renderer.sceneReady();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))});
  return page.evaluate(()=>window.__GENVO8__.sim.world.regionOrigin.x);
 }
 const residency=()=>page.evaluate(()=>{const s=window.__GENVO8__.sim;return{at:s.world.regionOrigin.x,resident:s.planetaryTravel.sessions.map(x=>({key:x.key,mode:x.biologicalMode,parked:!!x.parked,debt:s.tickCount-x.snapshot.core.tickCount})).sort((a,b)=>a.key.localeCompare(b.key)),unloaded:(s.planetaryTravel.unloaded||[]).map(e=>e.key).sort(),last:window.__GENVO8__.regionalResidency.last}});
 const settled=keys=>page.waitForFunction(keys=>{const s=window.__GENVO8__.sim,u=(s.planetaryTravel.unloaded||[]).map(e=>e.key);return keys.every(k=>u.includes(k))},keys,{timeout:180000});
 const path1=[];for(let k=0;k<4;k++){path1.push(await cross('east'));await page.waitForTimeout(400)}
 assert.equal(path1.at(-1),512);
 await settled(['0,0','128,0']);const far=await residency();
 assert.deepEqual(far.resident.map(r=>r.key),['256,0','384,0'],'only the two-step neighbourhood stays in memory');
 const stored=await page.evaluate(async()=>{const g=window.__GENVO8__,m=g.saveManager,{readRegionalCheckpoint}=await import('/src/persistence/regional-records.js');const root=await readRegionalCheckpoint(await m.db(),m.activeSlotId,{manifestOnly:true});return root.regionalPersistence.entries.map(e=>({key:e.key,unloaded:!!e.unloaded,ids:e.life?.ids.length}))});
 for(const key of ['0,0','128,0'])assert.ok(stored.some(e=>e.key===key),'unloaded region '+key+' has a committed record');
 const unloadedIds=await page.evaluate(()=>window.__GENVO8__.sim.planetaryTravel.unloaded.map(e=>({key:e.key,ids:e.life.ids})));
 await page.screenshot({path:path.join(output,'far-east.png')});
 const outwardAdmission=await page.evaluate(()=>window.__admissionProof);
 // Native Save and Continue keep unloaded regions on disk.
 await page.keyboard.press('Escape');await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').click();await page.waitForFunction(()=>!window.__GENVO8__.saveManager.busy);
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const continued=await residency();
 assert.equal(continued.at,512);assert.deepEqual(continued.unloaded,['0,0','128,0'],'Continue loads only the resident neighbourhood');
 // Walking back: the runtime reloads the region a crossing needs, runs its
 // genuine elapsed ticks, then promotes it to individual simulation.
 await cross('west');await page.waitForFunction(()=>!(window.__GENVO8__.sim.planetaryTravel.unloaded||[]).some(e=>e.key==='128,0'),{}, {timeout:180000});
 const reloadedAt384=await residency();
 await page.waitForFunction(()=>{const s=window.__GENVO8__.sim,r=s.planetaryTravel.sessions.find(x=>x.key==='128,0');return r&&s.tickCount-r.snapshot.core.tickCount<=96},{}, {timeout:180000});
 await cross('west');const back=await residency();
 const r128=back.resident.find(r=>r.key==='128,0');assert.equal(r128.mode,'canonical-ticks/1');
 const ids=await page.evaluate(()=>{const s=window.__GENVO8__.sim.planetaryTravel.sessions.find(x=>x.key==='128,0');return s.snapshot.animals.map(a=>({id:a.id,parents:a.parentIds.length}))});
 const before=new Set(unloadedIds.find(e=>e.key==='128,0').ids);for(const a of ids)assert.ok(before.has(a.id)||a.parents===2,'every individual is a survivor or a real birth');
 await page.screenshot({path:path.join(output,'returned.png')});
 const returnAdmission=await page.evaluate(()=>window.__admissionProof);
 for(const proof of [outwardAdmission,returnAdmission]){assert.ok(proof.started>0);assert.ok(proof.frames>proof.started);assert.ok(proof.maxBetweenPaints<=1,'only one planetary background job between paints: '+JSON.stringify(proof))}
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({outwardAdmission,returnAdmission,path:path1,far,stored,continued,reloadedAt384,back,survivorsChecked:ids.length,errors,scope:'Exported build, native New World, held-key crossings with explicit frontier placement and energy top-up, the runtime residency driver against real IndexedDB, native Save/Continue and return. Not a natural journey or long-run ecology acceptance.'},null,2));
 console.log('Regional residency Chromium PASS: far regions unloaded to committed IndexedDB records, Continue keeps them on disk, return reloads and promotes with survivors or real births only.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
