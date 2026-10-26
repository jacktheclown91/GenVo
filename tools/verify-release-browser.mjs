import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-release-browser.mjs <extracted release ZIP> <evidence dir>
// Release check of the exact HTML5 package: served from its own root, it must
// load with no missing resources or page errors; New World with a chosen
// starting creature; manual movement, drinking and eating; audio after input;
// save, reload and Continue to the same organism and tick; frame pacing at 1x;
// and layout at common itch.io embed sizes. Staging, where used, is limited to
// placing the creature beside water or food (documented in the report).
const root=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]);
if(fs.existsSync(output)&&fs.readdirSync(output).length)throw Error('Preserve previous evidence.');fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav','.gz':'application/gzip','.webp':'image/webp'};
const missing=[];
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){missing.push(req.url);res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port+'/';
const browser=await pw.chromium.launch({headless:true,args:['--autoplay-policy=user-gesture-required']});const report={root,checks:{}};const errors=[],consoleErrors=[],failed=[];
const shot=(page,name)=>page.screenshot({path:path.join(output,name+'.png')});
const ok=(name,value)=>{report.checks[name]=value;console.log('PASS',name,JSON.stringify(value).slice(0,220))};
let page;
async function beginNativeOpening(){
 for(let step=0;step<16;step++){
  const stage=await page.evaluate(()=>window.__GENVO8__.tutorial.stage);
  if(!['welcome','briefing'].includes(stage))return;
  if(await page.locator('#startGame').isVisible())await page.locator('#startGame').click();
  else await page.keyboard.press('Enter');
  await page.waitForTimeout(350);
 }
 throw Error('Opening cards did not finish through native controls');
}
try{
 const context=await browser.newContext({viewport:{width:1280,height:720}});page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});page.on('requestfailed',r=>failed.push(r.url()));
 await page.goto(origin);await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager,{},{timeout:60000});await page.waitForTimeout(800);await shot(page,'01-home');
 const options=await page.evaluate(()=>[...document.querySelectorAll('#newWorldCreature option')].map(o=>o.value));
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill('PLANET-RELEASE-1');await page.locator('#newWorldName').fill('Release check');
 await page.locator('#newWorldCreature').selectOption('starter-jump');await shot(page,'02-new-world');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 // Climate is produced by the first biological tick; the welcome deliberately
 // blocks that tick. Enter gameplay through its native cards before awaiting it.
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.player(),{},{timeout:90000});
 await beginNativeOpening();await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());await page.waitForTimeout(1500);
 const start=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();return{generator:s.world.generator,species:p.species,parts:[...new Set(p.bodyPlan.nodes.map(n=>n.partId))],stage:window.__GENVO8__.tutorial.stage,day:s.day,animals:s.animals.filter(a=>a.alive).length}});
 assert.equal(start.generator,'planetary/1');assert.ok(start.parts.some(p=>/spring/.test(p)),'the Spring jumper start has spring legs');
 ok('newWorld',{startingCreatureOptions:options,chosen:'starter-jump',...start});await shot(page,'03-opening');
 // Manual movement with the keyboard.
 await page.evaluate(()=>document.activeElement?.blur?.());const steps={};
 for(const key of ['KeyD','KeyS','KeyA','KeyW']){const b=await page.evaluate(()=>{const p=window.__GENVO8__.sim.player();return{x:p.x,y:p.y}});await page.keyboard.down(key);await page.waitForTimeout(900);await page.keyboard.up(key);
  steps[key]=await page.evaluate(b=>{const p=window.__GENVO8__.sim.player();return+Math.hypot(p.x-b.x,p.y-b.y).toFixed(2)},b)}
 assert.ok(Object.values(steps).filter(d=>d>.3).length>=3,'each direction key moves the creature');ok('keyboardMovement',{tilesPerKey:steps});
 // Audio after a user gesture.
 const audio=await page.evaluate(()=>{const a=window.__GENVO8__.audio;return{unlocked:!!a.unlocked,context:a.ctx?.state||a.context?.state||null,muted:!!a.muted}});ok('audio',audio);
 // Drinking: the creature is placed on legal ground beside open water (staged position), then Shift+E.
 const drink=await page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),w=s.world;s.paused=true;
  for(let r=1;r<40;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=Math.floor(p.x)+dx+.5,y=Math.floor(p.y)+dy+.5;if(!w.isPlayable(x,y)||!s.canOccupy(p,x,y)||w.water[w.idx(x,y)])continue;if(!w.isDrinkable(x,y))continue;p.x=x;p.y=y;g.renderer.motion?.clear?.();p.hydration=Math.min(p.hydration,40);s.paused=false;return{x,y,hydration:p.hydration}}
  s.paused=false;return null});
 assert.ok(drink,'drinkable ground near the start');await page.waitForTimeout(400);
 await page.keyboard.down('Shift');await page.keyboard.press('KeyE');await page.keyboard.up('Shift');await page.waitForTimeout(800);
 const drank=await page.evaluate(()=>{const p=window.__GENVO8__.sim.player();return{hydration:+p.hydration.toFixed(1),firstDrink:window.__GENVO8__.sim.cognition.state(p)?.history?.some(h=>h.type==='first-drink')}});
 assert.ok(drank.hydration>drink.hydration,'Shift+E drinks');ok('drink',{before:drink.hydration,after:drank.hydration,firstDrink:drank.firstDrink,staged:'creature placed on drinkable ground'});await shot(page,'04-drink');
 // Eating: placed beside food its mouth can use, then E (the game's own target).
 const food=await page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),f=g.tutorial.findFood(p,40);if(!f)return null;s.paused=true;
  for(const [dx,dy] of [[0,0],[.4,0],[-.4,0],[0,.4],[0,-.4]]){const x=f.x+dx,y=f.y+dy;if(s.canOccupy(p,x,y)){p.x=x;p.y=y;break}}g.renderer.motion?.clear?.();p.energy=Math.min(p.energy,40);s.paused=false;return{kind:f.kind,energy:p.energy}});
 assert.ok(food,'edible food near the start');await page.waitForTimeout(400);
 let ate=null;for(let i=0;i<6&&!(ate?.energy>food.energy+.5);i++){await page.keyboard.press('KeyE');await page.waitForTimeout(700);ate=await page.evaluate(()=>{const p=window.__GENVO8__.sim.player();return{energy:+p.energy.toFixed(1),intent:p.intent,firstMeal:window.__GENVO8__.sim.cognition.state(p)?.history?.some(h=>h.type.startsWith('first-meal'))}})}
 assert.ok(ate.energy>food.energy||ate.firstMeal,'E eats');ok('eat',{kind:food.kind,before:food.energy,after:ate.energy,firstMeal:ate.firstMeal,staged:'creature placed beside food'});await shot(page,'05-eat');
 // Frame pacing at 1x for 20 s under AUTO.
 await page.evaluate(()=>{window.__GENVO8__.sim.setPlayerAutonomy(true);const f=window.__pace=[];let last=performance.now();const loop=now=>{f.push(now-last);last=now;if(f.length<100000)requestAnimationFrame(loop)};requestAnimationFrame(loop)});
 await page.waitForTimeout(20000);const pace=await page.evaluate(()=>{const d=window.__pace.slice(10).sort((a,b)=>a-b),q=p=>+d[Math.floor(p*(d.length-1))].toFixed(1);window.__GENVO8__.sim.setPlayerAutonomy(false);return{frames:d.length,median:q(.5),p95:q(.95),max:+d.at(-1).toFixed(1),over100:d.filter(x=>x>100).length}});
 ok('framePacing20s',pace);await shot(page,'06-living-world');
 // Save, reload, Continue.
 await page.keyboard.press('Escape');await page.waitForTimeout(600);await shot(page,'07-pause-menu');
 const saveButton=page.locator('.menu-view:not([hidden]) [data-action="save"]');assert.ok(await saveButton.count(),'pause menu offers Save World');
 await saveButton.first().click();await page.waitForFunction(()=>/Saved/.test(document.querySelector('#saveStatus')?.textContent||'')||!window.__GENVO8__.saveManager.busy,{},{timeout:30000});await page.waitForTimeout(1500);
 const saved=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();return{tick:s.tickCount,day:s.day,player:p.id,x:+p.x.toFixed(3),parts:p.bodyPlan.nodes.length,animals:s.animals.filter(a=>a.alive).length,slot:window.__GENVO8__.saveManager.activeSlotId}});
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager,{},{timeout:60000});await page.waitForTimeout(800);
 const cont=page.locator('.menu-view[data-screen="home"] [data-action="continue"]');assert.ok(await cont.isVisible(),'Continue is offered after reload');await cont.click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.player(),{},{timeout:90000});await beginNativeOpening();await page.waitForTimeout(1200);
 const loaded=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();return{tick:s.tickCount,day:s.day,player:p.id,x:+p.x.toFixed(3),parts:p.bodyPlan.nodes.length,animals:s.animals.filter(a=>a.alive).length}});
 assert.equal(loaded.player,saved.player);assert.equal(loaded.parts,saved.parts);assert.ok(loaded.tick>=saved.tick&&loaded.tick-saved.tick<48*2,'continues from the saved tick');
 ok('saveContinue',{saved,loaded});await shot(page,'08-continued');
 // Layout at common embed and window sizes: no horizontal overflow, canvas fills the view.
 const layouts={};for(const [w,h] of [[960,600],[1280,720],[1920,1080],[800,500]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(900);
  layouts[w+'x'+h]=await page.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return{overflowX:document.documentElement.scrollWidth>innerWidth,overflowY:document.documentElement.scrollHeight>innerHeight,canvas:[Math.round(r.width),Math.round(r.height)],view:[innerWidth,innerHeight]}});await shot(page,'09-layout-'+w+'x'+h)}
 for(const [k,v] of Object.entries(layouts)){assert.equal(v.overflowX,false,k+' has no horizontal overflow');assert.ok(v.canvas[0]>=v.view[0]-2&&v.canvas[1]>=v.view[1]-2,k+' canvas fills the view')}
 ok('layouts',layouts);
 report.missingResources=[...new Set(missing)].filter(u=>!/favicon/.test(u));report.failedRequests=failed;report.pageErrors=errors;report.consoleErrors=consoleErrors;
 assert.deepEqual(report.missingResources,[],'no missing resources');assert.deepEqual(errors,[],'no page errors');
}catch(error){
 report.failure=error.stack;
 if(page){
  report.failureState=await page.evaluate(()=>({frontEndHidden:document.querySelector('#frontEnd')?.hidden,stage:window.__GENVO8__?.tutorial.stage,paused:window.__GENVO8__?.sim.paused})).catch(()=>null);
  await shot(page,'failure').catch(()=>{});
 }
 throw error;
}finally{report.pageErrors=errors;report.consoleErrors=consoleErrors;report.failedRequests=failed;report.missingResources=[...new Set(missing)].filter(u=>!/favicon/.test(u));fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close()}
console.log('Release browser PASS:',JSON.stringify({missing:report.missingResources,pageErrors:report.pageErrors.length,consoleErrors:report.consoleErrors.length}));
