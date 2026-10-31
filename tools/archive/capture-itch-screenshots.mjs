import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
// Usage: node tools/capture-itch-screenshots.mjs <extracted release> <output dir> [scene ...]
// Candidate store screenshots from the real game at its gameplay zoom: worlds
// are created through the menu (a new planetary world with a quick-start
// creature, or the shipped evolved Day-100 valley), the opening is skipped with
// the game's own Skip, AUTO plays at 1x, and frames are captured over time. No
// organism, trait or history is created or edited. Each frame is recorded with
// what is on screen so the strongest real scenes can be chosen. VIEW=WxH@scale
// sets the window (default 1280x720@1.5); a smaller window shows the same
// gameplay zoom over less ground. The Creature Lab is captured when it opens.
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const SCENES={
 'valley-d100':{start:'catalog:mature-valley-d100',creature:'recorded',frames:10,every:9000},
 'shore-swimmer':{seed:'PLANET-OBS-2',creature:'starter-dive',frames:8,every:9000},
 'winged-flier':{seed:'PLANET-B0-A',creature:'starter-flight',frames:8,every:9000},
 'ground-burrower':{seed:'PLANET-OBS-3',creature:'starter-burrow',frames:8,every:9000},
 'spring-jumper':{seed:'PLANET-OBS-1',creature:'starter-jump',frames:8,every:9000}};
const wanted=process.argv.slice(4).length?process.argv.slice(4):Object.keys(SCENES);
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(error,bytes)=>{if(error){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(bytes)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true});const index=[];
try{for(const name of wanted){const sc=SCENES[name];
 const [vw,vh,scale]=(process.env.VIEW||'1280x720@1.5').split(/[x@]/).map(Number),page=await browser.newPage({viewport:{width:vw,height:vh},deviceScaleFactor:scale});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldName').fill('Store capture');
 await page.locator('#newWorldCreature').selectOption(sc.creature);await page.waitForTimeout(400);
 if(sc.start)await page.locator('#newWorldStartingPoint').selectOption(sc.start);else await page.locator('#newWorldSeed').fill(sc.seed);
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:120000});
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true);g.sim.setPlayerAutonomy(true)});
 for(let f=0;f<sc.frames;f++){await page.waitForTimeout(sc.every);
  // Leave any modal the game opened (Creature Lab: keep the old body; reveal: continue).
  const lab=page.locator('#creatureEditor:not([hidden]) [data-act="cancel"]');if(await lab.count()){await page.waitForTimeout(600);await page.screenshot({path:path.join(out,`${name}-lab-${f}.png`)});await lab.click()}
  if(await page.locator('#transition:not([hidden])').count())await page.keyboard.press('Enter');
  const file=`${name}-${String(f).padStart(2,'0')}.png`;await page.screenshot({path:path.join(out,file)});
  index.push({file,scene:name,...await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player(),r=window.__GENVO8__.renderer;const near=s.animals.filter(a=>a.alive&&Math.hypot(a.x-p.x,a.y-p.y)<14);
   return{day:s.day,season:s.season,player:{species:p.species,parts:[...new Set(p.bodyPlan.nodes.map(n=>n.partId))],intent:p.intent,generation:p.generation},nearby:near.length,nearbySpecies:[...new Set(near.map(a=>a.species))],habitat:r.habitatField?.labelAt?.(p.x,p.y)||null}})})}
 await page.close()}}
finally{fs.writeFileSync(path.join(out,'index.json'),JSON.stringify(index,null,1));await browser.close();server.close()}
console.log(index.length,'frames');
