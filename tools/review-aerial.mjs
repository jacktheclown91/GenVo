// Native ground-contact observation using public New World and AUTO controls.
// Usage: node tools/review-aerial.mjs <source root> <fresh output> [seed] [creature]
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
const seed=process.argv[4]||'GENVO8-TEST-A',creature=process.argv[5]||'starter-flight';
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
  const context=await browser.newContext({viewport:{width:960,height:540},
    recordVideo:{dir:out,size:{width:960,height:540}}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>window.__GENVO8__?.saveManager&&
    window.__GENVO8__.nativeArtStatus().status==='ready');
  await page.getByRole('button',{name:'New World',exact:true}).click();
  await page.locator('#newWorldCreature').selectOption(creature);
  await page.locator('#newWorldSeed').fill(seed);
  await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(seed=>document.querySelector('#frontEnd')?.hidden&&
    window.__GENVO8__.sim.seed===seed,seed,{timeout:60000});
  await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
  for(let i=0;i<8;i++){
    const blocked=await page.evaluate(()=>{
      const tutorial=window.__GENVO8__.tutorial;
      return tutorial.worldInputBlocked()&&['welcome','briefing'].includes(tutorial.stage);
    });
    if(!blocked)break;
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(1500);
  await page.getByRole('button',{name:'Game utilities',exact:true}).click();
  await page.locator('button[data-action=autonomy]').click();
  await page.getByRole('button',{name:'Game utilities',exact:true}).click();
  await page.keyboard.press('p');
  const artProof=await page.evaluate(async()=>{
    const g=window.__GENVO8__,{loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{setPartArtPreview}=await import('/src/render/runtime-part-art.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    if(!g.sim.paused)throw Error('Public pause failed');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'native-detailed-locomotion'}))),before=snapshot();
    const result=await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:64});setPartArtPreview(result.parts);
    if(snapshot()!==before)throw Error('Detailed art changed simulation state');return{resolution:64,parts:result.parts.size,stateExact:true};
  });
  await page.keyboard.press('p');
  await page.evaluate(async()=>{
    const {AerialPresentation}=await import('/src/render/aerial-presentation.js'),g=window.__GENVO8__,original=AerialPresentation.prototype.sample;
    const review={samples:0,powered:0,gliding:0,landing:0,players:new Set(),npcs:new Set(),minSpread:1,maxSpread:0,rows:[]};
    AerialPresentation.prototype.sample=function(sim,a,time){const pose=original.call(this,sim,a,time);if(pose&&!review.measuring){review.samples++;if(a.player)review.players.add(a.id);else review.npcs.add(a.id);if(pose.landing)review.landing++;else if(a.aerialMode==='glide')review.gliding++;else review.powered++;review.minSpread=Math.min(review.minSpread,pose.flightSpread);review.maxSpread=Math.max(review.maxSpread,pose.flightSpread);if(review.rows.length<70)review.rows.push({id:a.id,player:a.player,airborne:a.airborne,mode:a.aerialMode||null,time,pose});}return pose;};
    window.__aerialReview={review,restore:()=>{AerialPresentation.prototype.sample=original;}};
  });
  if(!await page.evaluate(()=>window.__GENVO8__.sim.player().airborne))await page.keyboard.press('6');
  await page.waitForFunction(()=>window.__GENVO8__.sim.player().airborne,{timeout:10000});
  await page.waitForTimeout(1800);
  await page.screenshot({path:path.join(out,'native-powered-hover.png')});
  await page.keyboard.press('p');
  // Let the ordinary one-time family-control toast finish its saved UI flag.
  // Do not omit that flag or write it ourselves to manufacture snapshot parity.
  await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
  const rendering=await page.evaluate(async()=>{
    const g=window.__GENVO8__,{AerialPresentation}=await import('/src/render/aerial-presentation.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    if(!g.sim.paused)throw Error('Aerial timing requires public pause');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'aerial-cost'}))),before=snapshot(),original=AerialPresentation.prototype.sample,rows=[];
    window.__aerialReview.review.measuring=true;
    try{for(const enabled of [false,true,false]){
      AerialPresentation.prototype.sample=enabled?original:function(){return null;};
      const samples=[];for(let i=0;i<36;i++){await new Promise(resolve=>requestAnimationFrame(resolve));const started=performance.now();g.renderer.render();if(i>=6)samples.push(performance.now()-started);}
      samples.sort((a,b)=>a-b);rows.push({enabled,medianMs:samples[15],p95Ms:samples[28],samples:samples.length,visibleCreatures:g.renderer.screenPos?.size});
    }}finally{AerialPresentation.prototype.sample=original;window.__aerialReview.review.measuring=false;}
    g.renderer.render();const frozen=JSON.stringify(g.renderer.aerialPresentation.states.get(g.sim.playerId)?.last);for(let i=0;i<5;i++)g.renderer.render();
    const after=snapshot();let index=0;while(index<before.length&&before[index]===after[index])index++;return{rows,stateExact:before===after,snapshotDifference:before===after?null:{index,before:before.slice(Math.max(0,index-100),index+160),after:after.slice(Math.max(0,index-100),index+160)},frozenBefore:frozen,frozenAfter:JSON.stringify(g.renderer.aerialPresentation.states.get(g.sim.playerId)?.last),pauseExact:frozen===JSON.stringify(g.renderer.aerialPresentation.states.get(g.sim.playerId)?.last),scope:'Matched paused young-world direct renderer CPU composition while the real player is airborne. Preceding no-aerial-helper path / new path / preceding path. Not FPS or mature-population acceptance.'};
  });
  fs.writeFileSync(path.join(out,'rendering.json'),JSON.stringify(rendering,null,2));
  if(!rendering.stateExact||!rendering.pauseExact)throw Error('Aerial renderer changed paused state');
  await page.keyboard.press('p');

  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(1000);await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(600);
  await page.keyboard.press('6');
  await page.waitForFunction(()=>!window.__GENVO8__.sim.player().airborne,{timeout:10000});
  await page.waitForTimeout(80);await page.screenshot({path:path.join(out,'native-landing.png')});await page.waitForTimeout(700);
  const observation=await page.evaluate(()=>{const {review,restore}=window.__aerialReview;restore();return{...review,players:[...review.players],npcs:[...review.npcs]};});
  if(!observation.powered||!observation.landing||observation.maxSpread-observation.minSpread<.4)throw Error('Missing actual powered/landing transition');
  await page.keyboard.press('p');
  const stateProof=await page.evaluate(async()=>{
    const g=window.__GENVO8__,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'aerial-readonly'}))),before=snapshot();
    if(!g.sim.paused)throw Error('Pause failed');for(let i=0;i<8;i++)g.renderer.render();return{stateExact:before===snapshot()};
  });
  if(!stateProof.stateExact||errors.length)throw Error('State/browser errors: '+errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',...observation,artProof,stateProof,rendering,errors,scope:'Public winged-flier New World, AUTO wildlife, ordinary 6 takeoff/landing and directional input; actual optional64/native32 artwork. No organism, position, terrain, flight eligibility, energy or altitude injection. No natural autonomous flight acceptance claimed.',creatorAcceptance:false},null,2));
  console.log(JSON.stringify({...observation,rows:undefined,artProof,stateProof,rendering,errors}));
  await page.close();await context.close();
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
