// Native maternal anatomy in the actual paused game. Controlled body/frame fixtures only.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out='reports/maternal-surface-review',ids=['egg-chamber','live-womb','brood-pouch'];fs.mkdirSync(out,{recursive:true});let stage='before';
 const current=JSON.parse(fs.readFileSync('assets/art/catalog.json')),previous=JSON.parse(execFileSync('git',['show','3aac22a:assets/art/catalog.json']));
 const beforeCatalog={...current,parts:current.parts.map(p=>ids.includes(p.partId)?previous.parts.find(q=>q.partId===p.partId):p)},before=new Map([['/assets/art/catalog.json',Buffer.from(JSON.stringify(beforeCatalog))]]);
 for(const id of ids)before.set('/assets/art/parts/'+id+'.indexed.json',execFileSync('git',['show','3aac22a:assets/art/parts/'+id+'.indexed.json'],{maxBuffer:8e6}));
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'..'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');
  if(stage==='before'&&before.has(url.pathname))return res.end(before.get(url.pathname));if(fs.existsSync(file)&&fs.statSync(file).isFile())res.end(fs.readFileSync(file));else res.writeHead(404).end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.__GENVO8__?.editor);
  await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('MATERNAL-SURFACE-20261022');await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>!document.body.innerText.includes('Preparing ecosystem'),{},{timeout:120000});await page.waitForFunction(()=>window.__GENVO8__.sim?.player());
  const setup=await page.evaluate(()=>{
   const g=window.__GENVO8__,s=g.sim,a=s.player();s.paused=true;a.age=36;a.intent='idle';
   const occupied=s.animals.filter(b=>b!==a&&b.alive);let found=false;
   for(let dy=-4;dy<=4&&!found;dy++)for(let dx=-4;dx<=4&&!found;dx++){const x=a.x+dx,y=a.y+dy;if(!s.world.water[s.world.idx(x,y)]&&s.canOccupy(a,x,y)&&occupied.every(b=>Math.hypot(b.x-x,b.y-y)>2)){a.x=x;a.y=y;found=true}}
   s.rebuildSpatial();g.renderer.cameraReady=false;g.renderer.resetWorldCaches();return{zoom:g.renderer.zoom,scope:'Controlled valid adult stout body with paired maternal organ instances, on unchanged natural land. Indexed idle frames 0/1 are explicitly selected for visual review only. No conception, laying, nursing or birth claim.'};
  });
  const reports=[];
  for(const label of ['before','after']){
   stage=label;await page.evaluate(async ids=>{
    const {loadNativePartCatalog,artForPart}=await import('/src/render/runtime-part-art.js');const status=await loadNativePartCatalog();if(status.status!=='ready')throw Error(JSON.stringify(status));
    for(const id of ids){const art=artForPart(id),draw=art.draw;art.draw=(ctx,args)=>draw(ctx,{...args,frameIndex:window.__maternalReviewFrame??0})}
    window.__GENVO8__.renderer.resetWorldCaches();
   },ids);
   const captures=[];
   for(const id of ids)for(let frame=0;frame<2;frame++)for(let dir=0;dir<8;dir++){
    const body=await page.evaluate(async({id,frame,dir})=>{
     const g=window.__GENVO8__,a=g.sim.player(),{founderPlan}=await import('/src/lineage/body-inheritance.js'),{makePlan,validatePlan}=await import('/src/lineage/body-plan.js'),{applyLineageTarget}=await import('/src/lineage/reproduction-bridge.js');
     const nodes=founderPlan().nodes.map(n=>({partId:!n.parent?'stout-torso':n.partId,parent:n.parent,socket:n.socket}));nodes.push({partId:id,parent:'root',socket:'flank.left'},{partId:id,parent:'root',socket:'flank.right'});
     const plan=makePlan(nodes);if(!validatePlan(plan).ok)throw Error(JSON.stringify(validatePlan(plan)));applyLineageTarget(a,plan);a.dir=dir;window.__maternalReviewFrame=frame;g.renderer.motion.clear();g.renderer.render();return plan.id;
    },{id,frame,dir});
    const name=label+'-'+id+'-'+dir+'-'+frame+'.png';await page.screenshot({path:out+'/'+name});captures.push({id,dir,frame,body,file:name});
   }
   const receipt=await page.evaluate(async()=>{
    const g=window.__GENVO8__,r=g.renderer,times=[];for(let i=0;i<60;i++){const t=performance.now();r.render();times.push(performance.now()-t)}times.sort((a,b)=>a-b);
    const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js');return{meanMs:times.reduce((a,b)=>a+b)/times.length,p95Ms:times[56],state:JSON.stringify(createSimulationSnapshot(g.sim,{savedAt:'maternal-art-review'}),(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:ArrayBuffer.isView(v)?Array.from(v):v)};
   });reports.push({label,captures,...receipt});
  }
  assert.equal(reports[0].state,reports[1].state,'Maternal art changed canonical simulation state');assert.deepEqual(errors,[]);
  const receipt={setup,exactCanonicalState:true,errors,timingScope:'Paused renderer CPU commands; excludes GPU completion',reports:reports.map(({state,...r})=>r),creatorAcceptance:false};fs.writeFileSync(out+'/receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify({setup,exactCanonicalState:true,errors,captures:reports.map(r=>({label:r.label,count:r.captures.length,meanMs:r.meanMs,p95Ms:r.p95Ms}))}));
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
