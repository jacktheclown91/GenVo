// Native controlled turn fixture, using real artwork and an unchanged world.
// Usage: node tools/review-work-comparison.mjs <source root> <fresh output> [seed] [creature]
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
const seed=process.argv[4]||'PLANET-OBS-3',creature=process.argv[5]||'starter-burrow';
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

  await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
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
    const {applyWorkMotion,CLIMB_PIXEL_HEIGHT}=await import('/src/render/work-motion.js'),{behaviorVisualState}=await import('/src/render/behavior.js');
    const detail=await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:64}),authoredParts=Object.fromEntries(detail.parts);
    const base=starterPlan('small-torso'),climberPlan=makePlan(base.nodes.map(n=>n.socket==='limb.1'||n.socket==='limb.7'?{...n,partId:'climber-leg'}:n));
    const animals=[{...structuredClone(original),name:'Supported climb and descent',mode:'climb',bodyPlan:climberPlan},{...structuredClone(original),name:'Actual digging organs and bracing',mode:'dig'},{...structuredClone(original),name:'Canopy holding posture',mode:'perch',bodyPlan:climberPlan}];
    const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1000;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    const rows=animals.map(a=>({name:a.name,bodyPlan:a.bodyPlan.id}));
    function render(ms=0){
      c.fillStyle='#14251d';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#e4d9b5';c.font='23px Georgia';c.fillText('GenVo · Grip, pull and excavation',24,34);
      c.font='14px system-ui';c.fillStyle='#a7b99f';c.fillText('Actual modular optional64/native32 artwork. Staged states, eight directions. The biological world stays paused and exact.',24,59);
      c.fillText('Before: action-frame loop',150,85);c.fillText('After: progress-driven grips / scoops / braces',820,85);
      const phase=ms/110%8,dir=Math.floor(ms/900)&7;
      animals.forEach((animal,row)=>{
        c.fillStyle='#d5bd76';c.fillText(animal.name,24,130+row*285);
        const ph=phenotypeFor(animal),palette=creaturePalette(ph);
        for(let column=0;column<2;column++){
          const action=animal.mode==='perch'?'idle':animal.mode,height=(1-Math.cos(ms/1800*Math.PI))*1.5,elapsed=ms/1000%2.5;
          const frame=animal.mode==='dig'?elapsed*4:ms/1000*3;
          const behavior=behaviorVisualState({bodyPlan:animal.bodyPlan,id:animal.id,action,phase:frame,moving:action==='climb'});
          if(column)applyWorkMotion(behavior,animal.mode==='dig'?{kind:'dig',elapsed}:{kind:animal.mode,height:animal.mode==='perch'?3:height,holding:animal.mode==='perch',descending:Math.sin(ms/1800*Math.PI)<0});
          c.save();c.translate(310+column*670,235+row*285-(animal.mode==='climb'?height*CLIMB_PIXEL_HEIGHT*6:0));
          drawGenvoSprite(c,{animal,phenotype:ph,palette,authoredParts,scale:6,frame,moving:action==='climb',authoredTimeMs:frame*125,pose:{dir,action,behavior}});c.restore();
        }
      });
    }
    const {SPRITE_STATS}=await import('/src/render/genvo-draw.js');
    const cacheBefore=SPRITE_STATS.hits,cacheAnimal=animals[0],cacheBehavior=behaviorVisualState({bodyPlan:cacheAnimal.bodyPlan,action:'climb',moving:true});applyWorkMotion(cacheBehavior,{kind:'climb',height:1,holding:false,descending:false});
    const cacheOptions={animal:cacheAnimal,phenotype:phenotypeFor(cacheAnimal),palette:creaturePalette(phenotypeFor(cacheAnimal)),scale:3,frame:2,moving:true,frozenPose:true,cacheKey:'work-freeze-review-'+cacheAnimal.bodyPlan.id,pose:{dir:2,action:'climb',behavior:cacheBehavior}};
    for(let i=0;i<10;i++){drawGenvoSprite(c,cacheOptions);await new Promise(resolve=>requestAnimationFrame(resolve));}
    const frozenCacheHits=SPRITE_STATS.hits-cacheBefore;if(frozenCacheHits<5)throw Error('Frozen moving work pose did not reuse native sprites');
    render();const png=canvas.toDataURL('image/png');
    document.body.append(canvas);canvas.style.cssText='position:fixed;inset:0;width:100%;height:auto;z-index:2147483647;pointer-events:none';
    const started=performance.now();requestAnimationFrame(function tick(now){render(Math.max(0,now-started));if(now-started<7500)requestAnimationFrame(tick);});
    const after=snapshot();let difference=0;while(difference<saved.length&&saved[difference]===after[difference])difference++;
    return{scope:'Staged native progress traces on the actual public burrower body and legal paired-climber body. Same art, joints and body proportions; the after column receives the new observed-progress fields. Height and work are staged only on private draw inputs; the biological world stays paused and exact.',rows,frozenCacheHits,stateExact:saved===after,stateDifference:saved===after?null:{before:saved.slice(Math.max(0,difference-100),difference+160),after:after.slice(Math.max(0,difference-100),difference+160)},png};
  });
  fs.writeFileSync(path.join(out,'native-work-comparison.png'),Buffer.from(proof.png.split(',')[1],'base64'));delete proof.png;
  fs.writeFileSync(path.join(out,'snapshot-check.json'),JSON.stringify({...proof,png:undefined},null,2));
  if(!proof.stateExact)throw Error('Presentation changed simulation state');
  await page.waitForTimeout(7500);
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({...proof,errors,creatorAcceptance:false},null,2));
  console.log(JSON.stringify(proof));await page.close();await context.close();
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
