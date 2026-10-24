const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]||'reports/ui-panels-current-20261024');fs.mkdirSync(out,{recursive:true});
 const receipt={scope:'Public fresh-world panel readability observation. No authored simulation state.',creatorAcceptance:false,errors:[],panels:[]};
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,bytes)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(bytes)})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1024,height:768}});page.on('pageerror',e=>receipt.errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.__GENVO8__);await page.getByRole('button',{name:'New World',exact:true}).click();await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#frontEnd').hidden,null,{timeout:90000});
  for(let i=0;i<8;i++){if(!await page.evaluate(()=>{const t=window.__GENVO8__.tutorial;return t.worldInputBlocked()&&['welcome','briefing'].includes(t.stage)}))break;await page.keyboard.press('Enter')}
  await page.locator('#interactionDock').waitFor({state:'visible'});
  for(const [width,height] of [[1024,768],[390,844]]){
   await page.setViewportSize({width,height});
   for(const panel of ['help','population','territory','guide','journal','map']){
    const toggle=page.getByRole('button',{name:'Game utilities',exact:true});if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await page.locator('#quickMenu [data-panel="'+panel+'"]').click();await page.waitForTimeout(200);
    await page.screenshot({path:path.join(out,panel+'-'+width+'.png')});
    const observed=await page.evaluate(()=>[...document.querySelectorAll('.knowledge-panel,.journal-page,#help,#guide')].filter(e=>e.getBoundingClientRect().width&&getComputedStyle(e).visibility!=='hidden').map(e=>({id:e.id,heading:e.querySelector('h2,h3,strong')?.textContent,rect:e.getBoundingClientRect().toJSON(),buttons:[...e.querySelectorAll('button')].map(b=>({text:b.textContent,aria:b.getAttribute('aria-label')}))})));
    const notice=await page.evaluate(()=>{const root=document.querySelector('#notificationStack');return{rail:document.querySelector('#app').hasAttribute('data-notice-rail'),rect:root.getBoundingClientRect().toJSON(),hidden:root.hidden}});if(notice.rail&&!notice.hidden)for(const item of observed)assert.ok(notice.rect.bottom<=item.rect.top,'Notice clears '+panel+' '+width);receipt.panels.push({panel,width,height,observed,notice});
    if(panel==='help'){
     const close=page.getByRole('button',{name:'Close help',exact:true});await close.click();await page.waitForFunction(()=>document.querySelector('#help').hidden);
     for(const key of ['Enter','Space']){
      if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await page.locator('#quickMenu [data-panel="help"]').click();await close.waitFor({state:'visible'});await close.focus();
      await page.evaluate(()=>{window.__closeKeys=[];const listener=e=>{if(e.target.matches?.('[data-knowledge-close]'))window.__closeKeys.push({code:e.code,prevented:e.defaultPrevented,trusted:e.isTrusted,pending:!!window.__GENVO8__.sim.tickInProgress})};window.addEventListener('keydown',listener,{once:true})});
      await page.keyboard.press(key);await page.waitForFunction(()=>document.querySelector('#help').hidden);const events=await page.evaluate(()=>window.__closeKeys);assert.ok(events.some(e=>e.code===key&&e.trusted&&!e.prevented),'Native close activation '+key);receipt.panels.at(-1).keyboard??=[];receipt.panels.at(-1).keyboard.push({key,events});
     }
    }else await page.keyboard.press('Escape');
   }
  }
  if(process.argv.includes('--notice-fixture')){
   await page.setViewportSize({width:390,height:844});const toggle=page.getByRole('button',{name:'Game utilities',exact:true});if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await page.locator('#quickMenu [data-panel="help"]').click();
   await page.evaluate(()=>{const n=window.__GENVO8__.tutorial.notifications;n.clear();for(const channel of ['critical','progress','action'])n.post('Authored layout fixture: '+channel+' · '+('Long notice text for bounded overflow. '.repeat(12)),4000,'warn',channel)});
   await page.waitForTimeout(150);const measure=()=>page.evaluate(()=>{const app=document.querySelector('#app'),root=document.querySelector('#notificationStack'),panel=document.querySelector('#help');return{rail:app.hasAttribute('data-notice-rail'),notice:root.getBoundingClientRect().toJSON(),panel:panel.getBoundingClientRect().toJSON(),scrollHeight:root.scrollHeight,clientHeight:root.clientHeight,lanes:[...root.children].map(e=>({channel:e.dataset.channel,hidden:e.hidden,display:getComputedStyle(e).display})),hidden:root.hidden}});
   receipt.authoredBurst=await measure();assert.ok(receipt.authoredBurst.rail);assert.ok(receipt.authoredBurst.notice.bottom<=receipt.authoredBurst.panel.top);assert.ok(receipt.authoredBurst.scrollHeight>receipt.authoredBurst.clientHeight);assert.ok(receipt.authoredBurst.lanes.every(l=>!l.hidden&&l.display!=='none'));await page.screenshot({path:path.join(out,'authored-burst-phone.png')});await page.mouse.move(180,90);await page.mouse.wheel(0,400);await page.waitForTimeout(150);receipt.nativeNoticeScroll=await page.locator('#notificationStack').evaluate(e=>e.scrollTop);assert.ok(receipt.nativeNoticeScroll>0,'Bounded notice rail scrolls with native wheel');await page.screenshot({path:path.join(out,'authored-burst-scrolled-phone.png')});
   await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(160);receipt.resizeWide=await measure();assert.equal(receipt.resizeWide.rail,false);
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(160);assert.equal((await measure()).rail,true);await page.getByRole('button',{name:'Close help',exact:true}).click();await page.waitForTimeout(160);receipt.closed=await measure();assert.equal(receipt.closed.rail,false);
   if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await page.locator('#quickMenu [data-panel="help"]').click();await page.waitForTimeout(4200);receipt.expired=await measure();assert.equal(receipt.expired.rail,false);assert.equal(receipt.expired.hidden,true);await page.screenshot({path:path.join(out,'expired-phone.png')});
  }
  assert.equal(receipt.errors.length,0);
 }finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
 console.log('Public panel captures complete; inspect screenshots before conclusions.');
})().catch(e=>{console.error(e);process.exitCode=1});
