import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-border-presentation-browser.mjs <evidence dir> <exported build>
const output=path.resolve(process.argv[2]),root=path.resolve(process.argv[3]);fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill('PLANET-B0-A');await page.locator('#newWorldName').fill('Border presentation');await page.locator('#newWorldCreature').selectOption('starter-jump');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 // Inspect every crossing frame, rather than only the settled screenshots.
 await page.evaluate(()=>{const r=window.__GENVO8__.renderer,proof=window.__regionalContinuity={startupPreparations:0,crossings:[]};let region=JSON.stringify(r.sim.world.regionOrigin);const begin=r.beginScenePreparation;r.beginScenePreparation=function(...args){proof.startupPreparations++;return begin.apply(this,args)};const draw=r.renderOrPrepare;r.renderOrPrepare=function(...args){const next=JSON.stringify(this.sim.world.regionOrigin),changed=region!==next;const result=draw.apply(this,args);if(changed){window.__firstRegionalFrame=this.canvas.toDataURL('image/png');const d=this.ctx.getImageData(Math.round(this.w/2)-64,Math.round(this.h/2)-64,128,128).data;let terrainPixels=0;for(let i=0;i<d.length;i+=4)if(d[i]>28||d[i+1]>38||d[i+2]>32)terrainPixels++;proof.crossings.push({from:region,to:next,sceneShown:this.sceneShown,scenePending:!!this.scenePending,terrainPixels,stats:structuredClone(this.regionalSceneStats)});region=next}return result}});
 // Frame gaps across the whole run, from the page's own animation frames.
 await page.evaluate(()=>{const g=window.__borderFrames={max:0,last:performance.now()};const tick=t=>{g.max=Math.max(g.max,t-g.last);g.last=t;requestAnimationFrame(tick)};requestAnimationFrame(t=>{g.last=t;requestAnimationFrame(tick)})});
 const phases={};const phase=async name=>{phases[name]=await page.evaluate(()=>{const g=window.__borderFrames,m=Math.round(g.max);g.max=0;return m})};
 await phase('start');
 // Explicit observer placement on real accessible ground 3.5 cells from the east border, facing it.
 const placed=await page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,p=s.player();for(let y=40.5;y<100;y++){if(!s.world.water[s.world.idx(124.5,y)]&&s.canOccupy(p,124.5,y)){p.x=124.5;p.y=y;p.dir=2;g.renderer.cameraReady=false;g.renderer.motion.clear();return{x:p.x,y:p.y}}}throw Error('No accessible ground near the east border')});
 await page.waitForFunction(()=>{const b=window.__GENVO8__.renderer.borderTerrain,v=b?.views.get('128,0');return v&&v.renderer.terrainChunkCache.size>=8},{}, {timeout:90000});await page.waitForTimeout(1500);
 // Sample the canvas: cells across the border in front of the creature show
 // terrain, not the fog colour; the camera keeps the creature centred.
 const sample=(dx)=>page.evaluate(dx=>{const g=window.__GENVO8__,r=g.renderer,p=g.sim.player(),tile=g.CFG.tileSize*r.zoom,x=Math.round(r.w/2+(dx+.5)*tile-.5*tile),y=Math.round(r.h/2);const d=r.ctx.getImageData(x,y,1,1).data;return{rgb:[d[0],d[1],d[2]],cam:{...r.camera},player:{x:p.x,y:p.y},w:r.w,h:r.h}},dx);
 const fog=rgb=>rgb[0]<24&&rgb[1]<34&&rgb[2]<28;
 await phase('borderViews');
 const across=await sample(5),inside=await sample(2);
 assert.deepEqual(across.cam,across.player,'the creature stays centred at the border');
 assert.ok(!fog(across.rgb),'terrain beyond the border is drawn where the creature can see: '+across.rgb);assert.ok(!fog(inside.rgb));
 await page.screenshot({path:path.join(output,'at-border.png')});
 const views=await page.evaluate(()=>[...window.__GENVO8__.renderer.borderTerrain.views.values()].map(v=>({key:v.key,kind:v.kind,chunks:v.renderer.terrainChunkCache.size,surface:[v.renderer.canvas.width,v.renderer.canvas.height]})));
 // A real held-key crossing: the creature is centred on arrival and the
 // region just left is drawn from its own saved World.
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=false});await page.keyboard.down('d');await page.waitForFunction(()=>window.__GENVO8__.sim.world.regionOrigin.x===128,{}, {timeout:90000});await page.keyboard.up('d');await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());await page.waitForFunction(()=>window.__regionalContinuity.crossings.length===1);const firstFrame=await page.evaluate(()=>window.__firstRegionalFrame);fs.writeFileSync(path.join(output,'first-crossing-frame.png'),Buffer.from(firstFrame.split(',')[1],'base64'));
 await phase('crossing');
 await page.evaluate(()=>{const p=window.__GENVO8__.sim.player();p.dir=6});
 await page.waitForFunction(()=>{const v=window.__GENVO8__.renderer.borderTerrain?.views.get('0,0');return v?.kind==='resident'&&v.renderer.terrainChunkCache.size>=8},{}, {timeout:90000});await page.waitForTimeout(1500);
 await phase('afterCrossingViews');
 const arrived=await page.evaluate(()=>{const g=window.__GENVO8__,r=g.renderer,p=g.sim.player();return{cam:{...r.camera},player:{x:p.x,y:p.y}}});
 assert.deepEqual(arrived.cam,arrived.player,'the creature is centred after crossing');assert.ok(arrived.player.x<6);
 const behind=await sample(-(Math.floor(arrived.player.x)+3));assert.ok(!fog(behind.rgb),'the region just left is drawn across the border: '+behind.rgb);
 await page.screenshot({path:path.join(output,'after-crossing.png')});
 const continuity=await page.evaluate(()=>window.__regionalContinuity);assert.equal(continuity.startupPreparations,0,'crossings never clear the scene for startup preparation');assert.equal(continuity.crossings.length,1);const crossing=continuity.crossings[0];assert.equal(crossing.sceneShown,true);assert.equal(crossing.scenePending,false);assert.ok(crossing.terrainPixels>1000,'the FIRST crossing frame contains real visible terrain');assert.ok(crossing.stats.last.promotedChunks>0,'the first active frame reuses already prepared native destination chunks');assert.ok(crossing.stats.last.departingChunks>0,'departing region retains its ground');for(const v of views)assert.deepEqual(v.surface,[1,1],'neighbour terrain has no viewport-sized backing surface');
 const sizes=[];for(const [w,h] of [[800,600],[1024,768],[1920,1080]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(1200);const s=await sample(-(Math.floor(arrived.player.x)+3));assert.deepEqual(s.cam,s.player);assert.ok(!fog(s.rgb),w+'x'+h+' '+s.rgb);sizes.push({w,h,rgb:s.rgb});await page.screenshot({path:path.join(output,'after-crossing-'+w+'x'+h+'.png')})}
 await phase('resizes');const frames=Math.max(...Object.values(phases));
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({continuity,placed,across,inside,views,arrived,behind,sizes,maxFrameGapMs:frames,frameGapsByPhase:phases,errors,scope:'Exported build, native New World, explicit legal frontier placement, held-key crossing with first-frame pixel checks and no startup preparation, real neighbouring terrain at three sizes. Presentation continuity only: canonical travel still transfers to a different active Simulation and the physical margin gap and neighbouring wildlife interaction remain unfinished. Not creator acceptance.'},null,2));
 console.log('Border presentation Chromium PASS: centred camera at the border and after crossing, real neighbouring terrain within view at three sizes; longest frame gap '+frames+' ms '+JSON.stringify(phases)+'.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
