import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-living-creatures-browser.mjs <exported build> <evidence dir> [seed=PLANET-OBS-3] [seconds=120]
// Living Creature Pass in the exported game, at 1x with no setup: a fresh world, the player's
// creature on AUTO, video recorded. Every second each creature near the player is logged with
// its reaction stage (watching or backing from a predator, fleeing, investigating, watching
// the stranger, keeping away, posturing) and its inherited temperament; only creatures the
// player's creature can see are counted; screenshots are taken
// the first times a response is on screen. Nothing is forced.
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),seed=process.argv[4]||'PLANET-OBS-3',seconds=Number(process.argv[5]||120);
fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip','.ogg':'audio/ogg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch();const report={seed,seconds,samples:[],stages:{},creatures:{}};
try{
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill(seed);
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:120000});
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true);g.sim.setPlayerAutonomy(true)});
 let shots=0;const shotKinds=new Set();
 for(let i=0;i<seconds;i++){await page.waitForTimeout(1000);
  const lab=page.locator('#creatureEditor:not([hidden]) [data-act="cancel"]');if(await lab.count())await lab.click();
  const young=page.locator('#youngSummary:not([hidden]) [data-young="continue"]');if(await young.count())await young.click();
  const s=await page.evaluate(async()=>{const g=window.__GENVO8__,sim=g.sim,p=sim.player(),{reactionExpression}=await import('/src/render/reaction-expression.js'),{visuallyObservable}=await import('/src/ecology/atmospheric-visibility.js');if(!p)return null;
   return{t:sim.tickCount,day:sim.day,near:sim.animals.filter(a=>a.alive&&!a.player&&Math.hypot(a.x-p.x,a.y-p.y)<9).map(a=>{const r=reactionExpression(sim,a,{time:performance.now()/1000});const seen=visuallyObservable(sim,p,a);return{id:a.id,species:a.species,temperament:+(a.genes.temperament??1).toFixed(3),intent:a.intent,stage:r?.stage||null,seen,screen:seen?g.renderer.screenPos?.get(a.id)||null:null}})}});
  if(!s)continue;report.samples.push({t:s.t,day:s.day,near:s.near.map(({screen,...x})=>x)});
  for(const c of s.near){const e=report.creatures[c.id]??={species:c.species,temperament:c.temperament,stages:{}};if(c.stage&&c.seen){e.stages[c.stage]=(e.stages[c.stage]||0)+1;report.stages[c.stage]=(report.stages[c.stage]||0)+1}}
  // Label every visibly reacting creature with a temporary overlay, then remove it.
  const shown=s.near.filter(c=>c.stage&&c.screen),fresh=shown.find(c=>!shotKinds.has(c.stage));
  if(fresh&&shots<6){shotKinds.add(fresh.stage);shots++;
   await page.evaluate(list=>{const g=window.__GENVO8__,cv=document.querySelector('canvas').getBoundingClientRect(),layer=document.createElement('div');layer.id='__labels';layer.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:99999';
    for(const c of list){const x=cv.left+c.screen.x*cv.width/g.renderer.w,y=cv.top+c.screen.y*cv.height/g.renderer.h,l=document.createElement('div');l.textContent=`${c.stage} · ${c.species} ${c.temperament}`;l.style.cssText=`position:absolute;left:${x-60}px;top:${y-38}px;width:120px;text-align:center;font:600 11px system-ui;color:#fff6c8;text-shadow:0 0 3px #000,0 0 3px #000`;const ring=document.createElement('div');ring.style.cssText=`position:absolute;left:${x-16}px;top:${y-16}px;width:32px;height:32px;border:2px solid #ffd76a;border-radius:50%`;layer.append(l,ring)}document.body.append(layer)},shown);
   await page.screenshot({path:path.join(out,`stage-${fresh.stage}-${fresh.species}-${fresh.id}.png`)});await page.evaluate(()=>document.getElementById('__labels')?.remove())}}
 report.errors=errors;await context.close();report.video=fs.readdirSync(out).find(f=>f.endsWith('.webm'))||null;
 const responders=Object.values(report.creatures).filter(c=>Object.keys(c.stages).length);
 report.summary={nearbyCreatures:Object.keys(report.creatures).length,responders:responders.length,stages:report.stages,
  byStage:Object.fromEntries(Object.keys(report.stages).map(st=>[st,responders.filter(c=>c.stages[st]).map(c=>`${c.species} ${c.temperament}`)]))};
 assert.deepEqual(errors,[]);assert.ok(Object.keys(report.stages).length>=2,'creatures near the player react in at least two different ways: '+JSON.stringify(report.stages));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close()}
console.log(JSON.stringify(report.summary,null,1));
