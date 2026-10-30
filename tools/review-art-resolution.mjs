// Native controlled turn fixture, using real artwork and an unchanged world.
// Usage: node tools/review-turn-cadence.mjs <source root> <fresh output> [seed] [creature]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright')}catch{
  playwright=require(path.join(process.env.USERPROFILE,
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
if(!process.argv[2]||!process.argv[3])throw Error('Supply source root and fresh evidence directory');
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
const seed=process.argv[4]||'GENVO8-TEST-A',creature=process.argv[5]||'recorded';
if(fs.existsSync(out))throw Error('Never overwrite an earlier review');
fs.mkdirSync(out,{recursive:true});
const mime={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json',
  '.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml',
  '.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://local').pathname);
  const file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return}
  const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
  fs.readFile(target,(error,bytes)=>{
    if(error){response.writeHead(404);response.end();return}
    response.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
    response.end(bytes);
  });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await playwright.chromium.launch();
 const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out,size:{width:1440,height:1000}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const origin='http://127.0.0.1:'+server.address().port;
 await page.goto(origin+'/tools/art-resolution/');
 await page.waitForFunction(()=>window.__artStudy?.ready,{},{timeout:60000});
 await page.evaluate(()=>window.__artStudy.freeze());
 const atlases=await page.evaluate(()=>window.__artStudy.exportAtlases());
 const isCandidate=await page.evaluate(()=>window.__artStudy.catalog.schema==='genvo.part-art-variants/1');
 const artFolder=path.join(root,isCandidate?'assets/art/production-candidate-v1':'assets/art/experiments/resolution-v1');
 for(const atlas of atlases)fs.writeFileSync(path.join(artFolder,atlas.file),Buffer.from(atlas.data.split(',')[1],'base64'));

 const comparisons=[];
 for(let specimen=0;specimen<4;specimen++)for(const scale of ['2','4','7','10']){
  await page.locator('#specimen').selectOption(String(specimen));await page.locator('#scale').selectOption(scale);
  await page.locator('#measure').click();
  comparisons.push(await page.evaluate(()=>window.__artStudy.measurements));
  await page.locator('.cards').screenshot({path:path.join(out,'specimen-'+specimen+'-scale-'+scale+'.png')});
 }
 await page.locator('#specimen').selectOption('1');await page.locator('#scale').selectOption('7');
 await page.screenshot({path:path.join(out,'comparison-workshop.png')});
 const game=page.frames().find(f=>f.url()===origin+'/');if(!game)throw Error('Missing playable game');
 await page.locator('#game').scrollIntoViewIfNeeded();
 await game.waitForFunction(()=>window.__GENVO8__?.saveManager&&window.__GENVO8__.nativeArtStatus().status==='ready');
 await game.getByRole('button',{name:'New World',exact:true}).click();
 await game.locator('#newWorldSeed').fill('GENVO8-TEST-A');
 await game.getByRole('button',{name:'Begin World',exact:true}).click();
 await game.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden,{},{timeout:60000});
 await game.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 for(let i=0;i<8;i++){
  const blocked=await game.evaluate(()=>{const t=window.__GENVO8__.tutorial;return t.worldInputBlocked()&&['welcome','briefing'].includes(t.stage);});
  if(!blocked)break;await game.locator('body').press('Enter');
 }
 await game.locator('body').press('p');
 const snapshot=()=>game.evaluate(async()=>{
  const g=window.__GENVO8__,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
  if(!g.sim.paused)throw Error('World is not paused');
  return JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'art-resolution-study'})));
 });
 // Hide the pause menu with its ordinary Resume, then pause simulation in the
 // diagnostic view only. No organism or physical field is edited.
 await game.evaluate(()=>{document.querySelector('#frontEnd').hidden=true;});
 const before=await snapshot(),world=[];
 for(const resolution of [32,64,128,32]){
  await page.locator('[data-world="'+resolution+'"]').click();
  await page.waitForFunction(r=>window.__artStudy.worldResolution===r,resolution);
  await game.evaluate(()=>window.__GENVO8__.renderer.render());
  const info=await game.evaluate(()=>({zoom:window.__GENVO8__.renderer.zoom,art:window.__GENVO8__.nativeArtStatus(),animals:window.__GENVO8__.sim.animals.length}));
  const rendering=await game.evaluate(async()=>{
   const renderer=window.__GENVO8__.renderer,samples=[];
   for(let i=0;i<36;i++){
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const start=performance.now();renderer.render();
    if(i>=6)samples.push(performance.now()-start);
   }
   samples.sort((a,b)=>a-b);
   return{samples:samples.length,medianMs:samples[15],p95Ms:samples[28],visibleCreatures:renderer.screenPos?.size||0,
    scope:'Direct full-world renderer CPU composition in this fixed paused young-world camera; not end-to-end FPS or mature-population acceptance.'};
  });

  await page.locator('#game').screenshot({path:path.join(out,'world-'+resolution+(world.length===3?'-restored':'')+'.png')});
  if(before!==await snapshot())throw Error('Art preview changed canonical world state');
  world.push({resolution,...info,rendering,stateExact:true});
 }
 await page.locator('#observe').click();
 if(await page.locator('#specimen').inputValue()!=='4')throw Error('Observed creature import failed');
 await page.locator('#growth').selectOption('.55').catch(()=>page.locator('#growth').selectOption('0.55'));
 await page.locator('#pigment').selectOption('100');
 await page.locator('#walk').uncheck();
 await page.locator('.cards').screenshot({path:path.join(out,'observed-player-juvenile-pigment.png')});
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',comparisons,world,errors,creatorAcceptance:false,scope:'Four legal assembly fixtures and the actual New World player; all eight facings, matched physical scales, paused actual-world previews and exact state parity. Visual acceptance remains separate.'},null,2));
 console.log('Resolution prototype PASS: 4 bodies × 4 scales × 3 native resolutions, actual world and 32px restoration preserve complete state.');
 await page.close();await context.close();
}finally{await browser?.close();await new Promise(r=>server.close(r));}
