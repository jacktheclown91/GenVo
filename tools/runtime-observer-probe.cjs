// Windows-capable real Chromium smoke/pacing probe; staged load is not ecology proof.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'reports/runtime-observer'),HOST='https://genvo8.runtime';
(async()=>{
  fs.mkdirSync(out,{recursive:true});const errors=[];
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.route(HOST+'/**',async route=>{
      const rel=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/,''),file=path.resolve(root,rel||'index.html');
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'not found'});
      const ext=path.extname(file),type={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.gif':'image/gif','.wav':'audio/wav'}[ext]||'application/octet-stream';
      return route.fulfill({body:fs.readFileSync(file),contentType:type});
    });
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="'+HOST+'/">');
    await page.setContent(html);await page.waitForFunction(()=>window.__GENVO8__?.sim&&window.__GENVO8__?.renderer);
    await page.click('#startGame');for(let i=0;i<3;i++)await page.keyboard.press('Enter');
    const fixture=await page.evaluate(()=>{
      const G=window.__GENVO8__,sim=G.sim;G.tutorial.stage='done';sim.uiTutorialStage='done';G.tutorial.welcome.hidden=true;sim.paused=false;
      while(sim.animals.filter(a=>a.alive).length<G.CFG.performanceTarget)sim.spawnAnimal(['mosskip','rootling','genvo'][sim.animals.length%3]);
      sim.rebuildSpatial();G.tutorial.update(true);G.renderer.render();return{version:G.CFG.version,population:sim.population(),staged:true};
    });
    const pacing=await page.evaluate(async()=>{
      const intervals=[],start=performance.now();let last=start;
      await new Promise(resolve=>{function frame(now){intervals.push(now-last);last=now;if(now-start<3000)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});
      intervals.sort((a,b)=>a-b);return{frames:intervals.length,medianMs:intervals[Math.floor(intervals.length*.5)],p95Ms:intervals[Math.floor(intervals.length*.95)],maxMs:intervals.at(-1),tick:window.__GENVO8__.sim.tickCount};
    });
    await page.screenshot({path:path.join(out,'gameplay-560.png')});
    const report={fixture,pacing,errors,concurrentValidation:true,acceptance:false};fs.writeFileSync(path.join(out,'runtime.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
