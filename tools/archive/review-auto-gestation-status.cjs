// Read-only observation around native public controls; no simulation assignments.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
 if(fs.existsSync(out))throw Error('Use a new evidence directory.');fs.mkdirSync(out,{recursive:true});
 const receipt={root,scope:'Actual public authored capability preset; native controls, no staged state.',creatorAcceptance:false,errors:[]};
 const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.ogg':'audio/ogg'};
 const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'..'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,b)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});let page;
 try{
 page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.__GENVO8__);
 await page.getByRole('button',{name:'New World',exact:true}).click();
 const advanced=page.locator('#newWorldAdvanced');if(await advanced.getAttribute('open')===null)await advanced.locator('summary').click();
 await page.locator('#newWorldSeed').fill('GENVO8-PLAYABLE-TEST');
 await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.locator('#startGame').waitFor({state:'visible',timeout:90000});await page.locator('#startGame').click();
 await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());await page.waitForFunction(()=>!!window.__GENVO8__.sim.climate&&!window.__GENVO8__.sim.paused);
 await page.locator('#stageUtilities>button').click();await page.locator('[data-action="autonomy"]').click();await page.locator('[data-action="speed"]').click();await page.locator('[data-action="speed"]').click();await page.locator('#stageUtilities>button').click();
 receipt.observations=[];const begun=Date.now();let mother=null;
 while(Date.now()-begun<300000){
 const row=await page.evaluate(()=>{const s=window.__GENVO8__.sim,f=s.familyControlStatus(),a=f.members.find(a=>a.pregnant);return{tick:s.tickCount,day:s.day,paused:s.paused,mother:a?{id:a.id,mode:a.pregnant.mode,progress:s.family.pregnancyProgress(a)}:null}});receipt.observations.push(row);if(row.mother){mother=row.mother;break}await page.waitForTimeout(1000);
 }
 assert.ok(mother,'No naturally gestating controllable actor observed during this bounded AUTO run');receipt.mother=mother;
 const control=await page.evaluate(id=>{const f=window.__GENVO8__.sim.familyControlStatus();return{current:f.index,count:f.count,target:f.members.findIndex(a=>a.id===id)}},mother.id);
 for(let n=0;n<(control.target-control.current+control.count)%control.count;n++)await page.keyboard.press('Tab');
 await page.waitForFunction(()=>!!document.querySelector('#clock .gestation-mark'));
 receipt.layouts=[];for(const [width,height] of [[1920,1080],[1366,768],[800,600],[568,320],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(180);const row=await page.locator('#clock .gestation-mark').evaluate(e=>{const b=e.getBoundingClientRect();return{text:e.textContent,top:b.top,bottom:b.bottom,left:b.left,right:b.right}});assert.ok(row.left>=0&&row.right<=width&&row.top>=0&&row.bottom<=height);receipt.layouts.push({width,height,...row});await page.screenshot({path:path.join(out,'gestation-'+width+'x'+height+'.png')})}
 assert.equal(receipt.errors.length,0);

 }catch(e){receipt.failure=e.message;if(page){receipt.visibleText=await page.locator('body').innerText();await page.screenshot({path:path.join(out,'failure.png')})}throw e}
 finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
 console.log('Actual AUTO gestation status observed.');
})().catch(e=>{console.error(e);process.exitCode=1});
