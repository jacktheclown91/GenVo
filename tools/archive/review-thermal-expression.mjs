// Native thermal posture observation through public existing-resident selection.
// Usage: node tools/review-feeding-anatomy.mjs <source root> <fresh output> [seed] [resident id]
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
const seed=process.argv[4]||'GENVO8-TEST-A',creature='resident',resident=process.argv[5]||'178';
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
  if(process.argv.includes('--legacy'))await page.locator('#newWorldGeography').selectOption('freshwater/1');
  if(process.argv.includes('--mature')){await page.locator('#newWorldStartingPoint').selectOption('catalog:mature-valley-d100');await page.locator('#newWorldMovementRules').selectOption('current');}
  await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.getByLabel('Living resident',{exact:true}).selectOption(resident);
  await page.getByRole('button',{name:'Begin as this creature',exact:true}).click();

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
    const result=await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:64});setPartArtPreview(result.parts);
    const after=snapshot();if(after!==before){let index=0;while(index<before.length&&before[index]===after[index])index++;throw Error('Art-load snapshot differed: '+JSON.stringify({before:before.slice(Math.max(0,index-80),index+160),after:after.slice(Math.max(0,index-80),index+160)}));}return{resolution:64,parts:result.parts.size,stateExact:true};
  });
  await page.keyboard.press('p');
  await page.evaluate(async()=>{
    const {ThermalPresentation}=await import('/src/render/thermal-expression.js'),original=ThermalPresentation.prototype.sample,review={rows:[],samples:0};
    ThermalPresentation.prototype.sample=function(sim,a,time,options){const pose=original.call(this,sim,a,time,options);if(pose&&a.player){review.samples++;if(review.rows.length<80)review.rows.push({tick:sim.tickCount,time,...pose});}return pose;};window.__thermalReview={review,restore:()=>{ThermalPresentation.prototype.sample=original;}};
  });
  await page.waitForTimeout(2000);await page.screenshot({path:path.join(out,'native-thermal.png')});
  const observation=await page.evaluate(async()=>{const g=window.__GENVO8__,{review,restore}=window.__thermalReview;restore();const a=g.sim.player();return{...review,actorId:a.id,signal:(await import('/src/render/thermal-expression.js')).thermalExpressionSignal(g.sim,a),intent:a.intent,action:g.renderer.actionPose(a,false),entry:g.sim.creatureStart,parts:a.bodyPlan.nodes.map(n=>n.partId),position:{x:a.x,y:a.y}};});
  fs.writeFileSync(path.join(out,'observation.json'),JSON.stringify(observation,null,2));
  if(!observation.samples||!observation.rows.some(r=>r.kind==='cold'))throw Error('Actual cold expression was not observed');
  await page.keyboard.press('p');await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
  const comparison=await page.evaluate(async()=>{
    const g=window.__GENVO8__,{ThermalPresentation}=await import('/src/render/thermal-expression.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    if(!g.sim.paused)throw Error('Pause failed');const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'thermal-readonly'}))),before=snapshot(),original=ThermalPresentation.prototype.sample;
    const timings=[],samples=[[],[]];let enabled=false;
    ThermalPresentation.prototype.sample=function(...args){return enabled?original.apply(this,args):null;};
    try{
      for(let i=0;i<24;i++)for(const updated of i%2?[true,false]:[false,true]){enabled=updated;const start=performance.now();g.renderer.render();if(i>=4)samples[Number(updated)].push(performance.now()-start);}
      enabled=false;g.renderer.render();const baseline=g.renderer.canvas.toDataURL();enabled=true;g.renderer.render();const current=g.renderer.canvas.toDataURL();
      for(const updated of [false,true]){const values=samples[Number(updated)].sort((a,b)=>a-b);timings.push({updated,medianMs:values[10],p95Ms:values[18],samples:20});}
      if(before!==snapshot())throw Error('Thermal rendering changed the complete snapshot');return{baseline,current,timings,stateExact:true};
    }finally{ThermalPresentation.prototype.sample=original;}
  });
  for(const key of ['baseline','current']){fs.writeFileSync(path.join(out,key+'.png'),Buffer.from(comparison[key].split(',')[1],'base64'));delete comparison[key];}
  if(process.argv.includes('--comparison')){
    const sheet=await page.evaluate(async()=>{const g=window.__GENVO8__,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'thermal-sheet'}))),before=snapshot();const sheet=await(await import('/tools/review-thermal-sheet.js')).thermalSheet();if(before!==snapshot())throw Error('Private thermal sheet changed the canonical snapshot');return{...sheet,stateExact:true};});
    for(const key of ['comparison','facings']){fs.writeFileSync(path.join(out,key+'.png'),Buffer.from(sheet[key].split(',')[1],'base64'));delete sheet[key];}fs.writeFileSync(path.join(out,'sheet.json'),JSON.stringify(sheet,null,2));
  }
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',seed,resident,geography:process.argv.includes('--legacy')?'freshwater/1':'planetary/1',...observation,comparison,artProof,errors,scope:'Public New World and existing-resident selection; existing body, position, local temperature and real thermal demand. Running cold-expression samples; matched full renderer before/after with unchanged complete paused snapshot. No creature, weather or habitat injection. Heat and thermogenic shiver have separate controlled evidence.',creatorAcceptance:false},null,2));
  console.log(JSON.stringify({samples:observation.samples,actorId:observation.actorId,kind:observation.rows[0].kind,comparison,errors}));
  await page.close();await context.close();
}catch(error){
  fs.writeFileSync(path.join(out,'FAILED-OBSERVATION.json'),JSON.stringify({status:'FAILED',message:error.message},null,2));throw error;
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
