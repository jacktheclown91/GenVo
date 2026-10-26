// Read-only observation around native public controls; no simulation assignments.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
 if(fs.existsSync(out))throw Error('Use a new evidence directory.');fs.mkdirSync(out,{recursive:true});
 const receipt={root,scope:'Actual public authored spring-jumper start; native Enter launch and landing, no staged state.',creatorAcceptance:false,errors:[]};
 const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.ogg':'audio/ogg'};
 const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,b)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});let page;
 try{
 page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.__GENVO8__);
 await page.getByRole('button',{name:'New World',exact:true}).click();
 const advanced=page.locator('#newWorldAdvanced');if(await advanced.getAttribute('open')===null)await advanced.locator('summary').click();
 await page.locator('#newWorldSeed').fill('PLANET-RELEASE-1');await page.locator('#newWorldCreature').selectOption('starter-jump');
 await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.locator('#startGame').waitFor({state:'visible',timeout:90000});await page.locator('#startGame').click();
 await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());await page.waitForFunction(()=>!!window.__GENVO8__.sim.climate&&!window.__GENVO8__.sim.paused);
 const read=()=>page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();return{tick:g.sim.tickCount,x:p.x,y:p.y,airborne:p.airborne,mode:p.aerialMode,jump:p.jump,landing:p.jumpLanding,energy:p.energy,exertion:p.exertion,body:g.renderer.screenBounds.get(p.id),last:g.sim.lastPlayerAction}});
 receipt.before=await read();await page.screenshot({path:path.join(out,'ground.png')});
 await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__GENVO8__.sim.player().aerialMode==='jump',null,{timeout:5000});
 receipt.launch=await read();await page.screenshot({path:path.join(out,'launch.png')});
 await page.waitForTimeout(180);receipt.arc=await read();await page.screenshot({path:path.join(out,'arc.png')});
 await page.waitForFunction(()=>!!window.__GENVO8__.sim.player().jumpLanding&&!window.__GENVO8__.sim.player().airborne,null,{timeout:15000});
 receipt.landing=await read();await page.screenshot({path:path.join(out,'landing.png')});
 assert.equal(receipt.launch.mode,'jump');assert.ok(receipt.landing.landing.tick>=receipt.before.tick);assert.ok(Math.hypot(receipt.landing.x-receipt.before.x,receipt.landing.y-receipt.before.y)>.1);assert.equal(receipt.errors.length,0);
 }catch(e){receipt.failure=e.message;if(page)await page.screenshot({path:path.join(out,'failure.png')});throw e}
 finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
 console.log('Public native jump and landing observed.');
})().catch(e=>{console.error(e);process.exitCode=1});
