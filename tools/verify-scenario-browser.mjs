// Focused real Chromium acceptance for the bundled evolved-world start.
// Runs the actual New World menu, gzip fetch, canonical restore, renderer,
// independent IndexedDB world slot, and screenshot evidence.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright')}
catch{playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=process.argv[2]||'docs/test-runs/scenario-browser-ci';
const scenarioId=process.argv[3]||'established-valley-d30';
const residentMode=process.argv.includes('--resident');
const founderMode=process.argv.includes('--founder-guided')?'guided':process.argv.includes('--founder-sandbox')?'sandbox':null;
// An optional static web root exercises the delivered build, including
// fetch-loaded scenario assets, rather than accidentally using source files.
const root=path.resolve(process.argv[4]||process.cwd());
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/scenarios/catalog.json'),'utf8')).scenarios;
const scenario=catalog.find(row=>row.id===scenarioId);
assert.ok(scenario?.playable,'Only genuine playable curated scenarios may enter the browser quick-start check.');
assert.ok(Number.isSafeInteger(scenario.day)&&scenario.liveAnimals>0&&Number.isSafeInteger(scenario.continuedFrom?.toTick??1440));
fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css',
 '.png':'image/png','.svg':'image/svg+xml','.gz':'application/gzip','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
 fs.readFile(target,(err,body)=>{
  if(err){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
  res.end(body);
 });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await playwright.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:760}});
 const errors=[],missingAssets=[];page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))missingAssets.push({url:response.url(),status:response.status()})});
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 const select=page.locator('#newWorldStartingPoint');
 await page.waitForFunction(id=>Array.from(document.querySelector('#newWorldStartingPoint')?.options||[])
  .some(option=>option.value==='catalog:'+id),scenarioId);
 await page.screenshot({path:path.join(output,'advanced-start-menu.png')});
 await select.selectOption('catalog:'+scenarioId);
 if(residentMode)await page.locator('#newWorldCreature').selectOption('resident');
 if(founderMode)await page.locator('#newWorldCreature').selectOption(founderMode);
 await page.locator('#newWorldName').fill('Verified '+scenario.label+' Fork');
 assert.equal(await page.locator('#newWorldSeed').isDisabled(),true,
  'saved scenario ancestry cannot be relabeled as a different seed');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 let chosenResident=null,cancelPreservedSlots=null;
 if(residentMode){
  await page.locator('#residentStart').waitFor({state:'visible',timeout:120000});
  const slotsBefore=await page.evaluate(async()=> (await window.__GENVO8__.saveManager.listWorlds()).length);
  await page.locator('#residentStart button').filter({hasText:'Cancel'}).click();
  await page.waitForFunction(()=>!document.querySelector('#residentStart'));
  cancelPreservedSlots=await page.evaluate(async count=>(await window.__GENVO8__.saveManager.listWorlds()).length===count,slotsBefore);
  assert.ok(cancelPreservedSlots,'cancelling must not allocate an orphan world slot');
  await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
  await page.locator('#residentStart').waitFor({state:'visible',timeout:120000});
  const values=await page.locator('#residentStart select option').evaluateAll(options=>options.map(o=>o.value));
  assert.ok(values.length>1,'real evolved ecology offers several residents');
  chosenResident=Number(values[1]);
  await page.locator('#residentStart select').selectOption(String(chosenResident));
  await page.screenshot({path:path.join(output,'resident-chooser.png')});
  await page.locator('#residentStart button').filter({hasText:'Begin as this creature'}).click();
 }
 if(founderMode){
  const editor=page.locator('#founderEditor');await editor.waitFor({state:'visible',timeout:120000});
  const slotsBefore=await page.evaluate(async()=> (await window.__GENVO8__.saveManager.listWorlds()).length);
  await editor.locator('[data-act="cancel"]').click();
  await page.waitForFunction(()=>!document.querySelector('#founderEditor'));
  cancelPreservedSlots=await page.evaluate(async count=>(await window.__GENVO8__.saveManager.listWorlds()).length===count,slotsBefore);
  assert.ok(cancelPreservedSlots,'cancelling custom creation must leave save slots untouched');
  await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
  await editor.waitFor({state:'visible',timeout:120000});
  await editor.locator('[data-tray="back"]').click();
  const attach=async id=>{await editor.locator('[data-part="'+id+'"]').click();await editor.getByRole('button',{name:'Attach to back',exact:true}).click();};
  if(founderMode==='guided'){
   await attach('filament-tuft');
   await editor.locator('[data-act="design-step"]').click();
   await attach('feather-mantle');
  }else await attach('flight-wing');
  const downloading=page.waitForEvent('download');await editor.locator('[data-act="export-design"]').click();
  const download=await downloading,designFile=path.resolve(output,'authored-creature.json');await download.saveAs(designFile);
  assert.equal(JSON.parse(fs.readFileSync(designFile,'utf8')).design.mode,founderMode);
  const choosing=page.waitForEvent('filechooser');await editor.locator('[data-act="import-design"]').click();
  await (await choosing).setFiles(designFile);
  await page.waitForFunction(()=>document.querySelector('#founderEditor .ed-message')?.textContent.includes('design restored'));
  await page.screenshot({path:path.join(output,'authored-founder-editor.png')});
  await editor.locator('[data-act="commit"]').click();
  await editor.locator('[data-act="commit"]').click();
 }
 await page.waitForFunction(({seed,day})=>window.__GENVO8__?.sim?.seed===seed
  &&window.__GENVO8__.sim.day===day
  &&window.__GENVO8__.sim.player()?.alive,{seed:scenario.seed,day:scenario.day},{timeout:120000});
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden===true,
  {},{timeout:120000});
 await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 await page.waitForFunction(async()=>{
  try{
   const data=await window.__GENVO8__?.saveManager?.loadSnapshot();
   return data?.seed===window.__GENVO8__?.sim?.seed &&
     data?.core?.day===window.__GENVO8__?.sim?.day;
  }catch{return false;}
 },{},{timeout:120000});
 await page.evaluate(tick=>{window.__expectedScenarioTick=tick;},scenario.continuedFrom?.toTick??1440);
 await page.screenshot({path:path.join(output,'advanced-world-playable.png')});
 const report=await page.evaluate(async()=>{
  const g=window.__GENVO8__,world=g.sim.world,stored=await g.saveManager.loadSnapshot();
  return {
   seed:g.sim.seed,day:g.sim.day,tickCount:g.sim.tickCount,year:g.sim.year,
   liveAnimals:g.sim.animals.filter(a=>a.alive).length,
   playerAlive:!!g.sim.player()?.alive,playerId:g.sim.playerId,storedPlayerId:stored?.core?.playerId,playerSpecies:g.sim.player()?.species,creatureStart:g.sim.creatureStart||null,
   authoredIntroductions:g.sim.authoredIntroductions||null,playerParts:g.sim.player()?.bodyPlan?.nodes?.map(n=>n.partId),worldGenerator:world.generator,
   sourceDay:stored?.core?.day??null,sourceSeed:stored?.seed??null,
   storedPresent:!!stored,lastSavedTick:g.saveManager.lastSavedTick,
   saveBusy:g.saveManager.busy,sceneShown:g.renderer.sceneShown,
   scenePending:g.renderer.scenePending,
   saveStatus:document.querySelector('#saveStatus')?.textContent,
   newSlot:g.saveManager.activeSlotId,
   screenClosed:document.querySelector('#frontEnd').hidden,
   originalHistoryRetained:(stored?.core?.tickCount??0)>=(window.__expectedScenarioTick??1440)
  };
 });
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...report,errors},null,2));
 assert.ok(report.sceneShown,'evolved-world renderer has not displayed a complete frame');
 assert.ok(report.storedPresent,'advanced-world source fork was not persisted: '+JSON.stringify(report));
 assert.equal(report.seed,scenario.seed);
 assert.equal(report.worldGenerator,'planetary/1');
 assert.ok(report.liveAnimals>0&&report.playerAlive);
 assert.equal(report.sourceDay,scenario.day);
 assert.ok(report.newSlot.startsWith('world-'));
 assert.ok(report.originalHistoryRetained);
 if(residentMode){assert.equal(report.playerId,chosenResident);assert.equal(report.storedPlayerId,chosenResident);assert.equal(report.creatureStart?.actorId,chosenResident);assert.equal(report.creatureStart?.kind,'existing-resident');}
 if(founderMode){assert.equal(report.creatureStart?.kind,'authored-founder');assert.equal(report.creatureStart.mode,founderMode);assert.equal(report.creatureStart.generation,1);assert.ok(report.authoredIntroductions?.at(-1)?.actors?.length===2);assert.ok(report.playerParts.includes(founderMode==='guided'?'feather-mantle':'flight-wing'));assert.equal(report.storedPlayerId,report.playerId);}
 let browserReload=null;
 if(founderMode==='sandbox'){
  await page.locator('[data-command="flight"]').click();
  await page.waitForFunction(()=>window.__GENVO8__.sim.player()?.airborne);
  await page.screenshot({path:path.join(output,'authored-wing-flight.png')});
 }
 if(await page.locator('#startGame').isVisible()){await page.locator('#startGame').click();await page.waitForFunction(()=>!window.__GENVO8__.tutorial.worldInputBlocked());}
 // Every advanced-world path must survive actual native Save and Continue,
 // including recorded historical worlds rather than only authored founders.
 await page.keyboard.press('Escape');
 await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').click();
 await page.waitForFunction(()=>document.querySelector('#menuMessage')?.textContent==='World saved.',{}, {timeout:120000});
 const expectedReload=await page.evaluate(()=>{const s=window.__GENVO8__.sim;return{seed:s.seed,day:s.day,tick:s.tickCount,rng:s.rng.state,playerId:s.playerId,marinePolicy:s.marineFoodRules??null,marineFields:!!s.world.marineFood,population:s.animals.filter(a=>a.alive).length}});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();
 await page.waitForFunction(id=>window.__GENVO8__?.sim?.playerId===id&&document.querySelector('#frontEnd')?.hidden,report.playerId,{timeout:120000});
 await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 browserReload=await page.evaluate(()=>{const s=window.__GENVO8__.sim;return{seed:s.seed,day:s.day,tick:s.tickCount,rng:s.rng.state,playerId:s.playerId,marinePolicy:s.marineFoodRules??null,marineFields:!!s.world.marineFood,population:s.animals.filter(a=>a.alive).length,mode:s.creatureStart?.mode??null,receipts:s.authoredIntroductions?.length??0,airborne:!!s.player()?.airborne}});
 for(const key of Object.keys(expectedReload))assert.deepEqual(browserReload[key],expectedReload[key],'native Continue preserves '+key);
 if(founderMode){assert.equal(browserReload.mode,founderMode);assert.ok(browserReload.receipts>0)}
 if(founderMode==='sandbox')assert.ok(browserReload.airborne,'authored wings and midflight state survive actual browser reload');
 await page.screenshot({path:path.join(output,founderMode?'authored-world-restored.png':'advanced-world-restored.png')});
 assert.deepEqual(errors,[],'browser encountered a fatal gameplay script error');assert.deepEqual(missingAssets,[],'No requested runtime asset may be missing');
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({ok:true,servedRoot:root,residentMode,founderMode,cancelPreservedSlots,browserReload,missingAssets,...report,errors},null,2));
 console.log('Bundled '+scenario.label+' '+(founderMode?'authored '+founderMode+' founder':residentMode?'existing resident':'recorded lineage')+' start and saved browser fork PASS',JSON.stringify({seed:report.seed,day:report.day,playerId:report.playerId,storedPlayerId:report.storedPlayerId,kind:report.creatureStart?.kind||'recorded',introduced:report.authoredIntroductions?.at(-1)?.actors?.length||0,sceneShown:report.sceneShown,storedPresent:report.storedPresent}));
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
