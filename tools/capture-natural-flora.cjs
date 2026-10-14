let activeBrowser;const fs=require('node:fs'),path=require('node:path');

const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

(async()=>{

 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:800,height:600},recordVideo:{dir:path.join(root,'docs/natural-flora-video'),size:{width:800,height:600}}});

 activeBrowser=browser;const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));

 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav'})[ext]||'application/octet-stream'});});

 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);

 await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('NATURAL-FLORA-REVIEW');await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForTimeout(600);

 await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready');








 const proof={scope:'120 wall-clock seconds at normal speed in a fresh generated world; ordinary generation/editor pauses remain in force. Ordinary Auto and Keep the old body UI choices only; no actor, anatomy, readiness, stock, RNG or clock edits. Unscripted simulation, not a human playtest.',samples:[],seen:[],errors};
 await page.evaluate(()=>{const r=window.__GENVO8__.renderer,original=r.encounters.sample.bind(r.encounters);window.__NATURAL_REACTIONS__=new Map();r.encounters.sample=(sim,a,phase)=>{const pose=original(sim,a,phase);if(pose.move||pose.outcome||pose.impact){const key=a.id+':'+(pose.move||pose.outcome||'impact');if(!window.__NATURAL_REACTIONS__.has(key))window.__NATURAL_REACTIONS__.set(key,{actorId:a.id,tick:sim.tickCount,kind:pose.move||pose.outcome||'impact'})}return pose}});
 await page.locator('#stageUtilities>button').click();await page.locator('#stageUtilities [data-action=autonomy]').click();await page.locator('#stageUtilities>button').click();await page.screenshot({path:path.join(root,'docs/natural-flora-start-800.png')});
 for(let i=0;i<24;i++){await page.waitForTimeout(5000);if(await page.getByRole('button',{name:'Keep the old body',exact:true}).isVisible())await page.getByRole('button',{name:'Keep the old body',exact:true}).click();proof.samples.push(await page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,p=s.player();return{tick:s.tickCount,day:s.day,paused:s.paused,generationEditor:g.editor?.open||false,playerId:s.playerId,births:s.stats.births,plantTransport:{stats:s.dispersal.stats,carrierCount:s.animals.filter(a=>Object.values(a.seedCargo||{}).some(c=>c.load>0&&c.genome)).length,genotypeBanks:Object.values(s.dispersal.bankGenomes).reduce((n,m)=>n+m.size,0),established:Object.values(s.dispersal.producerOrigins).reduce((n,m)=>n+m.size,0),litter:s.dispersal.litter.reduce((a,b)=>a+b,0)},hybrids:s.animals.filter(a=>a.parentIds?.length===2).flatMap(a=>{const parents=a.parentIds.map(id=>s.animals.find(b=>b.id===id));return parents.every(Boolean)&&parents[0].species!==parents[1].species?[{id:a.id,parentIds:a.parentIds,foundingIds:parents.map(p=>p.species),genome:a.reproductiveGenome}]:[]}),acceptedNoConception:s.animals.filter(a=>a.lastReproductiveAttempt?.accepted&&!a.lastReproductiveAttempt.conceived).length,traces:s.discovery.activeTraces().length,feedingMarks:s.discovery.activeTraces().filter(t=>t.type==='feed').length,visibleMarks:s.discovery.visibleTraces(p).length,traceHint:s.discovery.traceHintShown||false,population:s.animals.filter(a=>a.alive).length,player:p?{alive:p.alive,energy:p.energy,hydration:p.hydration,intent:p.intent,lastMate:p.lastMate,offspring:s.family.livingChildren(p).length}:null,performers:s.animals.filter(a=>a.alive&&a.courtshipPerformance).map(a=>({id:a.id,sequence:a.courtshipPerformance.sequence}))}}));if(i%6===5)await page.screenshot({path:path.join(root,'docs/natural-flora-'+(i+1)*5+'s-800.png')})}
 proof.seen=await page.evaluate(()=>[...window.__NATURAL_REACTIONS__.values()]);proof.video=await page.video().path();fs.writeFileSync(path.join(root,'docs/natural-flora-proof.json'),JSON.stringify(proof,null,2));if(errors.length)throw Error(errors.join('\n'));await browser.close();
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});
