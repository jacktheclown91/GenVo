const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]||'docs/lab-structure-2026-10-29/native');
 if(fs.existsSync(out))throw Error('Use a fresh evidence directory');fs.mkdirSync(out,{recursive:true});
 const receipt={errors:[],layouts:[],creatorAcceptance:false};
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local'),f=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.gz':'application/gzip'})[path.extname(f)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>receipt.errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/tools/creature-lab/index.html');await page.waitForFunction(()=>window.__GENVO_LAB_ASSEMBLY__&&document.querySelector('#assemblyStructureSummary'));
  const fixture=await page.evaluate(async()=>{
   const {Simulation}=await import('/src/sim/simulation.js'),{organismStudy}=await import('/src/render/organism-study.js');
   const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
   const sim=new Simulation('LAB-STRUCTURAL-NATIVE',{player:true,dayClock:true,metabolism:true,bodySize:true,structuralSupport:true});
   const before=JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'lab'}))),actual=organismStudy(sim.player(),{seed:sim.seed,day:sim.day});
   const controlled=structuredClone(actual);controlled.source.seed='CONTROLLED-2X-STUDY';controlled.animal.bodySize={schema:1,alleles:[Math.log(2),Math.log(2)]};
   return{actual,controlled,saveExact:before===JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'lab'})))};
  });assert.equal(fixture.saveExact,true);
  const upload=async study=>{await page.locator('#importAssembly').setInputFiles({name:'organism.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(study))});await page.waitForFunction(seed=>window.__GENVO_LAB_ASSEMBLY__.study?.source.seed===seed,study.source.seed)};
  await upload(fixture.actual);receipt.actual=await page.locator('#assemblyStructureSummary').textContent();
  await upload(fixture.controlled);await page.locator('#assemblyPreviewAge').fill('100');await page.locator('#assemblyPreviewAge').dispatchEvent('input');
  receipt.adult=await page.locator('#assemblyStructureSummary').textContent();assert.match(receipt.adult,/Strained/);
  const body=await page.evaluate(()=>JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan));
  await page.locator('#attachmentSocket').selectOption(JSON.stringify(['root','limb.1']));await page.locator('#attachmentPart').selectOption('sturdy-leg');
  receipt.proposal=await page.locator('#assemblyStructureCandidate').textContent();assert.match(receipt.proposal,/reduces adult limb stress/);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan)),body);
  await page.locator('#assemblyStructure').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'adult-proposed-support.png')});
  await page.locator('#attach').click();receipt.attached=await page.locator('#assemblyStructureSummary').textContent();assert.notEqual(receipt.attached,receipt.adult);
  await page.locator('#assemblyUndo').click();assert.equal(await page.evaluate(()=>JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan)),body);assert.equal(await page.locator('#assemblyStructureSummary').textContent(),receipt.adult);
  await page.locator('#assemblyPreviewAge').fill('0');await page.locator('#assemblyPreviewAge').dispatchEvent('input');receipt.newborn=await page.locator('#assemblyStructureSummary').textContent();assert.match(receipt.newborn,/Adult: strained/);
  await page.locator('#assemblyStructure').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'juvenile-adult-warning.png')});
  await page.locator('#attachmentSocket').selectOption(JSON.stringify(['root','mouth']));receipt.incompatible=await page.locator('#assemblyStructureCandidate').textContent();assert.match(receipt.incompatible,/unavailable/);
  for(const [width,height] of [[1440,900],[1024,768],[800,600],[600,800]]){
   await page.setViewportSize({width,height});await page.locator('#assemblyStructure').scrollIntoViewIfNeeded();
   const layout=await page.evaluate(()=>{const e=document.querySelector('#assemblyStructure'),r=e.getBoundingClientRect();return{horizontalOverflow:document.documentElement.scrollWidth>innerWidth,panelOverflow:e.scrollWidth>e.clientWidth,left:r.left,right:r.right}});
   assert.equal(layout.horizontalOverflow,false);assert.equal(layout.panelOverflow,false);assert.ok(layout.left>=0&&layout.right<=width);
   receipt.layouts.push({width,height,...layout});await page.screenshot({path:path.join(out,'layout-'+width+'.png')});
  }
  assert.deepEqual(receipt.errors,[]);receipt.status='PASS';receipt.scope='Native public Lab study import, actual canonical animal plus clearly controlled isolated 2x study; proposed attachment leaves plan exact, attach/undo, juvenile/adult readings and four layouts. No evolved 2x lineage or historical-world policy is claimed.';
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log('Lab structure native PASS: actual and controlled imports, shared authority readings, proposed support, attach/undo, developmental warning and four layouts.');
 }catch(e){receipt.failure=e.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(receipt,null,2));throw e}finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
