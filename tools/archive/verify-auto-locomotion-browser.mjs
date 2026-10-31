import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-auto-locomotion-browser.mjs <exported build> <evidence dir> [auto|keys] [seed] [creature]
// Records a video of the player creature at 1x and, every rendered frame, the
// drawn position and whether the renderer would draw it walking. While the
// creature is really travelling it should be drawn walking, and its drawn
// position should advance every frame rather than in jumps.
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),mode=process.argv[4]||'auto',seed=process.argv[5]||'PLANET-B0-A',creature=process.argv[6]||'starter-jump';
fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch();
const context=await browser.newContext({viewport:{width:960,height:540},recordVideo:{dir:out,size:{width:960,height:540}}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldCreature').selectOption(creature);await page.locator('#newWorldSeed').fill(seed);
await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:120000});
await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true)});await page.waitForTimeout(1500);
if(mode==='auto')await page.evaluate(()=>window.__GENVO8__.sim.setPlayerAutonomy(true));
// Per-frame record: simulated and drawn positions, drawn-moving flag.
await page.evaluate(()=>{const g=window.__GENVO8__,r=g.renderer,log=window.__loco=[];const loop=now=>{const p=g.sim.player(),v=r.playerVisual;if(p&&v)log.push({t:now,sx:p.x,sy:p.y,vx:v.x,vy:v.y,moving:!!(r.lastPlayerDrawMoving??v.moving),auto:g.sim.playerAutonomy});requestAnimationFrame(loop)};requestAnimationFrame(loop)});
if(mode==='keys'){for(const k of ['KeyD','KeyS','KeyA','KeyW','KeyD','KeyS']){await page.keyboard.down(k);await page.waitForTimeout(3000);await page.keyboard.up(k);await page.waitForTimeout(600)}}
else await page.waitForTimeout(25000);
const log=await page.evaluate(()=>window.__loco);
// Travelling frames: simulated position moved more than .15 tiles over the surrounding 0.5 s.
const res={frames:log.length,travelling:0,drawnWalkingWhileTravelling:0,stillFramesWhileTravelling:0,maxStep:0,steps:[]};
for(let i=0;i<log.length;i++){const a=log[i],j=log.findIndex((b,k)=>k>i&&b.t-a.t>=500);if(j<0)break;const b=log[j];if(Math.hypot(b.sx-a.sx,b.sy-a.sy)<.15)continue;res.travelling++;if(a.moving)res.drawnWalkingWhileTravelling++;
 const n=log[i+1];if(n){const d=Math.hypot(n.vx-a.vx,n.vy-a.vy);res.steps.push(d);if(d<1e-4)res.stillFramesWhileTravelling++;res.maxStep=Math.max(res.maxStep,d)}}
const st=res.steps.sort((x,y)=>x-y);res.medianStep=+(st[st.length>>1]||0).toFixed(4);res.p95Step=+(st[Math.floor(st.length*.95)]||0).toFixed(4);res.maxStep=+res.maxStep.toFixed(4);delete res.steps;
res.walkingShare=+(res.drawnWalkingWhileTravelling/Math.max(1,res.travelling)).toFixed(3);res.stillShare=+(res.stillFramesWhileTravelling/Math.max(1,res.travelling)).toFixed(3);res.mode=mode;res.creature=creature;res.errors=errors;
await page.close();await context.close();await browser.close();server.close();
const video=fs.readdirSync(out).find(f=>f.endsWith('.webm'));if(video)fs.renameSync(path.join(out,video),path.join(out,`${mode}-${creature}.webm`));
fs.writeFileSync(path.join(out,`${mode}-${creature}.json`),JSON.stringify(res,null,1));console.log(JSON.stringify(res));
