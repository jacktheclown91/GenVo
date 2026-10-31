import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/capture-action-sheets.mjs <exported build> <out dir> [start=mature|new] [seconds=180] [zoom=2]
// Animation audit: plays the exported game at 1x (player on AUTO, nothing staged) and, whenever
// a visible creature near the player is in one of the key visual actions (as the renderer
// classifies it), records a burst of zoomed frames of that creature. Frames are saved per
// action for contact sheets. Observation only.
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),start=process.argv[4]||'mature',seconds=Number(process.argv[5]||180),zoom=Number(process.argv[6]||2),half=24*zoom;
fs.mkdirSync(out,{recursive:true});
const WANT=['move','eat','drink','crack','court','approach','hunt','stalk','flee','nurse','suckle','lay-settle','hatch-settle','guard','social','dig','swim','rest'];
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip','.ogg':'audio/ogg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch();const log={start,captured:{}};
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 if(start==='mature'){const sel=page.locator('.menu-view[data-screen="new"] select').nth(1);const opts=await sel.locator('option').allTextContents();await sel.selectOption({label:opts.find(o=>/Mature/.test(o))})}
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:180000});
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true);g.sim.setPlayerAutonomy(true)});
 await page.evaluate(z=>{window.__GENVO8__.renderer.zoom=z},zoom);log.zoom=zoom;
 const t0=Date.now();
 while(Date.now()-t0<seconds*1000){await page.waitForTimeout(700);
  for(const sel of ['#creatureEditor:not([hidden]) [data-act="cancel"]','#youngSummary:not([hidden]) [data-young="continue"]'])if(await page.locator(sel).count())await page.locator(sel).click();
  const cands=await page.evaluate(async want=>{const g=window.__GENVO8__,sim=g.sim,p=sim.player(),{visualActionFromIntent}=await import('/src/render/behavior.js'),{visuallyObservable}=await import('/src/ecology/atmospheric-visibility.js');if(!p)return[];
   const cv=document.querySelector('canvas').getBoundingClientRect();return sim.animals.filter(a=>a.alive&&Math.hypot(a.x-p.x,a.y-p.y)<10&&(a.player||visuallyObservable(sim,p,a))).map(a=>{const moving=Math.hypot(a.vx||0,a.vy||0)>.01||(a.intent&&a.target&&Math.hypot(a.target.x-a.x,a.target.y-a.y)>.4);const act=visualActionFromIntent(sim,a,{moving});const s=g.renderer.screenPos?.get(a.id);return s&&want.includes(act)?{id:a.id,act,species:a.species,player:!!a.player,x:cv.left+s.x*cv.width/g.renderer.w,y:cv.top+s.y*cv.height/g.renderer.h}:null}).filter(Boolean)},WANT);
  const pick=cands.find(c=>(log.captured[c.act]||0)<2);if(!pick)continue;
  const n=(log.captured[pick.act]=(log.captured[pick.act]||0)+1),dir=path.join(out,pick.act);fs.mkdirSync(dir,{recursive:true});
  for(let f=0;f<8;f++){const at=await page.evaluate(id=>{const g=window.__GENVO8__,cv=document.querySelector('canvas').getBoundingClientRect(),s=g.renderer.screenPos?.get(id);return s?{x:cv.left+s.x*cv.width/g.renderer.w,y:cv.top+s.y*cv.height/g.renderer.h}:null},pick.id);if(!at)break;
   await page.screenshot({path:path.join(dir,`${n}-${pick.species}-${pick.id}-f${f}.png`),clip:{x:Math.max(0,at.x-half),y:Math.max(0,at.y-half),width:half*2,height:half*2}});await page.waitForTimeout(110)}}
 log.errors=errors;
}finally{fs.writeFileSync(path.join(out,'log.json'),JSON.stringify(log,null,1));await browser.close();server.close()}
console.log(JSON.stringify(log));
