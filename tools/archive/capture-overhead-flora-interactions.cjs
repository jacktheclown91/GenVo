// Controlled placement/body/trait fixtures; real resources, mouse selection and E execution.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'../..'),browser=await chromium.launch({headless:true}),runs=[];
 try{for(const label of ['before','after']){
  const page=await browser.newPage({viewport:{width:800,height:600},recordVideo:{dir:`docs/overhead-flora-interactions-${label}-video`,size:{width:800,height:600}}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://genvo.review/**',r=>{const rel=decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html',old=path.resolve(root,'reports/overhead-flora-before',rel),p=label==='before'&&fs.existsSync(old)?old:path.resolve(root,rel);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return r.fulfill({status:404});return r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(p)]||'application/octet-stream'})});
  await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.editor);await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('OVERHEAD-PLANT-INTERACTION');await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready');
  await page.evaluate(async()=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),{founderPlan}=await import('/src/lineage/body-inheritance.js'),{makePlan}=await import('/src/lineage/body-plan.js'),{attachHeadPlan}=await import('/src/lineage/head-plan.js'),{applyLineageTarget}=await import('/src/lineage/reproduction-bridge.js');s.paused=true;applyLineageTarget(p,attachHeadPlan(makePlan(founderPlan().nodes.map(n=>n.socket==='mouth'?{...n,partId:'nibbler-mouth'}:n))));Object.assign(p,{age:40,energy:20,hydration:80,health:100,intent:'idle',target:null})});
  const trials=[];
  for(const kind of ['sunmoss','bramble','marshroot','rotcap','thistlepod']){
   const spot=await page.evaluate(async kind=>{
    const g=window.__GENVO8__,s=g.sim,p=s.player(),w=s.world,{worldResourceAt}=await import('/src/ui/world-resource-target.js');s.paused=true;g.contextTray.close();
    const options=[];for(let i=0;i<w.len;i++){const amount=w.plants[kind][i],x=i%w.n+.5,y=(i/w.n|0)+.5;if(amount<=.025||x<5||y<5||x>w.n-5||y>w.n-5||w.water[i]||!s.canOccupy(p,x-.8,y))continue;if(s.animals.some(a=>a!==p&&a.alive&&Math.hypot(a.x-x,a.y-y)<2.5))continue;options.push({i,x,y,amount})}
    options.sort((a,b)=>b.amount-a.amount);
    // Founding fungi are below ordinary canopy visibility on this seed. Keep this
    // test explicit: finite stock/substrate fixture, not a natural decomposer bloom.
    if(kind==='rotcap'&&options.length){const at=options[0];w.rotcap[at.i]=.6;s.dispersal.litter[at.i]=.3;options.splice(1);at.fixture='Controlled finite fungus (.6) and real substrate (.3); no natural growth claim'}
    for(const at of options.slice(0,100)){
     Object.assign(p,{x:at.x-.8,y:at.y,energy:20,hydration:80,intent:'idle',target:null});s.rebuildSpatial();g.renderer.motion.clear();g.renderer.resetWorldCaches();g.renderer.zoom=2;g.renderer.cameraReady=false;g.renderer.render();
     const target=g.renderer.visiblePlantTargets.get(at.i+'|'+kind);if(!target)continue;const r=g.renderer,tile=g.CFG.tileSize*r.zoom,x=r.w/2+(target.hitX-r.camera.x)*tile,y=r.h/2+(target.hitY-r.camera.y)*tile,hit=worldResourceAt(s,r,x,y);
     if(hit?.kind==='plant'&&hit.food===kind&&hit.i===at.i){s.paused=false;return{...at,kind,click:{x,y},anchor:target,scope:at.fixture||'Naturally present finite resource; controlled legal nibbling body, adult reserves and nearby placement. No food/terrain spawned.'}}
    }
    throw Error('No unambiguous visible natural resource candidate for '+kind+' among '+options.length+' reachable stocked cells; maximum '+Math.max(...w.plants[kind]));
   },kind);
   await page.mouse.click(spot.click.x,spot.click.y);const selected=await page.evaluate(()=>structuredClone(window.__GENVO8__.contextTray.resourceTarget));assert.equal(selected?.food,kind);assert.equal(selected.i,spot.i);await page.screenshot({path:`docs/overhead-flora-${label}-${kind}-selected-800.png`});
   await page.locator('.context-radial button[aria-label="Inspect"]').click();await page.waitForSelector('.resource-inspector:not([hidden])');if(kind==='bramble'||kind==='thistlepod')await page.screenshot({path:`docs/overhead-flora-${label}-${kind}-inspect-800.png`});await page.getByRole('button',{name:'Close object inspector',exact:true}).click();
   const before=await page.evaluate(i=>window.__GENVO8__.sim.world.plants[window.__GENVO8__.contextTray.resourceTarget.food][i],spot.i);await page.keyboard.press('KeyE');await page.waitForTimeout(180);
   const result=await page.evaluate(({kind,i})=>{const g=window.__GENVO8__,s=g.sim;return{stock:s.world.plants[kind][i],receipt:structuredClone(s.lastPlayerAction),meal:structuredClone(s.player().lastPlantMeal),radialClosed:g.contextTray.radial.el.hidden}},spot);
   assert.ok(result.receipt?.type==='eat'&&result.receipt.energyGain>0,JSON.stringify({kind,result}));assert.equal(result.receipt.kind,kind);assert.ok(result.stock<before);assert.equal(result.radialClosed,true);trials.push({spot,selected,before,result});
  }
  const traits=[];const pod=trials.find(t=>t.spot.kind==='thistlepod').spot;
  for(const coat of [.1,.25,.4]){
   const state=await page.evaluate(async({i,coat})=>{const g=window.__GENVO8__,s=g.sim,d=s.dispersal,{coatedClonalFloraGenome}=await import('/src/ecology/flora-genotype.js'),{registerFloraGenome}=await import('/src/ecology/flora-inheritance.js');s.paused=true;g.contextTray.close();const parent=d.genomeAt('thistlepod',i),genome=registerFloraGenome(d,coatedClonalFloraGenome(parent,parent.traits.seedAllocation,coat));d.floraState.adults.thistlepod.set(i,genome.id);g.renderer.resetWorldCaches();g.renderer.zoom=4;g.renderer.cameraReady=false;g.renderer.render();return{genome,amount:s.world.thistlepod[i],tick:s.tickCount}}, {...pod,coat});
   assert.equal(state.genome.traits.coatAllocation,coat);await page.screenshot({path:`docs/overhead-flora-${label}-coat-${coat}-800.png`});traits.push(state);
  }
  const seasons=[];for(let index=0;index<4;index++){
   const state=await page.evaluate(index=>{const g=window.__GENVO8__;g.sim.seasonIndex=index;g.renderer.resetWorldCaches();g.renderer.render();return{season:g.sim.season,amount:g.sim.world.thistlepod[window.__GENVO8__.sim.world.idx(g.sim.player().x+.8,g.sim.player().y)]}},index);
   await page.screenshot({path:`docs/overhead-flora-${label}-${state.season}-800.png`});seasons.push(state);
  }
  const saved=await page.evaluate(async i=>{const s=window.__GENVO8__.sim,{createSimulationSnapshot,restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js'),copy=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(s)));return{body:copy.player().bodyPlan.id===s.player().bodyPlan.id,stock:copy.world.thistlepod[i]===s.world.thistlepod[i],genome:JSON.stringify(copy.dispersal.genomeAt('thistlepod',i))===JSON.stringify(s.dispersal.genomeAt('thistlepod',i))}},pod.i);assert.ok(saved.body&&saved.stock&&saved.genome);assert.deepEqual(errors,[]);
  const video=page.video();await page.close();fs.copyFileSync(await video.path(),`docs/overhead-flora-interactions-${label}-runtime.webm`);runs.push({label,trials,traits,seasons,saved,errors});console.log(label+' all five mouse-selected foods, Inspect/E, canonical coat fixtures, seasons and save PASS');
 }
 fs.writeFileSync('docs/overhead-flora-interaction-proof.json',JSON.stringify({status:'PASS',scope:'Real 800x600 game. Body/placement/reserves and valid canonical coat/season fixtures are controlled. Four foods use natural stocks; founding fungi use an explicit finite stock/substrate fixture. Actual mouse/E consumes those stocks. No natural adaptation, reproductive success or human acceptance claimed.',runs},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
