import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-journey-saves-browser.mjs <exported build> <evidence dir> [seed]
// Browser saves along the player's journey, through the real UI and IndexedDB:
// at a pregnancy, the first birth, a real H handoff to a grown heir and after
// walking across a region border, the world is saved (Esc → Save World), the
// page is reloaded and Continue is pressed. What the world holds must match:
// the same creature, body, family, pregnancy, legacy record and region.
// Staging: whole days advance in the page under AUTO (time acceleration), the
// Creature Lab is left with "Keep the old body", and for the crossing the
// creature is placed on legal ground at the east edge before walking east.
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),seed=process.argv[4]||'PLANET-B0-A';
fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port+'/';
const browser=await pw.chromium.launch();const report={seed,checkpoints:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:720}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__?.sim?.climate,{},{timeout:120000});
 const keepLab=async()=>{const lab=page.locator('#creatureEditor:not([hidden]) [data-act="cancel"]');if(await lab.count())await lab.click()};
 // Whole days under AUTO until a condition holds (evaluated on the live sim).
 const advance=(cond,maxDays)=>page.evaluate(async({cond,maxDays})=>{const g=window.__GENVO8__,f=new Function('s','founder',cond);g.sim.setPlayerAutonomy(true);const founder=window.__founder;
  for(let d=0;d<maxDays;d++){const s=g.sim;if(f(s,founder))break;for(let i=0;i<g.CFG.dayTicks;i++){if(s.paused)break;s.update(null)}const lab=document.querySelector('#creatureEditor');if(lab&&!lab.hidden)lab.querySelector('[data-act="cancel"]')?.click();await new Promise(r=>setTimeout(r,0))}
  g.sim.setPlayerAutonomy(false);return f(g.sim,founder)},{cond,maxDays});
 const digest=()=>page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player(),f=window.__founder;
  return{tick:s.tickCount,day:s.day,player:p.id,generation:p.generation,parts:[...new Set(p.bodyPlan.nodes.map(n=>n.partId))].sort(),
   carrying:s.animals.filter(a=>a.alive&&a.lineage&&a.pregnant).map(a=>a.id+'<'+a.pregnant.fatherId).sort(),
   children:s.animals.filter(a=>a.alive&&a.parentIds?.includes(f)).map(a=>a.id).sort((a,b)=>a-b),lineageRecords:s.lineage.records.size,handoffs:s.lineage.handoffs.length,
   legacy:s.legacyMilestones?.firstLegacy?{from:s.legacyMilestones.firstLegacy.from.id,to:s.legacyMilestones.firstLegacy.to.id}:null,region:[s.world.regionOrigin?.x??0,s.world.regionOrigin?.y??0],
   alive:s.animals.filter(a=>a.alive).length,stage:window.__GENVO8__.tutorial.stage}});
 const checkpoint=async label=>{
  const before=await digest(),founder=await page.evaluate(()=>window.__founder);
  for(let i=0;i<8;i++){await keepLab();if(await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').isVisible())break;await page.keyboard.press('Escape');await page.waitForTimeout(700)}
  await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').click();
  await page.waitForFunction(()=>/Saved/.test(document.querySelector('#saveStatus')?.textContent||''),{},{timeout:60000});await page.waitForFunction(()=>!window.__GENVO8__.saveManager.busy,{},{timeout:60000});
  const saved=await digest();await page.screenshot({path:path.join(out,label+'-saved.png')});
  await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.waitForTimeout(600);
  await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await ready();await page.evaluate(f=>{window.__founder=f;window.__GENVO8__.sim.paused=true},founder);
  const loaded=await digest();await page.screenshot({path:path.join(out,label+'-continued.png')});
  await page.evaluate(()=>{window.__GENVO8__.sim.paused=false});
  const same=['player','generation','parts','carrying','children','lineageRecords','handoffs','legacy','region'].filter(k=>JSON.stringify(saved[k])!==JSON.stringify(loaded[k]));
  report.checkpoints.push({label,before,saved,loaded,mismatches:same,tickDrift:loaded.tick-saved.tick});
  console.log(label,same.length?'MISMATCH '+same.join(','):'ok','day',saved.day,'tick',saved.tick,'->',loaded.tick);
  assert.deepEqual(same,[],label+': the continued world holds the same organisms and history');assert.ok(loaded.tick>=saved.tick&&loaded.tick-saved.tick<=2,label+': continues from the saved tick');
 };
 await page.goto(origin);await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldCreature').selectOption('starter-jump');await page.locator('#newWorldSeed').fill(seed);await page.locator('#newWorldName').fill('Journey saves');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await ready();
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true);window.__founder=g.sim.player().id});
 assert.ok(await advance("return s.animals.some(a=>a.alive&&a.lineage&&a.pregnant&&(a.id===founder||a.pregnant.fatherId===founder))",40),'a natural pregnancy');
 await checkpoint('1-pregnancy');
 assert.ok(await advance("return s.animals.some(a=>a.alive&&a.parentIds?.includes(founder))",40),'a natural birth');
 await checkpoint('2-birth');
 assert.ok(await advance("return s.lineage.eligibleHeirs({fromId:founder}).length>0",200),'a grown heir');
 await page.keyboard.press('KeyH');await page.waitForTimeout(500);await page.keyboard.press('KeyH');
 await page.waitForFunction(()=>!document.querySelector('#transition').hidden,{},{timeout:20000});await page.keyboard.press('Enter');
 await page.waitForFunction(()=>!document.querySelector('#legacySummary')?.hidden,{},{timeout:10000});await page.locator('#legacySummary [data-legacy="continue"]').click();await page.waitForTimeout(500);
 await checkpoint('3-succession');
 // Walk across the east border with the heir.
 const placed=await page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,p=s.player();for(let y=10.5;y<118;y++){if(s.canOccupy(p,127.6,y)){p.x=127.6;p.y=y;g.renderer.motion?.clear?.();return{y}}}return null});
 assert.ok(placed,'legal ground at the east edge');
 const fromRegion=(await digest()).region;await page.keyboard.down('KeyD');
 await page.waitForFunction(r=>{const o=window.__GENVO8__.sim.world.regionOrigin;return(o?.x??0)!==r[0]||(o?.y??0)!==r[1]},fromRegion,{timeout:60000}).catch(()=>{});await page.keyboard.up('KeyD');await ready();await page.waitForTimeout(1500);
 const crossed=await digest();report.crossing={from:fromRegion,to:crossed.region};
 assert.notDeepEqual(crossed.region,fromRegion,'walked into the neighbouring region');
 await checkpoint('4-after-crossing');
 report.errors=errors;assert.deepEqual(errors,[]);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close()}
console.log('Journey saves PASS:',report.checkpoints.map(c=>c.label+' day '+c.saved.day).join(', '),'crossing',JSON.stringify(report.crossing));
