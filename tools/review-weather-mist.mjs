// Original/current HTTP-only artwork swap in a real New World. Only position is staged between
// naturally generated weather locations; observations never alter the climate.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'reports/weather-mist-review'),root=path.resolve(process.argv[3]||'.');fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');if(new URL(req.url,'http://local').pathname==='/src/render/atmosphere.js'){
 const old=fs.readFileSync(path.join(root,'assets/art/production-review/weather-v1/atmosphere-before.js'),'utf8').replace(/^import[^\n]+\n/,'').replace('export function drawAtmosphere','function originalDrawAtmosphere');
 bytes=Buffer.from(bytes.toString().replace('export function drawAtmosphere','function refinedDrawAtmosphere')+'\n'+old+'\nexport function drawAtmosphere(r){const now=r.renderNow;r.renderNow=16000;try{return(window.__weatherOriginal?originalDrawAtmosphere:refinedDrawAtmosphere)(r)}finally{r.renderNow=now}}');
 }res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldSeed').fill(process.argv[4]||'CAVES-GEOLOGY');await page.locator('#newWorldName').fill('Atmospheric visibility review');
 const geography=page.locator('#newWorldGeography');if(await geography.count())await geography.selectOption('planetary/1');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.climate&&window.__GENVO8__.sim.tickCount>0&&window.__GENVO8__.renderer.sim===window.__GENVO8__.sim&&window.__GENVO8__.sim.seed===(document.querySelector('#newWorldSeed').value),{}, {timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const samples=await page.evaluate(async()=>{const {atmosphereAt,atmosphericSight}=await import('/src/ecology/atmospheric-visibility.js'),g=window.__GENVO8__,s=g.sim,w=s.world,p=s.player();s.paused=true;let thick=null,clear=null;for(let y=12;y<w.n-12;y++)for(let x=12;x<w.n-12;x++){if(!s.canOccupy(p,x+.5,y+.5)||w.water[w.idx(x,y)])continue;const at=atmosphereAt(s,x+.5,y+.5),v={x:x+.5,y:y+.5,...at};if(!thick||v.extinction>thick.extinction)thick=v;if(!clear||v.extinction<clear.extinction)clear=v}if(!thick||!clear)throw Error('No generated atmospheric observation locations');p.x=thick.x;p.y=thick.y;p.target=null;g.renderer.zoom=2;return{thick,clear,policy:s.visibilityRules,probe:atmosphericSight(s,p,{x:p.x+6,y:p.y},8),climate:structuredClone(s.climate),day:s.day}});

 assert.ok(samples.thick.extinction>samples.clear.extinction);assert.ok(samples.thick.extinction>.04);
 const records=[];for(const [site,point] of Object.entries({mist:samples.thick,clear:samples.clear})){
 await page.evaluate(({x,y})=>{const g=window.__GENVO8__;if(!g.sim.paused||g.renderer.sim!==g.sim)throw Error('Lost observation state');const p=g.sim.player();p.x=x;p.y=y;p.target=null;g.renderer.camera.x=x;g.renderer.camera.y=y;while(!g.renderer.prepareScene(100)){};g.renderer.render()},point);await page.waitForTimeout(1500);
 for(const original of [true,false,false,true,false,true,true,false]){
 const result=await page.evaluate(async original=>{const g=window.__GENVO8__;window.__weatherOriginal=original;const fixed=8000,oldNow=g.renderer.renderNow;const saved=await import('/src/persistence/save-manager.js'),codec=await import('/src/persistence/scenario-codec.js');
 const state=()=>JSON.stringify(codec.encodeSnapshotGraph(saved.createSimulationSnapshot(g.sim,{savedAt:'mist-art-observation'})));
 const before=state();g.renderer.renderNow=fixed;for(let k=0;k<30;k++)g.renderer.render();const times=[];for(let k=0;k<100;k++){const start=performance.now();g.renderer.render();times.push(performance.now()-start)}times.sort((a,b)=>a-b);
 const after=state();if(before!==after)throw Error('Renderer changed simulation');g.renderer.renderNow=oldNow;return{original,meanMs:times.reduce((a,b)=>a+b,0)/times.length,medianMs:times[49],p95Ms:times[94],state:after};},original);
 await page.screenshot({path:path.join(output,site+(original?'-before':'-after')+'.png')});records.push({site,...result});
 }
 const states=records.filter(r=>r.site===site);for(const r of states)assert.equal(states[0].state,r.state,'same complete paused simulation');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({samples,records:records.map(({state,...r})=>r),exactCanonicalState:true,errors,creatorAcceptance:false,timingScope:'Paused CPU draws, GPU completion excluded; ABBA BAAB, 30 warmup + 100 each'},null,2));console.log('Native mist comparison PASS: original and candidate, real generated weather, exact complete simulation parity.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
