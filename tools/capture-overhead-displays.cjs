// Real mouse-funded displays; no authored reception or forced conception.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true}),runs=[];
 try{for(const label of ['before','after'])for(const part of ['signal-crest','display-frill']){
  const prefix=`docs/overhead-displays-${label}-${part}`;
  const page=await browser.newPage({viewport:{width:800,height:600},recordVideo:{dir:prefix+'-video',size:{width:800,height:600}}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://genvo.review/**',r=>{
   const rel=decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html',old=path.resolve(root,'reports/overhead-displays-before',rel),p=label==='before'&&fs.existsSync(old)?old:path.resolve(root,rel);
   if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return r.fulfill({status:404});
   let data=fs.readFileSync(p);
   if(rel==='src/render/indexed-part-renderer.js')data=Buffer.from(data.toString('utf8').replace('// Each selected native frame',"if(globalThis.__displayActor!=null)(globalThis.__displayPaint??=[]).push({actor:globalThis.__displayActor,part:asset.partId,x,y,scale,headingRadians,deployment,extent});\n  // Each selected native frame"));
   return r.fulfill({body:data,contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(p)]||'application/octet-stream'});
  });
  await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.editor);
  await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('DORSAL-DISPLAY-COURT');await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready');
  const setup=await page.evaluate(async part=>{
   const g=window.__GENVO8__,s=g.sim,a=s.player(),b=s.animals.find(v=>v.species===a.species&&v.id!==a.id);const {phenotypeFor}=await import('/src/organisms/species.js'),{developmentFor}=await import('/src/family/family.js');
   const {founderPlan}=await import('/src/lineage/body-inheritance.js'),{makePlan,validatePlan}=await import('/src/lineage/body-plan.js'),{attachHeadPlan}=await import('/src/lineage/head-plan.js'),{applyLineageTarget}=await import('/src/lineage/reproduction-bridge.js');
   s.paused=true;const plan=attachHeadPlan(makePlan([...founderPlan().nodes,{partId:part,parent:'root',socket:'dorsal'}]));if(!validatePlan(plan).ok)throw Error('Invalid display body');
   for(const x of [a,b]){applyLineageTarget(x,x===a?plan:attachHeadPlan(founderPlan()));Object.assign(x,{age:40,energy:90,hydration:100,health:100,pregnant:null,reproCooldown:0,infected:false,parentIds:[],intent:'idle',target:null})}
   b.sex=a.sex==='M'?'F':'M';b.x=a.x+.7;b.y=a.y+.24;a.dir=2;b.dir=6;s.animals=[a,b];s.rebuildSpatial();g.renderer.resetWorldCaches();g.renderer.motion.clear();g.renderer.zoom=2;g.renderer.cameraReady=false;
   const old=g.renderer.drawAnimal.bind(g.renderer);g.renderer.drawAnimal=function(a,...args){window.__displayActor=a.id;try{return old(a,...args)}finally{window.__displayActor=null}};
   s.paused=false;g.contextTray.onCourt(b);
   return{part,actor:a.id,partner:b.id,body:a.bodyPlan.id,bodyScale:phenotypeFor(a).bodyScale*developmentFor(a).growth,genes:structuredClone(a.genes),energy:a.energy,availability:s.reproduction.courtshipAvailability({targetId:b.id}),scope:'Complete legal body, mature healthy opposite-sex pair and nearby placement fixture. Existing compatibility, individual preferences, resources, costs and controllers; no forced mating or acceptance.'};
  },part);
  assert.ok(setup.availability.enabled,setup.availability.reason);await page.screenshot({path:prefix+'-rest-800.png'});
  await page.locator('[data-move="flare"]').click();await page.getByRole('button',{name:'Play',exact:true}).click();
  await page.waitForFunction(()=>window.__GENVO8__.sim.player().courtshipPerformance?.sequence.includes('flare'));
  const sample=()=>page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,a=s.player(),p=g.renderer.encounters.sample(s,a);return{tick:s.tickCount,move:p.move,spread:p.crestSpread,performance:a.courtshipPerformance&&{sequence:a.courtshipPerformance.sequence,energySpent:a.courtshipPerformance.energySpent,startedAt:a.courtshipPerformance.startedAt,endsAt:a.courtshipPerformance.endsAt},energy:a.energy,body:a.bodyPlan.id,genes:structuredClone(a.genes)}});
  const samples=[];for(let i=0;i<3;i++){await page.waitForTimeout(220);samples.push(await sample())}
  await page.screenshot({path:prefix+'-flare-800.png'});
  await page.evaluate(()=>{window.__GENVO8__.sim.paused=true;window.__GENVO8__.renderer.zoom=4});await page.waitForTimeout(80);const held=await sample();await page.screenshot({path:prefix+'-flare-close-800.png'});await page.waitForTimeout(150);const paused=await sample();assert.equal(paused.spread,held.spread,'Paused display must hold exactly');
  await page.evaluate(()=>{window.__GENVO8__.sim.paused=false;window.__GENVO8__.renderer.zoom=2});await page.getByRole('button',{name:'Back Off',exact:true}).click();
  const cancelled=await sample();await page.waitForTimeout(1200);const settled=await sample();await page.screenshot({path:prefix+'-settled-800.png'});
  const paint=await page.evaluate(id=>(window.__displayPaint||[]).filter(p=>p.actor===id),setup.actor);
  assert.ok(samples.some(p=>p.move==='flare'&&p.spread>0&&p.performance.energySpent>0));assert.equal(cancelled.performance,null);assert.equal(settled.performance,null);assert.equal(settled.spread,0);
  for(const p of [...samples,held,paused,cancelled,settled]){assert.equal(p.body,setup.body);assert.deepEqual(p.genes,setup.genes)}
  if(label==='after'){assert.ok(paint.length>5);assert.ok(Math.max(...paint.map(p=>p.deployment))>.1);assert.ok(paint.every(p=>Math.abs(p.scale-2*.31*setup.bodyScale)<1e-10||Math.abs(p.scale-4*.31*setup.bodyScale)<1e-10),'Display pulse must not enlarge native root scale')}
  assert.deepEqual(errors,[]);const video=page.video();await page.close();fs.copyFileSync(await video.path(),prefix+'-runtime.webm');runs.push({label,setup,samples,held,paused,cancelled,settled,paint,errors});
  console.log(label+' '+part+': actual paid Flare, pause, Back Off, settled native root PASS');
 }
 fs.writeFileSync('docs/overhead-displays-courtship-proof.json',JSON.stringify({status:'PASS',scope:'Paired actual 800x600 browser, mouse Flare/Play/Back Off. Legal mature body/pair fixtures; real funded controller and rendering. Read-only paint instrumentation, not natural reproductive success or human/creator acceptance.',runs},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
