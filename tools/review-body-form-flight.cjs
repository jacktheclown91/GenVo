const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const root=process.cwd(),out=path.resolve(process.argv[2]||'docs/body-form-detail-2026-10-29/flight');if(fs.existsSync(out))throw Error('Use a fresh evidence directory');fs.mkdirSync(out,{recursive:true});const receipt={errors:[],layouts:[],creatorAcceptance:false};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local'),f=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'})[path.extname(f)]||'application/octet-stream');res.end(b)})});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{const page=await browser.newPage({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});page.on('pageerror',e=>receipt.errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__GENVO8__?.audio);


await page.getByRole('button',{name:'New World',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#newWorldStartCards [data-start]').length>1);if(await page.locator('#newWorldAdvanced').getAttribute('open')===null)await page.locator('#newWorldAdvanced summary').click();await page.locator('#newWorldSeed').fill('LIGHT-BODY-DETAIL');await page.locator('#newWorldCreature').selectOption('starter-flight');await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#frontEnd').hidden&&window.__GENVO8__.sim.seed==='LIGHT-BODY-DETAIL',null,{timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());for(let i=0;i<8;i++){if(!await page.evaluate(()=>{const t=window.__GENVO8__.tutorial;return t.worldInputBlocked()&&['welcome','briefing'].includes(t.stage)}))break;await page.keyboard.press('Enter')}

await page.evaluate(async()=>{
 const {loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{setPartArtPreview}=await import('/src/render/runtime-part-art.js');
 const map=(await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:64})).parts;
 setPartArtPreview(map);
});
if(!await page.evaluate(()=>window.__GENVO8__.sim.player().airborne))await page.keyboard.press('6');
await page.waitForFunction(()=>window.__GENVO8__.sim.player().airborne);
await page.keyboard.down('ArrowRight');await page.waitForTimeout(1200);await page.keyboard.up('ArrowRight');
await page.screenshot({path:path.join(out,'actual-powered-flight64.png')});
await page.keyboard.press('p');await page.waitForFunction(()=>window.__GENVO8__.sim.paused);
await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained},null,{timeout:20000});
const comparison=await page.evaluate(async()=>{
 const g=window.__GENVO8__,{loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{setPartArtPreview}=await import('/src/render/runtime-part-art.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js'),{organismStudy}=await import('/src/render/organism-study.js');
 const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'detailed-wing-native'}))),before=snapshot(),images={},timings=[];
 for(const resolution of [64,128]){
  const current=(await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution})).parts,prior=new Map(current);
  prior.delete('light-torso');
  for(const [label,map] of [['before',prior],['current',current]]){
   setPartArtPreview(map);g.renderer.render();images[label+'-'+resolution]=g.renderer.canvas.toDataURL();
   const ms=[];for(let i=0;i<14;i++){const t=performance.now();g.renderer.render();if(i>=4)ms.push(performance.now()-t)}ms.sort((a,b)=>a-b);
   timings.push({label,resolution,medianMs:ms[5],p90Ms:ms[9],samples:10});
  }
 }
 const r=g.renderer,oldZoom=r.zoom;r.zoom=6;r.resetWorldCaches();r.beginScenePreparation();await r.sceneReady();
 const closeMap=(await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:128})).parts,closePrior=new Map(closeMap);closePrior.delete('light-torso');
 for(const [label,map] of [['before',closePrior],['current',closeMap]]){setPartArtPreview(map);r.render();images[label+'-flight-closeup128']=r.canvas.toDataURL();}
 r.zoom=oldZoom;r.resetWorldCaches();r.beginScenePreparation();await r.sceneReady();
 if(snapshot()!==before)throw Error('Wing artwork changed saved state');
 const p=g.sim.player();return {images,timings,stateExact:true,airborne:p.airborne,mode:p.aerialMode||null,study:organismStudy(p,{seed:g.sim.seed,day:g.sim.day}),aerial:g.renderer.aerialPresentation?.states.get(p.id)?.last};
});
for(const [name,data] of Object.entries(comparison.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete comparison.images;
assert.equal(comparison.airborne,true);assert.equal(comparison.stateExact,true);
await page.keyboard.press('p');await page.keyboard.press('6');await page.waitForFunction(()=>!window.__GENVO8__.sim.player().airborne);
await page.waitForTimeout(350);await page.screenshot({path:path.join(out,'actual-landed.png')});
const lab=await browser.newPage({viewport:{width:1440,height:1000}});lab.on('pageerror',e=>receipt.errors.push(e.message));
await lab.goto('http://127.0.0.1:'+server.address().port+'/tools/creature-lab/index.html');await lab.waitForFunction(()=>window.__GENVO_LAB_ASSEMBLY__);
await lab.locator('#importAssembly').setInputFiles({name:'actual-flier.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(comparison.study))});
await lab.waitForFunction(()=>!!window.__GENVO_LAB_ASSEMBLY__.study);
await lab.locator('#showAssemblyGuides').uncheck();await lab.locator('#previewAction').selectOption('idle');
const facings=[];
for(const resolution of ['64','128']){
 await lab.locator('#assemblyArtResolution').selectOption(resolution);await lab.waitForFunction(r=>document.querySelector('#assemblyArtStatus').textContent.includes(r+'px'),resolution);
 for(let dir=0;dir<8;dir++){
  await lab.locator('#previewDirection').selectOption(String(dir));
  const reading=await lab.evaluate(()=>({plan:window.__GENVO_LAB_ASSEMBLY__.plan.id,study:window.__GENVO_LAB_ASSEMBLY__.study.animal.id}));
  assert.equal(reading.plan,comparison.study.animal.bodyPlan.id);facings.push({resolution,dir,...reading});
  if(dir===2)await lab.locator('#creaturePreview').screenshot({path:path.join(out,'lab-rest-'+resolution+'.png')});
 }
}
await lab.screenshot({path:path.join(out,'lab-rest-context.png')});await lab.close();
assert.deepEqual(receipt.errors,[]);receipt.comparison=comparison;receipt.facings=facings;
receipt.scope='Public winged-flier start, real6 takeoff/landing and keyboard flight; same-state airborne gameplay before/current isolated to light-torso detail, plus actual organism study in Lab resting preview/all8 directions. Lab rest is not a biological takeoff claim. Enlarged airborne capture uses6x viewing zoom and the real paused flight pose. No mass/position/anatomy/energy/airborne injection; native32 and canonical state retained. Short CPU render observations, not mature-world acceptance.';
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));await page.close();
console.log('Detailed flying torso native PASS: actual supported takeoff/landing, fixed-state before/current64/128 flight, public real-study Lab rest/all8 directions, canonical graph exact.');
}catch(e){receipt.failure=e.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(receipt,null,2));throw e}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
