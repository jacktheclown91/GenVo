// Uses only a newly launched nonpersistent browser and an explicit fresh context.
// No existing browser profile, storage state, or user autosave is opened.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const out=path.resolve('docs/timeout-investigation/runtime');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:false,args:['--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[]}});
const page=await context.newPage(),errors=[];try{page.on('pageerror',e=>errors.push(e.message));
const cdp=await browser.newBrowserCDPSession();const gpu=(await cdp.send('SystemInfo.getInfo')).gpu;
const root=path.resolve(__dirname,'../..'),types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml'};
// Same in-process file transport as the repository's existing GPU/parity harnesses.
await context.route('https://genvo.review/**',async route=>{const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');if(!file.startsWith(root+path.sep))return route.abort();if(!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'})});
await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('CODEX-CONTINUATION-2026-10-17');await page.getByRole('button',{name:'Begin World',exact:true}).click();
await page.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus().status==='ready'&&window.__GENVO8__?.sim?.player(),null,{timeout:60000});await page.waitForTimeout(4000);
const read=()=>{const s=window.__GENVO8__.sim,p=s.player();return{day:s.day,tick:s.tickCount,paused:s.paused,alive:s.animals.filter(a=>a.alive).length,player:p&&{id:p.id,x:p.x,y:p.y,alive:p.alive},soilWater:!!s.world.soilWater,weather:!!s.weatherPattern}};
const start=await page.evaluate(read);await page.screenshot({path:path.join(out,'new-world.png')});
await page.keyboard.down('KeyD');await page.waitForTimeout(2500);await page.keyboard.up('KeyD');await page.keyboard.down('KeyS');await page.waitForTimeout(2500);await page.keyboard.up('KeyS');
const moved=await page.evaluate(read);await page.screenshot({path:path.join(out,'walking.png')});
await page.reload();await page.waitForFunction(()=>window.__GENVO8__?.contextTray);await page.locator('[data-action="continue"]').first().click();await page.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus().status==='ready'&&window.__GENVO8__?.sim?.player(),null,{timeout:60000});await page.waitForTimeout(4000);const resumed=await page.evaluate(read);await page.screenshot({path:path.join(out,'continued.png')});
fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({scope:'Isolated headed runtime smoke inspection during CPU test load; no performance acceptance claim',gpu:{devices:gpu.devices,auxAttributes:gpu.auxAttributes},start,moved,resumed,errors},null,2));console.log(JSON.stringify({start,moved,resumed,errors}));
if(errors.length||moved.tick<=start.tick||resumed.paused)process.exitCode=1;
}catch(error){await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});const state=await page.evaluate(()=>({status:window.__GENVO8__?.nativeArtStatus?.(),day:window.__GENVO8__?.sim?.day,body:document.body.innerText.slice(-3000)})).catch(()=>null);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,state,errors},null,2));throw error}finally{await context.close();await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});