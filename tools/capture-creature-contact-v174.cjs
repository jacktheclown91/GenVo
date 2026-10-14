const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900},recordVideo:{dir:path.join(root,'docs/runtime-v174-video'),size:{width:1440,height:900}}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.sim);
 console.log(await page.locator('button:visible').allTextContents());
 await page.screenshot({path:path.join(root,'docs/runtime-v174-menu.png')});
 const buttons=page.getByRole('button',{name:/new world/i});if(await buttons.count())await buttons.first().click();
 await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForTimeout(1500);
 await page.keyboard.down('d');await page.waitForTimeout(1800);await page.keyboard.up('d');
 await page.screenshot({path:path.join(root,'docs/runtime-v174-gameplay.png')});
 console.log(await page.evaluate(async()=>{
  const {nativeArtStatus}=await import('/src/render/runtime-part-art.js');
  const g=window.__GENVO8__;return {art:nativeArtStatus(),alive:g.sim.animals.filter(a=>a.alive).length,player:g.sim.player().bodyPlan};
 }));
 await page.evaluate(async()=>{
  const g=window.__GENVO8__,{drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{phenotypeFor}=await import('/src/organisms/species.js');
  const cv=document.createElement('canvas');cv.width=1440;cv.height=640;cv.id='artMotionReview';cv.style='position:fixed;inset:100px 0;z-index:10000;background:#29453f';document.body.append(cv);
  const ctx=cv.getContext('2d'),animals=[...new Map(g.sim.animals.filter(a=>a.alive&&a.bodyPlan).map(a=>[a.species,a])).values()].slice(0,8);window.__artReviewAnimals=animals.map(a=>a.id);
  const draw=now=>{ctx.fillStyle='#29453f';ctx.fillRect(0,0,1440,640);for(let i=0;i<animals.length;i++){
   const a=animals[i],x=180+(i%4)*360,y=160+Math.floor(i/4)*300;ctx.save();ctx.translate(x,y);
   drawGenvoSprite(ctx,{animal:a,phenotype:phenotypeFor(a),scale:7,frame:now/110%8,moving:true,palette:{body:'#699a81',shade:'#34554e',light:'#a4c7a5'},pose:{dir:3,action:'walk',life:{blink:now%2600>2460}}});ctx.restore();ctx.fillStyle='#edf1db';ctx.font='16px sans-serif';ctx.fillText(a.species+' / '+a.id,x-90,y+105);
  }window.__artReviewRAF=requestAnimationFrame(draw)};draw(performance.now());
 });
 await page.waitForTimeout(800);await page.screenshot({path:path.join(root,'docs/runtime-v174-moving-creatures.png')});
 await page.waitForTimeout(400);await page.screenshot({path:path.join(root,'docs/runtime-v174-moving-creatures-next.png')});
 await page.waitForTimeout(2400);
 fs.writeFileSync(path.join(root,'docs/runtime-v174-errors.json'),JSON.stringify(errors));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});

