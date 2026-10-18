// Uses only a newly launched nonpersistent browser and an explicit fresh context.
// No existing browser profile, storage state, or user autosave is opened.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const out=path.resolve('docs/living-planet-architecture/accessibility-experiment/runtime');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:false,args:['--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[]}});
const page=await context.newPage(),errors=[];try{page.on('pageerror',e=>errors.push(e.message));
const cdp=await browser.newBrowserCDPSession();const gpu=(await cdp.send('SystemInfo.getInfo')).gpu;
const root=path.resolve(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml'};
// Same in-process file transport as the repository's existing GPU/parity harnesses.
await context.route('https://genvo.review/**',async route=>{const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');if(!file.startsWith(root+path.sep))return route.abort();if(!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'})});
await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('GENVO8-TEST-A');await page.getByRole('button',{name:'Begin World',exact:true}).click();
await page.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus().status==='ready'&&window.__GENVO8__?.sim?.player(),null,{timeout:60000});await page.waitForTimeout(4000);
const {deserialize}=require('node:v8');const saved=deserialize(fs.readFileSync('docs/living-planet-architecture/accessibility-experiment/candidate-birth.snapshot.bin'));
const payload=JSON.stringify(saved,(_k,v)=>v instanceof Map?{auditType:'Map',entries:[...v]}:v instanceof Set?{auditType:'Set',values:[...v]}:ArrayBuffer.isView(v)?{auditType:v.constructor.name,values:Array.from(v)}:v);
const results=[];
for(const id of [1,4]){
await page.evaluate(async({payload,id})=>{const constructors={Uint8Array,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,Float32Array,Float64Array};const snapshot=JSON.parse(payload,(_k,v)=>v?.auditType==='Map'?new Map(v.entries):v?.auditType==='Set'?new Set(v.values):v?.auditType&&constructors[v.auditType]?new constructors[v.auditType](v.values):v);const {restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js');const s=restoreSimulationSnapshot(snapshot);for(const a of s.animals)a.player=false;const a=s.animals.find(a=>a.id===id);a.player=true;s.playerId=id;s.playerEnabled=true;s.playerAutonomy=false;a.x=23.8;a.y=38.5;s.rebuildSpatial();const manager=window.__GENVO8__.saveManager,load=manager.load;manager.load=async()=>s;try{if(!await window.__GENVO8__.loadSavedLineage())throw Error('Fixture load failed')}finally{manager.load=load}}, {payload,id});
await page.waitForTimeout(600);
await page.evaluate(()=>{const g=window.__GENVO8__,a=g.sim.player();a.x=23.8;a.y=38.5;a.target=null;a.intent='player';g.sim.rebuildSpatial();g.renderer.cameraReady=false});
const read=()=>{const s=window.__GENVO8__.sim,a=s.player();return{id:a.id,x:a.x,y:a.y,age:a.age,body:a.bodyPlan,genes:a.genes,energy:a.energy,wet:!!s.world.water[s.world.idx(a.x,a.y)],tick:s.tickCount}};
const before=await page.evaluate(read);await page.keyboard.down('KeyD');await page.waitForTimeout(900);await page.keyboard.up('KeyD');const after=await page.evaluate(read);await page.screenshot({path:path.join(out,`actor-${id}.png`)});results.push({before,after});
}
fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({scope:'Archived actual newborn versus parent, explicitly relocated to the same existing water edge and temporarily controlled for a locomotion fixture. No inherited anatomy or genotype edits; not ordinary succession or a mature lineage demonstration.',results,errors},null,2));
console.log(JSON.stringify({results:results.map(r=>({id:r.after.id,beforeX:r.before.x,afterX:r.after.x,wet:r.after.wet,energyBefore:r.before.energy,energyAfter:r.after.energy})),errors}));
if(errors.length||results[0].after.wet||!results[1].after.wet||results.some(r=>JSON.stringify(r.before.body)!==JSON.stringify(r.after.body)||JSON.stringify(r.before.genes)!==JSON.stringify(r.after.genes)))process.exitCode=1;
}catch(error){await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});const state=await page.evaluate(()=>({status:window.__GENVO8__?.nativeArtStatus?.(),day:window.__GENVO8__?.sim?.day,body:document.body.innerText.slice(-3000)})).catch(()=>null);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,state,errors},null,2));throw error}finally{await context.close();await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});