import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/verify-threat-display-browser.mjs <exported build> <evidence dir> [seed=PLANET-OBS-3] [creature=starter-jump]
// Anatomy as verbs in the exported game.
// 1. Creature Lab: whole days are advanced under AUTO until mating opens the Lab; a flare part
//    is attached through the Lab's own attach path; "What this body can do" must show
//    "+ Threat display". The Lab is then left with "Keep the old body".
// 2. Field: TEST SETUP gives the active creature a display frill and places a fed and a
//    starving needlejaw stalking it. The tray's Display button is clicked; the body must
//    spread, the fed hunter must break off and the starving one keep coming, each with a notice.
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),seed=process.argv[4]||'PLANET-OBS-3',creature=process.argv[5]||'starter-jump';
fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch();const report={seed,creature};
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldCreature').selectOption(creature);await page.locator('#newWorldSeed').fill(seed);
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:120000});
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true)});
 // 1. Creature Lab.
 report.lab=await page.evaluate(async()=>{const g=window.__GENVO8__;g.sim.setPlayerAutonomy(true);
  for(let d=0;d<60&&!g.editor.open;d++){for(let i=0;i<g.CFG.dayTicks&&!g.editor.open;i++){if(g.sim.paused)break;g.sim.update(null)}await new Promise(r=>setTimeout(r,0))}
  g.sim.setPlayerAutonomy(false);if(!g.editor.open)return{opened:false,day:g.sim.day};
  const before=[...document.querySelectorAll('#creatureEditor .ed-verb')].map(v=>v.textContent);
  let used=null;for(const id of ['display-frill','heat-frill','horn-crest','signal-crest','flag-tail','luminous-tail','proto-wing','display-eye']){if(g.editor.lockReason(id))continue;const a=g.editor.validFor(id)?.[0];if(!a)continue;g.editor.attach(id,a);used=id;break}
  g.editor.render();return{opened:true,day:g.sim.day,part:used,before,after:[...document.querySelectorAll('#creatureEditor .ed-verb')].map(v=>({text:v.textContent,cls:v.className}))}});
 if(report.lab.opened){await page.evaluate(()=>document.querySelector('#creatureEditor .ed-verbs')?.scrollIntoView({block:'start'}));await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'lab-verbs.png')});
  assert.ok(report.lab.part,'a flare part could be attached in the Lab');assert.ok(report.lab.after.some(v=>/Threat display/.test(v.text)&&/new/.test(v.cls)),'the Lab lists the new verb');
  await page.locator('#creatureEditor [data-act="cancel"]').click();await page.waitForTimeout(400)}
 // 2. Field display. TEST SETUP: frill on the active body and two stalking needlejaws.
 report.setup=await page.evaluate(async()=>{const g=window.__GENVO8__,s=g.sim,p=s.player(),{SPECIES}=await import('/src/organisms/species.js');s.paused=false;s.endOpeningGrace?.('browser test');
  p.bodyPlan={...p.bodyPlan,id:p.bodyPlan.id+'-test-frill',nodes:[...p.bodyPlan.nodes.filter(n=>n.socket!=='dorsal'),{id:'root/dorsal',partId:'display-frill',partVersion:1,parent:'root',socket:'dorsal'}]};
  p.exertion=g.CFG.exertion.max;p.exertionWinded=false;
  const make=(fed,dx)=>{const h=s.spawnAnimal('needlejaw');Object.assign(h,{x:p.x+dx,y:p.y,dir:dx>0?6:2,health:100,energy:SPECIES.needlejaw.maxEnergy*fed});h.genes.temperament=1;
   h.playerHunt={targetId:p.id,phase:'stalk',style:'stalk',role:'stalk',startedTick:s.tickCount,untilTick:s.tickCount+99,lastOutcome:null,aimX:null,aimY:null,stamina:g.CFG.stalkerPursuit.stamina};return h};
  const fed=make(1,3),starving=make(.05,-3);return{fedId:fed.id,starvingId:starving.id}});
 await page.waitForTimeout(400);
 const button=page.locator('[data-command="display"]');await button.waitFor({state:'visible',timeout:5000});
 report.button={visible:await button.isVisible(),disabled:await button.isDisabled(),title:await button.getAttribute('aria-description')};
 const toasts=[];await page.exposeFunction('__noteToast',t=>toasts.push(t));
 await page.evaluate(()=>{const t=window.__GENVO8__.tutorial,show=t.showToast.bind(t);t.showToast=(text,...rest)=>{window.__noteToast(text);return show(text,...rest)}});
 const at=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.renderer.screenPos?.get(g.sim.playerId),c=document.querySelector('canvas').getBoundingClientRect();return p?{x:c.left+p.x*c.width/g.renderer.w,y:c.top+p.y*c.height/g.renderer.h}:null});
 const clip=at?{x:Math.max(0,at.x-60),y:Math.max(0,at.y-60),width:120,height:120}:undefined;report.playerScreen=at;
 await page.screenshot({path:path.join(out,'player-before.png'),clip});
 await button.click();await page.waitForTimeout(450);await page.screenshot({path:path.join(out,'display-spread.png')});await page.screenshot({path:path.join(out,'player-spread.png'),clip});
 await page.waitForTimeout(1500);await page.screenshot({path:path.join(out,'display-verdicts.png')});
 report.field=await page.evaluate(({fedId,starvingId})=>{const s=window.__GENVO8__.sim,f=s.animals.find(a=>a.id===fedId),st=s.animals.find(a=>a.id===starvingId);
  return{fed:{aversion:f?.playerAversion?.reason||null,intent:f?.intent,habit:f?.displayHabit||null},starving:{hunting:st?.playerHunt?.targetId===s.player().id,intent:st?.intent},exertion:s.player().exertion}},report.setup);
 report.toasts=toasts;report.errors=errors;
 assert.equal(report.button.visible,true,'the Display button appears for a frilled body');
 assert.equal(report.field.fed.aversion,'deterred','the fed hunter breaks off');assert.equal(report.field.starving.hunting,true,'the starving hunter keeps hunting');
 assert.ok(toasts.some(t=>/backs off/.test(t))&&toasts.some(t=>/keeps coming/.test(t)),'both verdicts are told to the player');
 assert.deepEqual(errors,[]);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close()}
console.log(JSON.stringify({lab:report.lab,button:report.button,field:report.field,toasts:report.toasts},null,1));
