// Separate unstaged normal-world observation. No posed bodies or forced outcomes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:800,height:600},recordVideo:{dir:'docs/overhead-jaws-natural-video',size:{width:800,height:600}}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://genvo.review/**',r=>{const rel=decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html',p=path.resolve(root,rel);if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return r.fulfill({status:404});return r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(p)]||'application/octet-stream'})});
  await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.editor);
  await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('DORSAL-JAW-NATURAL');await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready');
  await page.evaluate(async()=>{
   const g=window.__GENVO8__,{assemblyFor}=await import('/src/render/creature-assembler.js'),old=g.renderer.drawAnimal.bind(g.renderer);
   const records=window.__jawObservation={actors:{},worldMouths:g.sim.animals.reduce((out,a)=>{const m=assemblyFor(a).mouth||'none';out[m]=(out[m]||0)+1;return out},{}),startTick:g.sim.tickCount,startLiving:g.sim.animals.filter(a=>a.alive).length,start:performance.now()};
   g.renderer.drawAnimal=function(a,...args){
    const mouth=assemblyFor(a).mouth;if(['tearing-jaw','crushing-jaw','gape-mouth','tusk-jaw'].includes(mouth)){
     const r=records.actors[a.id]??={id:a.id,mouth,body:a.bodyPlan?.id,draws:0,intents:{},phases:{}};
     r.draws++;r.intents[a.intent]=(r.intents[a.intent]||0)+1;if(a.attackAction?.phase)r.phases[a.attackAction.phase]=(r.phases[a.attackAction.phase]||0)+1;
    }
    return old(a,...args);
   };
  });
  await page.waitForTimeout(15000);await page.screenshot({path:'docs/overhead-jaws-natural-mid-800.png'});
  await page.waitForTimeout(15000);await page.screenshot({path:'docs/overhead-jaws-natural-end-800.png'});
  const observation=await page.evaluate(()=>{const g=window.__GENVO8__,r=window.__jawObservation;return{...r,elapsedSeconds:(performance.now()-r.start)/1000,endTick:g.sim.tickCount,endLiving:g.sim.animals.filter(a=>a.alive).length,playerSameActor:g.sim.animals.find(a=>a.id===g.sim.player().id)===g.sim.player()}});
  // An absence is an observation, never a reason to invent a nearby predator.
  assert.ok(observation.endTick>observation.startTick);assert.equal(observation.playerSameActor,true);assert.deepEqual(errors,[]);
  const video=page.video();await page.close();fs.copyFileSync(await video.path(),'docs/overhead-jaws-natural-runtime.webm');
  fs.writeFileSync('docs/overhead-jaws-natural-proof.json',JSON.stringify({status:Object.keys(observation.actors).length?'REVISED_JAWS_OBSERVED':'NO_REVISED_JAWS_VISIBLE',scope:'Thirty seconds of normal-speed initial world with no input, fixture body/position/resource changes, acceleration or forced encounter. Visible actors counted through unchanged real renderer. Not ten-minute engagement, natural generations, ecological balance or human comprehension.',observation,errors},null,2));
  console.log(JSON.stringify({status:'OBSERVED',actors:Object.values(observation.actors).map(a=>({id:a.id,mouth:a.mouth,intents:Object.keys(a.intents),phases:Object.keys(a.phases)})),ticks:observation.endTick-observation.startTick,errors}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
