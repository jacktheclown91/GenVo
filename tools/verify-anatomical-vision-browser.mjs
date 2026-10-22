import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-anatomical-vision-browser.mjs <evidence dir> <exported build>
const output=path.resolve(process.argv[2]),root=path.resolve(process.argv[3]);if(fs.existsSync(output)&&fs.readdirSync(output).length)throw Error('Preserve previous evidence.');fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});let page;
try{
 page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill('PLANET-B0-A');await page.locator('#newWorldName').fill('Advanced vision');await page.locator('#newWorldCreature').selectOption('starter-jump');await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 // Stage: the observer stands on genuine legal ground near the east border,
 // facing east, with the game paused. Nothing else in the world is edited.
 const placed=await page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,p=s.player();s.paused=true;
  for(let x=116.5;x>100;x--)for(let y=40.5;y<90;y++)if(s.canOccupy(p,x,y)){p.x=x;p.y=y;p.dir=2;g.renderer.motion.clear();g.renderer.cameraReady=false;return{x,y,policy:s.visionRules}}
  throw Error('No legal ground near the frontier')});
 assert.equal(placed.policy,'anatomical-vision/1');
 // Measure the actual fog layer the renderer drew: share of the screen cleared,
 // cleared cells beyond the region line, and creatures rendered as visible.
 const measure=async label=>{await page.evaluate(()=>{window.__GENVO8__.renderer.sensoryFogCache=null});await page.waitForFunction(()=>!window.__GENVO8__.renderer.terrainRefreshQueue?.length&&!window.__GENVO8__.renderer.terrainChunkWork,{}, {timeout:60000}).catch(()=>{});await page.waitForTimeout(2500);
  const m=await page.evaluate(async()=>{const g=window.__GENVO8__,s=g.sim,r=g.renderer,p=s.player(),c=r.sensoryFogCache,ctx=c.canvas.getContext('2d'),{visionProfile}=await import('/src/lineage/vision.js'),{creatureView,viewCanSee,viewReachesBeyond}=await import('/src/ecology/atmospheric-visibility.js');
   const data=ctx.getImageData(c.pad,c.pad,r.w,r.h).data;let clear=0;for(let i=3;i<data.length;i+=16)if(data[i]===0)clear++;
   const tile=32*(r.zoom/2)*1,view=creatureView(s,p,8,{beyond:(x,y)=>r.borderTerrain?.cellWorld(x,y)});let beyond=0,beyondDrawn=0,occluded=0,inReach=0;
   const cols=Math.ceil(r.w/(16*r.zoom))+2,rows=Math.ceil(r.h/(16*r.zoom))+2,x0=Math.floor(r.camera.x-cols/2),y0=Math.floor(r.camera.y-rows/2);
   for(let y=y0;y<y0+rows;y++)for(let x=x0;x<x0+cols;x++){const cx=x+.5,cy=y+.5;
    if(x>=s.world.n){if(r.borderTerrain?.cellWorld(cx,cy)){beyondDrawn++;if(viewReachesBeyond(view,cx,cy))beyond++}}
    else if(x>=0&&y>=0&&y<s.world.n&&Math.hypot(cx-p.x,cy-p.y)<=view.range&&!viewCanSee(view,cx,cy))occluded++;}
   const far=(r.visibleAnimals||[]).filter(a=>!a.player&&Math.hypot(a.x-p.x,a.y-p.y)>24).map(a=>({id:a.id,distance:+Math.hypot(a.x-p.x,a.y-p.y).toFixed(1)}));
   const prof=visionProfile(p);return{clearShare:+(clear/(data.length/16)).toFixed(3),range:+prof.range.toFixed(1),fieldOfView:prof.fieldOfView,eyes:p.bodyPlan.nodes.filter(n=>n.socket?.startsWith('eye')).map(n=>n.partId),extinction:+view.extinction.toFixed(3),beyondCleared:beyond,beyondDrawn,occludedInReach:occluded,farVisibleCreatures:far,zoom:r.zoom}});
  await page.screenshot({path:path.join(output,label+'.png')});return m};
 const primitive=await measure('primitive');
 // The evolved anatomy: raptor eyes forward and raised sentinel eyes behind on
 // a large head (each reachable only through the stepwise eye lines).
 await page.evaluate(()=>{window.__originalPlan=structuredClone(window.__GENVO8__.sim.player().bodyPlan)});
 await page.evaluate(async()=>{const g=window.__GENVO8__,p=g.sim.player(),{makePlan}=await import('/src/lineage/body-plan.js'),{applyLineageTarget}=await import('/src/lineage/reproduction-bridge.js');
  const keep=p.bodyPlan.nodes.filter(n=>n.parent==='root'&&/^limb\.|^mouth$/.test(n.socket)).map(n=>({partId:n.partId,parent:'root',socket:n.socket}));
  applyLineageTarget(p,makePlan([{partId:'barrel-torso',parent:null,socket:null},...keep,{partId:'raptor-eye',parent:'root',socket:'eye.left'},{partId:'raptor-eye',parent:'root',socket:'eye.right'},{partId:'sentinel-eye',parent:'root',socket:'eye.left.2'},{partId:'sentinel-eye',parent:'root',socket:'eye.right.2'}]))});
 const evolved=await measure('evolved');
 // Distant creature: stand about 30 tiles west of a real wild animal (legal
 // ground, facing it), then compare the evolved and the original eyes there.
 const spot=await page.evaluate(async()=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),{atmosphereAt}=await import('/src/ecology/atmospheric-visibility.js');
  // Favourable conditions: clear air at both ends of the line of sight.
  for(const a of s.animals){if(!a.alive||a.player||a.underground||atmosphereAt(s,a.x,a.y).extinction>.004)continue;for(const d of [32,30,28,26]){const x=Math.floor(a.x-d)+.5,y=a.y;if(x>2&&s.canOccupy(p,x,y)&&atmosphereAt(s,x,y).extinction<=.004){p.x=x;p.y=y;p.dir=2;g.renderer.motion.clear();g.renderer.cameraReady=false;return{target:a.id,distance:+Math.hypot(a.x-x,a.y-y).toFixed(1)}}}}
  throw Error('No legal ground behind a wild animal')});
 const distantEvolved=await measure('distant-evolved');
 await page.evaluate(async()=>{const {applyLineageTarget}=await import('/src/lineage/reproduction-bridge.js');applyLineageTarget(window.__GENVO8__.sim.player(),window.__originalPlan)});
 const distantPrimitive=await measure('distant-primitive');
 assert.ok(distantEvolved.farVisibleCreatures.some(a=>a.id===spot.target),'evolved eyes perceive the distant creature');
 assert.ok(!distantPrimitive.farVisibleCreatures.some(a=>a.id===spot.target),'the original eyes do not');
 assert.ok(primitive.clearShare<.2,'primitive sight reveals little of the screen');
 assert.equal(evolved.fieldOfView,360);assert.ok(evolved.range>=36);
 assert.ok(evolved.clearShare>primitive.clearShare*3,'evolved sight reveals far more of the screen');
 assert.ok(evolved.beyondCleared>primitive.beyondCleared,'neighbouring streamed terrain is revealed where physically visible');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({placed,primitive,evolved,spot,distantEvolved,distantPrimitive,errors,scope:'Exported native New World at 1920x1080, normal 2x zoom, game paused. Staged: observer placed on legal ground near the east border, and the evolved eye anatomy applied through the lineage authority (not grown by natural evolution in this trial). Fog shares are measured from the actual rendered sensory-fog layer; remaining fog marks physically occluded or out-of-arc cells and atmospheric loss.'},null,2));
 console.log('Anatomical vision Chromium PASS: screen revealed '+(primitive.clearShare*100).toFixed(0)+'% -> '+(evolved.clearShare*100).toFixed(0)+'%, range '+primitive.range+' -> '+evolved.range+' tiles, view '+primitive.fieldOfView+' -> '+evolved.fieldOfView+' deg, neighbouring cells '+primitive.beyondCleared+' -> '+evolved.beyondCleared+'/'+evolved.beyondDrawn+', unseen within reach (arc, air or relief) '+evolved.occludedInReach+', distant creature '+spot.target+' at '+spot.distance+' tiles perceived only with evolved eyes.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
