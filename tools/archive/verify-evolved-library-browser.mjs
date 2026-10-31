import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-evolved-library-browser.mjs <evidence dir> <exported build>
const output=path.resolve(process.argv[2]),root=path.resolve(process.argv[3]);fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 // Seed the shared library database with a structurally valid entry built
 // from a real founded body changed by the ordinary mutation operator.
 const seeded=await page.evaluate(async()=>{
  const m=window.__GENVO8__.saveManager,{Simulation}=await import('/src/sim/simulation.js'),{foundRegionalPopulations}=await import('/src/ecology/regional-founding.js'),lib=await import('/src/lineage/evolved-library.js'),{mutatePlan}=await import('/src/lineage/body-inheritance.js'),{RNG}=await import('/src/core/rng.js');
  const s=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:{x:128,y:0}});foundRegionalPopulations(s,{region:'128,0'});
  const cohort=s.animals.filter(a=>a.foundingOrigin?.template==='hopper');const rng=new RNG('lib');let plan=cohort[0].bodyPlan;for(let k=0;k<50&&lib.authoredConfigurations().has('mosskip|'+plan.id);k++)plan=mutatePlan(rng,cohort[0].bodyPlan);for(const a of cohort)a.bodyPlan=plan;
  s.evolvedRegistrations=[lib.entryFromCohort(s,cohort)];const added=await m.recordEvolvedRegistrations(s);const list=await m.listEvolvedLibrary();return{added,ids:list.map(e=>e.id)};
 });
 assert.equal(seeded.added,1);assert.equal(seeded.ids.length,1);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill('PLANET-B0-A');await page.locator('#newWorldName').fill('Library world');await page.locator('#newWorldCreature').selectOption('starter-jump');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const frozen=await page.evaluate(()=>{const s=window.__GENVO8__.sim;return{policy:s.evolvedLibraryRules,ids:(s.foundingLibrary||[]).map(e=>e.id),sightings:(s.foundingLibrary||[]).some(e=>'sightings' in e)}});
 assert.deepEqual(frozen.ids,seeded.ids,'a new world freezes its copy of the living library');assert.equal(frozen.sightings,false);
 await page.keyboard.press('Escape');await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').click();await page.waitForFunction(()=>!window.__GENVO8__.saveManager.busy);
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);
 const after=await page.evaluate(async()=>{const s=window.__GENVO8__.sim,db=await window.__GENVO8__.saveManager.db();return{ids:(s.foundingLibrary||[]).map(e=>e.id),savesVersion:db.version}});
 assert.deepEqual(after.ids,seeded.ids,'the frozen copy persists with the world');assert.equal(after.savesVersion,2,'the saves database needs no migration');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({seeded,frozen,after,errors,scope:'Storage and world-creation path with a structurally valid seeded entry; registration evidence is covered by tests/evolved-library.mjs.'},null,2));
 console.log('Evolved library Chromium PASS: shared library database, new-world frozen copy, Save/Continue persistence, saves database unchanged.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
