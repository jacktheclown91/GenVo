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
 page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.__GENVO8__);
 await page.getByRole('button',{name:'New World',exact:true}).click();
 const advanced=page.locator('#newWorldAdvanced');if(await advanced.getAttribute('open')===null)await advanced.locator('summary').click();
 await page.locator('#newWorldStartingPoint').selectOption('catalog:established-valley-d30');await page.locator('#newWorldCreature').selectOption('resident');
 await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.locator('#residentStart').waitFor({state:'visible',timeout:90000});await page.getByLabel('Living resident',{exact:true}).selectOption('117');await page.getByRole('button',{name:'Begin as this creature',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd').hidden);await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());if(await page.locator('#startGame').isVisible())await page.locator('#startGame').click();
 await page.waitForFunction(()=>!!document.querySelector('#clock .gestation-mark'));
 receipt.actor=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();return{id:p.id,species:p.species,seed:s.seed,day:s.day,pregnancy:p.pregnant,progress:s.family.pregnancyProgress(p)}});assert.equal(receipt.actor.id,117);assert.ok(receipt.actor.progress);
 receipt.layouts=[];for(const [width,height] of [[1920,1080],[1366,768],[800,600],[568,320],[390,844]]){const before=await page.evaluate(()=>window.__GENVO8__.renderer.renderNow);await page.setViewportSize({width,height});await page.waitForFunction(before=>window.__GENVO8__.renderer.renderNow>before&&window.__GENVO8__.renderer.w===innerWidth&&window.__GENVO8__.renderer.h===innerHeight,before);await page.locator('#clock .gestation-mark').waitFor({state:'visible'});const row=await page.evaluate(()=>{const e=document.querySelector('#clock .gestation-mark');const b=e.getBoundingClientRect();return{text:e.textContent,top:b.top,bottom:b.bottom,left:b.left,right:b.right}});assert.ok(row.bottom-row.top>0&&row.right-row.left>0);assert.ok(row.left>=0&&row.right<=width&&row.top>=0&&row.bottom<=height);receipt.layouts.push({width,height,...row});await page.screenshot({path:path.join(out,'gestation-'+width+'x'+height+'.png')})}
 assert.equal(receipt.errors.length,0);

 }catch(e){receipt.failure=e.message;if(page){receipt.visibleText=await page.locator('body').innerText();await page.screenshot({path:path.join(out,'failure.png')})}throw e}
 finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
 console.log('Recorded pregnant resident status observed.');
})().catch(e=>{console.error(e);process.exitCode=1});
