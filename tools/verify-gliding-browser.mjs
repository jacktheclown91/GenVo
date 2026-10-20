// Automated Chromium input, explicitly not human playtesting. Legal imported
// sandbox founder; only position/facing are staged on generated terrain.
// --jump exercises the shared ballistic movement path instead of gliding.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FounderDesign} from '../src/lineage/founder-design.js';
import {place} from '../src/lineage/evolution-draft.js';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const output=path.resolve(process.argv[2]||'docs/test-runs/gliding-browser'),root=path.resolve(process.argv[3]||'.');fs.mkdirSync(output,{recursive:true});
const jumpMode=process.argv.includes('--jump'),adoptMode=process.argv.includes('--adopt'),mode=jumpMode?'jump':'glide';
const design=new FounderDesign('sandbox');
for(const socket of jumpMode?['limb.3','limb.5']:['limb.1','limb.7'])assert.ok(place(design.draft,jumpMode?'spring-leg':'climber-leg','root',socket).ok);
if(!jumpMode)for(const side of ['left','right'])assert.ok(place(design.draft,'patagium','root','flank.'+side).ok);
if(adoptMode){
 for(const socket of jumpMode?['limb.1','limb.7']:['limb.3','limb.5'])assert.ok(place(design.draft,jumpMode?'climber-leg':'spring-leg','root',socket).ok);
 if(jumpMode)for(const side of ['left','right'])assert.ok(place(design.draft,'patagium','root','flank.'+side).ok);
}
const finished=design.finish();assert.ok(finished.ok);
const designFile=path.join(output,'gliding-founder.json');fs.writeFileSync(designFile,JSON.stringify({format:'genvo.authored-creature/1',design:finished.record}));
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw.chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
 await page.locator('#newWorldSeed').fill(jumpMode?'JUMP-BROWSER':'GLIDE-BROWSER');await page.locator('#newWorldName').fill(mode+' shared physics review');await page.locator('#newWorldCreature').selectOption('sandbox');
 if(adoptMode){
  await page.waitForFunction(()=>Array.from(document.querySelector('#newWorldStartingPoint').options).some(o=>o.value==='catalog:established-valley-d30'));
  await page.locator('#newWorldStartingPoint').selectOption('catalog:established-valley-d30');
  assert.equal(await page.locator('#newWorldMovementRules').inputValue(),'recorded');
  await page.locator('#newWorldMovementRules').selectOption('current');await page.screenshot({path:path.join(output,'movement-continuation-menu.png')});
 }
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 const editor=page.locator('#founderEditor');await editor.waitFor({state:'visible',timeout:60000});
 const chooser=page.waitForEvent('filechooser');await editor.locator('[data-act="import-design"]').click();await(await chooser).setFiles(designFile);
 await page.waitForFunction(()=>document.querySelector('#founderEditor .ed-message')?.textContent.includes('design restored'));
 await page.screenshot({path:path.join(output,'membrane-founder-editor.png')});
 await editor.locator('[data-act="commit"]').click();await editor.locator('[data-act="commit"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.creatureStart?.mode==='sandbox',{}, {timeout:60000});
 let adoption=null;
 if(adoptMode){
  adoption=await page.evaluate(async()=>{
   const g=window.__GENVO8__,m=g.saveManager,worlds=await m.listWorlds(),backupMeta=worlds.find(w=>w.role==='movement-backup'),backup=await m.loadSnapshot(backupMeta.key);
   return{slots:worlds.length,active:m.activeSlotId,backupSlot:backupMeta.key,backupFor:backupMeta.backupFor,sourceTick:backup.core.tickCount,sourceDay:backup.core.day,sourceSeed:backup.seed,sourceRng:backup.rngState,sourceAnimals:backup.animals.filter(a=>a.alive).length,sourceJumping:backup.core.jumpingRules??null,sourceGliding:backup.core.glidingRules??null,sourceIntroductions:backup.core.authoredIntroductions?.length??0,record:g.sim.movementRuleMigrations.at(-1),jumping:g.sim.jumpingRules,gliding:g.sim.glidingRules,glidingStatus:g.sim.glidingStatus()};
  });
  assert.equal(adoption.slots,2);assert.equal(adoption.sourceTick,1440);assert.equal(adoption.sourceDay,31);assert.equal(adoption.sourceAnimals,215);assert.equal(adoption.sourceIntroductions,0);assert.equal(adoption.sourceJumping,null);assert.equal(adoption.sourceGliding,null);assert.equal(adoption.record.backupSlot,adoption.backupSlot);assert.equal(adoption.active,adoption.backupFor);
 }
 const ridge=await page.evaluate(({jumpMode,adoptMode})=>{
  const g=window.__GENVO8__,s=g.sim,w=s.world,p=s.player();let best=null;
  for(let y=8;y<w.n-8;y++)for(let x=8;x<w.n-8;x++){
   if(jumpMode){
    if(x>w.n-14||Array.from({length:7},(_,k)=>w.water[w.idx(x+k,y)]).some(Boolean))continue;
    const heights=Array.from({length:7},(_,k)=>w.terrain.elevation[w.idx(x+k,y)]),range=Math.max(...heights)-Math.min(...heights);
    let vegetation=0;for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+8;xx++)vegetation+=(w.plants.woodspire[w.idx(xx,yy)]||0)*3+(w.plants.bramble[w.idx(xx,yy)]||0);
    const score=range*10+vegetation;
    if(range<.025&&(!best||score<best.score))best={x:x+.5,y:y+.5,range,vegetation,score};
    continue;
   }
   const i=w.idx(x,y);if(w.water[i])continue;
   for(const dir of adoptMode?[0,1,2,3,4,5,6,7]:[2]){
    const angle=(dir-2)*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle),j=w.idx(x+.5+dx,y+.5+dy);if(!adoptMode&&w.water[j])continue;
    const drop=(w.terrain.elevation[i]-(w.water[j]?0:w.terrain.elevation[j]))*20;
    if(drop>.65&&(!best||drop>best.drop))best={x:x+.5+dx*.4,y:y+.5+dy*.4,dir,dx,dy,drop,waterBelow:!!w.water[j],from:w.terrain.elevation[i],to:w.water[j]?0:w.terrain.elevation[j]};
   }
  }
  if(!best)throw Error('No suitable generated terrain for aerial review.');
  p.x=best.x;p.y=best.y;p.dir=best.dir??2;p.target=null;g.renderer.sceneReady();g.renderer.zoom=4;
  const play=g.audio.playCue.bind(g.audio);window.__aerialCues=[];g.audio.playCue=(name,data)=>{window.__aerialCues.push(name);return play(name,data)};
  return{...best,energy:p.energy,breath:p.exertion??100,body:p.bodyPlan.id,policy:jumpMode?s.jumpingRules:s.glidingRules,age:p.age};
 },{jumpMode,adoptMode});
 const progressed=(to,from)=>(to.x-from.x)*(ridge.dx??1)+(to.y-from.y)*(ridge.dy??0);
 const glide=page.locator('[data-command="'+mode+'"]');await glide.waitFor({state:'visible'});
 await page.waitForFunction(mode=>!document.querySelector('[data-command="'+mode+'"]').disabled,mode);
 await glide.click();await page.waitForFunction(mode=>window.__GENVO8__.sim.player()?.aerialMode===mode,mode);
 const flight=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;return{x:p.x,y:p.y,z:p.jump?.altitude??p.glideAltitude,elapsed:p.jump?.elapsed??null,energy:p.energy,breath:p.exertion,airborne:p.airborne,mode:p.aerialMode,health:p.health,cues:window.__aerialCues.slice()}});
 assert.ok(progressed(flight,ridge)>0&&flight.energy<ridge.energy,'real button launches and unsteered motion spends food');
 await page.screenshot({path:path.join(output,'ridge-glide.png')});
 await page.evaluate(async()=>window.__GENVO8__.saveManager.saveNow('gliding-browser-midair'));
 const saved=await page.evaluate(async()=>{const g=window.__GENVO8__,snapshot=await g.saveManager.loadSnapshot(),p=snapshot.animals.find(a=>a.id===snapshot.core.playerId);return{playerId:p.id,z:p.jump?.altitude??p.glideAltitude,elapsed:p.jump?.elapsed??null,x:p.x,y:p.y,mode:p.aerialMode,policy:p.jump?snapshot.core.jumpingRules:snapshot.core.glidingRules}});
 assert.equal(saved.mode,mode);assert.equal(saved.z,flight.z);
 await page.reload();await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);await page.locator('[data-action="continue"]').click();
 await page.waitForFunction(mode=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.player()?.aerialMode===mode,mode, {timeout:60000});
 const reload=await page.evaluate(()=>{const g=window.__GENVO8__;g.sim.paused=true;const p=g.sim.player();return{id:p.id,z:p.jump?.altitude??p.glideAltitude,elapsed:p.jump?.elapsed??null,x:p.x,y:p.y,heading:p.glideHeading??null,mode:p.aerialMode,policy:p.jump?g.sim.jumpingRules:g.sim.glidingRules,art:g.nativeArtStatus}});
 assert.equal(reload.id,saved.playerId);assert.ok((jumpMode?reload.elapsed>=saved.elapsed:reload.z<=saved.z)&&progressed(reload,saved)>=-1e-8);assert.equal(reload.policy,saved.policy);
 await page.evaluate(async()=>{const g=window.__GENVO8__,play=g.audio.playCue.bind(g.audio);window.__aerialCues=[];g.audio.playCue=(name,data)=>{window.__aerialCues.push(name);return play(name,data)};g.renderer.zoom=4;await g.renderer.sceneReady();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
 await page.screenshot({path:path.join(output,'restored-glide.png')});
 await page.evaluate(()=>{window.__GENVO8__.sim.paused=false});await page.keyboard.down('ArrowDown');
 await page.waitForFunction(({jumpMode,elapsed,heading})=>{const p=window.__GENVO8__.sim.player();return jumpMode?(!p.airborne||p.jump.elapsed>elapsed+.03):Math.abs(Math.atan2(Math.sin(p.glideHeading-heading),Math.cos(p.glideHeading-heading)))>.05},{jumpMode,elapsed:reload.elapsed,heading:reload.heading});
 await page.keyboard.up('ArrowDown');
 const steered=await page.evaluate(()=>{const p=window.__GENVO8__.sim.player();return{heading:p.glideHeading??null,jump:p.jump??null,energy:p.energy}});
 if(jumpMode&&steered.jump)assert.equal(steered.jump.vy,0,'arrow input cannot redirect the committed ballistic arc');
 await page.waitForFunction(()=>!window.__GENVO8__.sim.player()?.airborne,{}, {timeout:15000});
 const landed=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;return{x:p.x,y:p.y,health:p.health,energy:p.energy,mode:p.aerialMode??null,water:!!g.sim.world.water[g.sim.world.idx(p.x,p.y)],incident:p.lastJumpIncident??p.lastFlightIncident,cues:window.__aerialCues??[],audioState:g.audio.ctx?.state??null}});
 assert.equal(landed.mode,null);assert.ok(jumpMode?landed.energy<=flight.energy:landed.energy<flight.energy);
 if(jumpMode){assert.ok(flight.breath<ridge.breath,'launch spends actual breath');assert.ok(flight.cues.includes('jump'));assert.ok(landed.cues.some(c=>['land','splash','damage'].includes(c)));assert.equal(landed.audioState,'running');}
 else{assert.ok(landed.cues.some(c=>['land','splash','damage'].includes(c)),'automatic glide landing reaches the live audio graph');assert.equal(landed.audioState,'running');}
 await page.screenshot({path:path.join(output,'landed-glide.png')});
 let keyboard=null;
 if(jumpMode){
  await page.evaluate(()=>{window.__GENVO8__.sim.paused=false;document.activeElement?.blur()});
  await page.waitForFunction(()=>window.__GENVO8__.sim.jumpStatus().enabled);
  await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__GENVO8__.sim.player()?.aerialMode==='jump');
  keyboard=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();g.sim.paused=true;return{mode:p.aerialMode,energy:p.energy,breath:p.exertion,elapsed:p.jump.elapsed}});
  assert.ok(keyboard.energy<landed.energy,'keyboard launch also pays food energy');
 }
 if(adoptMode){
  await page.keyboard.press('Escape');await page.locator('.menu-view[data-screen="pause"] [data-screen-target="worlds"]').click();
  await page.locator('[data-action="fork-backup"]').waitFor({state:'visible'});await page.locator('[data-action="fork-backup"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'read-only-backup-worlds.png')});
  await page.locator('[data-action="fork-backup"]').click();
  await page.waitForFunction(slot=>document.querySelector('#newWorldStartingPoint')?.value==='fork:'+slot,adoption.backupSlot);
  assert.equal(await page.locator('#newWorldStartingPoint').inputValue(),'fork:'+adoption.backupSlot);
  assert.equal(await page.locator('#newWorldMovementRules').inputValue(),'recorded');
  await page.screenshot({path:path.join(output,'recover-backup-menu.png')});
  adoption.readOnly=await page.evaluate(async slot=>{const m=window.__GENVO8__.saveManager,id=m.activeSlotId;let save=false,load=false;try{m.setActiveSlot(slot);try{await m.saveNow('forbidden-browser-write')}catch{save=true}try{await m.load(slot)}catch{load=true}}finally{m.setActiveSlot(id)}const b=await m.loadSnapshot(slot);return{saveRejected:save,loadRejected:load,tick:b.core.tickCount,jumping:b.core.jumpingRules??null,gliding:b.core.glidingRules??null}},adoption.backupSlot);
  assert.ok(adoption.readOnly.saveRejected&&adoption.readOnly.loadRejected);assert.equal(adoption.readOnly.tick,1440);assert.equal(adoption.readOnly.jumping,null);assert.equal(adoption.readOnly.gliding,null);
  adoption.failedTransaction=await page.evaluate(async()=>{
   const {Simulation}=await import('/src/sim/simulation.js'),{createSimulationSnapshot,restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js');
   const m=window.__GENVO8__.saveManager,original=m.db.bind(m),native=await original(),active=m.activeSlotId,before=(await m.listWorlds()).length;
   const source=new Simulation('NATIVE-FAILED-MIGRATION');delete source.glidingRules;delete source.jumpingRules;
   const raw=structuredClone(createSimulationSnapshot(source)),candidate=restoreSimulationSnapshot(structuredClone(raw));let rejected=false;
   m.db=async()=>({transaction(...args){const tx=native.transaction(...args);let adds=0;return{
    get error(){return tx.error},set oncomplete(f){tx.oncomplete=f},set onabort(f){tx.onabort=f},set onerror(f){tx.onerror=f},abort(){tx.abort()},
    objectStore(key){const store=tx.objectStore(key);return{add(v,id){if(++adds===4)throw Error('Injected native backup serialization failure');return store.add(v,id)}}}
   }}});
   try{await m.storeMovementContinuation(candidate,raw,{name:'Must not exist',source:'native failure fixture'})}catch(error){rejected=error.message.includes('Injected native')}finally{m.db=original}
   return{rejected,before,after:(await m.listWorlds()).length,activeUnchanged:m.activeSlotId===active,rolledBack:candidate.glidingRules===undefined&&candidate.jumpingRules===undefined&&candidate.movementRuleMigrations===undefined};
  });
  assert.ok(adoption.failedTransaction.rejected&&adoption.failedTransaction.activeUnchanged&&adoption.failedTransaction.rolledBack);assert.equal(adoption.failedTransaction.before,adoption.failedTransaction.after);
  await page.locator('#newWorldName').fill('Recovered original movement');
  await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
  await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__.sim.jumpingRules===undefined,{}, {timeout:120000});
  await page.waitForFunction(async()=>{const m=window.__GENVO8__.saveManager;return(await m.listWorlds()).length===3&&!!(await m.loadSnapshot())}, {}, {timeout:120000});
  adoption.recovery=await page.evaluate(async slot=>{const g=window.__GENVO8__,s=g.sim,m=g.saveManager;s.paused=true;await g.renderer.sceneReady();const b=await m.loadSnapshot(slot);return{active:m.activeSlotId,slots:(await m.listWorlds()).length,day:s.day,tick:s.tickCount,jumping:s.jumpingRules??null,gliding:s.glidingRules??null,recordedPlayer:s.playerId===b.core.playerId,backupTick:b.core.tickCount}},adoption.backupSlot);
  assert.equal(adoption.recovery.slots,3);assert.equal(adoption.recovery.backupTick,1440);assert.equal(adoption.recovery.day,31);assert.ok(adoption.recovery.recordedPlayer);assert.equal(adoption.recovery.jumping,null);assert.equal(adoption.recovery.gliding,null);
  await page.screenshot({path:path.join(output,'recovered-original-world.png')});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({kind:'automated Chromium input; authored sandbox anatomy; staged position/facing on unmodified generated terrain; not human or naturally evolved evidence',mode,adoption,ridge,flight,saved,reload,steered,landed,keyboard,errors},null,2));
 console.log(mode+' Chromium PASS: native imported founder, generated terrain, mouse launch, shared aerial motion to landing, charged resources, IndexedDB midair save and Continue reload.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
