// Real controls; authored primitive founder and generated caves. Only the actor's
// initial position is staged, to inspect an existing connected entrance.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../../src/lineage/founder-design.js';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'docs/test-runs/natural-caves-browser'),root=path.resolve(process.argv[3]||'..');fs.mkdirSync(output,{recursive:true});
const design=new FounderDesign('sandbox'),finished=design.finish();assert.ok(finished.ok);const founder=path.join(output,'cave-founder.json');fs.writeFileSync(founder,JSON.stringify({format:'genvo.authored-creature/1',design:finished.record}));
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 if(await page.locator('#newWorldAdvanced').getAttribute('open')===null)await page.locator('#newWorldAdvanced summary').click();
 await page.locator('#newWorldSeed').fill('CAVES-GEOLOGY');await page.locator('#newWorldName').fill('Natural cave review');await page.locator('#newWorldCreature').selectOption('sandbox');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 const editor=page.locator('#founderEditor');await editor.waitFor({state:'visible',timeout:60000});const chooser=page.waitForEvent('filechooser');await editor.locator('[data-act="import-design"]').click();await(await chooser).setFiles(founder);
 await page.waitForFunction(()=>document.querySelector('#founderEditor .ed-message')?.textContent.includes('design restored'));
 await editor.locator('[data-act="commit"]').click();await editor.locator('[data-act="commit"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.creatureStart?.mode==='sandbox',{}, {timeout:60000});
 await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 for(let k=0;k<8;k++){if(!await page.evaluate(()=>{const t=window.__GENVO8__.tutorial;return t.worldInputBlocked()&&['welcome','briefing'].includes(t.stage)}))break;await page.keyboard.press('Enter')}
 const start=await page.evaluate(async()=>{
  const {solidTerrainTotal}=await import('/src/world/subsurface.js'),{burrowingAnatomy}=await import('/src/lineage/burrowing.js');const g=window.__GENVO8__,s=g.sim,w=s.world,p=s.player();let site;
  for(const entrance of w.subsurface.passages.values())if(entrance.entry&&!entrance.closed){const i=entrance.i,x=i%w.n,y=i/w.n|0;if(x<20||x>w.n-20||y<20||y>w.n-20)continue;for(const [dx,dy,key,back] of [[0,-1,'ArrowUp','ArrowDown'],[1,0,'ArrowRight','ArrowLeft'],[0,1,'ArrowDown','ArrowUp'],[-1,0,'ArrowLeft','ArrowRight']]){const next=w.subsurface.passages.get(i+dy*w.n+dx);if(next&&!next.closed&&!next.entry&&Math.abs(next.floor-entrance.floor)<=.6){site={i,x:x+.5,y:y+.5,next:next.i,key,back};break}}if(site)break}
  if(!site)throw Error('No generated connected cave opening');p.x=site.x;p.y=site.y;p.target=null;s.paused=true;g.renderer.zoom=3;window.__caveSite=site;
  return{...site,total:solidTerrainTotal(w),energy:p.energy,policy:s.caveRules,initialCaves:w.subsurface.initialCaves,canDig:burrowingAnatomy(p)};
 });assert.equal(start.canDig,false);
 await page.screenshot({path:path.join(output,'surface-opening.png')});
 const interact=page.locator('[data-command="interact"]');await page.evaluate(()=>window.__GENVO8__.sim.paused=false);
 await page.waitForFunction(()=>window.__GENVO8__.contextTray.directChoice()?.id==='cave'&&!document.querySelector('[data-command="interact"]').disabled);await interact.click();
 await page.waitForFunction(()=>window.__GENVO8__.sim.player().caveTransit?.elapsed>=.2);const descent=await page.evaluate(()=>{const s=window.__GENVO8__.sim;s.paused=true;return structuredClone(s.player().caveTransit)});
 await page.screenshot({path:path.join(output,'descending.png')});for(const [width,height] of [[1024,768],[568,320],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);await page.screenshot({path:path.join(output,'descent-'+width+'x'+height+'.png')});if(process.argv.includes('--readout')){const layout=await page.evaluate(async()=>{const r=window.__GENVO8__.renderer,{readoutScreenConstraints}=await import('/src/render/readout-layout.js'),{overlapArea}=await import('/src/ui/overlay-placement.js'),box=r.readoutRects.at(-1),c=readoutScreenConstraints(r);return{box,body:c.protectedRects.reduce((n,b)=>n+overlapArea(box,b),0),ui:c.obstacles.filter(b=>b!==box).reduce((n,b)=>n+overlapArea(box,b),0)}});assert.equal(layout.body,0);assert.equal(layout.ui,0);fs.writeFileSync(path.join(output,'layout-'+width+'.json'),JSON.stringify(layout,null,2))}}await page.setViewportSize({width:1250,height:850});await page.evaluate(async()=>window.__GENVO8__.saveManager.saveNow('cave-mid-descent'));
 const stored=await page.evaluate(async()=>{const g=window.__GENVO8__,snapshot=await g.saveManager.loadSnapshot();return snapshot.animals.find(a=>a.id===g.sim.playerId).caveTransit});assert.deepEqual(stored,descent);
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.evaluate(()=>{const manager=window.__GENVO8__.saveManager,load=manager.load.bind(manager);manager.load=async(...args)=>{const sim=await load(...args);window.__loadedCave=structuredClone(sim.player().caveTransit);return sim}});
 await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden);await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
 const restored=await page.evaluate(()=>{window.__GENVO8__.sim.paused=true;window.__GENVO8__.renderer.zoom=3;return window.__loadedCave});assert.deepEqual(restored,descent);
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=false;document.activeElement?.blur()});await page.waitForFunction(()=>window.__GENVO8__.sim.player().underground&&!window.__GENVO8__.sim.player().caveTransit);
 await page.keyboard.down(start.key);await page.waitForFunction(i=>{const s=window.__GENVO8__.sim;return s.world.idx(s.player().x,s.player().y)===i},start.next,{timeout:10000}).catch(async error=>{await page.keyboard.up(start.key);throw error});await page.keyboard.up(start.key);
 const below=await page.evaluate(()=>{const s=window.__GENVO8__.sim;s.paused=true;return{cell:s.world.idx(s.player().x,s.player().y),underground:s.player().underground,energy:s.player().energy,work:s.player().burrowWork}});assert.equal(below.cell,start.next);assert.equal(below.work,undefined);
 await page.screenshot({path:path.join(output,'connected-cave.png')});
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=false;document.activeElement?.blur()});await page.keyboard.down(start.back);await page.waitForFunction(i=>{const s=window.__GENVO8__.sim;return s.world.idx(s.player().x,s.player().y)===i},start.i);await page.keyboard.up(start.back);
 await page.waitForFunction(()=>window.__GENVO8__.contextTray.directChoice()?.id==='cave'&&!document.querySelector('[data-command="interact"]').disabled);await page.keyboard.press('KeyE');await page.waitForFunction(()=>!window.__GENVO8__.sim.player().underground&&!window.__GENVO8__.sim.player().caveTransit);
 const exit=await page.evaluate(async()=>{const {solidTerrainTotal}=await import('/src/world/subsurface.js'),s=window.__GENVO8__.sim;s.paused=true;return{total:solidTerrainTotal(s.world),energy:s.player().energy,underground:!!s.player().underground}});assert.ok(exit.energy<start.energy);assert.ok(Math.abs(exit.total-start.total)<1e-6);await page.screenshot({path:path.join(output,'surface-return.png')});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({kind:'automated real controls; sandbox primitive founder, generated caves; actor initial position staged only',start,descent,stored,restored,below,exit,errors},null,2));
 console.log('Natural caves Chromium PASS: non-digger mouse entry, finite descent, exact mid-transition IndexedDB save/Continue, keyboard connected traversal, entrance exit and conserved solid material.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
