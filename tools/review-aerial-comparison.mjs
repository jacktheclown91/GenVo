// Native controlled turn fixture, using real artwork and an unchanged world.
// Usage: node tools/review-aerial-comparison.mjs <source root> <fresh output> [seed] [creature]
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
  const context=await browser.newContext({viewport:{width:1440,height:1000},
    recordVideo:{dir:out,size:{width:1440,height:1000}}});
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

  const proof=await page.evaluate(async()=>{
    const g=window.__GENVO8__;
    const [{drawGenvoSprite},{phenotypeFor},{creaturePalette},{starterPlan},{makePlan,validatePlan},{coordinatedGaitOffsets},{assemblyFor},{createSimulationSnapshot},{encodeSnapshotGraph}]=await Promise.all([
      import('/src/render/genvo-draw.js'),import('/src/organisms/species.js'),import('/src/render/creature-palette.js'),
      import('/tools/creature-lab/assembly-model.js'),import('/src/lineage/body-plan.js'),import('/src/render/gait-coordination.js'),import('/src/render/creature-assembler.js'),
      import('/src/persistence/save-manager.js'),import('/src/persistence/scenario-codec.js')]);
    if(!g.sim.paused)throw Error('Public pause did not stop the world');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'gait-coordination'})));
    const saved=snapshot(),original=g.sim.player();
    const {loadPartArtVariant}=await import('/src/render/part-art-variants.js');
    const {aerialPose,applyAerialPose}=await import('/src/render/aerial-presentation.js'),{behaviorVisualState}=await import('/src/render/behavior.js'),{attachPart}=await import('/tools/creature-lab/assembly-model.js');
    const detail=await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:64}),authoredParts=Object.fromEntries(detail.parts);
    const flier=structuredClone(original),gliderPlan=attachPart(attachPart(starterPlan('small-torso'),'root','flank.left','gliding-membrane'),'root','flank.right','gliding-membrane');
    const animals=[{...flier,name:'Powered wingbeat',mode:'fly'},{...flier,id:80001,bodyPlan:gliderPlan,name:'Passive glider',mode:'glide'},{...flier,id:80002,name:'Landing recovery',mode:'land'}];
    const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1000;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    const rows=animals.map(a=>({name:a.name,bodyPlan:a.bodyPlan.id}));
    function render(ms=0){
      c.fillStyle='#14251d';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#e4d9b5';c.font='23px Georgia';c.fillText('GenVo · Aerial anatomy and landing',24,34);
      c.font='14px system-ui';c.fillStyle='#a7b99f';c.fillText('Actual modular optional64/native32 artwork. Staged states, eight directions. The biological world stays paused and exact.',24,59);
      c.fillText('Before: shared gait phase and untucked legs',150,85);c.fillText('After: powered stroke / steady glide / recovery',820,85);
      const phase=ms/110%8,dir=Math.floor(ms/900)&7;
      animals.forEach((animal,row)=>{
        c.fillStyle='#d5bd76';c.fillText(animal.name,24,130+row*285);
        const ph=phenotypeFor(animal),palette=creaturePalette(ph);
        for(let column=0;column<2;column++){
          const action=animal.mode==='land'?'idle':animal.mode;
          const behavior=behaviorVisualState({bodyPlan:animal.bodyPlan,id:animal.id,action,phase,moving:action==='fly'});
          if(column)applyAerialPose(behavior,aerialPose({mode:animal.mode,phase,age:animal.mode==='land'?(ms%2400)/2400*.26:1,fromDeployment:1}));
          c.save();c.translate(310+column*670,235+row*285);
          drawGenvoSprite(c,{animal,phenotype:ph,palette,authoredParts,scale:6,frame:phase,moving:action==='fly',authoredTimeMs:phase*125,pose:{dir,action,behavior}});c.restore();
        }
      });
    }
    render();const png=canvas.toDataURL('image/png');
    document.body.append(canvas);canvas.style.cssText='position:fixed;inset:0;width:100%;height:auto;z-index:2147483647;pointer-events:none';
    const started=performance.now();requestAnimationFrame(function tick(now){render(Math.max(0,now-started));if(now-started<7500)requestAnimationFrame(tick);});
    return{scope:'Staged native comparison of the actual public winged-flier body, a legal paired-membrane glider and landing posture. Preceding behavior inputs omit only the new aerial fields, keeping its original wing folding and walking limbs. Landing is slowed for inspection; the live game remains paused and exact.',rows,stateExact:saved===snapshot(),png};
  });
  fs.writeFileSync(path.join(out,'native-aerial-comparison.png'),Buffer.from(proof.png.split(',')[1],'base64'));delete proof.png;
  if(!proof.stateExact)throw Error('Presentation changed simulation state');
  await page.waitForTimeout(7500);
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({...proof,errors,creatorAcceptance:false},null,2));
  console.log(JSON.stringify(proof));await page.close();await context.close();
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
