// UI-free cover plates read from the game's own canvas: the shipped Day-100 valley,
// created through New World, AUTO at 1x, the player's zoom setting 3, rendered at
// 2x pixel density. Nothing in the world is created, edited or moved; the page UI
// is only hidden for the plate. Usage: node cover-plates.mjs EXTRACTED OUT
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 const f=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;if(!fs.existsSync(f)){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw.chromium.launch({headless:true});const meta=[];
try{const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
 await page.addInitScript(()=>{try{localStorage.setItem('genvo.viewMode','comfort');localStorage.setItem('genvo.cameraZoom','3')}catch{}});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldName').fill('Cover plate');
 await page.locator('#newWorldCreature').selectOption('recorded');await page.waitForTimeout(400);
 await page.locator('#newWorldStartingPoint').selectOption('catalog:mature-valley-d100');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__?.sim,{},{timeout:120000});
 await page.evaluate(()=>{const g=window.__GENVO8__;if(g.tutorial.stage!=='done')g.tutorial.begin(true);g.sim.setPlayerAutonomy(true)});
 for(let k=0;k<14;k++){await page.waitForTimeout(5000);
  const lab=page.locator('#creatureEditor:not([hidden]) [data-act="cancel"]');if(await lab.count())await lab.click();
  const data=await page.evaluate(()=>{const c=[...document.querySelectorAll('canvas')].sort((a,b)=>b.width*b.height-a.width*a.height)[0];return{url:c.toDataURL('image/png'),w:c.width,h:c.height,day:window.__GENVO8__.sim.day}});
  const file=`plate-${String(k).padStart(2,'0')}.png`;fs.writeFileSync(path.join(out,file),Buffer.from(data.url.split(',')[1],'base64'));meta.push({file,w:data.w,h:data.h,day:data.day})}}
finally{fs.writeFileSync(path.join(out,'plates.json'),JSON.stringify(meta,null,1));await browser.close();server.close()}
console.log(meta.length,'plates');
