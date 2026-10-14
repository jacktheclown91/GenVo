let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900},recordVideo:{dir:path.join(root,'docs/runtime-v176-video'),size:{width:1440,height:900}}});
 activeBrowser=browser;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav'})[ext]||'application/octet-stream'});});
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
 await page.uncheck('#showAssemblyGuides');await page.locator('#creaturePreview').screenshot({path:path.join(root,'docs/runtime-v176-head-lab-assembly.png')});
 fs.writeFileSync(path.join(root,'docs/runtime-v176-head-lab-proof.json'),JSON.stringify(labProof,null,2));
 fs.writeFileSync(path.join(root,'docs/runtime-v176-errors.json'),JSON.stringify(errors));
 const video=page.video();await browser.close();fs.copyFileSync(await video.path(),path.join(root,'docs/runtime-v176-lab-motion-review.webm'));
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});



