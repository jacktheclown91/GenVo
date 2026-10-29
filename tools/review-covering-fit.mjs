// Native covering fit on an existing recorded resident; no organism edits.
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
const seed=process.argv[4]||'GENVO8-TEST-A',creature='resident',resident=process.argv[5]||'86';
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
  if(process.argv.includes('--legacy'))await page.locator('#newWorldGeography').selectOption('freshwater/1');
  if(process.argv.includes('--mature')){await page.locator('#newWorldStartingPoint').selectOption('catalog:mature-valley-d100');}
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
  const result=await page.evaluate(async()=>{
    const g=window.__GENVO8__,{loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{setPartArtPreview,artForPart}=await import('/src/render/runtime-part-art.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js'),{developmentFor}=await import('/src/family/family.js'),{phenotypeFor}=await import('/src/organisms/species.js'),{assemblyFor}=await import('/src/render/creature-assembler.js'),{nativeCoveringFit}=await import('/src/render/covering-fit.js');
    if(!g.sim.paused)throw Error('Public pause failed');const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'covering-fit-native'}))),before=snapshot(),target=g.sim.player();
    const ids=['filament-tuft','fur-mantle','feather-mantle','shell-back'];setPartArtPreview(null);const native=new Map(ids.map(id=>[id,artForPart(id)]).filter(([,art])=>art)),variants={32:native};for(const resolution of [64,128])variants[resolution]=(await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution})).parts;
    const original=g.renderer.drawAnimal,images={},timings=[],observed=[];let active=null,baseline=false;
    g.renderer.drawAnimal=function(a,...args){active=a;try{return original.call(this,a,...args)}finally{active=null;}};
    try{
      for(const resolution of [32,64,128]){
        const parts=new Map(variants[resolution]);for(const id of ids){const art=parts.get(id)||native.get(id);if(!art)continue;parts.set(id,{...art,draw(c,args){
          let fit=null,growth=null;if(active){const p=phenotypeFor(active),d=developmentFor(active),shape=assemblyFor(active).shape,angle=(args.facing||0)*Math.PI/4,ox=Math.abs(Math.sin(angle)),oy=Math.abs(Math.cos(angle)),sum=ox+oy;growth=active.player?d.growth:Math.round(d.growth*32)/32;fit=nativeCoveringFit(id,{nativeBodyScale:p.bodyScale*growth,nativeBodyWidthScale:(p.bodyWidthScale||1)*(shape?(ox*shape.length+oy*shape.width)/sum*shape.size:1),nativeBodyHeightScale:(p.bodyHeightScale||1)*(shape?(oy*shape.length+ox*shape.width)/sum*shape.size:1)});}
          if(active?.id===target.id&&observed.length<80)observed.push({resolution,id,baseline,growth,fit,facing:args.facing});
          if(baseline&&fit){c.save();c.scale(1/fit.x,1/fit.y);try{return art.draw(c,args)}finally{c.restore()}}return art.draw(c,args);
        }});}
        for(const old of [true,false]){baseline=old;setPartArtPreview(parts);for(let i=0;i<6;i++)g.renderer.render();const samples=[];for(let i=0;i<20;i++){const start=performance.now();g.renderer.render();samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);timings.push({resolution,baseline:old,medianMs:samples[10],p95Ms:samples[18],samples:20});images[(old?'before-':'current-')+resolution]=g.renderer.canvas.toDataURL();}
      }
      if(before!==snapshot())throw Error('Covering fit changed the complete saved state');if(!observed.some(r=>r.id==='shell-back'&&r.fit))throw Error('Actual recorded shell fitting was not observed');
      return{images,timings,observed,stateExact:true,actor:{id:target.id,age:target.age,development:developmentFor(target),bodyPlan:target.bodyPlan,entry:g.sim.creatureStart},scope:'Public recorded mature-world resident selection; actual inherited anatomy and development. Before cancels only the new covering deformation around its unchanged pivot. No living body, age, position, resources, growth or movement rules changed.'};
    }finally{g.renderer.drawAnimal=original;setPartArtPreview(variants[64]);}
  });
  for(const [name,data] of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  await page.screenshot({path:path.join(out,'native-recorded-shell.png')});if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',...result,errors,creatorAcceptance:false},null,2));console.log(JSON.stringify({status:'PASS',stateExact:result.stateExact,actorId:result.actor.id,timings:result.timings,errors}));await page.close();await context.close();
}catch(error){
  fs.writeFileSync(path.join(out,'FAILED-OBSERVATION.json'),JSON.stringify({status:'FAILED',message:error.message},null,2));throw error;
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
