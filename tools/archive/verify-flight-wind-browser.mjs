// Automated controlled-anatomy fixture in the actual game. Not human play,
// natural evolution, or permission to edit a living creature in lineage mode.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;
try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=process.argv[2];assert.ok(output&&!fs.existsSync(output),'fresh evidence folder required');fs.mkdirSync(output,{recursive:true});
const root=process.cwd(),mime={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data)});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?skipTutorial=1');
 await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 await page.locator('#newWorldSeed').fill('FLIGHT-WIND-BROWSER');
 await page.locator('#newWorldGeography').selectOption('planetary/1');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd').hidden);
 await page.evaluate(async()=>{
  const g=window.__GENVO8__,p=g.sim.player(),{founderPlan}=await import('/src/lineage/body-inheritance.js'),
   {createDraft,place,draftProblems}=await import('/src/lineage/evolution-draft.js'),{SPECIES}=await import('/src/organisms/species.js');
  let d=createDraft({base:founderPlan(),ancestry:[],budget:8});
  for(const id of ['filament-tuft','feather-mantle','proto-wing','flight-wing']){
   d=createDraft({base:d.plan,ancestry:[...d.ancestry],budget:8});
   const r=place(d,id,'root','dorsal');if(!r.ok||draftProblems(d).length)throw Error('Invalid controlled anatomy fixture '+id);
  }
  p.bodyPlan=d.plan;p.age=SPECIES[p.species].maturity+1;p.energy=100;p.health=100;
 });
 const flight=page.locator('[data-command="flight"]');
 await flight.waitFor({state:'visible'});
 await page.waitForFunction(()=>!document.querySelector('[data-command="flight"]').disabled);
 assert.match(await flight.getAttribute('title'),/Wind toward/);
 await flight.click();
 await page.waitForFunction(()=>window.__GENVO8__.sim.player().airborne);
 await page.keyboard.press('ArrowRight',{delay:300});
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=true;window.__GENVO8__.renderer.render()});
 await page.screenshot({path:path.join(output,'wind-aware-flight.png')});
 const report=await page.evaluate(async()=>{
  const g=window.__GENVO8__,p=g.sim.player(),{flightWindReading}=await import('/src/lineage/flight-wind.js'),
   {movementProfile}=await import('/src/lineage/lifestyle.js'),{restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js');
  const wind=flightWindReading(p,g.sim.world),options={toX:p.x+1,toY:p.y},profile=movementProfile(p,g.sim.world,options);
  await g.saveManager.saveNow('flight-wind-browser');const saved=await g.saveManager.loadSnapshot(),restored=restoreSimulationSnapshot(saved);
  return{scope:'Automated controlled viable wing-body fixture, ordinary New World and takeoff button, keyboard movement, actual renderer and IndexedDB. Not naturally evolved anatomy or human play.',
   policy:g.sim.world.environment.flightWindPolicy,airborne:p.airborne,energy:p.energy,wind,
   restoredAirborne:restored.player().airborne,exactRestoredMovement:JSON.stringify(profile)===JSON.stringify(movementProfile(restored.player(),restored.world,options)),
   tooltip:document.querySelector('[data-command="flight"]').title,sceneShown:g.renderer.sceneShown};
 });
 assert.ok(report.airborne&&report.restoredAirborne&&report.exactRestoredMovement&&report.sceneShown);
 assert.ok(report.energy<94,'takeoff, movement and flight must consume existing energy');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'review.json'),JSON.stringify({...report,pageErrors:errors},null,2));
 console.log('Real Chromium wind-aware flight, action feedback, rendered cue and midflight IndexedDB continuity PASS',JSON.stringify(report));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
