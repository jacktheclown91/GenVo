// Detailed padded limbs on a legal furred founder, through public import and movement.
// Usage: node tools/review-padded-limbs.mjs <source root> <fresh output> [seed] [fur]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {FounderDesign} from '../src/lineage/founder-design.js';
import {place,replaceRoot} from '../src/lineage/evolution-draft.js';

const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright')}catch{
  playwright=require(path.join(process.env.USERPROFILE,
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
if(!process.argv[2]||!process.argv[3])throw Error('Supply source root and fresh evidence directory');
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
const seed=process.argv[4]||'GENVO8-TEST-A',creature='sandbox',subject=process.argv[5]||'fur';
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
  if(process.argv.includes('--mature')){await page.locator('#newWorldStartingPoint').selectOption('catalog:mature-valley-d100');await page.locator('#newWorldMovementRules').selectOption('current');}
  await page.getByRole('button',{name:'Begin World',exact:true}).click();
  const spec={fur:{root:'soft-torso',cover:'fur-mantle',leg:'padded-leg',mouth:'grazing-mouth'},feathers:{root:'soft-torso',cover:'feather-mantle',leg:'walking-leg',mouth:'beak-mouth'},shell:{root:'dome-torso',cover:'shell-back',leg:'sturdy-leg',mouth:'grazing-mouth'}}[subject];if(!spec)throw Error('Unknown covering subject');
  const design=new FounderDesign('sandbox');
  const rootResult=replaceRoot(design.draft,spec.root);if(!rootResult.ok)throw Error(rootResult.reason);
  for(const node of [...design.draft.plan.nodes].filter(n=>n.socket?.startsWith('limb.'))){const result=place(design.draft,spec.leg,node.parent,node.socket);if(!result.ok)throw Error(result.reason);}
  for(const [part,socket] of [[spec.cover,'dorsal'],[spec.mouth,'mouth']]){const result=place(design.draft,part,'root',socket);if(!result.ok)throw Error(result.reason);}
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
  await page.waitForFunction(async()=>{
    const g=window.__GENVO8__,{dayPhaseOf}=await import('/src/ecology/diurnal-temperature.js');
    return g.sim.player()?.alive&&dayPhaseOf(g.sim).daylight>.8;
  },null,{timeout:60000});
  await page.keyboard.press('p');
  await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
  const comparison=await page.evaluate(async()=>{
    const g=window.__GENVO8__,{loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{setPartArtPreview}=await import('/src/render/runtime-part-art.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    if(!g.sim.paused)throw Error('Public pause failed');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'covering-review'}))),before=snapshot(),maps={};
    for(const resolution of [64,128])maps[resolution]=(await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution})).parts;
    const prior=new Map(maps[64]);prior.delete('padded-leg');
    const images={},timings=[];
    for(const [label,parts] of [['native32',null],['before64',prior],['current64',maps[64]],['closeup128',maps[128]]]){setPartArtPreview(parts);g.renderer.render();images[label]=g.renderer.canvas.toDataURL();const samples=[];for(let i=0;i<14;i++){const start=performance.now();g.renderer.render();if(i>=4)samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);timings.push({label,medianMs:samples[5],p90Ms:samples[9],samples:10});}
    setPartArtPreview(maps[64]);if(before!==snapshot())throw Error('Covering art switch changed the complete snapshot');
    const a=g.sim.player();if(a.bodyPlan.nodes.filter(n=>n.partId==='padded-leg').length<4)throw Error('Actual founder lacks four padded limbs');return{study:(await import('/src/render/organism-study.js')).organismStudy(a,{seed:g.sim.seed,day:g.sim.day,bodySizeRules:g.sim.bodySizeRules}),images,timings,stateExact:true,plan:a.bodyPlan,parts:a.bodyPlan.nodes.map(n=>n.partId),position:{x:a.x,y:a.y},decodedRgbaBytesPerVariant:128*128*16*4};
  });
  for(const [label,data] of Object.entries(comparison.images))fs.writeFileSync(path.join(out,label+'.png'),Buffer.from(data.split(',')[1],'base64'));delete comparison.images;
  await page.keyboard.press('p');const start=await page.evaluate(()=>{const a=window.__GENVO8__.sim.player();return{x:a.x,y:a.y};});
  await page.keyboard.down('a');await page.waitForTimeout(900);await page.keyboard.up('a');await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'native-moving64.png')});
  const movement=await page.evaluate(start=>{const g=window.__GENVO8__,a=g.sim.player();return{distance:Math.hypot(a.x-start.x,a.y-start.y),start,end:{x:a.x,y:a.y},tick:g.sim.tickCount};},start);
  if(movement.distance<.05)throw Error('Ordinary authored-body movement was not observed');if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',subject,seed,comparison,movement,errors,scope:'Public recorded sandbox-founder import; real supported anatomy and ordinary keyboard movement in a new planetary world. Same paused daylight world/camera across native32/prior64/refined64/128 art; prior64 uses native32 padded-limb fallback only. No living actor, food, position or weather injection. 128 capture uses the same gameplay footprint; Lab closeups are separate.',creatorAcceptance:false},null,2));
  console.log(JSON.stringify({subject,distance:movement.distance,stateExact:comparison.stateExact,timings:comparison.timings,errors}));await page.close();await context.close();
}catch(error){
  fs.writeFileSync(path.join(out,'FAILED-OBSERVATION.json'),JSON.stringify({status:'FAILED',message:error.message},null,2));throw error;
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
