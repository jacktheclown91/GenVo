// Native actual swimming observation using public New World and AUTO controls.
// Usage: node tools/review-swim-turns.mjs <source root> <fresh output> [seed] [creature]
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
const seed=process.argv[4]||'GENVO8-TEST-A',creature=process.argv[5]||'starter-dive';
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
  const navigation=[];
  // Public keys only: locate a nearby liquid cell without editing the actor.
  for(let i=0;i<40;i++){
    const route=await page.evaluate(async()=>{
      const {liquidContact}=await import('/src/lineage/ice-locomotion.js'),g=window.__GENVO8__,p=g.sim.player(),w=g.sim.world;
      if(liquidContact(w,p)){
        const dirs=[['ArrowRight',1,0],['ArrowDown',0,1],['ArrowLeft',-1,0],['ArrowUp',0,-1]];
        const rows=dirs.map(([key,dx,dy])=>{let length=0;for(let j=1;j<20;j++){const x=p.x+dx*j,y=p.y+dy*j;if(!w.isPlayable(x,y)||!liquidContact(w,{...p,x,y}))break;length++;}return{key,length};}).sort((a,b)=>b.length-a.length);
        return{wet:true,x:p.x,y:p.y,key:rows[0].key,canSwim:g.sim.canSwim(p)};
      }
      let best=null;for(let dy=-20;dy<=20;dy++)for(let dx=-20;dx<=20;dx++){const x=Math.floor(p.x)+dx+.5,y=Math.floor(p.y)+dy+.5;if(!w.isPlayable(x,y)||!liquidContact(w,{...p,x,y}))continue;const distance=Math.hypot(x-p.x,y-p.y);if(!best||distance<best.distance)best={x,y,distance};}
      if(!best)throw Error('No nearby liquid water');const dx=best.x-p.x,dy=best.y-p.y;
      return{wet:false,x:p.x,y:p.y,key:Math.abs(dx)>Math.abs(dy)?dx>0?'ArrowRight':'ArrowLeft':dy>0?'ArrowDown':'ArrowUp',target:best};
    });
    navigation.push(route);
    if(route.wet){await page.keyboard.down(route.key);break;}
    await page.keyboard.down(route.key);await page.waitForTimeout(300);await page.keyboard.up(route.key);
  }
  await page.evaluate(async()=>{
    const {SwimMotionPresentation}=await import('/src/render/swim-motion.js'),{motionStateOf}=await import('/src/organisms/motion.js');const {organismStudy}=await import('/src/render/organism-study.js'),{developmentFor}=await import('/src/family/family.js'),{visualLifeState}=await import('/src/render/life.js');
    const original=SwimMotionPresentation.prototype.sample,stats=window.__swimTurnReview={samples:0,active:0,turns:0,braking:0,player:0,npc:0,cost:0,rows:[]};
    SwimMotionPresentation.prototype.sample=function(sim,a,time,options){const start=performance.now(),pose=original.call(this,sim,a,time,options);stats.cost+=performance.now()-start;stats.samples++;if(pose){if(!stats.specimen&&a.player&&Math.abs(pose.steer)>.2){const development=developmentFor(a);stats.specimen={study:organismStudy(a,{seed:sim.seed,day:sim.day}),pose,phase:a.anim||0,dir:a.dir,time,development,life:visualLifeState(sim,a,{action:'swim',moving:true,development,timeSeconds:time}),motion:motionStateOf(a),position:{x:a.x,y:a.y}};}stats.active++;stats[a.player?'player':'npc']++;if(Math.abs(pose.steer)>.02)stats.turns++;if(pose.brake>.02)stats.braking++;if(stats.rows.length<240)stats.rows.push({id:a.id,player:!!a.player,tick:sim.tickCount,position:{x:a.x,y:a.y},motion:motionStateOf(a),pose,parts:a.bodyPlan?.nodes.map(n=>n.partId)});}return pose;};
    stats.original=original;
  });
  for(const key of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'])await page.keyboard.up(key);
  const turns=[];let comparison=null;
  for(let step=0;step<12;step++){
    const course=await page.evaluate(async step=>{
      const {liquidContact}=await import('/src/lineage/ice-locomotion.js'),g=window.__GENVO8__,a=g.sim.player(),m=a.motion,heading=m&&Math.hypot(m.vx,m.vy)>.05?Math.atan2(m.vy,m.vx):((a.dir-2)*Math.PI/4),dirs=[['ArrowRight',1,0],['ArrowDown',0,1],['ArrowLeft',-1,0],['ArrowUp',0,-1]];
      const options=dirs.map(([key,dx,dy])=>{let wet=0;for(const d of [.15,.35,.6,.9,1.3]){if(!liquidContact(g.sim.world,{...a,x:a.x+dx*d,y:a.y+dy*d}))break;wet++;}return{key,wet,side:Math.sin(Math.atan2(dy,dx)-heading)}}).filter(o=>o.wet>0).sort((a,b)=>Math.abs(b.side)-Math.abs(a.side)||b.wet-a.wet);
      return{position:{x:a.x,y:a.y},wet:liquidContact(g.sim.world,a),key:options[step%2&&options.length>1?1:0]?.key||'ArrowRight'};
    },step);turns.push(course);await page.keyboard.down(course.key);await page.waitForTimeout(280);
    const observed=await page.evaluate(()=>window.__swimTurnReview.turns>0);
    if(observed&&!comparison){
      await page.screenshot({path:path.join(out,'native-swimming-turn.png')});await page.keyboard.press('p');
      await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
      comparison=await page.evaluate(async()=>{
        const g=window.__GENVO8__,{SwimMotionPresentation}=await import('/src/render/swim-motion.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
        const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'swim-turn-review'}))),before=snapshot(),sample=SwimMotionPresentation.prototype.sample,images={};
        try{for(const enabled of [false,true]){SwimMotionPresentation.prototype.sample=enabled?sample:function(){return null};g.renderer.render();images[enabled?'current':'before']=g.renderer.canvas.toDataURL()}}finally{SwimMotionPresentation.prototype.sample=sample}
        const recorded=window.__swimTurnReview.specimen,a=recorded?.study.animal||g.sim.player(),{motionStateOf}=await import('/src/organisms/motion.js'),{applySwimMotion}=await import('/src/render/swim-motion.js'),{liquidContact}=await import('/src/lineage/ice-locomotion.js');
        const {drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{phenotypeFor}=await import('/src/organisms/species.js'),{developmentFor}=await import('/src/family/family.js'),{visualLifeState}=await import('/src/render/life.js'),{behaviorVisualState}=await import('/src/render/behavior.js'),{creaturePalette}=await import('/src/render/creature-palette.js'),{loadPartArtVariant,setPartArtPreview}=await import('/src/render/runtime-part-art.js');
        const moving=!!recorded,swim=recorded?.pose;
        let enlarged=null;
        if(swim&&recorded){
          const dev=recorded.development,phase=recorded.phase,life=recorded.life,ph=phenotypeFor(a);ph.bodyScale*=dev.growth;ph.limbScale*=.72+.28*dev.growth;ph.sensoryScale*=.78+.22*dev.growth;
          const maps={};for(const resolution of [64,128])maps[resolution]=(await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution})).parts;
          setPartArtPreview(null);const canvas=document.createElement('canvas');canvas.width=960;canvas.height=640;const c=canvas.getContext('2d');c.fillStyle='#172d27';c.fillRect(0,0,960,640);
          for(const [column,resolution] of [32,64,128].entries())for(const [row,enabled] of [false,true].entries()){
            const x=160+column*320,y=165+row*320,behavior=behaviorVisualState({bodyPlan:a.bodyPlan,id:a.id,action:'swim',phase,moving,life});if(enabled)applySwimMotion(behavior,swim);
            c.fillStyle='#e6dab4';c.font='14px sans-serif';c.fillText(resolution+'px · '+(enabled?'actual turn articulation':'preceding symmetric stroke'),column*320+12,row*320+24);c.save();c.translate(x,y);drawGenvoSprite(c,{animal:a,phenotype:ph,scale:8,frame:phase,moving,palette:creaturePalette(ph),authoredParts:resolution===32?undefined:Object.fromEntries(maps[resolution]),pose:{dir:recorded.dir,action:'swim',life,behavior}});c.restore();
          }
          images['actual-state-closeups']=canvas.toDataURL();setPartArtPreview(maps[64]);enlarged={id:a.id,phase,dir:recorded.dir,swim,motion:recorded.motion,growth:dev.growth,scope:'Enlarged rendering of a body and committed motion recorded at an actual liquid-turn sample, using its canonical animation phase; only new articulation switches. Not a new physical trajectory or a Lab simulation.'};
        }
        if(snapshot()!==before)throw Error('Read-only steering comparison changed biology');return{stateExact:true,images,enlarged,scope:'Same paused actual world and camera; new swimming articulation disabled/current. No physical state or motion writes.'};
      });
      for(const [label,png] of Object.entries(comparison.images))fs.writeFileSync(path.join(out,label+'-turn.png'),Buffer.from(png.split(',')[1],'base64'));delete comparison.images;await page.keyboard.press('p');
    }
    await page.keyboard.up(course.key);await page.waitForTimeout(150);
  }
  await page.waitForTimeout(600);
  const observation=await page.evaluate(async()=>{const {SwimMotionPresentation}=await import('/src/render/swim-motion.js'),s=window.__swimTurnReview;SwimMotionPresentation.prototype.sample=s.original;const {original,...rest}=s;return{...rest,meanQueryMs:s.cost/s.samples}});
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:observation.turns?'PASS':'NO-ACTUAL-TURN',navigation,turns,artProof,comparison,observation,errors,creatorAcceptance:false,scope:'Public Shore swimmer New World, optional64/native32 fallback, ordinary directional keys in actual liquid. Real player and nearby wildlife motion read without injection. This is young-world observation, not mature-world or giant acceptance.'},null,2));
  if(!observation.turns)throw Error('No actual liquid turn expression observed');if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({...observation,rows:undefined,specimen:observation.specimen?{id:observation.specimen.study.animal.id,pose:observation.specimen.pose}:null,comparison}));await page.close();await context.close();
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
