// Real-GPU frame pacing: visible Chromium with the GPU allowed, exported build, normal 1x play.
// Usage: node tools/measure-real-gpu-pacing.mjs <exported build> <out> [start=new|mature] [seconds=60]
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),start=process.argv[4]||'new',seconds=Number(process.argv[5]||60);fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip','.ogg':'audio/ogg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw.chromium.launch({headless:false,args:['--ignore-gpu-blocklist','--window-size=1300,800']});
const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const cdp=await browser.newBrowserCDPSession();const gpu=(await cdp.send('SystemInfo.getInfo')).gpu;
await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
if(start==='mature'){const sel=page.locator('.menu-view[data-screen="new"] select').nth(1);const opts=await sel.locator('option').allTextContents();const pick=opts.find(o=>/Mature/.test(o));await sel.selectOption({label:pick})}
await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:180000});await page.waitForTimeout(3000);
const sample=ms=>page.evaluate(async ms=>{const g=window.__GENVO8__,frames=[],t0=performance.now();let prev=t0;const day0=g.sim.day,animals=g.sim.animals.filter(a=>a.alive).length;
 await new Promise(r=>{function f(now){frames.push({ms:now-prev,work:g.frameStepper.last?.workMs??null,pending:!!g.sim.tickInProgress});prev=now;if(now-t0>=ms)r();else requestAnimationFrame(f)}requestAnimationFrame(f)});
 const s=frames.slice(1).map(f=>f.ms).sort((a,b)=>a-b),q=p=>s[Math.min(s.length-1,Math.floor(s.length*p))];
 return{frames:s.length,fps:+(s.length/(ms/1000)).toFixed(1),p50:+q(.5).toFixed(1),p95:+q(.95).toFixed(1),p99:+q(.99).toFixed(1),max:+s.at(-1).toFixed(1),over33:s.filter(x=>x>33.4).length,over50:s.filter(x=>x>50).length,over100:s.filter(x=>x>100).length,
  workP95:+(()=>{const w=frames.map(f=>f.work).filter(Number.isFinite).sort((a,b)=>a-b);return w[Math.floor(w.length*.95)]||0})().toFixed(1),days:+(g.sim.day-day0).toFixed(2),animals,longFrames:frames.filter(f=>f.ms>50).slice(0,40).map(f=>[+f.ms.toFixed(0),f.work==null?null:+f.work.toFixed(0),f.pending])}},ms);
const result={start,gpu:{devices:gpu.devices?.map(d=>d.deviceString||d.vendorString),features:gpu.featureStatus?{canvas:gpu.featureStatus['2d_canvas'],raster:gpu.featureStatus.rasterization,gpu_compositing:gpu.featureStatus.gpu_compositing}:null},runs:{}};
await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true)});
// Walking by hand (the responsiveness a new player feels), then idle AUTO play.
const walk=(async()=>{const end=Date.now()+seconds*500;const keys=['KeyD','KeyS','KeyA','KeyW'];let i=0;while(Date.now()<end){const k=keys[i++%4];await page.keyboard.down(k);await page.waitForTimeout(1400);await page.keyboard.up(k)}})();
result.runs.walking=await sample(seconds*500);await walk;
await page.evaluate(()=>window.__GENVO8__.sim.setPlayerAutonomy(true));
result.runs.auto=await sample(seconds*500);
await page.screenshot({path:path.join(out,`gpu-${start}.png`)});result.errors=errors;
fs.writeFileSync(path.join(out,`gpu-${start}.json`),JSON.stringify(result,null,1));await browser.close();server.close();
console.log(JSON.stringify({gpu:result.gpu,walking:{...result.runs.walking,longFrames:result.runs.walking.longFrames.slice(0,12)},auto:{...result.runs.auto,longFrames:result.runs.auto.longFrames.slice(0,12)},errors},null,0));
