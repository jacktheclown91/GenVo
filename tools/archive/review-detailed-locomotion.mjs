// Native autonomous locomotion observation using public New World and AUTO controls.
// Usage: node tools/review-detailed-locomotion.mjs <source root> <fresh output> [seed] [creature]
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
  const observation=await page.evaluate(async()=>{
    const g=window.__GENVO8__,motion=g.renderer.motion,original=motion.sample;
    const rows=[],ids=new Set();let walking=0,turns=0;
    const headings=new Map();
    motion.sample=function(animal,tick,now,options){
      const pose=original.call(this,animal,tick,now,options);
      if(!animal.player&&pose.moving){
        walking++;ids.add(animal.id);
        const dir=Math.atan2(pose.headingY,pose.headingX),prior=headings.get(animal.id);
        if(prior!==undefined&&Math.abs(dir-prior)>.1)turns++;
        headings.set(animal.id,dir);
        if(rows.length<120)rows.push({id:animal.id,tick,x:pose.x,y:pose.y,gait:pose.gaitPhase});
      }
      return pose;
    };
    try{await new Promise(resolve=>setTimeout(resolve,8000));}
    finally{motion.sample=original;}
    return{walkingSamples:walking,creatures:[...ids],headingChanges:turns,samples:rows,
      nativeArt:g.nativeArtStatus().status,scope:'Ordinary New World with public AUTO and the actual optional64 batch; unmodified autonomous movement observed through the live presentation tracker. No organism or movement injection. This observation does not establish creator visual acceptance.'};
  });
  await page.screenshot({path:path.join(out,'native-autonomous-walking.png')});
  if(!observation.walkingSamples)throw Error('No autonomous walking observed');
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({...observation,artProof,errors},null,2));
  console.log(JSON.stringify({...observation,samples:undefined}));
  await page.close();await context.close();
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
