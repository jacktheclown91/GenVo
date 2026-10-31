// Observe actual detailed facial paint after public authored-mouth import and E.
// Usage: node tools/review-feeding-anatomy.mjs <source root> <fresh output> [seed] [mouth]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {FounderDesign} from '../../src/lineage/founder-design.js';
import {place} from '../../src/lineage/evolution-draft.js';

const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright')}catch{
  playwright=require(path.join(process.env.USERPROFILE,
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
if(!process.argv[2]||!process.argv[3])throw Error('Supply source root and fresh evidence directory');
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
const seed=process.argv[4]||'GENVO8-TEST-A',creature='sandbox',mouth=process.argv[5]||'nibbler-mouth';
if(fs.existsSync(out))throw Error('Never overwrite an earlier review');
fs.mkdirSync(out,{recursive:true});
const mime={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json',
  '.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml',
  '.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://local').pathname);
  const file=path.resolve(root,'..'+pathname);
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
  if(process.argv.includes('--mature')){await page.locator('#newWorldStartingPoint').selectOption('catalog:mature-valley-d100');await page.locator('#newWorldMovementRules').selectOption('current');}
  await page.getByRole('button',{name:'Begin World',exact:true}).click();
  const design=new FounderDesign('sandbox');const mounted=place(design.draft,mouth,'root','mouth');if(!mounted.ok)throw Error(mounted.reason);
  if(mouth==='beak-mouth'){const eye=place(design.draft,'compound-eye','root','eye.left');if(!eye.ok)throw Error(eye.reason);}
  const completed=design.finish();if(!completed.ok)throw Error(completed.problems.join('; '));
  const bundle=JSON.stringify({format:'genvo.authored-creature/1',design:completed.record});fs.writeFileSync(path.join(out,'authored-mouth.json'),bundle);
  await page.locator('#founderEditor [data-act=import-design]').waitFor();
  const fileChoice=page.waitForEvent('filechooser');await page.locator('#founderEditor [data-act=import-design]').click();await (await fileChoice).setFiles({name:'authored-mouth.json',mimeType:'application/json',buffer:Buffer.from(bundle)});
  await page.waitForFunction(()=>document.querySelector('#founderEditor')?.textContent.includes('Creature design restored.'));
  await page.locator('#founderEditor [data-act=commit]').click();await page.locator('#founderEditor [data-act=commit]').click();

  await page.waitForFunction(seed=>document.querySelector('#frontEnd')?.hidden&&
    (window.__GENVO8__.sim.seed===seed||window.__GENVO8__.sim.day>=100),seed,{timeout:60000});
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
  await page.keyboard.press('p');
  await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
  const artProof=await page.evaluate(async()=>{
    const g=window.__GENVO8__,{loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{setPartArtPreview}=await import('/src/render/runtime-part-art.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    if(!g.sim.paused)throw Error('Public pause failed');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'native-detailed-locomotion'}))),before=snapshot();
    const result=await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:64}),oldFaces=(await loadPartArtVariant(new URL('/docs/face-refinement-2026-10-28/before/catalog.json',location.href),{resolution:64})).parts;
    const prior=new Map(result.parts);for(const [id,part] of oldFaces)prior.set(id,part);
    const timings=[];function measure(label,parts){setPartArtPreview(parts);for(let i=0;i<6;i++)g.renderer.render();const samples=[];for(let i=0;i<20;i++){const start=performance.now();g.renderer.render();samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);timings.push({label,medianMs:samples[10],p95Ms:samples[18],samples:20});return g.renderer.canvas.toDataURL();}
    const baseline=measure('preceding64',prior),current=measure('refined64',result.parts);
    const originalParts=new Map(result.parts),originalDraw=g.renderer.drawAnimal,paint={counts:{},rows:[],player:false};
    g.renderer.drawAnimal=function(a,...args){paint.player=!!a.player;try{return originalDraw.call(this,a,...args)}finally{paint.player=false;}};
    for(const id of ['simple-eye','compound-eye','grazing-mouth','beak-mouth']){const art=result.parts.get(id);result.parts.set(id,{...art,draw(c,args){if(paint.player){const key=id+':'+args.frameIndex;paint.counts[key]=(paint.counts[key]||0)+1;if(paint.rows.length<100)paint.rows.push({id,frameIndex:args.frameIndex,facing:args.facing,tick:g.sim.tickCount});}return art.draw(c,args);}});}
    setPartArtPreview(result.parts);window.__facePaint={paint,restore(){g.renderer.drawAnimal=originalDraw;setPartArtPreview(originalParts);}};
    const after=snapshot();if(after!==before){let index=0;while(index<before.length&&before[index]===after[index])index++;throw Error('Art-load snapshot differed: '+JSON.stringify({before:before.slice(Math.max(0,index-80),index+160),after:after.slice(Math.max(0,index-80),index+160)}));}return{resolution:64,parts:result.parts.size,stateExact:true,timings,images:{baseline,current}};
  });
  for(const [name,data] of Object.entries(artProof.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete artProof.images;
  await page.keyboard.press('p');
  const beforeTick=await page.evaluate(()=>window.__GENVO8__.sim.tickCount);
  await page.evaluate(async()=>{
    const {FeedingPresentation}=await import('/src/render/feeding-expression.js'),original=FeedingPresentation.prototype.sample,review={samples:0,modes:new Set(),stages:new Set(),rows:[]};
    FeedingPresentation.prototype.sample=function(sim,a,time,options){const pose=original.call(this,sim,a,time,options);if(pose&&a.player){review.samples++;review.modes.add(pose.mode);review.stages.add(pose.stage);if(review.rows.length<100)review.rows.push({tick:sim.tickCount,time,mode:pose.mode,stage:pose.stage,progress:pose.progress,mouthShape:pose.mouthShape});}return pose;};window.__feedingReview={review,restore:()=>{FeedingPresentation.prototype.sample=original;}};
  });
  await page.keyboard.press('e');
  await page.waitForFunction(tick=>{const g=window.__GENVO8__,r=g.sim.lastPlayerAction;return r?.actorId===g.sim.playerId&&r.type==='eat'&&r.tick>=tick&&(r.energyGain>0||r.waterGain>0);},beforeTick,{timeout:10000});
  await page.waitForTimeout(320);await page.screenshot({path:path.join(out,'native-feeding.png')});await page.waitForTimeout(5800);
  const observation=await page.evaluate(()=>{const g=window.__GENVO8__,{review,restore}=window.__feedingReview;restore();const a=g.sim.player(),r=a.lastPlantMeal;return{...review,modes:[...review.modes],stages:[...review.stages],action:g.sim.lastPlayerAction,receipt:r?{actorId:r.actorId,tick:r.tick,removed:r.removed,edible:r.edible,tissue:r.tissue,viableSeeds:r.viableSeeds,destroyedSeeds:r.destroyedSeeds}:null,bodyPlan:a.bodyPlan.id,parts:a.bodyPlan.nodes.map(n=>n.partId)};});
  const painted=await page.evaluate(()=>{const {paint,restore}=window.__facePaint;restore();return{counts:paint.counts,rows:paint.rows};});
  fs.writeFileSync(path.join(out,'painted-frames.json'),JSON.stringify(painted,null,2));
  const eye=mouth==='beak-mouth'?'compound-eye':'simple-eye';for(const id of [mouth,eye])for(const frame of [0,1])if(!painted.counts[id+':'+frame])throw Error('Actual native face frame not observed: '+id+':'+frame);
  if(!observation.samples||!observation.modes.includes(mouth==='beak-mouth'?'peck':mouth==='nibbler-mouth'?'nibble':'graze'))throw Error('Expected actual mouth-specific feeding was not observed');
  await page.keyboard.press('p');await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
  const readOnly=await page.evaluate(async()=>{const g=window.__GENVO8__,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');if(!g.sim.paused)throw Error('Pause failed');const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'feeding-readonly'}))),before=snapshot();for(let i=0;i<8;i++)g.renderer.render();return{stateExact:before===snapshot()};});
  if(!readOnly.stateExact||errors.length)throw Error('Feeding read-only or browser failure: '+errors.join('\n'));
  if(process.argv.includes('--comparison')){
    const result=await page.evaluate(async()=>{
      const g=window.__GENVO8__,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
      const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'feeding-comparison'}))),before=snapshot();
      const result=await (await import('/tools/review-feeding-sheet.js')).feedingSheet();if(before!==snapshot())throw Error('Private feeding comparison changed the canonical snapshot');return{...result,stateExact:true};
    });
    for(const key of ['comparison','facings']){fs.writeFileSync(path.join(out,key+'.png'),Buffer.from(result[key].split(',')[1],'base64'));delete result[key];}
    fs.writeFileSync(path.join(out,'comparison.json'),JSON.stringify(result,null,2));
  }
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',mouth,painted,...observation,readOnly,artProof,errors,scope:'Public New World sandbox authored mouth import, ordinary E on actual available food, actual successful receipts and running presentation. No living actor, position, food, reserves or meal injection. Other feeding styles are separate evidence.',creatorAcceptance:false},null,2));console.log(JSON.stringify({...observation,rows:undefined,readOnly,errors}));
  await page.close();await context.close();
}catch(error){
  fs.writeFileSync(path.join(out,'FAILED-OBSERVATION.json'),JSON.stringify({status:'FAILED',message:error.message},null,2));throw error;
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
