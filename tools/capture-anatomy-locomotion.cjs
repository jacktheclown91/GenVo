// Full-speed anatomy locomotion evidence: real 800x600 headless Chromium, the game's own
// requestAnimationFrame loop and keyboard input (no manual frame stepping). Body plans are
// legal makePlan/validatePlan bodies mounted on the player for review; movement, swimming
// eligibility and speeds stay with the canonical authorities.
let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/anatomy-locomotion');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true});activeBrowser=browser;
 const page=await browser.newPage({viewport:{width:800,height:600},recordVideo:{dir:out,size:{width:800,height:600}}});const videoT0=Date.now();
 const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
 await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('LOCO-PROOF');await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:30000});await page.waitForTimeout(800);
 // Stage: open land with water nearby, other wildlife moved clear, opening grace ended.
 await page.evaluate(async()=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),w=s.world,N=g.CFG.worldSize;s.endOpeningGrace?.('review');
  let land=null,shore=null;for(let y=16;y<N-16&&!(land&&shore);y++)for(let x=16;x<N-24;x++){let dry=true;for(let oy=-3;oy<=3&&dry;oy++)for(let ox=-3;ox<=14;ox++)if(w.water[w.idx(x+ox,y+oy)]){dry=false;break}if(dry&&!land)land={x:x+.5,y:y+.5};
   if(!shore&&!w.water[w.idx(x,y)]&&[1,2,3,4,5,6].every(k=>w.water[w.idx(x+k,y)]))shore={x:x-.5,y:y+.5}}
  window.__stage={land,shore};
  const {makePlan,validatePlan}=await import('/src/lineage/body-plan.js'),base=p.bodyPlan.nodes.filter(n=>n.partId!=='armor-plate').map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})).map(x=>x.parent?x:{partId:'small-torso'}),legs=id=>base.map(x=>x.socket?.startsWith('limb.')?{...x,partId:id}:x);
  window.__bodies={walker:legs('walking-leg'),runner:legs('runner-leg'),heavy:[...legs('sturdy-leg').map(x=>x.parent?x:{partId:'reinforced-torso'}),{partId:'armor-plate',parent:'root',socket:'flank.left'},{partId:'armor-plate',parent:'root',socket:'flank.right'}],spring:legs('spring-leg'),webbed:legs('webbed-leg'),webbedPaddle:[...legs('webbed-leg').filter(x=>x.socket!=='tail'),{partId:'paddle-tail',parent:'root',socket:'tail'}]};
  for(const [k,v] of Object.entries(window.__bodies))if(!validatePlan(makePlan(v)).ok)throw Error('invalid '+k);
  window.__mount=(k,at)=>{p.bodyPlan=makePlan(window.__bodies[k]);p.x=at.x;p.y=at.y;p.energy=200;p.hydration=200;p.health=100;for(const a of s.animals)if(a!==p&&Math.hypot(a.x-at.x,a.y-at.y)<12)a.x=(a.x+40)%N};
  // Per-frame sampling of the real loop: frame time, player position and presentation gait.
  window.__frames=[];const loop=t=>{const st=g.renderer.motion?.states?.get(p.id);window.__frames.push({t,x:p.x,y:p.y,gait:st?.gait,swim:!!w.water[w.idx(p.x,p.y)]});requestAnimationFrame(loop)};requestAnimationFrame(loop);});
 const report={tool:'tools/capture-anatomy-locomotion.cjs',viewport:'800x600',zoom:'default 2x',runs:[],errors};
 const clip=async name=>{const box=await page.evaluate(()=>{const q=window.__GENVO8__.renderer.screenPos.get(window.__GENVO8__.sim.playerId);return{x:Math.max(0,Math.round(q.x-60)),y:Math.max(0,Math.round(q.y-45))}});await page.screenshot({path:path.join(out,name+'.png'),clip:{...box,width:120,height:90}});return name+'.png'};
 const run=async(body,keys,label,at='land')=>{
  await page.evaluate(([b,a])=>{window.__mount(b,window.__stage[a]);window.__frames.length=0},[body,at]);await page.waitForTimeout(150);
  for(const k of keys)await page.keyboard.down(k);const videoStart=+((Date.now()-videoT0)/1000).toFixed(2),shots=[];
  await page.waitForTimeout(1200);
  for(let i=0;i<3;i++){await page.waitForTimeout(180);shots.push(await clip(`${body}-${label}-${i}`))}
  for(const k of keys)await page.keyboard.up(k);
  const m=await page.evaluate(()=>{const f=window.__frames.slice(5);if(f.length<10)return null;const dt=(f.at(-1).t-f[0].t)/1000;let gait=0,dist=0;for(let i=1;i<f.length;i++){if(Number.isFinite(f[i].gait)&&Number.isFinite(f[i-1].gait))gait+=((f[i].gait-f[i-1].gait)+8)%8;dist+=Math.hypot(f[i].x-f[i-1].x,f[i].y-f[i-1].y)}
   const gaps=f.slice(1).map((x,i)=>x.t-f[i].t).sort((a,b)=>a-b);return{seconds:+dt.toFixed(2),fps:+((f.length-1)/dt).toFixed(1),p95FrameMs:+gaps[Math.floor(gaps.length*.95)].toFixed(1),tilesPerSecond:+(dist/dt).toFixed(2),strideCyclesPerSecond:+(gait/8/dt).toFixed(2),inWaterFrames:f.filter(x=>x.swim).length,frames:f.length}});
  report.runs.push({body,heading:label,videoStart,videoEnd:+((Date.now()-videoT0)/1000).toFixed(2),shots,...m});
 };
 for(const body of ['walker','runner','heavy','spring','webbed'])for(const [label,keys] of [['east',['KeyD']],['south',['KeyS']],['northwest',['KeyW','KeyA']]])await run(body,keys,label);
 // Swimming under the current contract: walk off the shore into open water.
 for(const body of ['walker','webbed','webbedPaddle'])await run(body,['KeyD'],'into-water','shore');
 report.swim=await page.evaluate(async()=>{const {canSwim}=await import('/src/lineage/lifestyle.js'),{makePlan}=await import('/src/lineage/body-plan.js');return Object.fromEntries(['walker','webbed','webbedPaddle'].map(k=>[k,canSwim({species:'genvo',alive:true,adaptations:[],bodyPlan:makePlan(window.__bodies[k])})]))});
 const video=await page.video()?.path();await page.close();await browser.close();
 report.video=video?path.relative(root,video).replace(/\\/g,'/'):null;
 fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,1));
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify(report.runs.map(r=>[r.body,r.heading,r.fps,r.tilesPerSecond,r.strideCyclesPerSecond,r.inWaterFrames])),report.video);
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});
