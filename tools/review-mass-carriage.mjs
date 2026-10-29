// Native covering review through public authored-founder import and ordinary movement.
// Usage: node tools/review-feeding-anatomy.mjs <source root> <fresh output> [seed] [fur|feathers|shell]
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
const seed=process.argv[4]||'GENVO8-TEST-A',creature='sandbox',subject=process.argv[5]||'shell';
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
  const spec={fur:{root:'soft-torso',cover:'fur-mantle',leg:'runner-leg',mouth:'grazing-mouth'},feathers:{root:'soft-torso',cover:'feather-mantle',leg:'walking-leg',mouth:'beak-mouth'},shell:{root:'dome-torso',cover:'shell-back',leg:'sturdy-leg',mouth:'grazing-mouth'}}[subject];if(!spec)throw Error('Unknown covering subject');
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

  await page.keyboard.press('=');await page.waitForTimeout(200);
  await page.evaluate(async()=>{
    const g=window.__GENVO8__,{locomotionStyle,visualBuildWeight,locomotionCacheToken}=await import('/src/render/locomotion-style.js');
    const {loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{setPartArtPreview}=await import('/src/render/runtime-part-art.js');
    setPartArtPreview((await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:64})).parts);
    const original=g.renderer.drawAnimal,observations=new Map();
    window.__massReview={observations,queries:0,totalMs:0,restore(){g.renderer.drawAnimal=original}};
    g.renderer.drawAnimal=function(a,tile){
      if(!g.sim.paused){
        const start=performance.now(),weight=visualBuildWeight(a),style=locomotionStyle(a),key=locomotionCacheToken(a),elapsed=performance.now()-start;
        const r=window.__massReview;r.queries++;r.totalMs+=elapsed;
        let entry=observations.get(a.id);
        if(!entry){entry={id:a.id,player:!!a.player,first:{x:a.x,y:a.y},last:{x:a.x,y:a.y},weight,style,key,samples:0};observations.set(a.id,entry)}
        entry.last={x:a.x,y:a.y};entry.samples++;
      }
      return original.call(this,a,tile);
    };
  });
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(1300);await page.keyboard.up('ArrowLeft');
  await page.screenshot({path:path.join(out,'actual-movement.png')});
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(850);await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(750);
  await page.keyboard.press('p');await page.waitForFunction(()=>window.__GENVO8__.sim.paused);
  await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained},null,{timeout:20000});
  const proof=await page.evaluate(async()=>{
    const g=window.__GENVO8__,r=window.__massReview,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'mass-carriage-native'}))),before=snapshot();
    for(let i=0;i<5;i++)g.renderer.render();
    const stateExact=before===snapshot();r.restore();
    const rows=[...r.observations.values()].map(e=>({...e,distance:Math.hypot(e.last.x-e.first.x,e.last.y-e.first.y)}));
    return {rows,queries:r.queries,meanQueryMs:r.totalMs/r.queries,stateExact,contacts:g.renderer.groundContacts?.stats};
  });
  if(!proof.rows.some(e=>e.player&&e.distance>.05&&e.weight.source==='relative-anatomical-load/1'))throw Error('No actual canonical-mass player travel');
  if(!proof.rows.some(e=>!e.player&&e.distance>.01&&e.weight.source==='relative-anatomical-load/1'))throw Error('No actual canonical-mass autonomous travel');
  if(!proof.stateExact)throw Error('Presentation changed canonical graph');
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',subject,seed,proof,errors,creatorAcceptance:false,scope:'Public legal authored founder, actual keyboard and autonomous movement. No mass/age/position/motion/resources altered. Query overhead and paused graph parity, not full mature-world performance acceptance.'},null,2));
  console.log(JSON.stringify({subject,moving:proof.rows.filter(e=>e.distance>.01).map(e=>({id:e.id,player:e.player,mass:e.weight.mass,heavy:e.style.heavy,distance:e.distance})),meanQueryMs:proof.meanQueryMs,stateExact:proof.stateExact}));
  await page.close();await context.close();
}catch(error){fs.writeFileSync(path.join(out,'FAILED-OBSERVATION.json'),JSON.stringify({status:'FAILED',message:error.message},null,2));throw error}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
