// Actual gameplay care response review. Only the behavior exports are switched for comparison.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out='reports/care-action-review';fs.mkdirSync(out,{recursive:true});const old=execFileSync('git',['show','3aac22a:src/render/behavior.js']);
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');
  if(u.pathname==='/src/render/behavior-before.js')return res.end(old);
  if(u.pathname==='/src/render/behavior-candidate.js')return res.end(fs.readFileSync('src/render/behavior.js'));
  if(u.pathname==='/src/render/behavior.js')return res.end("import * as old from './behavior-before.js';import * as candidate from './behavior-candidate.js';export function behaviorVisualState(...args){return(window.__careReviewBefore?old:candidate).behaviorVisualState(...args)}export function visualActionFromIntent(...args){return(window.__careReviewBefore?old:candidate).visualActionFromIntent(...args)}");
  if(fs.existsSync(file)&&fs.statSync(file).isFile())res.end(fs.readFileSync(file));else res.writeHead(404).end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.__GENVO8__?.editor);
  await page.getByRole('button',{name:/New World/}).click();await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>!document.body.innerText.includes('Preparing ecosystem'),{},{timeout:120000});await page.waitForFunction(()=>window.__GENVO8__.sim?.player());
  const reports=[];
  for(const kind of ['nursing','laying','hatching']){
   const setup=await page.evaluate(async kind=>{
    const g=window.__GENVO8__,{Simulation}=await import('/src/sim/simulation.js'),{SPECIES}=await import('/src/organisms/species.js'),{founderPlan}=await import('/src/lineage/body-inheritance.js'),{makePlan,validatePlan}=await import('/src/lineage/body-plan.js');
    const sim=new Simulation(kind==='nursing'?'CARE-RECEIPTS-20261022':'CARE-EGG-RECEIPTS-20261022',{player:true}),mother=sim.player(),father=sim.animals.find(a=>a.species==='genvo'&&a.id!==mother.id);
    const nodes=founderPlan().nodes.map(n=>({partId:kind==='nursing'&&!n.parent?'soft-torso':n.partId,parent:n.parent,socket:n.socket}));
    if(kind==='nursing')nodes.push({partId:'fur-mantle',parent:'root',socket:'dorsal'},{partId:'live-womb',parent:'root',socket:'flank.left'},{partId:'endothermic-core',parent:'root',socket:'flank.right'},{partId:'mammary-gland',parent:'root',socket:'flank.right'});else nodes.push({partId:'egg-chamber',parent:'root',socket:'flank.left'});
    const plan=makePlan(nodes);if(!validatePlan(plan).ok)throw Error('Invalid controlled maternal body');
    for(const a of [mother,father]){a.bodyPlan=plan;a.age=40;a.reproCooldown=0;a.energy=SPECIES.genvo.maxEnergy;a.hydration=SPECIES.genvo.maxHydration;a.intent='idle'}
    mother.sex='F';father.sex='M';sim.reproduction.courtTargetId=father.id;
    // Choose real open land for a readable fixture; never remove plants or other animals.
    const w=sim.world,origin={x:mother.x,y:mother.y};let clean=false;
    for(let radius=2;radius<20&&!clean;radius++)for(let dy=-radius;dy<=radius&&!clean;dy++)for(let dx=-radius;dx<=radius&&!clean;dx++){
     if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;const x=Math.floor(origin.x+dx)+.5,y=Math.floor(origin.y+dy)+.5;
     if(x<5||y<5||x>w.n-5||y>w.n-5)continue;let open=true;
     for(let yy=-1;yy<=1&&open;yy++)for(let xx=-1;xx<=1;xx++){const i=w.idx(x+xx,y+yy),density=(w.plants.woodspire?.[i]||0)+(w.plants.bramble?.[i]||0)+(w.plants.marshroot?.[i]||0)+(w.plants.thistlepod?.[i]||0);if(w.water[i]||density>.22){open=false;break}}
     if(!open||sim.animals.some(a=>a!==mother&&a!==father&&a.alive&&Math.hypot(a.x-x,a.y-y)<3))continue;
     mother.x=x;mother.y=y;father.x=x+.8;father.y=y;sim.rebuildSpatial();if(sim.conceptionAvailability(mother,father).enabled)clean=true;
    }
    if(!clean)throw Error('No readable real land fixture available');
    if(!sim.tryMate(mother,father))throw Error('Canonical conception failed');
    // Three seconds of ordinary updates expire the earlier pairing cue; no receipt is rewritten.
    for(let tick=0;tick<24;tick++)sim.update(null);
    const delivered=sim.giveBirth(mother);if(!delivered.length)throw Error('Canonical funded delivery failed');mother.intent='idle';let subject=mother,transfer=null;
    if(kind==='nursing'){
     const child=delivered[0];for(let j=1;j<delivered.length;j++){const sibling=delivered[j];for(const [dx,dy] of [[2+j,0],[-2-j,0],[0,2+j]]){if(sim.canOccupy(sibling,mother.x+dx,mother.y+dy)){sibling.x=mother.x+dx;sibling.y=mother.y+dy;break}}}
     for(const [dx,dy] of [[0,.65],[.65,0],[-.65,0],[0,-.65]]){const x=mother.x+dx,y=mother.y+dy;if(!sim.world.water[sim.world.idx(x,y)]&&sim.canOccupy(child,x,y)){child.x=x;child.y=y;break}}
     child.energy=1;child.intent='idle';child.dir=0;mother.dir=2;transfer=sim.family.tend(mother,child);if(!transfer.ok||transfer.type!=='nursing')throw Error('Actual paid milk transfer failed');subject=child;
    }else if(kind==='hatching'){
     const eggId=delivered[0].id,days=delivered[0].incubationDays;for(let day=0;day<days;day++)sim.advanceEggs();subject=sim.animals.find(a=>a.hatchedFromEggId===eggId);if(!subject)throw Error('Real funded egg did not hatch');subject.intent='idle';const born=sim.animals.filter(a=>a.hatchedFromEggId!=null);for(let j=0;j<born.length;j++){const child=born[j];for(const [dx,dy] of [[1.1+j*1.7,.5],[0,1.1+j*1.7],[-1.1-j*1.7,0]]){if(sim.canOccupy(child,mother.x+dx,mother.y+dy)){child.x=mother.x+dx;child.y=mother.y+dy;break}}}
    }
    // The co-parent remains in the same real world, outside the demonstration pair.
    for(const [dx,dy] of [[3,-3],[-3,-3],[3,3],[-3,3]]){const x=mother.x+dx,y=mother.y+dy;if(!sim.world.water[sim.world.idx(x,y)]&&sim.canOccupy(father,x,y)){father.x=x;father.y=y;break}}
    sim.paused=true;sim.rebuildSpatial();const load=g.saveManager.load;g.saveManager.load=async()=>sim;try{if(!await g.loadSavedLineage())throw Error('Native simulation install failed')}finally{g.saveManager.load=load}g.sim.paused=true;g.renderer.resetWorldCaches();g.renderer.cameraReady=false;g.renderer.render();
    return{kind,motherId:mother.id,subjectId:subject.id,actualConception:!!mother.lastReproductiveAttempt?.conceived,delivered:delivered.length,paidMilk:transfer?.fed??null,zoom:g.renderer.zoom,scope:'Explicit adult anatomy/reserve/role fixture, actual first-attempt conception, direct canonical paid delivery and incubation operations. Real open land and sibling observation positions explicitly staged without removing organisms/vegetation. Three seconds of ordinary updates follow conception; gestation/incubation timeline otherwise accelerated by direct authority calls, not natural evolution or elapsed-gestation proof. Only the presentation clock is sampled while paused.'};
   },kind);
   // Native HUDs lazily initialize existing care records; finish this before the paired state boundary.
   await page.waitForTimeout(1250);
   // Family-control explanation is deliberately gated behind the native toast queue.
   // Wait for that real one-time state transition, rather than filtering it from saves.
   await page.waitForFunction(()=>{const s=window.__GENVO8__.sim;return !s.familyControlStatus?.().unlocked||s.familyControlExplained},{},{timeout:45000});
   const stages=[];
   for(const stage of ['before','after']){
    await page.evaluate(stage=>{window.__careReviewBefore=stage==='before'},stage);
    const captures=[];
    for(let frame=0;frame<8;frame++){
     const actions=await page.evaluate(({frame,setup})=>{const g=window.__GENVO8__,r=g.renderer;r.encounters.time=frame*.22;r.render();return g.sim.animals.filter(a=>a.id===setup.motherId||a.id===setup.subjectId).map(a=>({id:a.id,action:r.actionPose(a,false)}))},{frame,setup});
     const name=stage+'-'+kind+'-'+frame+'.png';await page.screenshot({path:out+'/'+name});captures.push({frame,file:name,actions});
    }
    const sampled=await page.evaluate(async()=>{const g=window.__GENVO8__,r=g.renderer,times=[];for(let i=0;i<50;i++){const t=performance.now();r.render();times.push(performance.now()-t)}times.sort((a,b)=>a-b);const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js');return{meanMs:times.reduce((a,b)=>a+b)/times.length,p95Ms:times[46],state:JSON.stringify(createSimulationSnapshot(g.sim,{savedAt:'care-render-review'}),(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:ArrayBuffer.isView(v)?Array.from(v):v)}});
    stages.push({stage,captures,...sampled});
   }
   if(stages[0].state!==stages[1].state){for(const r of stages)fs.writeFileSync(out+'/'+kind+'-'+r.stage+'-state.json',r.state);throw Error(kind+' canonical state differs; inspect saved diagnostics')} const afterActions=stages[1].captures[0].actions.map(a=>a.action);assert.ok(afterActions.includes(kind==='nursing'?'suckle':kind==='laying'?'lay-settle':'hatch-settle'));if(kind==='nursing')assert.ok(afterActions.includes('nurse'));
   reports.push({setup,exactCanonicalState:true,stages:stages.map(({state,...r})=>r)});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/receipt.json',JSON.stringify({errors,reports,timingScope:'Paused renderer CPU commands only',creatorAcceptance:false},null,2));console.log(JSON.stringify({errors,reports:reports.map(r=>({setup:r.setup,exactCanonicalState:r.exactCanonicalState,timing:r.stages.map(s=>({stage:s.stage,meanMs:s.meanMs,p95Ms:s.p95Ms}))}))}));
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
