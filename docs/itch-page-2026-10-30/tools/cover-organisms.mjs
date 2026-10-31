// Real organisms from the shipped Day-100 valley, drawn by the game's own portrait
// renderer (src/render/lineage-portrait.js) onto a transparent canvas, with the body
// at a whole-number pixel scale. Nothing is edited. Usage: node cover-organisms.mjs EXTRACTED OUT
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://l').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 const f=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;if(!fs.existsSync(f)){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw.chromium.launch({headless:true});let meta=[];
try{const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
 await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldName').fill('Cover organisms');
 await page.locator('#newWorldCreature').selectOption('recorded');await page.waitForTimeout(400);
 await page.locator('#newWorldStartingPoint').selectOption('catalog:mature-valley-d100');
 await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
 await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&window.__GENVO8__?.sim,{},{timeout:120000});
 meta=await page.evaluate(async()=>{
  const {drawLineagePortrait,lineagePortraitBounds}=await import('/src/render/lineage-portrait.js');
  const {adultSizeScale}=await import('/src/render/genvo-draw.js').catch(()=>({}));
  const s=window.__GENVO8__.sim,p=s.player(),rows=[];
  const near=s.animals.filter(a=>a.alive&&a.genes&&a.bodyPlan&&Math.hypot(a.x-p.x,a.y-p.y)<16).sort((a,b)=>(b.bodyPlan.nodes.length-a.bodyPlan.nodes.length));
  for(const a of near.slice(0,24)){
   const opts={pigmentGenome:a.pigmentGenome||null,frame:2,dir:2,bodyPlan:a.bodyPlan,adaptations:a.adaptations||[],bodySize:a.bodySize??null};
   const cv=document.createElement('canvas');cv.width=520;cv.height=520;drawLineagePortrait(cv,a.genes,{...opts,fitScale:8});
   rows.push({id:a.id,species:a.species,parts:[...new Set(a.bodyPlan.nodes.map(n=>n.partId))],generation:a.generation??null,age:+a.age.toFixed(1),url:cv.toDataURL('image/png')})}
  return rows});
 for(const r of meta){fs.writeFileSync(path.join(out,`${r.species}-${r.id}.png`),Buffer.from(r.url.split(',')[1],'base64'));delete r.url}}
finally{fs.writeFileSync(path.join(out,'organisms.json'),JSON.stringify(meta,null,1));await browser.close();server.close()}
console.log(meta.length,'organisms');
