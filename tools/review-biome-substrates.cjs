// Actual generated planetary environments, default zoom. Only ground-paint exports are switched.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out='reports/biome-substrate-review',baselineOnly=process.argv.includes('--baseline'),sites=JSON.parse(fs.readFileSync(fs.existsSync(out+'/generated-sites.json')?out+'/generated-sites.json':'docs/art-refinement-biome-substrates-2026-10-22/generated-sites.json')).best;fs.mkdirSync(out,{recursive:true});
 const original=execFileSync('git',['show','e67d953:src/render/identity.js']);
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');
  if(u.pathname==='/src/render/identity-before.js')return res.end(original);
  if(u.pathname==='/src/render/identity-candidate.js')return res.end(fs.readFileSync('src/render/identity.js'));
  if(u.pathname==='/src/render/identity.js')return res.end("import * as before from './identity-before.js';import * as after from './identity-candidate.js';"+['habitatIdentityAt','terrainPaletteAt','riverIdentityAt','seasonalGroundProfile','drawSeasonalGround'].map(name=>`export function ${name}(...args){return(window.__substrateReviewBefore===false?after:before).${name}(...args)}`).join(''));
  if(fs.existsSync(file)&&fs.statSync(file).isFile())res.end(fs.readFileSync(file));else res.writeHead(404).end();
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.__GENVO8__?.editor);await page.getByRole('button',{name:/New World/}).click();await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>!document.body.innerText.includes('Preparing ecosystem'),{},{timeout:120000});await page.waitForFunction(()=>window.__GENVO8__.sim?.player());
  const reports=[];
  for(const site of Object.values(sites)){
   if(!site)continue;
   const setup=await page.evaluate(async site=>{
    const g=window.__GENVO8__,{Simulation}=await import('/src/sim/simulation.js'),sim=new Simulation(site.seed,{player:true,worldGenerator:'planetary/1',planetOrigin:site.origin}),a=sim.player();if(!a)throw Error('No canonical living player at generated site');for(let tick=0;tick<g.CFG.lifeStride+1&&!sim.climate;tick++)sim.update(null);if(!sim.climate)throw Error('Canonical climate did not initialize');sim.paused=true;
    let observation=null;for(let radius=0;radius<6&&!observation;radius++)for(let dy=-radius;dy<=radius&&!observation;dy++)for(let dx=-radius;dx<=radius&&!observation;dx++){const x=site.x+dx,y=site.y+dy;if(x<4||y<4||x>sim.world.n-4||y>sim.world.n-4)continue;if(!sim.world.water[sim.world.idx(x,y)]&&sim.canOccupy(a,x,y))observation={x,y}}
    if(!observation)throw Error('Generated site cannot host the real observation body');Object.assign(a,observation);a.target=null;sim.rebuildSpatial();
    const load=g.saveManager.load;g.saveManager.load=async()=>sim;try{if(!await g.loadSavedLineage())throw Error('Native world install failed')}finally{g.saveManager.load=load}g.sim.paused=true;g.renderer.zoom=2;g.renderer.cameraReady=false;g.renderer.resetWorldCaches();g.renderer.render();
    const w=sim.world,i=w.idx(a.x,a.y);return{...site,observation,temperature:w.temperature[i],moisture:w.moisture[i],elevation:w.terrain.elevation[i],biome:w.biomeAt(a.x,a.y,sim.climate),zoom:g.renderer.zoom,scope:'Unmodified generated planetary region and canonical founder population. Only player observation position is staged; no terrain, climate, anatomy, reserves or resource editing.'};
   },site);
   await page.waitForTimeout(1250);const stages=[];
   for(const stage of baselineOnly?['before']:['before','after']){
    const receipt=await page.evaluate(async stage=>{
     const g=window.__GENVO8__,r=g.renderer;window.__substrateReviewBefore=stage==='before';r.resetWorldCaches();const coldStart=performance.now();r.render();const coldMs=performance.now()-coldStart,times=[];for(let k=0;k<50;k++){const t=performance.now();r.render();times.push(performance.now()-t)}times.sort((a,b)=>a-b);
     const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js');return{stage,coldMs,meanMs:times.reduce((a,b)=>a+b)/times.length,p95Ms:times[46],state:JSON.stringify(createSimulationSnapshot(g.sim,{savedAt:'substrate-review'}),(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:ArrayBuffer.isView(v)?Array.from(v):v)};
    },stage);stages.push(receipt);await page.screenshot({path:out+'/'+stage+'-'+site.kind+'-gameplay.png'});
   }
   if(!baselineOnly&&stages[0].state!==stages[1].state){for(const s of stages)fs.writeFileSync(out+'/'+site.kind+'-'+s.stage+'-state.json',s.state);throw Error('Substrate changed canonical state: '+site.kind)}
   reports.push({setup,exactCanonicalState:baselineOnly?null:true,stages:stages.map(({state,...s})=>s)});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/'+(baselineOnly?'baseline':'receipt')+'.json',JSON.stringify({reports,errors,creatorAcceptance:false,timingScope:'Paused renderer CPU command timing, not GPU completion'},null,2));console.log(JSON.stringify({errors,reports:reports.map(r=>({kind:r.setup.kind,biome:r.setup.biome.code,temperature:r.setup.temperature,moisture:r.setup.moisture,elevation:r.setup.elevation,exactCanonicalState:r.exactCanonicalState,timing:r.stages}))}));
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
