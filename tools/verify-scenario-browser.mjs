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
fs.mkdirSync(output,{recursive:true});
const root=process.cwd();
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
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 const select=page.locator('#newWorldStartingPoint');
 await page.waitForFunction(()=>Array.from(document.querySelector('#newWorldStartingPoint')?.options||[])
  .some(option=>option.value==='catalog:established-valley-d30'));
 await page.screenshot({path:path.join(output,'advanced-start-menu.png')});
 await select.selectOption('catalog:established-valley-d30');
 await page.locator('#newWorldName').fill('Verified Evolved Valley Fork');
 assert.equal(await page.locator('#newWorldSeed').isDisabled(),true,
  'saved scenario ancestry cannot be relabeled as a different seed');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 await page.waitForFunction(()=>window.__GENVO8__?.sim?.seed==='GENVO-VALLEY-REPLAY-30'
  &&window.__GENVO8__.sim.day===31
  &&window.__GENVO8__.sim.player()?.alive,{},{timeout:120000});
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden===true,
  {},{timeout:120000});
 await page.waitForFunction(async()=>{
  try{
   const data=await window.__GENVO8__?.saveManager?.loadSnapshot();
   return data?.seed==='GENVO-VALLEY-REPLAY-30'&&data.core?.day===31;
  }catch{return false;}
 },{},{timeout:120000});
 await page.screenshot({path:path.join(output,'advanced-world-playable.png')});
 const report=await page.evaluate(async()=>{
  const g=window.__GENVO8__,world=g.sim.world,stored=await g.saveManager.loadSnapshot();
  return {
   seed:g.sim.seed,day:g.sim.day,tickCount:g.sim.tickCount,year:g.sim.year,
   liveAnimals:g.sim.animals.filter(a=>a.alive).length,
   playerAlive:!!g.sim.player()?.alive,worldGenerator:world.generator,
   sourceDay:stored.core.day,sourceSeed:stored.seed,
   newSlot:g.saveManager.activeSlotId,
   screenClosed:document.querySelector('#frontEnd').hidden,
   originalHistoryRetained:stored.core.tickCount>=1440
  };
 });
 assert.equal(report.seed,'GENVO-VALLEY-REPLAY-30');
 assert.equal(report.worldGenerator,'planetary/1');
 assert.ok(report.liveAnimals>0&&report.playerAlive);
 assert.equal(report.sourceDay,31);
 assert.ok(report.newSlot.startsWith('world-'));
 assert.ok(report.originalHistoryRetained);
 assert.deepEqual(errors,[],'browser encountered a fatal gameplay script error');
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({ok:true,...report,errors},null,2));
 console.log('Bundled Day 30 real-world New Game quick start and saved browser fork PASS',JSON.stringify(report));
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
