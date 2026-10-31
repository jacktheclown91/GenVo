// Paired actual-game ice review. HTTP instrumentation switches only the ice paint export.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out='reports/ice-surface-review';fs.mkdirSync(out,{recursive:true});
 const original=execFileSync('git',['show','3aac22a:src/render/surface-ice.js']);
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'..'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');
  if(url.pathname==='/src/render/surface-ice-before.js')return res.end(original);
  if(url.pathname==='/src/render/surface-ice-candidate.js')return res.end(fs.readFileSync('src/render/surface-ice.js'));
  if(url.pathname==='/src/render/surface-ice.js')return res.end("import {drawSurfaceIce as candidate} from './surface-ice-candidate.js';export function drawSurfaceIce(...args){return (window.__iceReviewDraw||candidate)(...args)}");
  if(fs.existsSync(file)&&fs.statSync(file).isFile())res.end(fs.readFileSync(file));else res.writeHead(404).end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.__GENVO8__?.editor);
  await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('NATIVE-ICE-SURFACES-20261022');await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>!document.body.innerText.includes('Preparing ecosystem'),{},{timeout:120000});await page.waitForFunction(()=>window.__GENVO8__.sim?.player());
  const setup=await page.evaluate(async()=>{
   const g=window.__GENVO8__,s=g.sim,w=s.world,e=w.environment,a=s.player();s.paused=true;
   const {advanceSurfaceIce,fractureSurfaceIce,iceCapacity,validateSurfaceIce}=await import('/src/world/surface-ice.js');
   const volume=e.volume.slice(),salt=e.salt.slice(),rng=s.rng.state;
   for(let day=0;day<4;day++)advanceSurfaceIce(w,{temp:-.5,rain:0},e.iceDay+1);
   let target=-1,bank=-1;
   for(let y=20;y<w.n-20&&target<0;y++)for(let x=20;x<w.n-20&&target<0;x++){
    const i=w.idx(x,y);if(!w.water[i]||e.ice[i]<=.08)continue;
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const j=w.idx(x+dx,y+dy);if(!w.water[j]&&s.canOccupy(a,x+dx+.5,y+dy+.5)){target=i;bank=j;break}}
   }
   if(target<0)throw Error('No actual frozen bank in this generated region');
   a.x=bank%w.n+.5;a.y=(bank/w.n|0)+.5;const dx=target%w.n-bank%w.n,dy=(target/w.n|0)-(bank/w.n|0);a.dir=dx===1?2:dx===-1?6:dy===1?4:0;
   const fractured=fractureSurfaceIce(w,target,iceCapacity(e,target)+1);validateSurfaceIce(w);
   if(!e.volume.every((v,i)=>v===volume[i])||!e.salt.every((v,i)=>v===salt[i])||rng!==s.rng.state)throw Error('Cold/ fracture fixture changed finite water, salt or biological RNG');
   s.rebuildSpatial();g.renderer.cameraReady=false;g.renderer.resetWorldCaches();g.renderer.render();
   return{target,bank,fractured,zoom:g.renderer.zoom,scope:'Four explicit cold-forcing phase updates on generated water and one canonical load fracture; player placed on a real nearby dry bank. Not natural weather or a biological action trial.',unchangedWaterSaltRng:true};
  });
  const reports=[];
  for(const stage of ['before','after']){
   const receipt=await page.evaluate(async stage=>{
    const g=window.__GENVO8__,r=g.renderer;window.__iceReviewDraw=(await import(stage==='before'?'/src/render/surface-ice-before.js':'/src/render/surface-ice-candidate.js')).drawSurfaceIce;
    r.render();const times=[];for(let i=0;i<60;i++){const t=performance.now();r.render();times.push(performance.now()-t)}times.sort((a,b)=>a-b);
    const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js');const snapshot=createSimulationSnapshot(g.sim,{savedAt:'ice-art-review'});
    return{stage,iceTiles:r.iceDrawCount,meanMs:times.reduce((a,b)=>a+b)/times.length,p95Ms:times[56],state:JSON.stringify(snapshot,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:ArrayBuffer.isView(v)?Array.from(v):v)};
   },stage);
   reports.push(receipt);await page.screenshot({path:out+'/'+stage+'-gameplay.png'});
  }
  assert.equal(reports[0].state,reports[1].state,'Ice art changed canonical simulation');assert.deepEqual(errors,[]);assert.ok(reports.every(r=>r.iceTiles>0));
  const receipt={setup,exactCanonicalState:true,errors,timingScope:'Paused renderer CPU command timing; excludes GPU completion',reports:reports.map(({state,...r})=>r),creatorAcceptance:false};
  fs.writeFileSync(out+'/receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
