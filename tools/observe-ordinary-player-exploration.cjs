// Uses only a newly launched nonpersistent browser and an explicit fresh context.
// No existing browser profile, storage state, or user autosave is opened.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const out=path.resolve('docs/player-journey/exploration-attempt');fs.mkdirSync(out,{recursive:true});
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


const rows=[],actions=[];const read=()=>{const s=window.__GENVO8__.sim,p=s.player();return{day:s.day,tick:s.tickCount,player:{id:p.id,age:p.age,x:p.x,y:p.y,energy:p.energy,hydration:p.hydration,health:p.health,lastMate:p.lastMate,alive:p.alive},children:s.animals.filter(a=>a.parentIds?.includes(p.id)).map(a=>({id:a.id,age:a.age,alive:a.alive,parentIds:a.parentIds,body:a.bodyPlan})),pregnancies:s.animals.filter(a=>a.pregnant?.fatherId===p.id).map(a=>({id:a.id,pregnant:true})),editor:window.__GENVO8__.editor.open,selected:s.reproduction.selectedMate()?.id,courtTarget:s.reproduction.courtTargetId,refusal:p.lastCourtshipRefusal,failure:p.lastCourtshipFailure}};
async function record(label){const r=await page.evaluate(read);rows.push({label,...r});fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify({scope:'Unmodified new world, normal keyboard exploration and existing mate-panel choice. No fixture imports, state/RNG/resource/consent edits or simulation time advance. UI-guided automation, not human play or mouse-first acceptance.',rows,actions,errors},null,2));console.log(JSON.stringify({label,day:r.day,player:r.player,children:r.children.map(a=>a.id),pregnancies:r.pregnancies,refusal:r.refusal}));return r}
await record('opening');await page.keyboard.press('KeyE');actions.push('E: eat available local food');
let initiated=false;
for(let region=0;region<5;region++){
await page.keyboard.press('KeyM');await page.waitForTimeout(250);const details=page.locator('#mate summary').filter({hasText:'Biological details'});if(await details.count()&&!(await details.evaluate(e=>e.parentElement.open)))await details.click();
for(let choice=0;choice<8;choice++){const text=await page.locator('#mate').innerText();actions.push({region,choice,matePanel:text});if(text.includes('Both currently favor this pairing')){await page.keyboard.press('KeyC');initiated=true;break}if(text.includes('No ready, unrelated'))break;await page.keyboard.press('KeyE');await page.waitForTimeout(130)}
await page.screenshot({path:path.join(out,`region-${region}.png`)});await page.keyboard.press('KeyM');if(initiated)break;
const key=['KeyD','KeyS','KeyD','KeyW','KeyA'][region];await page.keyboard.down(key);await page.waitForTimeout(6000);await page.keyboard.up(key);actions.push({movement:key,seconds:6});await page.keyboard.press('KeyE');await record('explored-'+region);
}
if(initiated){for(let i=0;i<70;i++){await page.waitForTimeout(2000);const keep=page.getByRole('button',{name:'Keep the old body',exact:true});if(await keep.count()&&await keep.isVisible()){await keep.click();actions.push('Keep the old body: ordinary pending litter UI');}const r=await record('courtship-follow-'+i);if(r.children.length||!r.player.alive||(i>5&&!r.courtTarget&&!r.pregnancies.length&&!r.player.lastMate))break;}}
const final=await record('final');await page.screenshot({path:path.join(out,'final.png')});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({scope:'Normal UI-guided exploration and courtship under shared biology; no biological state edits. Finite five-region search and at most140 seconds following one accepted UI-selected opportunity; outcome retained. Not a completed player life-cycle trial.',initiated,rows,actions,errors},null,2));
}catch(error){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,errors},null,2));throw error}finally{await context.close();await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
