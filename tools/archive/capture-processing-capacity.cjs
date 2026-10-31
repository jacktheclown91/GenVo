// Uses only a newly launched nonpersistent browser and an explicit fresh context.
// No existing browser profile, storage state, or user autosave is opened.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const out=path.resolve('docs/processing-capacity/runtime');fs.mkdirSync(out,{recursive:true});
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
const baseline=await page.evaluate(()=>({alive:window.__GENVO8__.sim.animals.filter(a=>a.alive).length,warning:document.querySelector('#processingCapacity')?.textContent||''}));
await page.evaluate(()=>{const s=window.__GENVO8__.sim;s.paused=true;while(s.animals.filter(a=>a.alive).length<=window.__GENVO8__.CFG.maxAnimals)s.spawnAnimal('rootling',32,32);s.rebuildSpatial()});
await page.waitForFunction(()=>document.querySelector('#processingCapacity')&&!document.querySelector('#processingCapacity').hidden);
await page.screenshot({path:path.join(out,'capacity-warning.png')});
const overloaded=await page.evaluate(()=>({alive:window.__GENVO8__.sim.animals.filter(a=>a.alive).length,warning:document.querySelector('#processingCapacity').textContent}));
fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({scope:'Controlled capacity UI fixture: actors explicitly spawned and simulation paused. Not ecological or performance evidence.',baseline,overloaded,errors},null,2));
console.log(JSON.stringify({baseline,overloaded,errors}));if(errors.length||!overloaded.warning.includes('All offspring are retained'))process.exitCode=1;
}catch(error){await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});const state=await page.evaluate(()=>({status:window.__GENVO8__?.nativeArtStatus?.(),day:window.__GENVO8__?.sim?.day,body:document.body.innerText.slice(-3000)})).catch(()=>null);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,state,errors},null,2));throw error}finally{await context.close();await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});