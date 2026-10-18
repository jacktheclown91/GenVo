// Review-only gait cadence comparison: the same legal bodies walking in real Chromium at the
// shipped stride (1x) and longer review strides (1.5x, 2x), recorded in-page at up to 60 fps.
// Uses GAIT_REVIEW.strideScale in the page only; the shipped value (1) is not changed on disk.
let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/gait-cadence-comparison');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true});activeBrowser=browser;const page=await browser.newPage({viewport:{width:800,height:600}});
 const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
 await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('CADENCE-PROOF');await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:30000});await page.waitForTimeout(600);
 await page.evaluate(async()=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),w=s.world,N=g.CFG.worldSize;s.endOpeningGrace?.('review');let land=null;for(let y=16;y<N-30&&!land;y++)for(let x=16;x<N-16&&!land;x++){let dry=true;for(let oy=-3;oy<=16&&dry;oy++)for(let ox=-3;ox<=3;ox++)if(w.water[w.idx(x+ox,y+oy)]){dry=false;break}if(dry)land={x:x+.5,y:y+.5}}
  const {makePlan}=await import('/src/lineage/body-plan.js'),{applyLineageTarget}=await import('/src/lineage/reproduction-bridge.js');window.__review=(await import('/src/render/genvo.js')).GAIT_REVIEW;
  const base=p.bodyPlan.nodes.filter(n=>n.partId!=='armor-plate').map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})).map(x=>x.parent?x:{partId:'small-torso'}),legs=id=>base.map(x=>x.socket?.startsWith('limb.')?{...x,partId:id}:x);
  const B={walker:legs('walking-leg'),heavy:[...legs('sturdy-leg').map(x=>x.parent?x:{partId:'reinforced-torso'}),{partId:'armor-plate',parent:'root',socket:'flank.left'},{partId:'armor-plate',parent:'root',socket:'flank.right'}],runner:legs('runner-leg')};
  window.__at=k=>{for(const a of s.animals)if(a!==p&&Math.hypot(a.x-land.x,a.y-land.y)<20)a.x=(a.x+50)%N;p.x=land.x;p.y=land.y;p.energy=200;p.hydration=200;applyLineageTarget(p,makePlan(B[k]))};
  window.__log=[];const loop=t=>{const st=g.renderer.motion?.states?.get(p.id);window.__log.push({t,x:p.x,y:p.y,gait:st?.gait});requestAnimationFrame(loop)};requestAnimationFrame(loop)});
 const report={tool:'tools/capture-gait-cadence-comparison.cjs',note:'GAIT_REVIEW.strideScale set in page only; shipped value is 1',runs:[],errors};
 for(const body of ['walker','heavy','runner'])for(const scale of [1,1.5,2]){
  await page.evaluate(([b,sc])=>{window.__review.strideScale=sc;window.__at(b)},[body,scale]);await page.waitForTimeout(200);
  await page.evaluate(()=>{const cv=document.querySelector('canvas'),rec=new MediaRecorder(cv.captureStream(60),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:3e6}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);window.__rec={rec,i0:window.__log.length,done:new Promise(r=>{rec.onstop=async()=>{const buf=new Uint8Array(await new Blob(chunks).arrayBuffer());let s='';for(let i=0;i<buf.length;i+=32768)s+=String.fromCharCode(...buf.subarray(i,i+32768));r(btoa(s))}})};rec.start(250)});
  await page.keyboard.down('KeyS');await page.waitForTimeout(2600);await page.keyboard.up('KeyS');
  const r=await page.evaluate(async()=>{window.__rec.rec.stop();const data=await window.__rec.done,f=window.__log.slice(window.__rec.i0+10);let gait=0,dist=0;for(let i=1;i<f.length;i++){if(Number.isFinite(f[i].gait)&&Number.isFinite(f[i-1].gait))gait+=((f[i].gait-f[i-1].gait)+8)%8;dist+=Math.hypot(f[i].x-f[i-1].x,f[i].y-f[i-1].y)}const dt=(f.at(-1).t-f[0].t)/1000;return{data,fps:+((f.length-1)/dt).toFixed(1),tilesPerSecond:+(dist/dt).toFixed(2),strideCyclesPerSecond:+(gait/8/dt).toFixed(2)}});
  const name=`${body}-stride${String(scale).replace('.','_')}x`;fs.writeFileSync(path.join(out,name+'.webm'),Buffer.from(r.data,'base64'));delete r.data;report.runs.push({body,strideScale:scale,file:name+'.webm',...r});}
 await page.evaluate(()=>{window.__review.strideScale=1});await browser.close();
 fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,1));console.log(JSON.stringify(report.runs.map(r=>[r.body,r.strideScale,r.fps,r.tilesPerSecond,r.strideCyclesPerSecond])),errors.length);
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});
