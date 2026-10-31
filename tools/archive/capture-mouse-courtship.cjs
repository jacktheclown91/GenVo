let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'../..'),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900},recordVideo:{dir:path.join(root,'docs/runtime-v176-video'),size:{width:1440,height:900}}});
 activeBrowser=browser;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
 await page.getByRole('button',{name:/New World/}).click();await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForTimeout(600);
 await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready');
 const targetId=await page.evaluate(async()=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),t=s.animals.find(a=>a.alive&&a.id!==p.id&&a.species===p.species),{SPECIES}=await import('/src/organisms/species.js');s.paused=true;for(const a of [p,t]){const spec=SPECIES[a.species];a.age=spec.maturity+20;a.health=100;a.energy=spec.maxEnergy*.99;a.hydration=spec.maxHydration*.99;a.pregnant=null;a.reproCooldown=0;a.infected=false;a.parentIds=[]}t.sex=p.sex==='M'?'F':'M';t.x=p.x+.4;t.y=p.y;s.rebuildSpatial();g.renderer.motion.clear();g.renderer.render();return t.id});
 const point=await page.evaluate(id=>window.__GENVO8__.renderer.screenPos.get(id),targetId);await page.mouse.click(point.x,point.y);await page.evaluate(()=>window.__GENVO8__.sim.paused=false);await page.waitForTimeout(100);await page.getByRole('button',{name:'Social',exact:true}).click();await page.getByRole('button',{name:'Court',exact:true}).click();await page.waitForTimeout(120);
 if(!(await page.locator('.courtship-tray').isVisible()))throw Error('Courtship tray not open');
 const cards=await page.locator('.courtship-cards button').evaluateAll(bs=>bs.map(b=>b.dataset.move));
 await page.locator('.courtship-tray [data-move="approach"]').click();await page.getByRole('button',{name:'Undo',exact:true}).click();
 if(await page.evaluate(()=>window.__GENVO8__.sim.reproduction.ritualQueue.length))throw Error('Undo did not clear choice');
 await page.locator('.courtship-tray [data-move="approach"]').click();await page.locator('.courtship-tray [data-move="approach"]').click();await page.getByRole('button',{name:'Clear',exact:true}).click();await page.locator('.courtship-tray [data-move="approach"]').click();
 await page.screenshot({path:path.join(root,'docs/runtime-mouse-courtship-desktop.png')});
 await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForTimeout(80);
 const committed=await page.evaluate(()=>{const s=window.__GENVO8__.sim,a=s.player();return{target:s.reproduction.courtTargetId,queued:a.queuedCourtshipSequence,performance:a.courtshipPerformance,intent:a.intent,status:document.querySelector('.courtship-tray [role=status]').textContent}});
 if(committed.target!==targetId||!(committed.performance?.sequence||committed.queued)?.includes('approach'))throw Error('Play did not commit explicit selected sequence');
 await page.screenshot({path:path.join(root,'docs/runtime-mouse-courtship-performing.png')});
 await page.getByRole('button',{name:'Combat',exact:true}).click();if(await page.evaluate(()=>window.__GENVO8__.contextTray.mode)!=='combat')throw Error('Courtship mode switch failed');const stopped=await page.evaluate(()=>{const s=window.__GENVO8__.sim,a=s.player();return{target:s.reproduction.courtTargetId,performance:a.courtshipPerformance,queue:a.queuedCourtshipSequence}});if(stopped.target||stopped.performance||stopped.queue)throw Error('Back Off failed');
 await page.setViewportSize({width:800,height:600});await page.getByRole('button',{name:'Social',exact:true}).click();await page.evaluate(id=>window.__GENVO8__.courtshipTray.show(id),targetId);await page.waitForTimeout(120);await page.screenshot({path:path.join(root,'docs/runtime-mouse-courtship-embedded.png')});
 const bounds=await page.locator('.courtship-tray').boundingBox();if(bounds.x<0||bounds.y<0||bounds.x+bounds.width>800||bounds.y+bounds.height>600)throw Error('Embedded courtship tray is clipped');if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(root,'docs/runtime-mouse-courtship-proof.json'),JSON.stringify({targetId,cards,committed,stopped,bounds,errors},null,2));
 const video=page.video();await browser.close();fs.copyFileSync(await video.path(),path.join(root,'docs/runtime-mouse-courtship.webm'));
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});



