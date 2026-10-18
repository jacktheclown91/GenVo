// Uses only a newly launched nonpersistent browser and an explicit fresh context.
// No existing browser profile, storage state, or user autosave is opened.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const out=path.resolve(process.argv[2]||'docs/living-planet-architecture/anatomical-mass-implementation/runtime-verified');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:false,args:['--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:900},storageState:{cookies:[],origins:[]}});
const page=await context.newPage(),errors=[];try{page.on('pageerror',e=>errors.push(e.message));
const cdp=await browser.newBrowserCDPSession();const gpu=(await cdp.send('SystemInfo.getInfo')).gpu;
const root=process.cwd(),types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml'};
// Same in-process file transport as the repository's existing GPU/parity harnesses.
await context.route('https://genvo.review/**',async route=>{const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');if(!file.startsWith(root+path.sep))return route.abort();if(!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'})});
await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);


await page.locator('[data-screen="home"] [data-screen-target="new"]').click();await page.locator('#newWorldName').fill('Anatomical mass isolated fixture');await page.locator('#newWorldSeed').fill('MASS-RUNTIME-2026-10-18');await page.getByRole('button',{name:'Begin World'}).click();await page.waitForFunction(()=>window.__GENVO8__.renderer.sceneShown&&!window.__GENVO8__.renderer.scenePending);
await page.evaluate(()=>window.__GENVO8__.sim.paused=true);
await page.screenshot({path:path.join(out,'ordinary-new-world.png')});
const result=await page.evaluate(async()=>{
 const {bodyMass,adultBodyMass,basalResourceCosts}=await import('./src/organisms/body-mass.js'),{founderPlan}=await import('./src/lineage/body-inheritance.js'),{makePlan}=await import('./src/lineage/body-plan.js'),{growthCostForDay,advanceAgeDay}=await import('./src/ecology/juvenile-biology.js'),{createSimulationSnapshot,restoreSimulationSnapshot}=await import('./src/persistence/save-manager.js');
 const g=window.__GENVO8__,s=g.sim,p=s.player(),base=founderPlan(),loaded=makePlan([...base.nodes.map(({partId,parent,socket})=>({partId,parent,socket})),{partId:'storage-sac',parent:'root',socket:'flank.left'},{partId:'storage-sac',parent:'root',socket:'flank.right'}]);
 const identity={seed:s.seed,slot:g.saveManager.activeSlotId,massRules:s.massRules,initialPlayerPolicy:p.massPolicy};
 let land;for(let y=40;y<s.world.n-25&&!land;y++)for(let x=40;x<s.world.n-25;x++){if([0,1,2].every(dx=>!s.world.water[s.world.idx(x+dx,y)])){land={x:x+.5,y:y+.5};break}}if(!land)throw Error('No dry fixture lane');
 // Diagnostic anatomy substitutions in a fresh disposable world, not an evolved lineage.
 const rows=[];for(const [name,bodyPlan]of[['founder',base],['two-sac-body',loaded]]){
  p.bodyPlan=bodyPlan;p.age=30;p.energy=100;p.hydration=95;p.health=100;p.x=land.x;p.y=land.y;p.genes.metabolism=1;p.intent='player';
  const before={x:p.x,energy:p.energy};s.paused=false;s.playerControlStep({right:true},32);s.paused=true;const movement={distance:p.x-before.x,energy:before.energy-p.energy};
  const a={...p,age:10,energy:100},massBefore=bodyMass(a),cost=growthCostForDay(a);advanceAgeDay(a);
  rows.push({name,adultMass:adultBodyMass(p),basal:basalResourceCosts(p),movement,growth:{massBefore,massAfter:bodyMass(a),cost,energySpent:100-a.energy,age:a.age}});
 }
 const snapshot=createSimulationSnapshot(s,{savedAt:'fixed',reason:'mass-runtime-fixture'}),restored=restoreSimulationSnapshot(structuredClone(snapshot));
 const exactMass=bodyMass(restored.player())===bodyMass(p)&&restored.massRules===s.massRules;
 if(identity.massRules!=='relative-anatomical-load/1'||identity.initialPlayerPolicy!==identity.massRules||!exactMass||rows.some(r=>!(r.movement.distance>0&&r.movement.energy>0&&Number.isFinite(r.movement.energy)))||Math.abs(rows[1].movement.energy/rows[0].movement.energy-1.2)>1e-8||rows[1].growth.cost<=rows[0].growth.cost)throw Error('Runtime mass consequences mismatch');
 s.paused=true;g.renderer.render();return{scope:'Ordinary New World menu/default policy, followed by disclosed diagnostic body substitutions and direct normal movement/growth calls in this disposable world. Not spontaneous mutation, inheritance accessibility, long survival or complete tissue physics.',identity,rows,exactMassAfterSaveRestore:exactMass};
});await page.screenshot({path:path.join(out,'loaded-body-fixture.png')});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...result,errors},null,2));if(errors.length)throw Error('Runtime errors: '+errors.join(';'));
await page.evaluate(async()=>{const g=window.__GENVO8__;if(!await g.saveManager.saveNow('anatomical-mass-runtime'))throw Error('Runtime save failed')});
await page.reload();await page.getByRole('button',{name:/^Continue/}).click();await page.waitForFunction(()=>window.__GENVO8__.renderer.sceneShown&&!window.__GENVO8__.renderer.scenePending);const continued=await page.evaluate(async()=>{const g=window.__GENVO8__,{adultBodyMass}=await import('./src/organisms/body-mass.js');g.sim.paused=true;return{seed:g.sim.seed,slot:g.saveManager.activeSlotId,massRules:g.sim.massRules,playerPolicy:g.sim.player().massPolicy,adultMass:adultBodyMass(g.sim.player())}});
if(continued.seed!==result.identity.seed||continued.slot!==result.identity.slot||continued.massRules!==result.identity.massRules||continued.adultMass!==result.rows[1].adultMass)throw Error('Native new-policy Continue mismatch');
await page.screenshot({path:path.join(out,'new-policy-continue.png')});fs.writeFileSync(path.join(out,'native-continue.json'),JSON.stringify({continued,errors},null,2));console.log(JSON.stringify({...result,continued}));
}catch(error){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,errors},null,2));throw error}finally{await context.close();await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
