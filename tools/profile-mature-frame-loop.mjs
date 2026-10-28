// Diagnostic native frame-loop attribution. Requires a real canonical saved world;
// never spawns populations, changes reserves or directly advances simulation ticks.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import v8 from 'node:v8';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
import {packageScenarioSnapshot} from '../src/persistence/scenario-library.js';
const root=process.cwd(),out=path.resolve(process.argv[2]||'');
if(!process.argv[2]||!process.argv[3]||fs.existsSync(out))throw Error('Usage: profile-mature-frame-loop.mjs fresh-output actual.snapshot.v8 [--native] [--reference-snow=40-char-commit]');
fs.mkdirSync(out);
const input=path.resolve(process.argv[3]);
const sourceHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const referenceFlag=process.argv.slice(4).find(arg=>arg.startsWith('--reference-snow='));
const referenceCommit=referenceFlag?.slice('--reference-snow='.length);
if(referenceCommit&&!/^[a-f0-9]{40}$/.test(referenceCommit))throw Error('A complete reference commit is required');
const original=fs.readFileSync(input),snapshot=v8.deserialize(original);
const runtimeSourceSha256=Object.fromEntries(['src/render/renderer.js','src/render/snow-ground-art.js']
  .map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const referenceSnow=referenceCommit?execFileSync('git',['show',referenceCommit+':src/render/snow-ground-art.js']):null;
if(referenceSnow)runtimeSourceSha256['src/render/snow-ground-art.js']=createHash('sha256').update(referenceSnow).digest('hex');
const workingTreeChanges=execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const packed=zlib.gzipSync(JSON.stringify(encodeSnapshotGraph(snapshot)));
const imported={...snapshot,core:{...snapshot.core,paused:true}};
const importPath=path.join(out,'mature-frame-proof.json.gz');
fs.writeFileSync(importPath,zlib.gzipSync(JSON.stringify(packageScenarioSnapshot(imported,
  {id:'mature-frame-proof',label:'Actual Day '+snapshot.core.day+' frame-loop proof'}))));
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname);
  if(name==='/src/render/snow-ground-art.js'&&referenceSnow){res.setHeader('Content-Type','text/javascript');res.end(referenceSnow);return}
  if(name==='/mature-proof.json.gz'){res.end(packed);return}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(error,bytes)=>{
    if(error){res.writeHead(404);res.end();return}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(bytes);
  });
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
  browser=await chromium.launch({headless:!process.argv.includes('--native')});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
  await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
  await page.locator('#newWorldStartingPoint').selectOption('import');
  await page.locator('#newWorldScenarioFile').setInputFiles(importPath);
  await page.locator('#newWorldCreature').selectOption('recorded');
  await page.locator('#newWorldMovementRules').selectOption('recorded');
  await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
  await page.waitForFunction(({seed,tick})=>{const g=window.__GENVO8__;return document.querySelector('#frontEnd')?.hidden&&g?.sim.seed===seed&&g.renderer.sceneShown&&!g.saveManager.busy&&g.saveManager.lastSavedTick>=tick},{seed:snapshot.seed,tick:snapshot.core.tickCount},{timeout:120000});
  const begin=page.getByRole('button',{name:"LET'S BEGIN",exact:true});
  if(await begin.isVisible())await begin.click();
  await page.keyboard.press('Escape');
  const installed=await page.evaluate(()=>{
    const sim=window.__GENVO8__.sim;
    return {tick:sim.tickCount,day:sim.day,rng:sim.rng.state,living:sim.animals.filter(a=>a.alive).length,
      player:sim.player()?.id,rules:sim.autonomousEvolutionRules,autonomy:sim.playerAutonomy};
  });
  await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',{},{timeout:60000});
  if(await begin.isVisible())await begin.click();
  const resume=page.locator('.menu-view[data-screen="pause"] [data-action="resume"]');
  if(!await resume.isVisible())await page.keyboard.press('Escape');
  await resume.waitFor({state:'visible'});
  await page.screenshot({path:path.join(out,'paused-mature-world.png')});
  await page.evaluate(async()=>{
    const {World}=await import('/src/world/world.js'),original=World.prototype.buildHydrology;
    const {snowGroundArtStats}=await import('/src/render/snow-ground-art.js');
    window.__snowBuildProof=[];
    window.__hydrologyProof=[];
    World.prototype.buildHydrology=function(...args){
      const start=performance.now();try{return original.apply(this,args)}finally{
        const duration=performance.now()-start;
        window.__hydrologyProof.push({duration,n:this.n,origin:this.regionOrigin,
          stack:duration>20?new Error().stack:null});
      }
    };
    const g=window.__GENVO8__,enqueue=g.planetaryWork.enqueue;
    window.__regionalWorkProof=[];
    g.planetaryWork.enqueue=function(key,target,run,options){
      return enqueue.call(this,key,target,function(...args){
        const start=performance.now(),result=run.apply(this,args);
        window.__regionalWorkProof.push({key,syncMs:performance.now()-start});
        return result;
      },options);
    };
    window.__frameComponentProof=[];
    for(const [owner,name,label] of [[g.renderer,'renderOrPrepare','render'],[g.frameStepper,'advance','stepper'],
      [g.tutorial,'update','tutorial'],[g.fieldGuide,'refresh','guide'],[g.leadershipWheel,'sync','leadership'],
      [g.journal,'update','journal'],[g.contextTray,'update','context'],[g.youngSummary,'check','young']]){
      if(typeof owner?.[name]!=='function')continue;
      const original=owner[name];
      owner[name]=function(...args){const start=performance.now();
        if(label==='render')window.__renderStageCurrent={};
        try{return original.apply(this,args)}finally{
        window.__frameComponentProof.push({label,at:start,duration:performance.now()-start,tick:g.sim.tickCount,
          ...(label==='render'?{stages:window.__renderStageCurrent}:{})});
        if(label==='render')window.__renderStageCurrent=null;
      }};
    }
    for(const name of ['syncScene','drawTerrainChunks','queueTerrainWarmRing','drawSnowWindow',
      'drawLiveVegetationWindow','drawHabitatScenes','drawHabitatTransitions','drawForegroundHabitat',
      'drawHabitatSceneForeground','drawSceneDepthForeground','drawWeatherOverlay','processTerrainRefreshQueue',
      'drawSites','drawSignals','drawMemoryOverlay']){
      const original=g.renderer[name];if(typeof original!=='function')continue;
      g.renderer[name]=function(...args){const start=performance.now();
        const before=name==='drawSnowWindow'?snowGroundArtStats(g.sim.world).builds:0;
        try{return original.apply(this,args)}finally{
        const buckets=window.__renderStageCurrent;
        if(buckets)buckets[name]=(buckets[name]||0)+performance.now()-start;
        if(name==='drawSnowWindow'){
          const stats=snowGroundArtStats(g.sim.world),built=stats.builds-before;
          if(built)window.__snowBuildProof.push({at:start,built,entries:stats.entries,capacity:stats.capacity});
        }
      }};
    }
  });
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});
  await page.evaluate(()=>{
    const state=window.__frameProof={running:true,frames:[],longTasks:[],start:performance.now(),last:null};
    state.observer=new PerformanceObserver(list=>{for(const task of list.getEntries())state.longTasks.push({at:task.startTime,duration:task.duration})});
    state.observer.observe({type:'longtask',buffered:false});
    const frame=at=>{if(!state.running)return;if(state.last!==null)state.frames.push(at-state.last);state.last=at;requestAnimationFrame(frame)};
    requestAnimationFrame(frame);
  });
  await cdp.send('Profiler.start');
  await resume.click();
  await page.waitForFunction(tick=>!window.__GENVO8__.sim.paused&&window.__GENVO8__.sim.tickCount>tick,installed.tick,{timeout:15000});
  // Yield in bounded tool-visible intervals; do not call Simulation.update or
  // alter biology, simulation speed, populations, reserves or random state.
  for(let n=0;n<6;n++){await page.waitForTimeout(10000);console.log('Actual frame-loop observation '+(n+1)+'/6')}
  const measurement=await page.evaluate(()=>{
    const x=window.__frameProof;x.running=false;x.observer.disconnect();
    const frames=[...x.frames].sort((a,b)=>a-b),s=window.__GENVO8__.sim;
    const quantile=p=>frames[Math.min(frames.length-1,Math.floor(frames.length*p))];
    return {elapsed:performance.now()-x.start,frames:x.frames,p50:quantile(.5),p95:quantile(.95),p99:quantile(.99),max:Math.max(...frames),
      longTasks:x.longTasks,hydrology:window.__hydrologyProof,regionalWork:window.__regionalWorkProof,components:window.__frameComponentProof,snowBuilds:window.__snowBuildProof,tick:s.tickCount,day:s.day,rng:s.rng.state,living:s.animals.filter(a=>a.alive).length,player:s.player()?.id,paused:s.paused};
  });
  const profile=(await cdp.send('Profiler.stop')).profile;
  if(measurement.tick<=installed.tick||measurement.paused)throw Error('Invalid simulation benchmark: world did not continue');
  fs.writeFileSync(path.join(out,'profile.cpuprofile'),JSON.stringify(profile));
  await page.screenshot({path:path.join(out,'observed-mature-world.png')});
  const frames=new Map(profile.nodes.map(n=>[n.id,n.callFrame])),hits=new Map();
  for(const id of profile.samples||[]){const f=frames.get(id);if(!f)continue;const key=f.functionName+'@'+f.url;hits.set(key,(hits.get(key)||0)+1)}
  const receipt={input,inputSha256:createHash('sha256').update(original).digest('hex'),sourceHead,installed,measurement,top:[...hits].sort((a,b)=>b[1]-a[1]).slice(0,30),errors};
  receipt.browserMode=process.argv.includes('--native')?'visible Chromium':'headless Chromium';
  receipt.runtimeSourceSha256=runtimeSourceSha256;receipt.workingTreeChanges=workingTreeChanges;
  receipt.referenceSnowRoute=!!referenceSnow;receipt.referenceCommit=referenceCommit||null;
  receipt.scope='Real saved Day '+snapshot.core.day+' imported through native New World recorded-file controls, actual requestAnimationFrame/control/biological loop at 1x retained AUTO for 60 seconds. Timed hydrology and synchronous regional admission; CPU profiler overhead applies. Browser mode recorded separately. Not GPU completion, hosted network speed, before/after improvement, or external usability acceptance. Only pause state changed in import setup.';
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));
  console.log(JSON.stringify({sourceHead,browserMode:receipt.browserMode,referenceCommit:referenceCommit||null,installed,
    tickAdvance:measurement.tick-installed.tick,p50:measurement.p50,p95:measurement.p95,p99:measurement.p99,max:measurement.max,longTasks:measurement.longTasks.length,errors},null,2));
}catch(error){fs.writeFileSync(path.join(out,'failure.txt'),error.stack||String(error));throw error}
finally{await browser?.close();await new Promise(r=>server.close(r))}
