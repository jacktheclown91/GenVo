let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'../..'),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900},recordVideo:{dir:path.join(root,'docs/runtime-v176-video'),size:{width:1440,height:900}}});
 activeBrowser=browser;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
 await page.getByRole('button',{name:/New World/}).click();await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForTimeout(600);
 await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready');
 const targetId=await page.evaluate(async()=>{const g=window.__GENVO8__,{canHunt}=await import('/src/ecology/functional-diet.js'),p=g.sim.player(),t=g.sim.animals.find(a=>a.alive&&canHunt(a)&&a.id!==p.id);g.sim.paused=true;t.x=p.x+1;t.y=p.y;g.sim.rebuildSpatial();g.renderer.motion.clear();g.renderer.render();return t.id});
 const point=await page.evaluate(id=>window.__GENVO8__.renderer.screenPos.get(id),targetId);await page.mouse.click(point.x,point.y);await page.waitForTimeout(120);
 if(!(await page.locator('.creature-context-tray').isVisible()))throw Error('Creature tray did not open');await page.evaluate(()=>window.__GENVO8__.sim.paused=false);await page.waitForTimeout(150);
 await page.screenshot({path:path.join(root,'docs/runtime-mouse-context-desktop.png')});
 const state=await page.evaluate(()=>({target:window.__GENVO8__.contextTray.targetId,buttons:[...document.querySelectorAll('.creature-context-tray button')].map(b=>({label:b.textContent,disabled:b.disabled}))}));
 await page.getByRole('button',{name:'Attack',exact:true}).click();
 const action=await page.evaluate(()=>window.__GENVO8__.sim.player().attackAction);if(action?.targetId!==targetId)throw Error('Mouse attack not bound to selected target');
 state.attack=action;await page.screenshot({path:path.join(root,'docs/runtime-mouse-context-windup.png')});
 await page.evaluate(()=>{const w=window.__GENVO8__.leadershipWheel,original=w.openAt.bind(w);window.__familyRightCalls=0;w.openAt=(...args)=>{window.__familyRightCalls++;return original(...args)}});await page.mouse.click(point.x,point.y,{button:'right'});if(await page.locator('.creature-context-tray').isVisible())throw Error('Context tray conflicts with right-click guidance');
 state.familyWheelVisible=await page.locator('#commandWheel').isVisible();state.familyGate=await page.evaluate(()=>({calls:window.__familyRightCalls,available:window.__GENVO8__.leadershipWheel.available(),message:document.querySelector('#toast')?.textContent}));if(state.familyGate.calls!==1||(state.familyGate.available&&!state.familyWheelVisible))throw Error('Right-click guidance controller was not preserved');
 await page.setViewportSize({width:800,height:600});await page.mouse.click(400,300);await page.evaluate(()=>window.__GENVO8__.leadershipWheel.close());
 await page.waitForTimeout(150);await page.evaluate(id=>{const g=window.__GENVO8__,p=g.sim.player(),t=g.sim.animals.find(a=>a.id===id);t.alive=true;t.x=p.x+1;t.y=p.y;g.sim.rebuildSpatial();g.renderer.render()},targetId);const small=await page.evaluate(id=>window.__GENVO8__.renderer.screenPos.get(id),targetId);if(small){await page.mouse.click(small.x,small.y);await page.waitForTimeout(130);await page.screenshot({path:path.join(root,'docs/runtime-mouse-context-embedded.png')})}
 fs.writeFileSync(path.join(root,'docs/runtime-mouse-context-proof.json'),JSON.stringify({state,errors},null,2));
 const video=page.video();await browser.close();fs.copyFileSync(await video.path(),path.join(root,'docs/runtime-mouse-context.webm'));
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});



