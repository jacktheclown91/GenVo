// Read-only observation around native public controls; no simulation assignments.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
 if(fs.existsSync(out))throw Error('Use a new evidence directory.');fs.mkdirSync(out,{recursive:true});
 const receipt={root,scope:'Actual public authored capability preset; native controls, no staged state.',creatorAcceptance:false,errors:[]};
 const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.ogg':'audio/ogg'};
 const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,b)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});let page;
 try{
 page=await browser.newPage({viewport:{width:1366,height:768},recordVideo:{dir:path.join(out,'video'),size:{width:1366,height:768}}});page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.__GENVO8__);
 await page.getByRole('button',{name:'New World',exact:true}).click();
 const advanced=page.locator('#newWorldAdvanced');if(await advanced.getAttribute('open')===null)await advanced.locator('summary').click();
 await page.locator('#newWorldStartingPoint').selectOption('catalog:established-valley-d30');await page.locator('#newWorldCreature').selectOption('resident');await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.locator('#residentStart').waitFor({state:'visible',timeout:90000});await page.getByLabel('Living resident',{exact:true}).selectOption('117');await page.getByRole('button',{name:'Begin as this creature',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#frontEnd').hidden);if(await page.locator('#startGame').isVisible())await page.locator('#startGame').click();await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const read=()=>page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player(),m=g.renderer.motion.states.get('gait:'+p.id)||g.renderer.motion.states.get(p.id);return{tick:g.sim.tickCount,x:p.x,y:p.y,dir:p.dir,anim:p.anim,intent:p.intent,pregnancy:g.sim.family.pregnancyProgress(p),energy:p.energy,exertion:p.exertion,autonomy:g.sim.playerAutonomy,gait:m?.gait,heading:m&&{x:m.headingX,y:m.headingY},body:g.renderer.screenBounds.get(p.id)}});
 assert.equal((await page.evaluate(()=>window.__GENVO8__.sim.playerId)),117);assert.ok((await read()).pregnancy,'Actual recorded live pregnancy required');receipt.segments=[];
 for(const [name,keys] of [['walk',['KeyS']],['sprint',['Shift','KeyS']],['reverse',['KeyW']],['turn',['KeyA']]]){
 const segment={name,before:await read(),samples:[]};for(const k of keys)await page.keyboard.down(k);
 for(let i=0;i<4;i++){await page.waitForTimeout(120);segment.samples.push(await read());await page.screenshot({path:path.join(out,name+'-'+i+'.png')})}
 for(const k of keys.reverse())await page.keyboard.up(k);segment.after=await read();receipt.segments.push(segment);
 }
 await page.locator('#stageUtilities>button').click();await page.locator('[data-action="autonomy"]').click();
 assert.equal(await page.evaluate(()=>window.__GENVO8__.sim.playerAutonomy),true);
 await page.locator('#stageUtilities>button').click();const auto={name:'auto',before:await read(),samples:[]};
 for(let i=0;i<12;i++){await page.waitForTimeout(250);auto.samples.push(await read());if(i%3===0)await page.screenshot({path:path.join(out,'auto-'+i+'.png')})}auto.after=await read();receipt.segments.push(auto);
 for(const segment of receipt.segments){segment.distance=Math.hypot(segment.after.x-segment.before.x,segment.after.y-segment.before.y);segment.gaitValues=[...new Set(segment.samples.map(x=>x.gait))]}
 assert.ok(receipt.segments.slice(0,4).some(x=>x.distance>.1),'Real manual movement must occur');
 assert.ok(receipt.segments.slice(0,4).some(x=>x.gaitValues.length>1),'The actual renderer gait must advance during movement');
 assert.equal(receipt.errors.length,0);
 await page.close();

 }catch(e){receipt.failure=e.message;if(page){receipt.visibleText=await page.locator('body').innerText();await page.screenshot({path:path.join(out,'failure.png')})}throw e}
 finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
 console.log('Actual recorded pregnant locomotion observed.');
})().catch(e=>{console.error(e);process.exitCode=1});
