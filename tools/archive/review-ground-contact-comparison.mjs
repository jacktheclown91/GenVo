// Native controlled turn fixture, using real artwork and an unchanged world.
// Usage: node tools/review-ground-contact-comparison.mjs <source root> <fresh output> [seed] [creature]
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
    const {genvoVisualPose,gaitTravelFor}=await import('/src/render/genvo.js');const {GroundContactTracker}=await import('/src/render/ground-contacts.js');
    const detail=await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:64});
    const authoredParts=Object.fromEntries(detail.parts);
    const definitions=[['Two limbs','small-torso',[1,7]],['Four limbs','small-torso',null],['Sturdy eight limbs','reinforced-torso',null,'sturdy-leg'],['Twelve limbs','long-torso',null]];
    const animals=definitions.map(([name,root,keep,limb],index)=>{
      const plan=starterPlan(root),nodes=keep?plan.nodes.filter(n=>!n.socket?.startsWith('limb.')||keep.includes(Number(n.socket.slice(5)))):plan.nodes;
      const bodyPlan=makePlan(limb?nodes.map(n=>n.socket?.startsWith('limb.')?{...n,partId:limb}:n):nodes);const valid=validatePlan(bodyPlan);if(!valid.ok)throw Error(valid.errors.join('; '));
      return{...structuredClone(original),id:80000+index,name,bodyPlan,genVersion:0};
    });
    const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1000;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    const trackers=animals.map(()=>new GroundContactTracker()),world={},rows=animals.map(a=>({name:a.name,bodyPlan:a.bodyPlan.id}));
    let lastTime=0,x=0,y=0,gait=0;
    function render(ms=0){
      const dt=Math.min(32,Math.max(0,ms-lastTime));lastTime=ms;
      const t=ms%6000,moving=t>600&&t<4600,dir=t<2400?2:t<4600?3:4;
      const dx=moving?dt*.00011:0,dy=moving&&dir===3?dt*.00008:0;x+=dx;y+=dy;gait+=Math.hypot(dx,dy);
      c.fillStyle='#14251d';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#e4d9b5';c.font='23px Georgia';c.fillText('GenVo · Grounded walking and recovery',24,34);
      c.font='14px system-ui';c.fillStyle='#a7b99f';c.fillText('Real modular 64px artwork. Legal body plans. Staged movement trace; the paused biological world stays exact.',24,59);
      c.fillText('Before: phase and rounded origin',150,85);c.fillText('After: persistent support contact',820,85);
      animals.forEach((animal,row)=>{
        c.fillStyle='#d5bd76';c.fillText(animal.name,24,125+row*210);
        const ph=phenotypeFor(animal),palette=creaturePalette(ph),scale=6,phase=Math.floor((gait*128/gaitTravelFor(ph.limbScale,assemblyFor(animal).legSlots)%8)*4)/4;
        for(let column=0;column<2;column++){
          const ox=Math.round(x*16*scale),oy=Math.round(y*16*scale),baseX=230+column*670,baseY=195+row*210;
          c.save();c.beginPath();c.rect(100+column*670,95+row*210,590,195);c.clip();
          c.strokeStyle='#314c3a';c.lineWidth=1;for(let k=-12;k<20;k++){const gx=baseX+k*48-ox;c.beginPath();c.moveTo(gx,105+row*210);c.lineTo(gx,285+row*210);c.stroke();}
          c.translate(baseX,baseY);
          const frame=column?trackers[row].begin({id:animal.id,world,anatomy:animal.bodyPlan.id,x:ox/(16*scale),y:oy/(16*scale),dir,now:ms,moving,action:moving?'move':'idle'}):null;
          drawGenvoSprite(c,{animal,phenotype:ph,palette,authoredParts,scale,frame:phase,moving,groundContactFrame:frame,pose:{dir,action:moving?'move':'idle'}});c.restore();
        }
      });
    }
    render();const png=canvas.toDataURL('image/png');
    document.body.append(canvas);canvas.style.cssText='position:fixed;inset:0;width:100%;height:auto;z-index:2147483647;pointer-events:none';
    const started=performance.now();requestAnimationFrame(function tick(now){render(now-started);if(now-started<7200)requestAnimationFrame(tick);});
    return{scope:'Controlled camera-following movement, start, turn and stop with four legal real body plans and actual optional64 assets. Comparison bypasses only the new final-paint contact frame; live simulation remains paused.',rows,stateExact:saved===snapshot(),png};
  });
  fs.writeFileSync(path.join(out,'native-ground-contact-comparison.png'),Buffer.from(proof.png.split(',')[1],'base64'));delete proof.png;
  if(!proof.stateExact)throw Error('Presentation changed simulation state');
  await page.waitForTimeout(7200);
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({...proof,errors,creatorAcceptance:false},null,2));
  console.log(JSON.stringify(proof));await page.close();await context.close();
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
