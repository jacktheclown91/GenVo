// Uses only a newly launched nonpersistent browser and an explicit fresh context.
// No existing browser profile, storage state, or user autosave is opened.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const out=path.resolve('docs/player-journey/current-opening');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:false,args:['--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[]}});
const page=await context.newPage(),errors=[];try{page.on('pageerror',e=>errors.push(e.message));
const cdp=await browser.newBrowserCDPSession();const gpu=(await cdp.send('SystemInfo.getInfo')).gpu;
const root=path.resolve(__dirname,'../..'),types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml'};
// Same in-process file transport as the repository's existing GPU/parity harnesses.
await context.route('https://genvo.review/**',async route=>{const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');if(!file.startsWith(root+path.sep))return route.abort();if(!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'})});
await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('GENVO8-TEST-A');await page.getByRole('button',{name:'Begin World',exact:true}).click();
await page.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus().status==='ready'&&window.__GENVO8__?.sim?.player(),null,{timeout:60000});await page.waitForTimeout(4000);
const state=await page.evaluate(()=>{const s=window.__GENVO8__.sim,p=s.player();return{day:s.day,seed:s.seed,player:{id:p.id,sex:p.sex,age:p.age,x:p.x,y:p.y,energy:p.energy,hydration:p.hydration,lastMate:p.lastMate},eligible:s.reproduction.eligibleMates().map(a=>({id:a.id,age:a.age,sex:a.sex,distance:Math.hypot(a.x-p.x,a.y-p.y),x:a.x,y:a.y})),openingGrace:s.openingGraceUntilDay}});
await page.keyboard.press('KeyM');await page.waitForTimeout(300);const details=page.locator('#mate summary').filter({hasText:'Biological details'});if(await details.count())await details.click();await page.screenshot({path:path.join(out,'ordinary-opening.png')});
const text=await page.locator('#mate').innerText();fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify({scope:'Unmodified ordinary new-world menu, canonical GENVO8-TEST-A, default geography, keyboard M and existing disclosure only. Read-only telemetry; no pause, movement, actor/condition edits, spawning or mating. UI opening inspection, not completed player progression.',state,text,errors},null,2));console.log(JSON.stringify({state,text:text.slice(0,700),errors}));
}catch(error){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,errors},null,2));throw error}finally{await context.close();await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
