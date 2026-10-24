// Actual exported app. Delay only the catalog request; never edit game/draft/state.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
 const record={errors:[],misses:[],creatorAcceptance:false,scope:'Ordinary public guided-founder controls. Native catalog response is delayed, then continued unchanged. No source overlay, manufactured biology or draft edits.'};
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local'),f=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e){record.misses.push(u.pathname);return res.writeHead(404).end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});let release;
 const gate=new Promise(r=>release=r);
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768},acceptDownloads:true});page.on('pageerror',e=>record.errors.push(e.message));
  await page.route('**/assets/art/catalog.json',async route=>{await gate;await route.continue()});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?day=30');await page.waitForFunction(()=>window.__GENVO8__?.saveManager);
  await page.getByRole('button',{name:/New World/}).click();await page.waitForFunction(()=>document.querySelectorAll('#newWorldStartCards [data-start]').length>1);
  if(await page.locator('#newWorldAdvanced').getAttribute('open')===null)await page.locator('#newWorldAdvanced summary').click();
  await page.locator('#newWorldCreature').selectOption('guided');await page.getByRole('button',{name:'Begin World',exact:true}).click();
  const ed=page.locator('#founderEditor');await ed.waitFor({state:'visible',timeout:60000});
  async function design(name){const wait=page.waitForEvent('download');await ed.locator('[data-act="export-design"]').click();const dl=await wait,f=path.join(out,name+'.json');await dl.saveAs(f);return JSON.parse(fs.readFileSync(f,'utf8'))}
  const beforeDesign=await design('before-design');
  const focus=ed.locator('[data-act="compare"]');await focus.focus();const control=await focus.elementHandle();
  const state=()=>page.evaluate(async()=>{const g=window.__GENVO8__,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');return JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'art-arrival',reason:'art-arrival'})))});
  const beforeState=await state();
  const images=()=>ed.evaluate(e=>({thumb:e.querySelector('[data-part="walking-leg"] canvas').toDataURL(),parent:e.querySelector('.ed-parent canvas').toDataURL(),stage:e.querySelector('.ed-stage').toDataURL()}));
  const before=await images();record.before=await page.evaluate(()=>window.__GENVO8__.nativeArtStatus());assert.equal(record.before.status,'loading');
  await page.screenshot({path:path.join(out,'before-art-arrival.png')});release();
  await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready');
  await page.waitForFunction(previous=>document.querySelector('#founderEditor [data-part="walking-leg"] canvas').toDataURL()!==previous,before.thumb);
  const after=await images();record.after=await page.evaluate(()=>window.__GENVO8__.nativeArtStatus());
  assert.notEqual(after.thumb,before.thumb,'idle thumbnails refresh after native art arrives');assert.notEqual(after.parent,before.parent,'comparison parent refreshes');assert.notEqual(after.stage,before.stage,'native stage refreshes');
  record.controlsRetained=await control.evaluate(e=>e.isConnected&&e===document.activeElement);assert.equal(record.controlsRetained,true,'art repaint preserves control identity and focus');
  record.snapshotParity=beforeState===await state();assert.equal(record.snapshotParity,true,'art arrival changes no saved simulation state');
  record.designParity=JSON.stringify(beforeDesign)===JSON.stringify(await design('after-design'));assert.equal(record.designParity,true,'art arrival changes no authored draft');
  record.changed={thumb:true,parent:true,stage:true};await page.screenshot({path:path.join(out,'after-art-arrival.png')});
  assert.ok(record.after.revision>record.before.revision&&record.after.installed>0);assert.deepEqual(record.after.errors,[]);assert.deepEqual(record.errors,[]);assert.ok(record.misses.every(p=>p==='/favicon.ico'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(record,null,2));console.log('Lab art arrival PASS: native thumbnail/parent/stage refresh without control replacement, draft changes or simulation changes.');
 }catch(e){record.failure=e.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(record,null,2));throw e}
 finally{release();await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
