import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-regional-dispersal-browser.mjs <evidence dir> <exported build>
const output=path.resolve(process.argv[2]),root=path.resolve(process.argv[3]);fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill('PLANET-B0-A');await page.locator('#newWorldName').fill('Residency proof');await page.locator('#newWorldCreature').selectOption('starter-jump');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 // Real held-key crossings. The observer is explicitly placed on genuine,
 // anatomically accessible ground beside the frontier; energy is topped up.
 async function cross(direction){
  const from=await page.evaluate(async direction=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),{planetaryTravelAvailability}=await import('/src/world/planetary-travel.js'),{SPECIES}=await import('/src/organisms/species.js');
   p.energy=SPECIES[p.species].maxEnergy*.95;p.hydration=SPECIES[p.species].maxHydration*.95;const edge=direction==='east'?125.2:2.8;
   for(let y=10.5;y<118.5;y++){p.x=edge;p.y=y;const status=planetaryTravelAvailability(s);if(status.enabled&&status.direction===direction){g.renderer.motion.clear();g.renderer.cameraReady=false;return s.world.regionOrigin.x}}
   throw Error('No accessible '+direction+' frontier: '+planetaryTravelAvailability(s).reason)},direction);
  await page.evaluate(()=>{window.__GENVO8__.sim.paused=false});const key=direction==='east'?'d':'a';await page.keyboard.down(key);
  await page.waitForFunction(from=>window.__GENVO8__.sim.world.regionOrigin.x!==from,from,{timeout:90000});await page.keyboard.up(key);
  return page.evaluate(()=>window.__GENVO8__.sim.world.regionOrigin.x);
 }
 for(let k=0;k<2;k++)await cross('east');
 await page.evaluate(()=>{const g=window.__GENVO8__;g.sim.paused=false;g.sim.player().energy=999});
 // Real time: wait for refused breeders to cross a border naturally.
 const started=Date.now();let log=[];
 while(Date.now()-started<180000){await page.waitForTimeout(5000);log=await page.evaluate(async()=>{const s=window.__GENVO8__.sim,{validatePlanetAnimalOwnership}=await import('/src/world/planet-regions.js');validatePlanetAnimalOwnership(s.animals,s.planetaryTravel);return s.planetaryTravel.dispersalLog||[]});if(log.length)break}
 assert.ok(log.length>0,'no natural crossing within three minutes');
 const day=await page.evaluate(()=>window.__GENVO8__.sim.day);
 await page.keyboard.press('Escape');await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').click();await page.waitForFunction(()=>!window.__GENVO8__.saveManager.busy);
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);
 const after=await page.evaluate(()=>{const s=window.__GENVO8__.sim,ids=new Set((s.planetaryTravel.dispersalLog||[]).map(m=>m.id));const owners=[...s.animals,...s.planetaryTravel.sessions.flatMap(x=>x.snapshot.animals),...(s.planetaryTravel.unloaded||[]).flatMap(e=>e.life.ids.map(id=>({id,dispersalHistory:[{}]})))];return{log:(s.planetaryTravel.dispersalLog||[]).length,withHistory:owners.filter(a=>ids.has(a.id)&&a.dispersalHistory?.length).length}});
 assert.ok(after.log>=log.length);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({log,day,after,errors,scope:'Exported build, native New World, two held-key crossings, unpaused real-time play; natural crossings by wildlife and Save/Continue. Not a long-run ecological claim.'},null,2));
 console.log('Regional dispersal Chromium PASS: '+log.length+' natural wildlife crossing(s) by day '+day+', ownership valid each check, persisted through Save/Continue.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
