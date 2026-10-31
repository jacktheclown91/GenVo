const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]||'docs/daylight-2026-10-29/flight-observation');if(fs.existsSync(out))throw Error('Use a fresh directory');fs.mkdirSync(out,{recursive:true});
 const receipt={errors:[],phases:[],creatorAcceptance:false};let reviewPage=null;
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://local'),f=path.resolve(root,'..'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();if(u.pathname==='/src/render/daylight.js')b=Buffer.from(b.toString('utf8').replace('export function drawDaylight(renderer){','export function drawDaylight(renderer){if(globalThis.__skyBefore)return false;'));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.gz':'application/gzip'})[path.extname(f)]||'application/octet-stream');res.end(b)});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});reviewPage=page;page.on('pageerror',e=>receipt.errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.__GENVO8__?.saveManager);
  await page.getByRole('button',{name:'New World',exact:true}).click();await page.locator('#newWorldSeed').fill('DIURNAL-PRESENTATION');await page.locator('#newWorldCreature').selectOption('starter-flight');await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#frontEnd').hidden,null,{timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
  for(let i=0;i<8;i++){if(!await page.evaluate(()=>{const t=window.__GENVO8__.tutorial;return t.worldInputBlocked()&&['welcome','briefing'].includes(t.stage)}))break;await page.keyboard.press('Enter')}
  if(!await page.evaluate(()=>window.__GENVO8__.sim.player().airborne))await page.keyboard.press('6');await page.waitForFunction(()=>window.__GENVO8__.sim.player().airborne);
  await page.evaluate(async()=>{const {daylightPresentation}=await import('/src/render/daylight.js');window.__skyPhase=()=>daylightPresentation(window.__GENVO8__.sim)});
  for(const [name,target] of [['night',.02],['dawn',.265],['noon',.5],['dusk',.735],['late-night',.86]]){
   await page.waitForFunction(({t,wide})=>{const f=window.__skyPhase()?.timeOfDay;return f>=t&&f<t+(wide ? .20 : .07)},{t:target,wide:name==='night'},{timeout:30000});
   await page.screenshot({path:path.join(out,name+'-interface.png')});
   await page.keyboard.press('p');await page.waitForFunction(()=>window.__GENVO8__.sim.paused);
   await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained},null,{timeout:20000});
   const result=await page.evaluate(async()=>{
    const g=window.__GENVO8__,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'native-daylight'}))),before=snapshot(),images={},timings=[];
    for(const old of [true,false]){globalThis.__skyBefore=old;g.renderer.render();images[old?'before':'current']=g.renderer.canvas.toDataURL();const times=[];for(let i=0;i<12;i++){const t=performance.now();g.renderer.render();if(i>=4)times.push(performance.now()-t)}times.sort((a,b)=>a-b);timings.push({old,medianMs:times[4],maxMs:times[7],samples:8});}
    globalThis.__skyBefore=false;if(snapshot()!==before)throw Error('Lighting changed saved state');
    return {images,timings,phase:window.__skyPhase(),tick:g.sim.tickCount,day:g.sim.day,clock:document.querySelector('#clock').textContent,stateExact:true};
   });
   for(const [label,data] of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'-'+label+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
   receipt.phases.push({name,...result});console.log(name+' captured at tick '+result.tick);await page.locator('.menu-view[data-screen="pause"] [data-action="resume"]').click();await page.waitForFunction(()=>!window.__GENVO8__.sim.paused);
  }
  assert.ok(receipt.phases.some(p=>p.phase.night)&&receipt.phases.some(p=>p.phase.daylight>.95));
  assert.ok(receipt.phases.every(p=>p.phase.policy==='diurnal-temperature/1'&&p.stateExact));
  await page.keyboard.press('p');await page.waitForFunction(()=>window.__GENVO8__.sim.paused);
  const legacy=await browser.newPage({viewport:{width:1280,height:800}});legacy.on('pageerror',e=>receipt.errors.push(e.message));await legacy.goto('http://127.0.0.1:'+server.address().port+'/');await legacy.waitForFunction(()=>window.__GENVO8__?.saveManager);
  await legacy.getByRole('button',{name:'New World',exact:true}).click();await legacy.locator('#newWorldStartingPoint').selectOption('catalog:mature-valley-d100');await legacy.getByRole('button',{name:'Begin World',exact:true}).click();await legacy.waitForFunction(()=>document.querySelector('#frontEnd').hidden&&window.__GENVO8__.sim.day>=100,null,{timeout:60000});await legacy.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
  receipt.legacy=await legacy.evaluate(async()=>{const g=window.__GENVO8__,{daylightPresentation}=await import('/src/render/daylight.js');return {policy:g.sim.diurnalRules||null,presentation:daylightPresentation(g.sim),phaseLabels:document.querySelectorAll('#clock .day-phase').length}});
  assert.equal(receipt.legacy.policy,null);assert.equal(receipt.legacy.presentation,null);assert.equal(receipt.legacy.phaseLabels,0);
  await legacy.screenshot({path:path.join(out,'recorded-legacy-interface.png')});
  assert.deepEqual(receipt.errors,[]);receipt.status='PASS';receipt.scope='Actual public Winged flier start/6 takeoff, natural clock progression and public pause/resume, matched-state color treatment at night/dawn/noon/dusk/night, exact full saved-state comparisons. No tick, climate, position, anatomy or event injection. Actual recorded mature world retains neutral legacy presentation. Short CPU render observations, not full performance acceptance.';
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log('Daylight native PASS: actual full clock progression, five matched-state color phases, compact clock labels, recorded-world neutrality and exact biological state.');
 }catch(e){if(reviewPage){receipt.diagnostic=await reviewPage.evaluate(()=>{const g=window.__GENVO8__,p=g?.sim.player();return {tick:g?.sim.tickCount,paused:g?.sim.paused,alive:p?.alive,health:p?.health,energy:p?.energy,stage:g?.tutorial.stage,blocked:g?.tutorial.worldInputBlocked(),frontHidden:document.querySelector('#frontEnd')?.hidden,body:document.body.innerText.slice(-1800)}}).catch(()=>null);await reviewPage.screenshot({path:path.join(out,'failure-interface.png')}).catch(()=>{});}receipt.failure=e.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(receipt,null,2));throw e}finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
