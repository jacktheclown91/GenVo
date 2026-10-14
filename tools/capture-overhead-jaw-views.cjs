// Stationary overhead camera, one organism rotated in the actual game. No demo renderer.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const label=process.argv[2];assert.ok(['before','after'].includes(label));const root=path.resolve(__dirname,'..');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:800,height:600},recordVideo:{dir:`docs/overhead-jaws-views-${label}-video`,size:{width:800,height:600}}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://genvo.review/**',r=>{const rel=decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html',old=path.resolve(root,'reports/overhead-jaws-before',rel),p=label==='before'&&fs.existsSync(old)?old:path.resolve(root,rel);return p.startsWith(root+path.sep)&&fs.existsSync(p)?r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(p)]||'application/octet-stream'}):r.fulfill({status:404})});
  await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.editor);
  await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('ANATOMICAL-STRIKE');await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready');
  const checkpoint=JSON.parse(fs.readFileSync('reports/limb-production/world-checkpoint.json'));
  await page.evaluate(async state=>{const g=window.__GENVO8__,{restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js');const sim=restoreSimulationSnapshot(JSON.parse(state.snapshot,(_k,v)=>v?.__map?new Map(v.__map):v?.__set?new Set(v.__set):v?.__typed?new globalThis[v.__typed](v.values):v));// JSON transport cannot retain shared object aliases. Rebuild this derived cache.
sim._player=null;const old=g.saveManager.load;g.saveManager.load=async()=>sim;try{if(!await g.loadSavedLineage())throw Error('Checkpoint restore failed')}finally{g.saveManager.load=old}g.sim.paused=true;g.contextTray.close();},checkpoint);
  await page.evaluate(()=>{const g=window.__GENVO8__,old=g.renderer.easedDir.bind(g.renderer);g.renderer.easedDir=function(id,target){const actual=old(id,target);if(id===g.sim.player().id)window.__renderedFacing={target,actual};return actual}});const cases=[];
  for(const body of ['tearing-jaw','crushing-jaw','gape-mouth','tusk-jaw']){
   const setup=await page.evaluate(async body=>{
    const g=window.__GENVO8__,s=g.sim,p=s.player();
    if(body){
     const {founderPlan}=await import('/src/lineage/body-inheritance.js'),{attachHeadPlan}=await import('/src/lineage/head-plan.js'),{makePlan,validatePlan}=await import('/src/lineage/body-plan.js'),{applyLineageTarget}=await import('/src/lineage/reproduction-bridge.js');
     const base=attachHeadPlan(founderPlan());const plan=makePlan(base.nodes.map(n=>n.socket==='mouth'?{...n,partId:body}:n));
     if(!validatePlan(plan).ok)throw Error('Invalid compound anatomy');if(!applyLineageTarget(p,plan))throw Error('Failed valid anatomy fixture');
    }
    p.target=null;p.lastPlantMeal=null;p.lastFreshwaterMeal=null;s.lastPlayerAction=null;const {FeedingPresentation}=await import('/src/render/feeding-expression.js');g.renderer.feeding=new FeedingPresentation();g.renderer.playerVisual=null;g.renderer.motion.clear();g.renderer.camera={x:p.x,y:p.y};g.renderer.cameraReady=true;
    return{body,plan:p.bodyPlan,genes:p.genes,x:p.x,y:p.y,tick:s.tickCount,scope:body==='natural'?'Natural initial body in saved world; idle-heading fixture clears recent meal presentation and rebinds JSON-transfer player cache to the actual animal':'Controlled legal headed body with the selected jaw on the same actual player; no ecological outcome forced'};
   },body);
   const facings=[];
   for(let dir=0;dir<8;dir++){
    await page.evaluate(async dir=>{const g=window.__GENVO8__,p=g.sim.player(),{HeadAttentionPresentation}=await import('/src/render/head-attention.js');p.dir=dir;p.anim=0;g.renderer.playerVisual=null;g.renderer.turnState.clear();g.renderer.headAttention=new HeadAttentionPresentation();g.renderer.motion.clear();g.renderer.zoom=2;g.renderer.cameraReady=true;g.renderer.render();},dir);
    await page.waitForTimeout(70);await page.screenshot({path:`docs/overhead-jaws-views-${label}-${body}-${dir}-800.png`});
    await page.evaluate(()=>{const g=window.__GENVO8__;g.renderer.zoom=4;g.renderer.render()});
    await page.screenshot({path:`docs/overhead-jaws-views-${label}-${body}-${dir}-close-800.png`});
    facings.push(await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();return{dir:p.dir,rendered:window.__renderedFacing,sameSim:g.renderer.sim===g.sim,sameActor:g.sim.animals.find(a=>a.id===p.id)===p,body:p.bodyPlan.id,genes:p.genes,x:p.x,y:p.y,tick:g.sim.tickCount,camera:{...g.renderer.camera},zoom:g.renderer.zoom}}));
   }
   for(const f of facings){assert.equal(f.rendered?.actual,f.dir,'The actual renderer must face the requested direction');assert.equal(f.sameSim,true);assert.equal(f.sameActor,true)}assert.equal(new Set(facings.map(f=>f.body)).size,1);assert.equal(new Set(facings.map(f=>JSON.stringify(f.genes))).size,1);assert.equal(new Set(facings.map(f=>JSON.stringify(f.camera))).size,1);assert.equal(new Set(facings.map(f=>f.tick)).size,1);cases.push({setup,facings});
  }
  const walkStart=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=false;g.renderer.zoom=2;return{x:p.x,y:p.y}});
  await page.keyboard.down('KeyD');await page.waitForTimeout(1200);await page.keyboard.up('KeyD');await page.waitForTimeout(1300);
  const walkEnd=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();return{x:p.x,y:p.y,sameActor:g.sim.animals.find(a=>a.id===p.id)===p}});
  assert.equal(walkEnd.sameActor,true);assert.ok(Math.hypot(walkEnd.x-walkStart.x,walkEnd.y-walkStart.y)>.05,'Actual rendered world animal must move, not a detached player copy');
  assert.deepEqual(errors,[]);const video=page.video();await page.close();fs.copyFileSync(await video.path(),`docs/overhead-jaws-views-${label}-runtime.webm`);
  fs.writeFileSync(`docs/overhead-jaws-views-${label}-proof.json`,JSON.stringify({status:'PASS',label,cases,walkStart,walkEnd,errors,limits:'Heading/body poses are controlled fixture evidence. Camera position/zoom and biological identity remain fixed across eight views. Rendered heading and actual animal identity are independently checked. The final walk uses ordinary gameplay; not human usability or creator visual approval.'},null,2));console.log(label+' eight rendered facings, fixed camera/body/genetics and actual world movement PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
