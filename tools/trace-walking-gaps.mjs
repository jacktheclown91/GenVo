// Usage: node tools/trace-walking-gaps.mjs <exported build> <out.json> [seconds=25] [seed=GENVO-F6B2B88C]
// Real-GPU walking trace: visible Chromium (GPU allowed), exported build, a fresh world walked by
// hand at 1x, recorded with Chrome tracing. For every gap of 60 ms or more between animation
// frames it lists the main-thread tasks inside the gap and their heaviest child events, so long
// frames are attributed to what actually ran (script, idle callbacks, GC, canvas/GPU work).
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const root=path.resolve(process.argv[2]),outFile=path.resolve(process.argv[3]),seconds=Number(process.argv[4]||25),seed=process.argv[5]||'GENVO-F6B2B88C';
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip','.ogg':'audio/ogg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://l').pathname));const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw.chromium.launch({headless:false,args:['--ignore-gpu-blocklist','--window-size=1300,800']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill(seed);
await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:180000});
await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true)});await page.waitForTimeout(3000);
const traceFile=outFile.replace(/\.json$/,'')+'-trace.json';
await browser.startTracing(page,{path:traceFile,categories:['devtools.timeline','toplevel','v8.execute','disabled-by-default-v8.gc']});
const end=Date.now()+seconds*1000;const keys=['KeyD','KeyS','KeyA','KeyW'];let k=0;while(Date.now()<end){const key=keys[k++%4];await page.keyboard.down(key);await page.waitForTimeout(1400);await page.keyboard.up(key)}
await browser.stopTracing();await browser.close();server.close();
const ev=JSON.parse(fs.readFileSync(traceFile,'utf8')).traceEvents;
// The renderer main thread: the one running FireAnimationFrame.
const raf=ev.filter(e=>e.name==='FireAnimationFrame'&&e.ph==='X');const tid=raf[0]?.tid,pid=raf[0]?.pid;
const main=ev.filter(e=>e.tid===tid&&e.pid===pid&&e.ph==='X'&&e.dur>0).sort((a,b)=>a.ts-b.ts);
const top=main.filter(e=>e.name==='RunTask'||e.name==='ThreadControllerImpl::RunTask');
const frames=raf.map(e=>e.ts).sort((a,b)=>a-b),gaps=[];for(let i=1;i<frames.length;i++)if(frames[i]-frames[i-1]>=60000)gaps.push([frames[i-1],frames[i]]);
const name=e=>e.name==='FunctionCall'?'FunctionCall '+(e.args?.data?.functionName||'')+' '+String(e.args?.data?.url||'').split('/').slice(-2).join('/'):e.name;
const report={seed,seconds,frames:frames.length,gapsOver60:gaps.length,gaps:[]};const kinds={};
for(const [a,b] of gaps){const tasks=top.filter(t=>t.ts<b&&t.ts+t.dur>a).map(t=>{const kids=main.filter(c=>c!==t&&c.ts>=t.ts&&c.ts+c.dur<=t.ts+t.dur&&c.dur>=3000&&c.name!=='RunTask'&&c.name!=='ThreadControllerImpl::RunTask').sort((x,y)=>y.dur-x.dur).slice(0,6).map(c=>`${name(c)} ${(c.dur/1000).toFixed(0)}`);return{ms:+(t.dur/1000).toFixed(0),kids}}).filter(t=>t.ms>=5);
 for(const t of tasks)for(const k of t.kids.slice(0,2)){const n=k.replace(/ \d+$/,'');kinds[n]=(kinds[n]||0)+Number(k.match(/ (\d+)$/)[1])}
 report.gaps.push({gapMs:+((b-a)/1000).toFixed(0),tasks})}
report.heaviestChildrenInGaps=Object.entries(kinds).sort((x,y)=>y[1]-x[1]).slice(0,20);
fs.writeFileSync(outFile,JSON.stringify(report,null,1));
console.log(JSON.stringify({frames:report.frames,gapsOver60:report.gapsOver60,heaviest:report.heaviestChildrenInGaps,sample:report.gaps.slice(0,5)},null,1));
