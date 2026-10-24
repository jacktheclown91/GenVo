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
    receipt.panels.push({panel,width,height,observed});
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
  assert.equal(receipt.errors.length,0);
 }finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));await browser.close();await new Promise(r=>server.close(r))}
 console.log('Public panel captures complete; inspect screenshots before conclusions.');
})().catch(e=>{console.error(e);process.exitCode=1});
