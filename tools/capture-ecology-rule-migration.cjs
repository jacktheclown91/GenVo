// Uses only a newly launched nonpersistent browser and an explicit fresh context.
// No existing browser profile, storage state, or user autosave is opened.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const out=path.resolve('docs/living-planet-architecture/founder-feedback-repair/runtime');fs.mkdirSync(out,{recursive:true});
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
const {deserialize}=require('node:v8'),{pathToFileURL}=require('node:url');
const {restoreSimulationSnapshot,createSimulationSnapshot}=await import(pathToFileURL(path.resolve('src/persistence/save-manager.js')).href);
const {placeSupportedBreedingPair}=await import(pathToFileURL(path.resolve('tests/helpers/breeding-pair.js')).href);
const s=restoreSimulationSnapshot(deserialize(fs.readFileSync('docs/living-planet-architecture/accessibility-experiment/current-policy/maturity/final.snapshot.bin'))),a=s.animals.find(a=>a.id===3),mate=s.spawnAnimal('genvo',a.x+1,a.y);Object.assign(mate,{sex:'M',age:32});
placeSupportedBreedingPair(s,a,mate,{developDays:0});const deadline=s.day+20;while(a.alive&&mate.alive&&(a.reproCooldown>0||mate.reproCooldown>0)&&s.day<deadline)s.update(null);placeSupportedBreedingPair(s,a,mate,{developDays:0});
if(!s.conceptionAvailability(a,mate).enabled)throw Error('Declared existing-phenotype pair is not ready');
const saved=createSimulationSnapshot(s,{savedAt:'fixed',reason:'parental-guidance-ui-fixture'});
// Explicit legacy-format fixture; source/archive state is never rewritten.
delete saved.core.ecologyRules;delete saved.core.ecologyRuleMigrations;
// Preserve canonical actor target cycles during test transport; JSON tree encoding
// cannot represent live mutual targets. This is fixture transport, not a save format.
const nodes=[],seen=new Map();function ref(v){if(v===undefined)return{u:true};if(v===null||typeof v!=='object')return v;if(seen.has(v))return{r:seen.get(v)};const id=nodes.length;seen.set(v,id);nodes.push(null);nodes[id]=ArrayBuffer.isView(v)?{t:v.constructor.name,v:[...v]}:v instanceof Map?{t:'Map',v:[...v].map(([a,b])=>[ref(a),ref(b)])}:v instanceof Set?{t:'Set',v:[...v].map(ref)}:{t:Array.isArray(v)?'Array':'Object',v:Object.entries(v).map(([k,w])=>[k,ref(w)])};return{r:id}}
const rootRef=ref(saved),payload=JSON.stringify({root:rootRef,nodes});

await page.evaluate(async({payload,mateId})=>{const constructors={Uint8Array,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,Float32Array,Float64Array},graph=JSON.parse(payload),values=graph.nodes.map(n=>constructors[n.t]?new constructors[n.t](n.v):n.t==='Map'?new Map():n.t==='Set'?new Set():n.t==='Array'?[]:{}),d=v=>v&&typeof v==='object'?(v.u?undefined:values[v.r]):v;for(let i=0;i<values.length;i++){const n=graph.nodes[i],v=values[i];if(constructors[n.t])continue;if(n.t==='Map')for(const [k,w]of n.v)v.set(d(k),d(w));else if(n.t==='Set')for(const w of n.v)v.add(d(w));else for(const[k,w]of n.v)v[k]=d(w)}const snapshot=d(graph.root);const {restoreSimulationSnapshot}=await import('/src/persistence/save-manager.js'),s=restoreSimulationSnapshot(snapshot);for(const a of s.animals)a.player=false;const a=s.animals.find(a=>a.id===3);a.player=true;s.playerId=3;s.playerEnabled=true;s.playerAutonomy=false;s.paused=true;s.rebuildSpatial();const manager=window.__GENVO8__.saveManager,load=manager.load;manager.load=async()=>s;try{if(!await window.__GENVO8__.loadSavedLineage())throw Error('Fixture load failed')}finally{manager.load=load}s.paused=true;s.reproduction.selectedMateId=mateId;window.__parentalBio=()=>{const seen=new Map();return JSON.stringify({animals:s.animals,world:{water:[...s.world.water],moisture:[...s.world.moisture]},rng:s.rng},(_k,v)=>{if(v&&typeof v==='object'){if(seen.has(v))return{reference:seen.get(v)};seen.set(v,seen.size)}return v})};window.__parentalPanelBefore=window.__parentalBio();},{payload,mateId:mate.id});
await page.waitForTimeout(700);await page.screenshot({path:path.join(out,'migration-notice.png')});
await page.keyboard.press('KeyM');await page.waitForTimeout(700);
await page.locator('#mate summary').filter({hasText:'Biological details'}).click();
await page.locator('#mate [data-knowledge-size]').click();
await page.evaluate(()=>{const el=document.querySelector('#mate .knowledge-scroll');el.scrollTop=el.scrollHeight});await page.waitForTimeout(200);
const proof=await page.evaluate(()=>{const s=window.__GENVO8__.sim,el=document.querySelector('#mate');return{migrationText:document.querySelector('#saveStatus')?.textContent,migrations:s.ecologyRuleMigrations,text:el.innerText,visible:!el.hidden,parentsUnchanged:window.__parentalPanelBefore===window.__parentalBio(),selectedId:s.reproduction.selectedMateId}});
await page.screenshot({path:path.join(out,'mate-panel.png')});
if(!proof.migrationText?.includes('Feeding rules updated')||proof.migrations.length!==1||!proof.visible||!proof.text.includes('OBSERVED PARENTAL ADAPTATIONS')||!proof.text.includes('Webbed Limbs')||!proof.text.includes('do not guarantee')||proof.text.includes('all young')||!proof.parentsUnchanged||errors.length)throw Error('Parental adaptation panel proof failed: '+JSON.stringify(proof));
fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({scope:'Explicit legacy ecology-version fixture derived from an archived living scenario. New isolated headed context, source snapshot unchanged. Browser restore records one future-behavior migration and exposes its message. Temporary control/paused inspection, no mating or candidate anatomy/genes/resources edit; not ordinary progression.',proof,errors},null,2));console.log(JSON.stringify({visible:proof.visible,parentsUnchanged:proof.parentsUnchanged,selectedId:proof.selectedId,errors}));
}catch(error){await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,errors},null,2));throw error}finally{await context.close();await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
