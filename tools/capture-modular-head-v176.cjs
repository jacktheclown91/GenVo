let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900},recordVideo:{dir:path.join(root,'docs/runtime-v176-video'),size:{width:1440,height:900}}});
 activeBrowser=browser;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.sim);
 console.log(await page.locator('button:visible').allTextContents());
 await page.screenshot({path:path.join(root,'docs/runtime-v176-menu.png')});
 const buttons=page.getByRole('button',{name:/new world/i});if(await buttons.count())await buttons.first().click();
 await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForTimeout(1500);
 await page.screenshot({path:path.join(root,'docs/runtime-v176-legacy-compatibility.png')});
 const stage=await page.evaluate(async()=>{
  const {attachHeadPlan}=await import('/src/lineage/head-plan.js'),g=window.__GENVO8__;let converted=0;
  for(const animal of g.sim.animals)if(animal.alive&&animal.bodyPlan){animal.bodyPlan=attachHeadPlan(animal.bodyPlan);animal.genVersion=(animal.genVersion||0)+1;converted++}
  g.renderer.motion.clear();return {controlledReviewFixture:true,converted};
 });console.log('Head review stage',stage);

 await page.keyboard.down('d');await page.waitForTimeout(1800);await page.keyboard.up('d');
 await page.screenshot({path:path.join(root,'docs/runtime-v176-gameplay.png')});
 console.log(await page.evaluate(async()=>{
  const {nativeArtStatus}=await import('/src/render/runtime-part-art.js');
  const g=window.__GENVO8__;return {art:nativeArtStatus(),alive:g.sim.animals.filter(a=>a.alive).length,player:g.sim.player().bodyPlan};
 }));
 await page.evaluate(async()=>{
  const g=window.__GENVO8__,{drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{phenotypeFor}=await import('/src/organisms/species.js');
  const cv=document.createElement('canvas');cv.width=1440;cv.height=640;cv.id='artMotionReview';cv.style='position:fixed;inset:100px 0;z-index:10000;background:#29453f';document.body.append(cv);
  const ctx=cv.getContext('2d'),animals=[...new Map(g.sim.animals.filter(a=>a.alive&&a.bodyPlan).map(a=>[a.bodyPlan.id,a])).values()].slice(0,8);window.__artReviewAnimals=animals.map(a=>a.id);
  const draw=now=>{ctx.fillStyle='#29453f';ctx.fillRect(0,0,1440,640);for(let i=0;i<animals.length;i++){
   const a=animals[i],x=180+(i%4)*360,y=160+Math.floor(i/4)*300;ctx.save();ctx.translate(x,y);
   drawGenvoSprite(ctx,{animal:a,phenotype:phenotypeFor(a),scale:7,frame:now/110%8,moving:true,palette:{body:'#699a81',shade:'#34554e',light:'#a4c7a5'},pose:{dir:3,action:'walk',life:{blink:now%2600>2460}}});ctx.restore();ctx.fillStyle='#edf1db';ctx.font='16px sans-serif';ctx.fillText('body '+a.bodyPlan.id+' / '+a.id,x-90,y+105);
  }window.__artReviewRAF=requestAnimationFrame(draw)};draw(performance.now());
 });
 await page.waitForTimeout(800);await page.screenshot({path:path.join(root,'docs/runtime-v176-moving-creatures.png')});
 await page.waitForTimeout(160);await page.screenshot({path:path.join(root,'docs/runtime-v176-moving-creatures-next.png')});
 await page.waitForTimeout(3000);
 await page.evaluate(()=>{cancelAnimationFrame(window.__artReviewRAF);document.getElementById('artMotionReview').remove()});
 await page.evaluate(()=>{window.__GENVO8__.renderer.zoom=4});
 await page.keyboard.down('d');await page.waitForTimeout(900);await page.keyboard.up('d');
 await page.screenshot({path:path.join(root,'docs/runtime-v176-gameplay-close.png')});
 const proof=await page.evaluate(async()=>{
 const g=window.__GENVO8__,{drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{phenotypeFor}=await import('/src/organisms/species.js'),{creaturePalette}=await import('/src/render/creature-palette.js');
 const a=g.sim.player(),ph=phenotypeFor(a),cv=document.createElement('canvas');cv.width=160;cv.height=160;const ctx=cv.getContext('2d');
 const paint=species=>{ctx.clearRect(0,0,160,160);ctx.save();ctx.translate(80,80);drawGenvoSprite(ctx,{animal:{...a,species},phenotype:ph,scale:5,frame:2.5,moving:true,palette:creaturePalette(ph),pose:{dir:3,life:{blink:false}}});ctx.restore();return ctx.getImageData(0,0,160,160).data};
 const A=paint(a.species),B=paint('new-emergent-lineage');let mismatch=0,opaque=0;for(let i=0;i<A.length;i++){if(A[i]!==B[i])mismatch++;if(i%4===3&&A[i])opaque++}
 if(mismatch||!opaque)throw Error('Native identity invariance failed');
 g.fieldGuide.setOpen(true);
 return {nativeIdentityInvariance:{mismatch,opaque},mountedHead:a.bodyPlan.nodes.find(n=>n.socket==='head'),facialParents:a.bodyPlan.nodes.filter(n=>n.socket==='mouth'||n.socket?.startsWith('eye')).map(n=>n.parent),observedBodies:g.sim.discovery.observedBodies?.length||0,guidePortraits:g.fieldGuide.creatures(g.sim.discovery).length};
 });
 await page.screenshot({path:path.join(root,'docs/runtime-v176-observed-field-guide.png')});
 fs.writeFileSync(path.join(root,'docs/runtime-v176-proof.json'),JSON.stringify(proof,null,2));
 fs.writeFileSync(path.join(root,'docs/runtime-v176-errors.json'),JSON.stringify(errors));
 await page.goto('https://genvo.review/tools/creature-lab/index.html');
 await page.waitForSelector('#attachmentSocket option',{state:'attached'});
 await page.selectOption('#attachmentSocket',JSON.stringify(['root','head']));
 await page.selectOption('#attachmentPart','head-base');await page.click('#attach');
 const attached=await page.locator('#assemblyNodes').innerText();if(!attached.includes('root/head'))throw Error('Lab head attachment failed');
 await page.fill('#search','head-base');await page.locator('#library button').first().click();
 await page.selectOption('#sourceFacing','2');
 await page.click('#previewAsset');
 await page.waitForTimeout(600);
 const labProof={nodes:await page.locator('#assemblyNodes').innerText(),status:await page.locator('#assemblyStatus').innerText(),art:await page.locator('#artReview').innerText()};
 await page.screenshot({path:path.join(root,'docs/runtime-v176-head-lab.png'),fullPage:true});
 await page.locator('#creaturePreview').screenshot({path:path.join(root,'docs/runtime-v176-head-lab-assembly.png')});
 fs.writeFileSync(path.join(root,'docs/runtime-v176-head-lab-proof.json'),JSON.stringify(labProof,null,2));
 fs.writeFileSync(path.join(root,'docs/runtime-v176-errors.json'),JSON.stringify(errors));
 const video=page.video();await browser.close();fs.copyFileSync(await video.path(),path.join(root,'docs/runtime-v176-motion-review.webm'));
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});



