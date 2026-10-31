// Automated real Chromium controls; only actor position is staged in generated water.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../../src/lineage/founder-design.js';
import {place} from '../../src/lineage/evolution-draft.js';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'docs/underwater-presentation-2026-10-29/native'),root=path.resolve(process.argv[3]||'..');if(fs.existsSync(output))throw Error('Use a fresh output directory');fs.mkdirSync(output,{recursive:true});
const design=new FounderDesign('sandbox');for(const socket of ['limb.3','limb.5'])assert.ok(place(design.draft,'webbed-leg','root',socket).ok);
const finished=design.finish();assert.ok(finished.ok);const file=path.join(output,'diving-founder.json');fs.writeFileSync(file,JSON.stringify({format:'genvo.authored-creature/1',design:finished.record}));
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');if(target.endsWith('underwater-presentation.js'))bytes=Buffer.from(bytes.toString('utf8').replace('export function underwaterView(sim){','export function underwaterView(sim){if(globalThis.__underwaterBefore)return null;').replace('export function submergedActorOpacity(observer,actor){','export function submergedActorOpacity(observer,actor){if(globalThis.__underwaterBefore)return actor?.diveDepth>.03?.55:1;').replace('export function showDiveSurfaceCue(observer,actor){','export function showDiveSurfaceCue(observer,actor){if(globalThis.__underwaterBefore)return actor?.diveDepth>.03;'));res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 await page.locator('#newWorldGeography').selectOption('freshwater/1');await page.locator('#newWorldSeed').fill('DIVING-BROWSER');await page.locator('#newWorldName').fill('Depth and respiration review');await page.locator('#newWorldCreature').selectOption('sandbox');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 const editor=page.locator('#founderEditor');await editor.waitFor({state:'visible',timeout:60000});const chooser=page.waitForEvent('filechooser');await editor.locator('[data-act="import-design"]').click();await(await chooser).setFiles(file);
 await page.waitForFunction(()=>document.querySelector('#founderEditor .ed-message')?.textContent.includes('design restored'));
 await editor.locator('[data-act="commit"]').click();await editor.locator('[data-act="commit"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.creatureStart?.mode==='sandbox',{}, {timeout:60000});
 await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 for(let i=0;i<8;i++){
  if(!await page.evaluate(()=>{const t=window.__GENVO8__.tutorial;return t.worldInputBlocked()&&['welcome','briefing'].includes(t.stage)}))break;
  await page.keyboard.press('Enter');
 }
 const start=await page.evaluate(async()=>{
  const g=window.__GENVO8__,s=g.sim,w=s.world,p=s.player(),{waterColumn}=await import('/src/lineage/diving.js');
  let i=-1;
  for(let j=0;j<w.len;j++)if(w.water[j]&&waterColumn(w,j%w.n+.5,(j/w.n|0)+.5)>.7){i=j;break}
  if(i<0)throw Error('No real generated diving column');
  // Explicit controlled placement only; actual generated water and public dive.
  p.x=i%w.n+.5;p.y=(i/w.n|0)+.5;p.target=null;
  g.renderer.zoom=3;
  return {x:p.x,y:p.y,column:waterColumn(w,p.x,p.y),policy:s.divingRules};
 });
 const button=page.locator('[data-command="dive"]');
 await button.waitFor({state:'visible'});
 await page.waitForFunction(()=>!document.querySelector('[data-command="dive"]').disabled);
 await button.click();
 await page.waitForFunction(()=>window.__GENVO8__.sim.player().diveDepth>.3,null,{timeout:20000});
 await page.keyboard.press('PageDown');
 await page.waitForFunction(()=>window.__GENVO8__.sim.player().diveDepth>.5,null,{timeout:20000});
 await page.keyboard.press('p');
 await page.waitForFunction(()=>window.__GENVO8__.sim.paused);
 await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained;},null,{timeout:20000});
 const reading=await page.evaluate(async()=>{
  const g=window.__GENVO8__,{underwaterView}=await import('/src/render/underwater-presentation.js');
  return {view:underwaterView(g.sim),depth:g.sim.player().diveDepth,air:g.sim.player().diveAir};
 });
 const snapshot=()=>page.evaluate(async()=>{
  const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
  return JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(window.__GENVO8__.sim,{savedAt:'underwater-native'})));
 });
 const saved=await snapshot();
 for(const old of [true,false]){
  await page.evaluate(flag=>{globalThis.__underwaterBefore=flag;window.__GENVO8__.renderer.render()},old);
  const image=await page.evaluate(()=>window.__GENVO8__.renderer.canvas.toDataURL('image/png'));
  fs.writeFileSync(path.join(output,old?'before-submerged.png':'current-submerged.png'),Buffer.from(image.split(',')[1],'base64'));
 }
 assert.equal(await snapshot(),saved,'same-state comparison preserves canonical graph');
 const timings=await page.evaluate(()=>{
  const r=window.__GENVO8__.renderer,result=[];
  for(const old of [true,false]){
   globalThis.__underwaterBefore=old;
   for(let i=0;i<4;i++)r.render();
   const ms=[];
   for(let i=0;i<16;i++){const t=performance.now();r.render();ms.push(performance.now()-t)}
   ms.sort((a,b)=>a-b);result.push({old,samples:ms.length,medianMs:ms[8],p95Ms:ms[15]});
  }
  globalThis.__underwaterBefore=false;
  return result;
 });
 assert.equal(await snapshot(),saved);
 await page.keyboard.press('p');
 await page.keyboard.press('PageUp');
 await page.waitForFunction(()=>window.__GENVO8__.sim.player().diveDepth===0,null,{timeout:20000});
 await page.keyboard.press('p');
 await page.waitForFunction(()=>window.__GENVO8__.sim.paused);
 const surfacedImage=await page.evaluate(()=>{window.__GENVO8__.renderer.render();return window.__GENVO8__.renderer.canvas.toDataURL('image/png')});
 fs.writeFileSync(path.join(output,'surfaced.png'),Buffer.from(surfacedImage.split(',')[1],'base64'));
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({status:'PASS',start,reading,timings,stateExact:true,errors,creatorAcceptance:false,scope:'Public founder import and public dive/deepen/surface controls; actor position explicitly staged in actual generated water. Matched paused native game-canvas capture (DOM pause menu excluded), no natural wildlife claim. Timings are local CPU observations, not full performance acceptance.'},null,2));
 console.log('Underwater native PASS: public dive/deepen/surface, matched before/current, full graph exact, no browser errors.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
