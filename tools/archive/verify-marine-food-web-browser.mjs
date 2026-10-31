import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-marine-food-web-browser.mjs <evidence dir> <exported build>
const output=path.resolve(process.argv[2]),root=path.resolve(process.argv[3]);fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill('PLANET-B0-A');await page.locator('#newWorldName').fill('Marine proof');await page.locator('#newWorldCreature').selectOption('starter-jump');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const policy=await page.evaluate(()=>window.__GENVO8__.sim.marineFoodRules);assert.equal(policy,'marine-food-web/1','a native New World records the policy');
 // The coast lies hundreds of regions from the landing site, so this stage
 // builds that region with the exported modules, founds it through the real
 // founding authority, steps one day in the page, and shows it in the
 // renderer. The game's own simulation is paused and restored afterwards.
 const coast=await page.evaluate(async()=>{
  const g=window.__GENVO8__,home=g.sim;home.paused=true;
  const {Simulation}=await import('/src/sim/simulation.js'),{foundRegionalPopulations}=await import('/src/ecology/regional-founding.js'),{salinityAt}=await import('/src/world/environment.js'),{MARINE_KEYS}=await import('/src/ecology/marine-food.js'),{foundingTemplate}=await import('/src/organisms/founding-templates.js');
  const s=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:{x:-57600,y:-18176}});const r=foundRegionalPopulations(s,{region:'-57600,-18176'});
  const marine=r.introduced.filter(x=>foundingTemplate(x.template).habitat.salinity==='marine'),ids=new Set(marine.flatMap(x=>x.ids));
  const t=performance.now();for(let i=0;i<g.CFG.dayTicks;i++)s.update();const dayMs=performance.now()-t;
  const live=s.animals.filter(a=>a.alive&&ids.has(a.id)),inSea=live.filter(a=>s.world.water[s.world.idx(a.x,a.y)]&&salinityAt(s.world,s.world.idx(a.x,a.y))>.1);
  const totals=Object.fromEntries(MARINE_KEYS.map(k=>[k,+s.world.marineFood[k].reduce((a,b)=>a+b,0).toFixed(1)]));
  const focus=inSea.find(a=>a.foundingOrigin?.template==='plankton-sifter')||inSea[0];
  window.__marineStage={home,coast:s};g.renderer.sim=s;g.renderer.beginScenePreparation();g.renderer.cameraReady=true;g.renderer.camera.x=focus.x;g.renderer.camera.y=focus.y;g.renderer.zoom=4;
  return{groups:marine.map(x=>x.template+':'+x.supportable),founders:ids.size,live:live.length,inSea:inSea.length,totals,dayMs:Math.round(dayMs),focus:{template:focus.foundingOrigin?.template,x:focus.x,y:focus.y,parts:focus.bodyPlan.nodes.map(n=>n.partId)}};
 });
 assert.ok(coast.groups.length>=2,'marine groups founded');assert.equal(coast.live,coast.founders,'every marine founder alive after a day');assert.equal(coast.inSea,coast.live,'and in seawater');assert.ok(coast.focus.parts.includes('salt-gland'));
 for(const v of Object.values(coast.totals))assert.ok(v>0);
 await page.waitForTimeout(1500);await page.screenshot({path:path.join(output,'coast-sifters.png')});
 const art=await page.evaluate(()=>{const st=window.__GENVO8__.nativeArtStatus();return{errors:st.errors,loaded:st.loaded??st.ready??null}});
 // Return the game to its own world and confirm the policy persists.
 await page.evaluate(()=>{const g=window.__GENVO8__,{home}=window.__marineStage;g.renderer.sim=home;g.renderer.beginScenePreparation();g.renderer.cameraReady=false;home.paused=false});
 await page.keyboard.press('Escape');await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').click();await page.waitForFunction(()=>!window.__GENVO8__.saveManager.busy);
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);
 const after=await page.evaluate(()=>{const s=window.__GENVO8__.sim;return{policy:s.marineFoodRules,fields:!!s.world.marineFood}});
 assert.deepEqual(after,{policy:'marine-food-web/1',fields:true});assert.deepEqual(art.errors,[]);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({policy,coast,art,after,errors,scope:'Exported build. Native New World records the policy and persists it through Save/Continue. The coastal region (-57600,-18176) is staged in the page with the exported modules and the real founding authority, stepped one day and rendered; it is not reached by travel.'},null,2));
 console.log('Marine food web Chromium PASS: '+coast.groups.join(' ')+' founded on the coast, all '+coast.live+' alive in seawater after a page day ('+coast.dayMs+' ms), marine tiers present, rendered, no art or page errors, policy through Save/Continue.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
