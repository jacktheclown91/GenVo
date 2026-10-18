// Integrated combat + locomotion evidence in real headless Chromium.
// - Canvas clips are recorded in-page at up to 60 fps (canvas.captureStream + MediaRecorder);
//   Playwright's page video is fixed at 25 fps and is not used here.
// - Every clip carries rAF frame-time statistics measured during that clip.
// - CONTROLLED demos stage legal bodies and positions and, where named, force a hit/miss with
//   rng.chance so the outcome is shown; the canonical authorities still resolve every effect.
// - The NATURAL session stages nothing: fresh world, keyboard wandering, normal time.
// Usage: node tools/capture-integrated-gameplay.cjs [800x600|1440x900] [naturalSeconds] [norecord]
// 'norecord' measures frame times without in-page video encoding (encoding costs CPU).
let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const [vw,vh]=(process.argv[2]||'800x600').split('x').map(Number),naturalSeconds=Number(process.argv[3]||45),record=process.argv[4]!=='norecord';
(async()=>{
 // GENVO_ROOT serves another tree (e.g. the exported web build); evidence is still written to this repo.
 const root=path.resolve(process.env.GENVO_ROOT||path.resolve(__dirname,'..')),out=path.join(path.resolve(__dirname,'..'),`docs/integrated-gameplay/${process.env.GENVO_ROOT?'packaged-':''}${vw}x${vh}${record?'':'-norecord'}`);fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true});activeBrowser=browser;
 const page=await browser.newPage({viewport:{width:vw,height:vh}});
 const errors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))consoleErrors.push(m.text())});
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav'})[ext]||'application/octet-stream'});});
 const newWorld=async seed=>{await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
  await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill(seed);await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:30000});await page.waitForTimeout(600);
  await page.evaluate(()=>{window.__frameLog=[];const loop=t=>{window.__frameLog.push(t);requestAnimationFrame(loop)};requestAnimationFrame(loop);
   // Count reaction kinds the renderer actually produced (wraps, never alters results).
   window.__reactionKinds={};const R=window.__GENVO8__.renderer;const wrap=(obj,key)=>{const fn=obj[key];obj[key]=function(...a){const r=fn.apply(this,a);if(r?.kind)window.__reactionKinds[r.kind]=(window.__reactionKinds[r.kind]||0)+1;if(r?.organ)window.__reactionKinds['organ:'+r.organ]=(window.__reactionKinds['organ:'+r.organ]||0)+1;return r}};
   const install=()=>{if(!R.reactions)return requestAnimationFrame(install);const proto=Object.getPrototypeOf(R.reactions);if(!proto.__wrapped){wrap(proto,'sample');wrap(proto,'sampleDefense');proto.__wrapped=true}};install()})};
 // Record the game canvas in-page at up to 60 fps while `act` runs.
 const clip=async(name,seconds,act=async()=>{})=>{
  if(!record){const f0=await page.evaluate(()=>window.__frameLog.length);await act();await page.waitForTimeout(seconds*1000+150);const r=await page.evaluate(i=>{const t=window.__frameLog.slice(i),gaps=t.slice(1).map((x,k)=>x-t[k]).sort((a,b)=>a-b);return{frames:t.length,fps:+((t.length-1)/((t.at(-1)-t[0])/1000)).toFixed(1),medianMs:+gaps[Math.floor(gaps.length/2)]?.toFixed(1),p95Ms:+gaps[Math.floor(gaps.length*.95)]?.toFixed(1),worstMs:+gaps.at(-1)?.toFixed(1)}},f0);return{name,seconds,recorded:false,...r}}
  await page.evaluate(sec=>{const cv=document.querySelector('canvas'),stream=cv.captureStream(60),rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:5e6}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);
   window.__clip={start:performance.now(),frames0:window.__frameLog.length,done:new Promise(res=>{rec.onstop=async()=>{const b=new Blob(chunks,{type:'video/webm'}),buf=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<buf.length;i+=32768)s+=String.fromCharCode(...buf.subarray(i,i+32768));res(btoa(s))}})};rec.start(250);setTimeout(()=>rec.stop(),sec*1000)},seconds);
  await act();await page.waitForTimeout(seconds*1000+150);
  const r=await page.evaluate(async()=>{const data=await window.__clip.done,t=window.__frameLog.slice(window.__clip.frames0),gaps=t.slice(1).map((x,i)=>x-t[i]).sort((a,b)=>a-b);return{data,frames:t.length,fps:+((t.length-1)/((t.at(-1)-t[0])/1000)).toFixed(1),medianMs:+gaps[Math.floor(gaps.length/2)]?.toFixed(1),p95Ms:+gaps[Math.floor(gaps.length*.95)]?.toFixed(1),worstMs:+gaps.at(-1)?.toFixed(1)}});
  fs.writeFileSync(path.join(out,name+'.webm'),Buffer.from(r.data,'base64'));await page.screenshot({path:path.join(out,name+'.png')});
  delete r.data;return{name,seconds,...r};};
 const report={tool:'tools/capture-integrated-gameplay.cjs',viewport:`${vw}x${vh}`,controlled:[],natural:null,errors,consoleErrors};
 // ---------------- CONTROLLED ----------------
 await newWorld('INTEGRATED-PROOF');
 await page.evaluate(async()=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),w=s.world,N=g.CFG.worldSize;s.endOpeningGrace?.('review');
  let land=null,shore=null;for(let y=16;y<N-16&&!(land&&shore);y++)for(let x=16;x<N-24;x++){let dry=true;for(let oy=-3;oy<=3&&dry;oy++)for(let ox=-3;ox<=14;ox++)if(w.water[w.idx(x+ox,y+oy)]){dry=false;break}if(dry&&!land)land={x:x+.5,y:y+.5};if(!shore&&!w.water[w.idx(x,y)]&&[1,2,3,4,5,6].every(k=>w.water[w.idx(x+k,y)]))shore={x:x-.5,y:y+.5}}
  const {makePlan}=await import('/src/lineage/body-plan.js'),{applyLineageTarget}=await import('/src/lineage/reproduction-bridge.js');
  const base=p.bodyPlan.nodes.filter(n=>n.partId!=='armor-plate').map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})).map(x=>x.parent?x:{partId:'small-torso'}),legs=id=>base.map(x=>x.socket?.startsWith('limb.')?{...x,partId:id}:x),plates=[{partId:'armor-plate',parent:'root',socket:'flank.left'},{partId:'armor-plate',parent:'root',socket:'flank.right'}];
  const B={walker:legs('walking-leg'),runner:legs('runner-leg'),heavy:[...legs('sturdy-leg').map(x=>x.parent?x:{partId:'reinforced-torso'}),...plates],spring:legs('spring-leg'),webbed:legs('webbed-leg'),paddle:[...legs('webbed-leg').filter(x=>x.socket!=='tail'),{partId:'paddle-tail',parent:'root',socket:'tail'}],clubHeavy:[...legs('sturdy-leg').filter(x=>x.socket!=='tail'),...plates,{partId:'club-tail',parent:'root',socket:'tail'}],shellWalker:[...base.filter(x=>x.socket!=='dorsal'),{partId:'shell-back',parent:'root',socket:'dorsal'}],hunterJaw:base.map(x=>x.socket==='mouth'?{...x,partId:'tearing-jaw'}:x)};
  const clear=at=>{for(const a of s.animals)if(a!==p&&Math.hypot(a.x-at.x,a.y-at.y)<12)a.x=(a.x+40)%N};
  // Bodies go through the canonical lineage path, so plates express Hardened Mantle as in play.
  window.__body=k=>{applyLineageTarget(p,makePlan(B[k]))};
  window.__at=(k,where='land')=>{const at=where==='shore'?shore:land;clear(at);p.x=at.x;p.y=at.y;p.energy=200;p.hydration=200;p.health=100;p.bracing=false;window.__body(k)};
  window.__hunter=()=>s.animals.find(a=>a.alive&&a.species==='needlejaw');window.__prey=()=>s.animals.find(a=>a.alive&&a.species==='mosskip');
  window.__forced=(pattern,fn)=>{let n=0;const old=s.rng.chance;s.rng.chance=pattern==='all'?()=>true:pattern==='miss'?()=>false:()=>n++===0;try{return fn()}finally{s.rng.chance=old}};});
 const hold=async(keys,ms)=>{for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(ms);for(const k of keys)await page.keyboard.up(k)};
 for(const body of ['walker','runner','heavy','spring','webbed']){await page.evaluate(b=>window.__at(b),body);report.controlled.push({...await clip(`gait-${body}`,2.4,()=>hold(['KeyS'],2300)),staged:'legal body on cleared land; real keyboard input'})}
 await page.evaluate(()=>window.__at('paddle','shore'));report.controlled.push({...await clip('swim-paddle',2.6,()=>hold(['KeyD'],2500)),staged:'legal body at a shore; real keyboard input into water'});
 await page.evaluate(()=>window.__at('walker','shore'));report.controlled.push({...await clip('swim-walker-blocked',2,()=>hold(['KeyD'],1900)),staged:'non-swimmer pushed at water with real input'});
 // Combat: real authorities, outcome forced where named.
 const combat=async(name,setup,note)=>{report.controlled.push({...await clip(name,1.6,()=>page.evaluate(setup)),staged:note})};
 await page.evaluate(()=>{window.__at('heavy');const h=window.__hunter(),p=window.__GENVO8__.sim.player();h.x=p.x+.85;h.y=p.y;p.dir=2});
 await combat('braced-charge',()=>{const s=window.__GENVO8__.sim,p=s.player(),h=window.__hunter();p.dir=2;p.bracing=true;h.x=p.x+.85;h.y=p.y;h.playerHunt={targetId:p.id,phase:'charge',style:'rusher',startedTick:s.tickCount,untilTick:s.tickCount+8,lastOutcome:null,aimX:p.x,aimY:p.y,aimDirX:-1,aimDirY:0,laneLength:3,laneTravel:2.5};h.intent='charge-player';window.__forced('all',()=>s.predator.resolveCharge(h));setTimeout(()=>{p.bracing=false},700)},'heavy plated body braces a staged charge; contact forced to land; predator.resolveCharge resolves it');
 await page.evaluate(()=>{window.__at('clubHeavy');const h=window.__hunter(),p=window.__GENVO8__.sim.player();h.x=p.x+.9;h.y=p.y;h.playerHunt=null;p.dir=6});
 await combat('club-tail-repel',()=>{const s=window.__GENVO8__.sim,p=s.player(),h=window.__hunter();h.x=p.x+.9;h.y=p.y;window.__forced('all',()=>s.tryKill(h,p))},'club tail facing away; bite and repel roll forced; tryKill resolves damage and repel');
 await page.evaluate(()=>{window.__at('shellWalker');const h=window.__hunter(),p=window.__GENVO8__.sim.player();h.x=p.x+.9;h.y=p.y;h.playerAversion=null;p.dir=6});
 await combat('shell-from-behind',()=>{const s=window.__GENVO8__.sim,p=s.player(),h=window.__hunter();h.x=p.x+.9;h.y=p.y;window.__forced('first',()=>s.tryKill(h,p))},'shell back bitten from behind; bite forced to land, repel forced off');
 await page.evaluate(()=>{window.__at('hunterJaw');const q=window.__prey(),p=window.__GENVO8__.sim.player();q.x=p.x+.75;q.y=p.y;q.health=400;p.dir=2;window.__hunter().x+=30});
 await combat('prey-bite',()=>{const s=window.__GENVO8__.sim,q=window.__prey(),p=s.player();q.x=p.x+.75;q.y=p.y;window.__forced('first',()=>s.tryKill(p,q))},'tearing jaw bites a mosskip; hit forced');
 await combat('prey-dodge',()=>{const s=window.__GENVO8__.sim,q=window.__prey(),p=s.player();q.x=p.x+.75;q.y=p.y;window.__forced('miss',()=>s.tryKill(p,q))},'same bite forced to miss');
 report.controlledReactionKinds=await page.evaluate(()=>window.__reactionKinds);
 // ---------------- NATURAL ----------------
 await newWorld('INTEGRATED-NATURAL');
 await page.evaluate(()=>window.__GENVO8__.sim.endOpeningGrace?.('natural session'));
 const t0=Date.now(),wander=[['KeyD'],['KeyS'],['KeyA'],['KeyW'],['KeyD','KeyS'],['KeyA','KeyW']];let wi=0;
 const nat=await clip('natural-session',Math.min(naturalSeconds,45),async()=>{while(Date.now()-t0<Math.min(naturalSeconds,45)*1000-500){await hold(wander[wi++%wander.length],1400+(wi%3)*500)}});
 report.natural={...nat,staged:'none: fresh world, opening grace ended, keyboard wandering at normal time',reactionKinds:await page.evaluate(()=>window.__reactionKinds),summary:await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();return{tick:s.tickCount,playerAlive:!!p?.alive,health:Math.round(p?.health??0),injury:p?.injuryCare?.level||'none',lastDamage:s.lastPlayerDamage,defense:s.lastDefenseReceipt,alive:s.animals.filter(a=>a.alive).length}})};
 await browser.close();
 fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(report,null,1));
 console.log(JSON.stringify({viewport:report.viewport,record,clips:report.controlled.map(c=>[c.name,c.fps,c.p95Ms,c.worstMs]),controlledKinds:report.controlledReactionKinds,natural:[report.natural.fps,report.natural.p95Ms,report.natural.reactionKinds,report.natural.summary.tick],errors:errors.length,consoleErrors:consoleErrors.length}));
 if(errors.length)console.error(errors.slice(0,3).join('\n'));
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});
