const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')))}
(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]||'reports/home-controls');fs.mkdirSync(out,{recursive:true});
 const receipt={scope:'Controlled browser fixture: actor relocation and already-earned territory are staged. Native controls, finite original plants and original build costs are exercised; not natural tutorial completion or external usability acceptance.',creatorAcceptance:false,errors:[]};
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1024,height:768}});
 page.on('pageerror',e=>receipt.errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.__GENVO8__);
  await page.getByRole('button',{name:'New World',exact:true}).click();await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.locator('#startGame').waitFor({state:'visible',timeout:90000});await page.locator('#startGame').click();
  receipt.site=await page.evaluate(()=>{
   const g=window.__GENVO8__,s=g.sim,a=s.player(),w=s.world;let site;
   for(let y=8;y<w.n-8&&!site;y++)for(let x=8;x<w.n-8;x++){
    if(w.water[w.idx(x,y)]||!s.canOccupy(a,x+.5,y+.5)||!s.canOccupy(a,x-.5,y+.5)||s.animals.some(b=>b!==a&&b.alive&&Math.hypot(b.x-x,b.y-y)<3))continue;
    if(s.shelter.materialAvailable(x+.5,y+.5)<1.2)continue;
    site={kind:'ground',x:x+.5,y:y+.5};break;
   }
   if(!site)throw Error('No naturally stocked empty dry fixture site');
   a.x=site.x-1;a.y=site.y;a.dir=2;const t=s.territory.state(a);t.established=true;t.home={x:site.x,y:site.y};t.radius=8;t.totalFamiliarity=3;t.lastRecompute=s.day;
   s.uiTutorialHome={preexisting:false};g.tutorial.advance('step-home');s.paused=false;window.__homeSite=site;return site;
  });
  await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());await page.waitForTimeout(700);
  async function select(){
   const at=await page.evaluate(async()=>{const {worldResourceAt}=await import('/src/ui/world-resource-target.js'),g=window.__GENVO8__,t=window.__homeSite,tile=g.CFG.tileSize*g.renderer.zoom,cx=(t.x-g.renderer.camera.x)*tile+innerWidth/2,cy=(t.y-g.renderer.camera.y)*tile+innerHeight/2;for(let dy=-.4;dy<=.4;dy+=.2)for(let dx=-.4;dx<=.4;dx+=.2){const x=cx+dx*tile,y=cy+dy*tile,hit=worldResourceAt(g.sim,g.renderer,x,y);if(['ground','snow'].includes(hit?.kind)&&hit.i===g.sim.world.idx(t.x,t.y))return{x,y}}throw Error('No empty point in selected tile')});
   await page.mouse.click(at.x,at.y);await page.locator('.context-radial [data-tutorial-action="mark-home-site"]').waitFor({state:'visible'});
  }
  const build=page.locator('.context-radial [data-tutorial-action="build-shelter"]');
  await page.evaluate(()=>{const g=window.__GENVO8__;window.__homeEnergy=g.sim.player().energy;g.sim.player().energy=1});
  await select();assert.equal(await build.getAttribute('aria-disabled'),'true');assert.match(await build.getAttribute('title'),/energy/);await page.screenshot({path:path.join(out,'insufficient-energy.png')});receipt.energyRejected=true;
  await page.evaluate(()=>{const g=window.__GENVO8__;g.sim.player().energy=window.__homeEnergy;const t=window.__homeSite;window.__homePlants=Object.fromEntries(Object.entries(g.sim.world.plants).map(([k,v])=>[k,Array.from(v)]));g.sim.shelter.consumeMaterials(t.x,t.y,g.sim.shelter.materialAvailable(t.x,t.y)+1,2.2)});
  await select();assert.equal(await build.getAttribute('aria-disabled'),'true');assert.match(await build.getAttribute('title'),/material/);await page.screenshot({path:path.join(out,'insufficient-material.png')});receipt.materialRejected=true;
  await page.evaluate(()=>{for(const [k,v] of Object.entries(window.__homePlants))window.__GENVO8__.sim.world.plants[k].set(v)});
  await select();await build.click();await page.waitForFunction(()=>!!window.__GENVO8__.contextTray.pendingHome);
  assert.equal(await page.evaluate(()=>window.__GENVO8__.sim.shelter.activeShelters().length),0);
  await page.keyboard.press('KeyA');await page.waitForFunction(()=>!window.__GENVO8__.contextTray.pendingHome);receipt.remoteCancelled=true;
  await select();await build.click();await page.waitForFunction(()=>window.__GENVO8__.sim.shelter.activeShelters().some(s=>Math.hypot(s.x-window.__homeSite.x,s.y-window.__homeSite.y)<.001),{},{timeout:10000});
  receipt.built=await page.evaluate(()=>{const g=window.__GENVO8__,a=g.sim.player();return{shelter:g.sim.shelter.activeShelters()[0],body:{x:a.x,y:a.y},energy:a.energy}});
  assert.ok(Math.hypot(receipt.built.body.x-receipt.site.x,receipt.built.body.y-receipt.site.y)<=.35);await page.screenshot({path:path.join(out,'paid-selected-site-shelter.png')});
  await page.keyboard.down('KeyJ');await page.waitForFunction(()=>window.__GENVO8__.sim.uiTutorialDefense?.braced);await page.keyboard.up('KeyJ');await page.setViewportSize({width:568,height:320});await page.waitForTimeout(150);const completeButton=await page.locator('#tutorialContinue').boundingBox();assert.ok(completeButton.y>=0&&completeButton.y+completeButton.height<=320);receipt.compactCompletion=completeButton;await page.screenshot({path:path.join(out,'compact-completion.png')});await page.setViewportSize({width:1024,height:768});await page.locator('#tutorialContinue').click();
  await page.locator('#stageUtilities>button').click();await page.locator('[data-action="autonomy"]').click();await page.waitForFunction(()=>window.__GENVO8__.sim.playerAutonomy);
  await page.keyboard.down('KeyJ');await page.waitForFunction(()=>!window.__GENVO8__.sim.playerAutonomy&&window.__GENVO8__.sim.player().bracing);await page.keyboard.up('KeyJ');receipt.autoAndKeyboardTakeover=true;
  if(await page.locator('#quickMenu').isVisible())await page.locator('#stageUtilities>button').click();
  receipt.waterFixture=await page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,w=s.world,a=s.player();for(let y=3;y<w.n-3;y++)for(let x=3;x<w.n-3;x++){if(!w.water[w.idx(x,y)]||w.water[w.idx(x-1,y)]||!s.canOccupy(a,x-.5,y+.5))continue;a.x=x-.5;a.y=y+.5;a.dir=2;window.__waterSite={x:x+.5,y:y+.5};return window.__waterSite}throw Error('No actual water bank')});
  await page.waitForTimeout(700);
  const waterPoint=await page.evaluate(()=>{const g=window.__GENVO8__,t=window.__waterSite;return{x:(t.x-g.renderer.camera.x)*g.CFG.tileSize*g.renderer.zoom+innerWidth/2,y:(t.y-g.renderer.camera.y)*g.CFG.tileSize*g.renderer.zoom+innerHeight/2}});
  await page.mouse.click(waterPoint.x,waterPoint.y);await page.waitForTimeout(150);
  assert.equal(await page.locator('.context-radial [data-tutorial-action="build-shelter"]').count(),0);assert.equal(await page.locator('.context-radial [data-tutorial-action="mark-home-site"]').count(),0);receipt.waterRejected=true;
  await page.getByRole('button',{name:'Clear selection',exact:true}).click();
  receipt.familyFixture=await page.evaluate(()=>{const g=window.__GENVO8__,a=g.sim.player(),relative=g.sim.animals.find(b=>b.id===g.sim.starterMateId);relative.lineage=true;relative.generation=2;relative.parentIds=[a.id];relative.age=45;relative.x=a.x-.3;relative.y=a.y;return{scope:'Controlled existing adult given family identity for right-click delegation, not a naturally raised descendant',id:relative.id,available:g.leadershipWheel.available()}});
  assert.equal(receipt.familyFixture.available,true);await page.waitForTimeout(200);
  const relativePoint=await page.evaluate(id=>window.__GENVO8__.renderer.screenPos.get(id),receipt.familyFixture.id);await page.mouse.click(relativePoint.x,relativePoint.y,{button:'right'});
  await page.locator('#commandWheel').waitFor({state:'visible'});assert.equal(await page.locator('.context-radial').isVisible(),false);receipt.rightClickFamily=true;await page.screenshot({path:path.join(out,'right-click-family.png')});

  assert.deepEqual(receipt.errors,[]);
 }catch(error){receipt.failure=error.message;receipt.runtime=await page.evaluate(()=>{const g=window.__GENVO8__,a=g.sim.player();return{site:window.__homeSite,home:g.sim.territory.states.get(a.id),check:g.sim.shelter.canBuildAt(a,window.__homeSite),actions:g.contextTray.actionDescriptors.map(x=>({id:x.id,label:x.label,reason:x.reason}))}}).catch(()=>null);await page.screenshot({path:path.join(out,'failure.png')});throw error}
 finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
 console.log('Controlled home UI: genuine disabled explanations, physical approach/cancellation, paid selected-site construction and AUTO/brace takeover PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
