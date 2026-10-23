// Actual generated planetary environments, default zoom. Only ground-paint exports are switched.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out=process.argv.includes('--performance')?'reports/terrain-continuity-performance':'reports/terrain-continuity-integrated-modules',baselineOnly=process.argv.includes('--baseline'),sites=JSON.parse(fs.readFileSync(fs.existsSync(out+'/generated-sites.json')?out+'/generated-sites.json':'docs/art-refinement-biome-substrates-2026-10-22/generated-sites.json')).best;fs.mkdirSync(out,{recursive:true});
 const original=fs.readFileSync('assets/art/production-review/terrain-continuity-v1/identity.js.before');
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');
  if(u.pathname==='/src/render/biome-substrates-before.js')return res.end(fs.readFileSync('assets/art/production-review/terrain-continuity-v1/biome-substrates.js.before'));
  if(u.pathname==='/src/render/biome-substrates-candidate.js')return res.end(fs.readFileSync('src/render/biome-substrates.js'));
  if(u.pathname==='/src/render/biome-substrates.js')return res.end("import * as before from './biome-substrates-before.js';import * as after from './biome-substrates-candidate.js';"+['substrateWeightsAt','substrateTileData','drawNativeSubstrate'].map(name=>`export function ${name}(...args){return(window.__substrateReviewBefore===false?after:before).${name}(...args)}`).join(''));
  if(u.pathname==='/src/render/renderer.js')return res.end(fs.readFileSync('src/render/renderer.js','utf8').replace('this.renderNow=performance.now();','this.renderNow=16000;'));
  if(u.pathname==='/src/render/flora-before.js')return res.end(fs.readFileSync('assets/art/production-review/terrain-continuity-v1/flora.js.before'));
  if(u.pathname==='/src/render/flora-candidate.js')return res.end(fs.readFileSync('src/render/flora.js'));
  if(u.pathname==='/src/render/flora.js')return res.end("import * as before from './flora-before.js';import * as after from './flora-candidate.js';"+['floraAnchor', 'floraVisualAnchor', 'drawFloraPlant', 'floraTraceAnchor', 'drawFloraTrace', 'floraSeedlingAnchor', 'drawFloraSeedling'].map(name=>`export function ${name}(...args){return(window.__substrateReviewBefore===false?after:before).${name}(...args)}`).join(''));
  if(u.pathname==='/src/render/habitat-detail-before.js')return res.end(fs.readFileSync('assets/art/production-review/terrain-continuity-v1/habitat-detail.js.before'));
  if(u.pathname==='/src/render/habitat-detail-candidate.js')return res.end(fs.readFileSync('src/render/habitat-detail.js'));
  if(u.pathname==='/src/render/habitat-detail.js')return res.end("import * as before from './habitat-detail-before.js';import * as after from './habitat-detail-candidate.js';"+['drawRiparianDepth','drawHabitatClusterAccents'].map(name=>`export function ${name}(...args){return(window.__substrateReviewBefore===false?after:before).${name}(...args)}`).join(''));
  if(u.pathname==='/src/render/identity-before.js')return res.end(original);
  if(u.pathname==='/src/render/identity-candidate.js')return res.end(fs.readFileSync('src/render/identity.js'));
  if(u.pathname==='/src/render/identity.js')return res.end("import * as before from './identity-before.js';import * as after from './identity-candidate.js';"+['habitatIdentityAt','terrainPaletteAt','riverIdentityAt','seasonalGroundProfile','drawSeasonalGround'].map(name=>`export function ${name}(...args){return(window.__substrateReviewBefore===false?after:before).${name}(...args)}`).join('')+"export {terrainGrainAt} from './identity-candidate.js';");
  if(fs.existsSync(file)&&fs.statSync(file).isFile())res.end(fs.readFileSync(file));else res.writeHead(404).end();
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.__GENVO8__?.editor);await page.getByRole('button',{name:/New World/}).click();await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>!document.body.innerText.includes('Preparing ecosystem'),{},{timeout:120000});await page.waitForFunction(()=>window.__GENVO8__.sim?.player());
  await page.evaluate(()=>{window.requestAnimationFrame=()=>0});await page.waitForTimeout(100);const reports=[];
  for(const site of [{kind:'meadow',seed:'CAVES-GEOLOGY',origin:{x:0,y:0},x:64.5,y:64.5},...(process.argv.includes('--performance')?[]:[sites.rock])]){
   if(!site)continue;
   const setup=await page.evaluate(async site=>{
    const g=window.__GENVO8__,{Simulation}=await import('/src/sim/simulation.js'),sim=new Simulation(site.seed,{player:true,worldGenerator:'planetary/1',planetOrigin:site.origin}),a=sim.player();if(!a)throw Error('No canonical living player at generated site');for(let tick=0;tick<g.CFG.lifeStride+1&&!sim.climate;tick++)sim.update(null);if(!sim.climate)throw Error('Canonical climate did not initialize');sim.paused=true;
    let observation=null;for(let radius=0;radius<6&&!observation;radius++)for(let dy=-radius;dy<=radius&&!observation;dy++)for(let dx=-radius;dx<=radius&&!observation;dx++){const x=site.x+dx,y=site.y+dy;if(x<4||y<4||x>sim.world.n-4||y>sim.world.n-4)continue;if(!sim.world.water[sim.world.idx(x,y)]&&sim.canOccupy(a,x,y))observation={x,y}}
    if(!observation)throw Error('Generated site cannot host the real observation body');Object.assign(a,observation);a.target=null;sim.rebuildSpatial();
    const load=g.saveManager.load;g.saveManager.load=async()=>sim;try{if(!await g.loadSavedLineage())throw Error('Native world install failed')}finally{g.saveManager.load=load}g.sim.paused=true;g.renderer.zoom=2;g.renderer.lowDetail=false;g.renderer.motion.clear();g.renderer.turnState?.clear();g.renderer.playerVisual=null;g.renderer.cameraReady=false;g.renderer.resetWorldCaches();g.renderer.render();
    const w=sim.world,i=w.idx(a.x,a.y);return{...site,observation,temperature:w.temperature[i],moisture:w.moisture[i],elevation:w.terrain.elevation[i],biome:w.biomeAt(a.x,a.y,sim.climate),zoom:g.renderer.zoom,scope:'Unmodified generated planetary region and canonical founder population. Only player observation position is staged; no terrain, climate, anatomy, reserves or resource editing.'};
   },site);
   await page.waitForTimeout(1250);const stages=[];
   for(const stage of baselineOnly?['before']:process.argv.includes('--performance')?['before','after','after','before','after','before','before','after']:['before','after','after','before']){
    const receipt=await page.evaluate(async stage=>{
     const g=window.__GENVO8__,r=g.renderer;window.__substrateReviewBefore=stage==='before';r.resetWorldCaches();const coldStart=performance.now();r.render();const coldMs=performance.now()-coldStart,coldSamples=[coldMs],times=[];let stable=0;for(let k=0;k<1200&&stable<100;k++){r.render();stable=r.terrainRefreshQueue.length===0&&!r.terrainChunkWork?stable+1:0}if(stable<100)throw Error('Terrain cache did not settle');for(let k=0;k<400;k++){const t=performance.now();r.render();times.push(performance.now()-t)}times.sort((a,b)=>a-b);
     const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js');return{stage,coldMs,coldSamples,coldMedianMs:coldSamples[0],meanMs:times.reduce((a,b)=>a+b)/times.length,medianMs:times[Math.floor((times.length-1)*.5)],p95Ms:times[Math.floor((times.length-1)*.95)],warmSamples:times.length,state:JSON.stringify((await import('/src/persistence/scenario-codec.js')).encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'terrain-continuity-review'})))};
    },stage);stages.push(receipt);await page.screenshot({path:out+'/'+stage+'-'+site.kind+'-gameplay.png'});
   }
   if(!baselineOnly&&stages.some(s=>s.state!==stages[0].state)){for(const s of stages)fs.writeFileSync(out+'/'+site.kind+'-'+s.stage+'-state.json',s.state);throw Error('Substrate changed canonical state: '+site.kind)}
   reports.push({setup,exactCanonicalState:baselineOnly?null:true,stages:stages.map(({state,...s})=>s)});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/'+(baselineOnly?'baseline':'receipt')+'.json',JSON.stringify({reports,errors,creatorAcceptance:false,timingScope:'Paused renderer CPU command timing, not GPU completion'},null,2));console.log(JSON.stringify({errors,reports:reports.map(r=>({kind:r.setup.kind,biome:r.setup.biome.code,temperature:r.setup.temperature,moisture:r.setup.moisture,elevation:r.setup.elevation,exactCanonicalState:r.exactCanonicalState,timing:r.stages}))}));
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
