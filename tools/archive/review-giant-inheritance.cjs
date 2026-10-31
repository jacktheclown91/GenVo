const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]||'docs/lineage-detail-2026-10-29/native');if(fs.existsSync(out))throw Error('Use a fresh evidence directory');fs.mkdirSync(out,{recursive:true});
 const controlled=process.argv.includes('--controlled');
 const receipt={mode:controlled?'controlled canonical birth':'recorded mature world',errors:[],directions:[],layouts:[],creatorAcceptance:false};
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');if(u.pathname==='/fixture.html'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><link rel="stylesheet" href="/styles.css"><div id="app"><canvas id="fixtureWorld" style="width:100vw;height:100vh;position:absolute;inset:0"></canvas><section id="journal" class="journal" hidden aria-live="polite"></section></div>')}const f=path.resolve(root,'..'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.gz':'application/gzip','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),requests=[];page.on('pageerror',e=>receipt.errors.push(e.message));page.on('request',r=>{if(r.url().includes('/production-candidate-v1/'))requests.push(r.url())});
  if(controlled){
   await page.goto('http://127.0.0.1:'+server.address().port+'/fixture.html');
   await page.evaluate(async()=>{
    const {Simulation}=await import('/src/sim/simulation.js'),{SPECIES}=await import('/src/organisms/species.js'),{makePlan}=await import('/src/lineage/body-plan.js'),{FieldJournal}=await import('/src/ui/journal.js'),{Renderer}=await import('/src/render/renderer.js'),{loadNativePartCatalog,nativeArtStatus}=await import('/src/render/runtime-part-art.js');await loadNativePartCatalog();
    const sim=new Simulation('CONTROLLED-NATIVE-CONCEPTION',{player:true,dayClock:true,metabolism:true,bodySize:'body-size/2'}),p=sim.player(),mate=sim.animals.find(a=>a.alive&&a.species===p.species&&a.id!==p.id&&a.sex!==p.sex);if(!mate)throw Error('No controlled-fixture mate');
    p.bodySize={schema:1,alleles:[Math.log(3),Math.log(3)]};mate.bodySize={schema:1,alleles:[Math.log(2.5),Math.log(2.5)]};
    mate.bodyPlan=makePlan(p.bodyPlan.nodes.map(n=>n.socket==='mouth'?{...n,partId:'beak-mouth'}:n));const mother=p.sex==='F'?p:mate,father=p.sex==='F'?mate:p;mother.energy=SPECIES.genvo.maxEnergy*.9;mother.hydration=SPECIES.genvo.maxHydration*.9;mother.pregnant={fatherId:father.id,days:1,totalDays:16,mode:'live',plannedLitterSize:1,maternalInheritance:structuredClone(mother),paternalInheritance:structuredClone(father)};
    const children=sim.giveBirth(mother);if(children.length!==1)throw Error('Canonical fixture birth did not produce its planned child');sim.paused=true;const renderer=new Renderer(document.getElementById('fixtureWorld'),sim),journal=new FieldJournal(sim);renderer.render();window.__GENVO8__={sim,journal,renderer,nativeArtStatus};
   });
  }else{
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.__GENVO8__?.saveManager&&window.__GENVO8__.nativeArtStatus().status==='ready');
  await page.getByRole('button',{name:'New World',exact:true}).click();await page.locator('#newWorldStartingPoint').selectOption('catalog:mature-valley-d100');await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.day>=100,null,{timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
  for(let i=0;i<8;i++){if(!await page.evaluate(()=>{const t=window.__GENVO8__.tutorial;return t.worldInputBlocked()&&['welcome','briefing'].includes(t.stage)}))break;await page.keyboard.press('Enter')}
  await page.waitForTimeout(1000);await page.keyboard.press('p');await page.waitForFunction(()=>window.__GENVO8__.sim.paused);
  await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
  }
  receipt.record=await page.evaluate(async()=>{
   const g=window.__GENVO8__,{lineageComparisonModels,lineageComparisonChanges}=await import('/src/ui/lineage-comparison.js');
   const candidates=[...g.sim.lineage.records.values()].map(r=>{const models=lineageComparisonModels(g.sim,r.id);if(models.length<2)return null;return{id:r.id,models,changed:lineageComparisonChanges(g.sim,models).reduce((n,c)=>n+c.differences.length,0)}}).filter(Boolean).sort((a,b)=>b.changed-a.changed);
   const found=candidates[0];if(!found)throw Error('No retained genuine conception comparison');g.journal.selectedId=found.id;g.journal.setOpen(true);
   const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');window.__lineageDetailBefore=JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'lineage-detail'})));
   return{id:found.id,changed:found.changed,models:found.models.map(m=>({id:m.id,label:m.label,sizeStatus:m.sizeStatus})),day:g.sim.day,seed:g.sim.seed};
  });
  const journal=page.locator('#journal'),section=journal.locator('[data-section="body-comparison"]');if(!await section.evaluate(e=>e.open))await section.locator(':scope>summary').click();await page.waitForFunction(()=>document.querySelector('.lineage-comparison-status')?.textContent.startsWith('Detailed 128'));
  receipt.artStatus=await section.locator('.lineage-comparison-status').textContent();receipt.inheritedSizeDisabled=await section.locator('[aria-label="Comparison scale"] [value="inherited"]').evaluate(e=>e.disabled);assert.equal(receipt.inheritedSizeDisabled,receipt.record.models.some(m=>m.sizeStatus==='unrecorded'));receipt.detailedRequests=requests.filter(u=>u.endsWith('.gz')).map(u=>path.basename(new URL(u).pathname));
  const details=section.locator('.lineage-change-reading');if(await details.count()){await details.first().locator('summary').click();await page.waitForTimeout(50)}
  await section.locator('.lineage-view-controls>summary').click();
  for(let dir=0;dir<8;dir++){
   await section.locator('[aria-label="Facing"]').focus();await section.locator('[aria-label="Facing"]').selectOption(String(dir));await page.waitForFunction(()=>document.querySelector('.lineage-comparison-status')?.textContent.startsWith('Detailed 128'));
   receipt.directions.push({dir,expanded:await details.first().evaluate(e=>e.open),focus:await page.evaluate(()=>document.activeElement?.getAttribute('aria-label'))});assert.equal(receipt.directions.at(-1).expanded,true);assert.equal(receipt.directions.at(-1).focus,'Facing');
  }
  await section.locator('[aria-label="Facing"]').selectOption('2');await page.waitForFunction(()=>document.querySelector('.lineage-comparison-status')?.textContent.startsWith('Detailed 128'));await section.locator('.lineage-view-controls>summary').click();await section.screenshot({path:path.join(out,'recorded-comparison-128.png')});
  const detailed=await section.locator('canvas').first().evaluate(c=>c.toDataURL());await section.locator('.lineage-view-controls>summary').click();await section.locator('[aria-label="Comparison artwork"]').selectOption('standard');await section.locator('.lineage-view-controls>summary').click();const standard=await section.locator('canvas').first().evaluate(c=>c.toDataURL());assert.notEqual(detailed,standard);await section.screenshot({path:path.join(out,'recorded-comparison-standard.png')});
  await section.locator('.lineage-view-controls>summary').click();await section.locator('[aria-label="Comparison artwork"]').selectOption('128');await section.locator('.lineage-view-controls>summary').click();await page.waitForFunction(()=>document.querySelector('.lineage-comparison-status')?.textContent.startsWith('Detailed 128'));
  for(const [width,height] of [[1440,1000],[1024,768],[800,600],[600,800]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>window.__GENVO8__.renderer.render());await section.scrollIntoViewIfNeeded();const layout=await section.evaluate(e=>({pageOverflow:document.documentElement.scrollWidth>innerWidth,panelOverflow:e.scrollWidth>e.clientWidth}));assert.equal(layout.pageOverflow,false);assert.equal(layout.panelOverflow,false);receipt.layouts.push({width,height,...layout});await page.screenshot({path:path.join(out,'layout-'+width+'.png')});
  }
  receipt.stateExact=await page.evaluate(async()=>{const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');return window.__lineageDetailBefore===JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(window.__GENVO8__.sim,{savedAt:'lineage-detail'})))});assert.equal(receipt.stateExact,true);
  // Isolated rendering check only: these legal 1x/3x sizes are not written to
  // the actual family or presented as retained historical parent measurements.
  receipt.controlledScale=await page.evaluate(async()=>{
   const {drawLineagePortrait}=await import('/src/render/lineage-portrait.js'),g=window.__GENVO8__,a=g.sim.player(),sheet=document.createElement('canvas');sheet.width=640;sheet.height=260;const sc=sheet.getContext('2d');sc.fillStyle='#172d20';sc.fillRect(0,0,640,260);const extents=[];
   for(const [column,size] of [1,3].entries()){const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;drawLineagePortrait(canvas,a.genes,{bodyPlan:a.bodyPlan,pigmentGenome:a.pigmentGenome,adaptations:a.adaptations,anatomy:a.anatomy,bodySize:{schema:1,alleles:[Math.log(size),Math.log(size)]},bodySizeRules:'body-size/2',fitScale:3});const d=canvas.getContext('2d').getImageData(0,0,320,240).data;let lo=320,hi=-1;for(let y=0;y<240;y++)for(let x=0;x<320;x++)if(d[(y*320+x)*4+3]>200){lo=Math.min(lo,x);hi=Math.max(hi,x)}extents.push(hi-lo+1);sc.drawImage(canvas,column*320,20);sc.fillStyle='#e8dba5';sc.font='13px sans-serif';sc.fillText('Controlled '+size+'× size adapter check',column*320+10,18)}
   return{extents,png:sheet.toDataURL(),scope:'Isolated legal-size portrait adapter check; actual lineage and historical records unchanged.'};
  });assert.ok(receipt.controlledScale.extents[1]>receipt.controlledScale.extents[0]*1.7);fs.writeFileSync(path.join(out,'controlled-size-adapter.png'),Buffer.from(receipt.controlledScale.png.split(',')[1],'base64'));delete receipt.controlledScale.png;

  if(controlled){
   receipt.witnessReader=await page.evaluate(async id=>{
    const g=window.__GENVO8__,records=new Map([...g.sim.lineage.records].map(([id,r])=>[id,structuredClone(r)])),record=records.get(id);
    // A local presentation-only retained-witness fixture. The actual world remains untouched.
    for(const [i,witness] of record.parentPhenotypes.entries())witness.bodySize={schema:1,alleles:[Math.log(i?2:1.5),Math.log(i?2:1.5)]};
    const view=Object.assign(Object.create(Object.getPrototypeOf(g.sim)),g.sim,{lineage:Object.assign(Object.create(Object.getPrototypeOf(g.sim.lineage)),g.sim.lineage,{records})});
    g.journal.setSimulation(view);g.journal.selectedId=id;g.journal.setOpen(true);
    return{scope:'Controlled view-only conception-size witnesses, not canonical saved history',worldRecordStillMissing:g.sim.lineage.records.get(id).parentPhenotypes.every(p=>!p.bodySize)};
   },receipt.record.id);
   if(!await section.evaluate(e=>e.open))await section.locator(':scope>summary').click();await page.waitForFunction(()=>document.querySelector('.lineage-comparison-status')?.textContent.startsWith('Detailed 128'));
   assert.equal(await section.locator('[aria-label="Comparison scale"] [value="inherited"]').evaluate(e=>e.disabled),false);
   await section.locator('.lineage-view-controls>summary').click();await section.locator('[aria-label="Comparison scale"]').selectOption('inherited');
   for(let dir=0;dir<8;dir++){await section.locator('[aria-label="Facing"]').selectOption(String(dir));await page.waitForFunction(()=>document.querySelector('.lineage-comparison-status')?.textContent.startsWith('Detailed 128'))}
   receipt.witnessReader.labels=await section.locator('.lineage-size-change').allTextContents();assert.equal(receipt.witnessReader.labels.length,2);
   await section.screenshot({path:path.join(out,'controlled-giant-inherited-comparison.png')});
   receipt.cachePolicy=await page.evaluate(async()=>{const {lineagePortraitBounds}=await import('/src/render/lineage-portrait.js'),g=window.__GENVO8__,a=g.sim.player(),options={bodyPlan:a.bodyPlan,bodySize:{schema:1,alleles:[Math.log(3),Math.log(3)]},bodySizeRules:'body-size/2'};lineagePortraitBounds(a.genes,options);try{lineagePortraitBounds(a.genes,{...options,bodySizeRules:'body-size/1'});return false}catch{return true}});assert.equal(receipt.cachePolicy,true);
   receipt.birth=await page.evaluate(async id=>{const g=window.__GENVO8__,{YoungSummary,buildYoungSummary}=await import('/src/ui/young-summary.js'),child=g.sim.animals.find(a=>a.id===id),parent=g.sim.player(),model=buildYoungSummary(g.sim,parent,[child],{first:true});g.journal.setOpen(false);const card=new YoungSummary({getSim:()=>g.sim});card.show(g.sim,model);window.__giantBirthCard=card;return{lines:model.young[0].lines,size:model.young[0].size}},receipt.record.id);
   assert.ok(receipt.birth.size.adultScale>2);assert.ok(receipt.birth.lines.some(t=>t.startsWith('Inherited adult length')));
   for(const [width,height] of [[1440,1000],[800,600],[600,800]]){await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#youngSummary [data-young="continue"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'birth-size-'+width+'.png')})}
   await page.locator('#youngSummary [data-young="continue"]').click();
   receipt.finalStateExact=await page.evaluate(async()=>{const g=window.__GENVO8__,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');return window.__lineageDetailBefore===JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'lineage-detail'})))});assert.equal(receipt.finalStateExact,true);
  }
  assert.deepEqual(receipt.errors,[]);receipt.status='PASS';receipt.scope=(controlled?'Explicit controlled funded conception fixture, canonical giveBirth and actual Journal/Renderer classes; not natural field reproduction.':'Genuine bundled mature-world family record, selected through existing Journal UI controller;')+' native detailed portraits, eight directions, preserved disclosure/focus, four layouts and full biological parity. Conception size remains unknown in actual records. Retained-size reader witnesses and 1x/3x portraits are explicitly local controlled adapters; birth labels read the actual canonical fixture child.';fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({status:receipt.status,record:receipt.record,art:receipt.artStatus,requests:receipt.detailedRequests,stateExact:receipt.stateExact,controlledScale:receipt.controlledScale}));
 }catch(e){receipt.failure=e.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(receipt,null,2));throw e}finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
