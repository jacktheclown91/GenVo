// Native ground-contact observation using public New World and AUTO controls.
// Usage: node tools/review-work-motion.mjs <source root> <fresh output> [seed] [creature]
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
const seed=process.argv[4]||'GENVO8-TEST-A',creature=process.argv[5]||'starter-burrow';
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
    const {WorkMotionPresentation}=await import('/src/render/work-motion.js'),original=WorkMotionPresentation.prototype.sample;
    const review={samples:0,digging:0,climbing:0,perched:0,ids:new Set(),rows:[]};
    WorkMotionPresentation.prototype.sample=function(sim,a,time){const pose=original.call(this,sim,a,time);if(pose&&!review.measuring){review.samples++;review.ids.add(a.id);if(pose.kind==='dig')review.digging++;else if(pose.kind==='climb')review.climbing++;else review.perched++;if(review.rows.length<150)review.rows.push({id:a.id,player:a.player,time,actualElapsed:a.burrowWork?.elapsed,actualHeight:a.climb?.height,pose});}return pose;};
    window.__workReview={review,restore:()=>{WorkMotionPresentation.prototype.sample=original;}};
  });
  await page.locator('button[data-command=burrow]').click();
  await page.waitForFunction(()=>!!window.__GENVO8__.sim.player().burrowWork,null,{timeout:10000});
  await page.waitForTimeout(550);await page.screenshot({path:path.join(out,'native-excavating.png')});
  await page.keyboard.press('p');
  await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
  const rendering=await page.evaluate(async()=>{
    const g=window.__GENVO8__,{WorkMotionPresentation}=await import('/src/render/work-motion.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    if(!g.sim.paused)throw Error('Public pause failed');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'work-render'}))),before=snapshot(),original=WorkMotionPresentation.prototype.sample,rows=[];window.__workReview.review.measuring=true;
    try{for(const enabled of [false,true,false]){WorkMotionPresentation.prototype.sample=enabled?original:function(){return null;};const samples=[];for(let i=0;i<36;i++){await new Promise(resolve=>requestAnimationFrame(resolve));const start=performance.now();g.renderer.render();if(i>=6)samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);rows.push({enabled,medianMs:samples[15],p95Ms:samples[28],samples:samples.length,visibleCreatures:g.renderer.screenPos?.size});}}
    finally{WorkMotionPresentation.prototype.sample=original;window.__workReview.review.measuring=false;}
    const pose=original.call(g.renderer.workMotion,g.sim,g.sim.player(),g.renderer.encounters.time);for(let i=0;i<5;i++)g.renderer.render();
    return{rows,stateExact:before===snapshot(),pauseExact:JSON.stringify(pose)===JSON.stringify(original.call(g.renderer.workMotion,g.sim,g.sim.player(),g.renderer.encounters.time)),scope:'Matched paused young-world native CPU composition during actual excavation; no-work observer / new observer / no-work observer. Not FPS or mature-population acceptance.'};
  });
  fs.writeFileSync(path.join(out,'rendering.json'),JSON.stringify(rendering,null,2));
  if(!rendering.stateExact||!rendering.pauseExact)throw Error('Work render changed paused state');
  await page.keyboard.press('p');await page.waitForFunction(()=>!!window.__GENVO8__.sim.player().underground,null,{timeout:15000});await page.screenshot({path:path.join(out,'native-completed-entry.png')});
  const observation=await page.evaluate(()=>{const {review,restore}=window.__workReview;restore();const a=window.__GENVO8__.sim.player();return{...review,ids:[...review.ids],final:{underground:a.underground,work:a.burrowWork||null,parts:a.bodyPlan.nodes.map(n=>n.partId)}};});
  if(!observation.digging||!observation.final.underground||errors.length)throw Error('Missing actual excavation/completion: '+errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',...observation,artProof,rendering,errors,scope:'Public Ground burrower New World and Burrow control, real elapsed work and completed underground entry. No body, site, position, passage or excavation injection. Climbing is separate evidence.',creatorAcceptance:false},null,2));
  console.log(JSON.stringify({...observation,rows:undefined,artProof,rendering,errors}));
  await page.close();await context.close();
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
