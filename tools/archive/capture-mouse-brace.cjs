let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'../..'),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900},recordVideo:{dir:path.join(root,'docs/runtime-v176-video'),size:{width:1440,height:900}}});
 activeBrowser=browser;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
 await page.getByRole('button',{name:/New World/}).click();await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForTimeout(600);
 await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready');
 await page.locator('#tutorial').focus();await page.keyboard.press('Enter');await page.locator('#guide').waitFor({state:'visible',timeout:3000});
 const taskText=await page.locator('#guide').textContent();if(!taskText.includes('Fed and watered'))throw Error('Compact task chip lost the goal details');
 await page.locator('#quickMenu button[data-panel="guide"]').click();await page.locator('#guide').waitFor({state:'hidden'});
 if(!(await page.locator('.creature-stage-modes').isVisible()))throw Error('Stage modes absent without selected target');
 await page.getByRole('button',{name:'Social',exact:true}).click();if(await page.evaluate(()=>window.__GENVO8__.contextTray.mode)!=='social')throw Error('Idle stage Social failed');
 await page.getByRole('button',{name:'Combat',exact:true}).click();await page.screenshot({path:path.join(root,'docs/runtime-creature-stage-idle.png')});
 const targetId=await page.evaluate(async()=>{const g=window.__GENVO8__,{canHunt}=await import('/src/ecology/functional-diet.js'),p=g.sim.player(),t=g.sim.animals.find(a=>a.alive&&canHunt(a)&&a.id!==p.id);g.sim.paused=true;t.x=p.x+1;t.y=p.y;g.sim.rebuildSpatial();g.renderer.motion.clear();g.renderer.render();return t.id});
 const point=await page.evaluate(id=>window.__GENVO8__.renderer.screenPos.get(id),targetId);await page.mouse.click(point.x,point.y);await page.waitForTimeout(120);
 if(!(await page.locator('.creature-context-tray').isVisible()))throw Error('Creature tray did not open');await page.evaluate(()=>window.__GENVO8__.sim.paused=false);await page.waitForTimeout(150);
 if(await page.locator('.creature-context-actions canvas[data-part-id]').count()<2)throw Error('Actual anatomy action icons did not render');
 const iconDiagnostic=await page.evaluate(async()=>{const {artForPart,nativeArtStatus}=await import('/src/render/runtime-part-art.js');return{status:nativeArtStatus(),icons:[...document.querySelectorAll('.creature-context-actions canvas')].map(cv=>{const partId=cv.dataset.partId,native=artForPart(partId),pixels=cv.getContext('2d').getImageData(0,0,32,32).data,colors=new Set();for(let i=0;i<pixels.length;i+=4)if(pixels[i+3])colors.add([...pixels.slice(i,i+4)].join(','));return{partId,native:!!native,rig:native?.rig,frame:native?.frameAt({state:'idle',facing:2,timeMs:0})?.key,colors:[...colors]}})}});fs.writeFileSync(path.join(root,'docs/action-icon-diagnostic.json'),JSON.stringify(iconDiagnostic,null,2));if(iconDiagnostic.status.status!=='ready'||iconDiagnostic.icons.some(i=>!i.native||i.colors.length<4))throw Error('Screenshot still contains unloaded native anatomy');
 await page.screenshot({path:path.join(root,'docs/runtime-mouse-context-desktop.png')});
 const state=await page.evaluate(()=>({target:window.__GENVO8__.contextTray.targetId,buttons:[...document.querySelectorAll('.creature-context-tray button')].map(b=>({label:b.textContent,disabled:b.disabled}))}));
 const brace=page.getByRole('button',{name:/^Hold Brace/});const box=await brace.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(240);
 const held=await page.evaluate(()=>({input:window.__GENVO8__.braceInput.read(),bracing:window.__GENVO8__.sim.player().bracing,exertion:window.__GENVO8__.sim.player().exertion}));if(!held.input||!held.bracing)throw Error('Pointer-held brace did not enter canonical stance');
 await page.screenshot({path:path.join(root,'docs/runtime-mouse-held-brace.png')});
 await page.mouse.move(20,850);await page.mouse.up();await page.waitForTimeout(50);
 const released=await page.evaluate(()=>({input:window.__GENVO8__.braceInput.read(),bracing:window.__GENVO8__.sim.player().bracing}));if(released.input||released.bracing)throw Error('Pointer-up outside button did not release brace');
 state.brace={held,released};
 await page.getByRole('button',{name:'Attack',exact:true}).click();
 const action=await page.evaluate(()=>window.__GENVO8__.sim.player().attackAction);if(action?.targetId!==targetId)throw Error('Mouse attack not bound to selected target');
 state.attack=action;await page.screenshot({path:path.join(root,'docs/runtime-mouse-context-windup.png')});
 await page.evaluate(()=>{const w=window.__GENVO8__.leadershipWheel,original=w.openAt.bind(w);window.__familyRightCalls=0;w.openAt=(...args)=>{window.__familyRightCalls++;return original(...args)}});await page.mouse.click(point.x,point.y,{button:'right'});if(await page.locator('.creature-context-tray').isVisible())throw Error('Context tray conflicts with right-click guidance');
 state.familyWheelVisible=await page.locator('#commandWheel').isVisible();state.familyGate=await page.evaluate(()=>({calls:window.__familyRightCalls,available:window.__GENVO8__.leadershipWheel.available(),message:document.querySelector('#toast')?.textContent}));if(state.familyGate.calls!==1||(state.familyGate.available&&!state.familyWheelVisible))throw Error('Right-click guidance controller was not preserved');
 await page.setViewportSize({width:800,height:600});await page.mouse.click(400,300);await page.evaluate(()=>window.__GENVO8__.leadershipWheel.close());
 await page.waitForTimeout(150);await page.evaluate(id=>{const g=window.__GENVO8__,p=g.sim.player(),t=g.sim.animals.find(a=>a.id===id);t.alive=true;t.x=p.x+1;t.y=p.y;g.sim.rebuildSpatial();g.renderer.render()},targetId);const small=await page.evaluate(id=>window.__GENVO8__.renderer.screenPos.get(id),targetId);if(small){await page.mouse.click(small.x,small.y);await page.waitForTimeout(130);await page.screenshot({path:path.join(root,'docs/runtime-mouse-context-embedded.png')})}
 fs.writeFileSync(path.join(root,'docs/runtime-mouse-held-brace-proof.json'),JSON.stringify({state,errors},null,2));
 const video=page.video();await browser.close();fs.copyFileSync(await video.path(),path.join(root,'docs/runtime-mouse-held-brace.webm'));
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});



