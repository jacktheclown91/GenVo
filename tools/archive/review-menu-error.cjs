// Read-only observation around native public controls; no simulation assignments.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),kind='burrow';
 if(fs.existsSync(out))throw Error('Use a new evidence directory.');fs.mkdirSync(out,{recursive:true});
 const receipt={root,kind,scope:'Actual public authored capability preset; native controls, no staged state.',creatorAcceptance:false,errors:[]};
 const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.ogg':'audio/ogg'};
 const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'..'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,b)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});let page;
 try{
 page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.__GENVO8__);
 await page.getByRole('button',{name:'New World',exact:true}).click();
 const advanced=page.locator('#newWorldAdvanced');if(await advanced.getAttribute('open')===null)await advanced.locator('summary').click();
 await page.locator('#newWorldSeed').fill('PLANET-RELEASE-1');await page.locator('#newWorldCreature').selectOption('starter-'+kind);
 await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#menuMessage.error')?.textContent,{},{timeout:30000});
 receipt.message=await page.locator('#menuMessage').innerText();assert.match(receipt.message,/habitat/i);
 receipt.firstFailure=await page.locator('#menuMessage').evaluate(e=>{const b=e.getBoundingClientRect(),f=e.closest('.front-frame').getBoundingClientRect();return{top:b.top,bottom:b.bottom,frameTop:f.top,frameBottom:f.bottom}});
 assert.ok(receipt.firstFailure.bottom-receipt.firstFailure.top>=16,'Error text must have real layout height');
 assert.ok(receipt.firstFailure.top>=Math.max(0,receipt.firstFailure.frameTop)&&receipt.firstFailure.bottom<=Math.min(768,receipt.firstFailure.frameBottom),'The first refusal must be fully visible without another click');
 receipt.layouts=[];
 for(const [width,height] of [[1920,1080],[1366,768],[800,600],[568,320],[390,844]]){
 await page.setViewportSize({width,height});
 // Reproduce a real failed action from its native button at every viewport.
 await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#menuMessage.error')?.textContent,{},{timeout:30000});
 const row=await page.locator('#menuMessage').evaluate(e=>{const b=e.getBoundingClientRect(),f=e.closest('.front-frame').getBoundingClientRect();return{text:e.textContent,top:b.top,bottom:b.bottom,left:b.left,right:b.right,frameTop:f.top,frameBottom:f.bottom,focus:document.activeElement?.textContent}});
 assert.ok(row.bottom-row.top>=16,'The error must retain its text height');
 assert.ok(row.top>=Math.max(0,row.frameTop)&&row.bottom<=Math.min(height,row.frameBottom),'The complete actual error must be inside the visible scrolling frame');
 assert.ok(row.left>=0&&row.right<=width);receipt.layouts.push({width,height,...row});await page.screenshot({path:path.join(out,width+'x'+height+'.png')});
 }
 await page.getByRole('button',{name:'Back',exact:true}).click();
 assert.equal(await page.locator('.menu-view[data-screen="home"]').isVisible(),true);
 assert.equal(await page.locator('#menuMessage').innerText(),'');receipt.backRecovered=true;
 assert.equal(receipt.errors.length,0);

 }catch(e){receipt.failure=e.message;if(page){receipt.visibleText=await page.locator('body').innerText();await page.screenshot({path:path.join(out,'failure.png')})}throw e}
 finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
 console.log('Native creation-error visibility checked at five sizes.');
})().catch(e=>{console.error(e);process.exitCode=1});
