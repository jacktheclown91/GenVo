import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-view-modes-browser.mjs <exported build> <evidence dir> [seed] [creature]
// Viewing modes in the exported game. After real AUTO exploration it captures
// each mode chosen through Esc → Options, checks that the creatures drawn are
// the same in every mode (perception still decides them), checks that the
// live-layer clip covers sensed cells only, and records rapid turning.
const openOptions=async page=>{for(let i=0;i<8;i++){const lab=page.locator('#creatureEditor:not([hidden]) [data-act="cancel"]');if(await lab.count())await lab.click();if(await page.locator('.menu-view[data-screen="pause"] [data-screen-target="settings"]').isVisible())break;await page.keyboard.press('Escape');await page.waitForTimeout(700)}await page.locator('.menu-view[data-screen="pause"] [data-screen-target="settings"]').click()};
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),seed=process.argv[4]||'PLANET-OBS-2',creature=process.argv[5]||'starter-dive';
fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch();const report={seed,creature};
try{
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldCreature').selectOption(creature);await page.locator('#newWorldSeed').fill(seed);
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:120000});
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true);g.sim.setPlayerAutonomy(true)});
 report.defaultMode=await page.evaluate(async()=>(await import('/src/render/view-modes.js')).viewMode());
 await page.waitForTimeout(50000);await page.evaluate(()=>window.__GENVO8__.sim.setPlayerAutonomy(false));await page.waitForTimeout(800);
 const modes={};
 // The Options select is exercised once; the world is then held still so all
 // three modes show the same moment.
 await openOptions(page);await page.locator('#menuViewMode').selectOption('biological');report.optionsNote=await page.locator('#menuViewNote').textContent();
 await page.locator('.menu-view[data-screen="settings"] [data-action="back"]').click();await page.waitForTimeout(300);
 if(await page.locator('#frontEnd:not([hidden])').count())await page.locator('.menu-view:not([hidden]) [data-action="resume"]').first().click();
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=true});
 for(const mode of ['biological','comfort','sandbox']){
  await page.evaluate(async m=>(await import('/src/render/view-modes.js')).setViewMode(m),mode);const note=await page.evaluate(async m=>(await import('/src/render/view-modes.js')).VIEW_MODES[m].note,mode);
  await page.waitForTimeout(1600);await page.screenshot({path:path.join(out,`mode-${mode}.png`)});
  modes[mode]=await page.evaluate(async()=>{const g=window.__GENVO8__,r=g.renderer,{viewMode}=await import('/src/render/view-modes.js'),{clipToSensed}=await import('/src/render/sensory-fog.js');
   const cache=r.sensoryFogCache,tile=16*r.zoom,counts=[0,0,0];for(const s of cache.state)counts[s]++;
   // Clip probe: paint through the clip, then read the centre pixel of sample cells.
   const c=r.ctx,before=c.getImageData(0,0,r.w,r.h);let probe={seenPainted:0,seen:0,otherPainted:0,other:0};
   if(clipToSensed(r,tile)){c.fillStyle='#ff00ff';c.fillRect(0,0,r.w,r.h);c.restore();
    const img=c.getImageData(0,0,r.w,r.h).data;
    for(let j=0;j<cache.rows;j+=2)for(let i=0;i<cache.cols;i+=2){const x=cache.left+i,y=cache.top+j,px=Math.floor((x+.5-r.camera.x)*tile+r.w/2),py=Math.floor((y+.5-r.camera.y)*tile+r.h/2);if(px<0||py<0||px>=r.w||py>=r.h)continue;
     const k=(py*r.w+px)*4,painted=img[k]===255&&img[k+1]===0&&img[k+2]===255,s=cache.state[j*cache.cols+i];if(s===2){probe.seen++;if(painted)probe.seenPainted++}else{probe.other++;if(painted)probe.otherPainted++}}}
   c.putImageData(before,0,0);
   return{mode:viewMode(),drawnCreatures:(r.visibleAnimals||[]).length,cells:{unknown:counts[0],remembered:counts[1],seen:counts[2]},probe}});
  modes[mode].note=note;
 }
 report.modes=modes;
 const drawn=Object.values(modes).map(m=>m.drawnCreatures);assert.ok(drawn.every(n=>n===drawn[0]),'the same creatures are drawn in every mode');
 for(const m of Object.values(modes)){assert.equal(m.probe.otherPainted,0,'live layers never reach unsensed cells');assert.ok(m.probe.seenPainted>=m.probe.seen*.95,'live layers cover sensed cells')}
 // Rapid turning in the default mode, recorded.
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=false});
 await openOptions(page);await page.locator('#menuViewMode').selectOption('comfort');await page.locator('.menu-view[data-screen="settings"] [data-action="back"]').click();
 if(await page.locator('#frontEnd:not([hidden])').count())await page.locator('.menu-view:not([hidden]) [data-action="resume"]').first().click();
 report.turnStart=Date.now();for(let r=0;r<3;r++)for(const k of ['KeyD','KeyW','KeyA','KeyS']){await page.keyboard.down(k);await page.waitForTimeout(450);await page.keyboard.up(k)}
 await page.screenshot({path:path.join(out,'turning-comfort.png')});
 report.errors=errors;assert.deepEqual(errors,[]);
 await page.close();await context.close();
 const video=fs.readdirSync(out).find(f=>f.endsWith('.webm'));if(video)fs.renameSync(path.join(out,video),path.join(out,'view-modes-session.webm'));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close()}
console.log(JSON.stringify(report.modes||report,null,1));
