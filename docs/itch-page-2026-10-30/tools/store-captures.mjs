// Store screenshot candidates from the exact extracted release. Worlds are created
// through the real New World menu; the game's own Skip ends the opening; AUTO plays
// at 1x and frames are taken over ordinary time. View mode and camera zoom are the
// player's own settings (Comfort View, zoom 2-4). Nothing in the world is created,
// edited or moved. Each frame records what was on screen.
// Usage: node store-captures.mjs EXTRACTED OUT scene...
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const [rootArg,outArg,...wanted]=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg);fs.mkdirSync(out,{recursive:true});
const SCENES={
 valley:{start:'catalog:mature-valley-d100',creature:'recorded',zoom:2,frames:14,every:7000,extras:true},
 'valley-close':{start:'catalog:mature-valley-d100',creature:'recorded',zoom:3,frames:12,every:7000},
 dive:{seed:'PLANET-OBS-2',creature:'starter-dive',zoom:3,frames:10,every:8000},
 flight:{seed:'PLANET-B0-A',creature:'starter-flight',zoom:3,frames:10,every:8000},
 burrow:{seed:'PLANET-OBS-3',creature:'starter-burrow',zoom:3,frames:10,every:8000},
 jump:{seed:'PLANET-OBS-1',creature:'starter-jump',zoom:3,frames:10,every:8000},
 lab:{seed:'PLANET-OBS-1',creature:'sandbox',zoom:3,frames:0,every:0,lab:true},
 'valley-detail':{start:'catalog:mature-valley-d100',creature:'recorded',zoom:4,frames:12,every:6000},
 'valley-night':{start:'catalog:mature-valley-d100',creature:'recorded',zoom:3,frames:24,every:3000,nightOnly:true},
 family:{seed:'PLANET-B0-A',creature:'starter-flight',zoom:4,frames:16,every:4000,untilYoung:1500000}};
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 const f=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;if(!fs.existsSync(f)){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw.chromium.launch({headless:true});const index=[],errors=[];
const describe=page=>page.evaluate(async()=>{const {timeOfDay}=await import('/src/ecology/diurnal-temperature.js');const g=window.__GENVO8__,s=g.sim,p=s.player(),near=s.animals.filter(a=>a.alive&&Math.hypot(a.x-p.x,a.y-p.y)<12);
 const visible=sel=>[...document.querySelectorAll(sel)].filter(e=>e.offsetParent&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).opacity!=='0').length;
 return{tod:+timeOfDay(s).toFixed(3),day:s.day,season:s.season,night:!!s.isNight?.(),weather:s.weather?.kind||s.climate?.weather||null,player:{species:p.species,generation:p.generation,intent:p.intent,parts:[...new Set((p.bodyPlan?.nodes||[]).map(n=>n.partId))]},
  young:s.animals.filter(a=>a.alive&&a.parentIds?.includes(p.id)).length,nearby:near.length,nearbySpecies:[...new Set(near.map(a=>a.species))],toast:visible('#toast'),
  overlays:[...document.querySelectorAll('body *')].filter(e=>e.offsetParent&&/notice|story|guide|cue|busy|toast/i.test(e.id+' '+e.className)&&e.textContent.trim().length>20).length}});
try{for(const name of wanted.length?wanted:Object.keys(SCENES)){const sc=SCENES[name];
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1.5});page.on('pageerror',e=>errors.push(name+': '+e.message));
 await page.addInitScript(([z])=>{try{localStorage.setItem('genvo.viewMode','comfort');localStorage.setItem('genvo.cameraZoom',String(z))}catch{}},[sc.zoom]);
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldName').fill('Store capture');
 await page.locator('#newWorldCreature').selectOption(sc.creature);await page.waitForTimeout(400);
 if(sc.start)await page.locator('#newWorldStartingPoint').selectOption(sc.start);else await page.evaluate(seed=>{const e=document.querySelector('#newWorldSeed');e.value=seed;e.dispatchEvent(new Event('input',{bubbles:true}))},sc.seed);
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 if(sc.lab){await page.waitForSelector('#creatureEditor:not([hidden])',{timeout:120000});await page.waitForTimeout(1500);
  for(let k=0;k<4;k++){await page.screenshot({path:path.join(out,`lab-${k}.png`)});index.push({file:`lab-${k}.png`,scene:name});
   const options=page.locator('#creatureEditor:not([hidden]) button:visible');const n=await options.count();if(n>4)await options.nth(2+k*2).click().catch(()=>{});await page.waitForTimeout(900)}
  await page.close();continue}
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__?.sim,{},{timeout:120000});
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true);g.sim.setPlayerAutonomy(true)});
 if(sc.untilYoung){const t0=Date.now();while(Date.now()-t0<sc.untilYoung){await page.waitForTimeout(5000);
  const lab=page.locator('#creatureEditor:not([hidden]) [data-act="cancel"]');if(await lab.count()){const file=`${name}-lab-wait-${Date.now()-t0}.png`;await page.waitForTimeout(800);await page.screenshot({path:path.join(out,file)});index.push({file,scene:name,lab:'opened by the game'});await lab.click()}
  if(await page.locator('#transition:not([hidden])').count())await page.keyboard.press('Enter');
  if(await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();return s.animals.some(a=>a.alive&&a.parentIds?.includes(p.id)&&Math.hypot(a.x-p.x,a.y-p.y)<6)}))break}}
 for(let f=0;f<sc.frames;f++){await page.waitForTimeout(sc.every);
  if(sc.nightOnly&&!await page.evaluate(async()=>{const {timeOfDay}=await import('/src/ecology/diurnal-temperature.js');const t=timeOfDay(window.__GENVO8__.sim);return t>.78||t<.15})){f--;if(Date.now()>(globalThis.__deadline||=Date.now()+600000))break;continue}
  const lab=page.locator('#creatureEditor:not([hidden]) [data-act="cancel"]');if(await lab.count()){await page.waitForTimeout(800);const file=`${name}-lab-${f}.png`;await page.screenshot({path:path.join(out,file)});index.push({file,scene:name,lab:'opened by the game'});await lab.click()}
  if(await page.locator('#transition:not([hidden])').count())await page.keyboard.press('Enter');
  const file=`${name}-${String(f).padStart(2,'0')}.png`;await page.screenshot({path:path.join(out,file)});index.push({file,scene:name,...await describe(page)})}
 if(sc.extras){for(const [key,label] of [['KeyY','fieldguide'],['KeyL','journal']]){await page.keyboard.press(key);await page.waitForTimeout(1200);const file=`${name}-${label}.png`;await page.screenshot({path:path.join(out,file)});index.push({file,scene:name,panel:label});await page.keyboard.press('Escape');await page.waitForTimeout(600)}}
 await page.close()}}
finally{fs.writeFileSync(path.join(out,'index.json'),JSON.stringify({index,errors},null,1));await browser.close();server.close()}
console.log(index.length,'frames',errors.length,'page errors');
