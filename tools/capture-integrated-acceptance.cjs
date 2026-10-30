// Combined-game browser acceptance (integration of stabilization work and PR #51,
// October 30). Drives the real game in headless Chromium: main menu, guided New
// World, keyboard movement and braking, feeding and drinking through the radial
// commands, Field Guide, Journal and Population panels, creature sizes, day and
// night, save and Continue after a reload, frame pacing, 800 x 600 and mobile
// portrait. Writes screenshots and receipt.json to docs/integrated-acceptance-2026-10-30/.
// Only the simulation clock is advanced (real updates) to reach night and later days.
let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/integrated-acceptance-2026-10-30');fs.mkdirSync(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip','.svg':'image/svg+xml','.woff2':'font/woff2'};
async function serve(context){await context.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(p),contentType:TYPES[path.extname(p)]||'application/octet-stream'})})}
const receipt={scope:'Combined main (stabilization + PR #51) in headless Chromium. Real input and real simulation; the clock is only advanced by ordinary updates.',steps:[],gaps:[],errors:[]};
const step=(name,data)=>{receipt.steps.push({name,...data});console.log(name,JSON.stringify(data).slice(0,300))};
const state=page=>page.evaluate(()=>{const g=window.__GENVO8__,s=g.sim,p=s.player();return{day:s.day,tick:s.tickCount,playerId:s.playerId,alive:p?.alive,x:p?.x,y:p?.y,vx:p?.vx??null,vy:p?.vy??null,energy:p?.energy,hydration:p?.hydration,intent:p?.intent,animals:s.animals.filter(a=>a.alive).length,births:s.stats.births,rules:{grazing:s.grazingNutrientRules,breeding:s.breedingSupportRules,climateWater:s.climateWaterRules,bodySize:s.bodySizeRules}}});
async function newWorld(page,seed){
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
 await page.getByRole('button',{name:/New World/}).first().click();await page.locator('#newWorldSeed').fill(seed);await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus?.().status==='ready',{timeout:120000});await page.waitForTimeout(800);
}
// The player creature runs on the game's own Auto mode while time is advanced unattended.
async function advanceDays(page,days){await page.evaluate(n=>{const s=window.__GENVO8__.sim,target=s.day+n,auto=s.playerAutonomy;s.setPlayerAutonomy(true);while(s.day<target)s.update(null);s.setPlayerAutonomy(auto)},days);await page.waitForTimeout(400)}
(async()=>{
 const browser=await chromium.launch({headless:true});activeBrowser=browser;
 // Desktop 800 x 600.
 const context=await browser.newContext({viewport:{width:800,height:600}});await serve(context);const page=await context.newPage();
 page.on('pageerror',e=>receipt.errors.push(String(e.stack||e.message).slice(0,400)));
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);await page.waitForTimeout(500);
 await page.screenshot({path:path.join(out,'menu-800.png')});step('main menu',{buttons:await page.locator('.menu-screen:not([hidden]) button, [data-screen-target], [data-action]').allTextContents().then(t=>t.map(x=>x.trim()).filter(Boolean).slice(0,12))});
 await page.getByRole('button',{name:/New World/}).first().click();await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'new-world-800.png')});
 await page.locator('#newWorldSeed').fill('INTEGRATED-ACCEPTANCE');await page.getByRole('button',{name:'Begin World',exact:true}).click();
 await page.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus?.().status==='ready',{timeout:120000});await page.waitForTimeout(800);
 await page.screenshot({path:path.join(out,'welcome-800.png')});
 await page.locator('#startGame').click();await page.waitForTimeout(1200);
 await page.screenshot({path:path.join(out,'hud-start-800.png')});step('new world',await state(page));
 // Movement and braking with the keyboard.
 const before=await state(page);await page.keyboard.down('ArrowRight');await page.waitForTimeout(900);const moving=await state(page);await page.screenshot({path:path.join(out,'moving-800.png')});
 await page.keyboard.up('ArrowRight');await page.waitForTimeout(120);const braking=await state(page);await page.waitForTimeout(900);const stopped=await state(page);
 step('movement',{movedWhileHeld:+(moving.x-before.x).toFixed(2),glideFirst120ms:+(braking.x-moving.x).toFixed(3),glideAfterRelease:+(stopped.x-moving.x).toFixed(3),stillAfter900ms:Math.abs(stopped.x-braking.x)<.6});
 if(!(moving.x>before.x))receipt.gaps.push('Keyboard movement did not move the creature.');
 // Feeding and drinking through the radial commands.
 for(const [kind,label] of [['plant',/^(Approach & )?Eat /],['water',/^(Approach & )?Drink/]]){
  const target=await page.evaluate(kind=>{const g=window.__GENVO8__,s=g.sim,r=g.renderer,tile=g.CFG.tileSize*r.zoom,p=s.player();const list=[];
   if(kind==='plant')for(const t of r.visiblePlantTargets.values()){const target={...t,kind:'plant'};if(s.interactionOptions(target).some(o=>o.enabled||o.state==='approachable'))list.push({...target,sx:r.w/2+(t.hitX-r.camera.x)*tile,sy:r.h/2+(t.hitY-r.camera.y)*tile})}
   else for(let dy=-8;dy<=8;dy++)for(let dx=-12;dx<=12;dx++){const x=Math.floor(p.x)+dx+.5,y=Math.floor(p.y)+dy+.5;if(!s.world.water[s.world.idx(x,y)])continue;list.push({kind:'water',x,y,sx:r.w/2+(x-r.camera.x)*tile,sy:r.h/2+(y-r.camera.y)*tile})}
   return list.filter(t=>t.sx>40&&t.sx<760&&t.sy>100&&t.sy<480).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null},kind);
  if(!target){receipt.gaps.push(`No visible ${kind} target near the start.`);continue}
  await page.mouse.click(target.sx,target.sy);await page.waitForTimeout(200);await page.screenshot({path:path.join(out,`${kind}-options-800.png`)});
  const command=page.locator('.context-radial button').filter({hasText:label});
  let viaHud=false;if(!await command.count()){await page.keyboard.press('Escape');await page.waitForTimeout(150);if(kind!=='plant'){receipt.gaps.push(`No ${kind} command on the radial.`);continue}viaHud=true}
  const start=await state(page);if(viaHud)await page.locator('button:visible').filter({hasText:/^\s*Eat\s*$/}).first().click();else await command.first().click();
  let done=false;for(let k=0;k<40&&!done;k++){await page.waitForTimeout(250);const now=await state(page);done=kind==='plant'?now.energy>start.energy+.01:now.hydration>start.hydration+.01}
  const end=await state(page);await page.screenshot({path:path.join(out,`${kind}-result-800.png`)});
  step(kind==='plant'?'feeding':'drinking',{via:viaHud?'HUD Eat button':'radial command',energy:[start.energy,end.energy],hydration:[start.hydration,end.hydration],changed:done});
  if(!done)receipt.gaps.push(`${kind==='plant'?'Feeding':'Drinking'} did not raise the reserve within 10 s.`);
 }
 // Panels from PR #51.
 await page.keyboard.press('KeyY');await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'field-guide-800.png')});
 step('field guide',{open:await page.evaluate(()=>!!document.querySelector('.field-guide:not([hidden]), #fieldGuide:not([hidden])')),text:(await page.locator('body').innerText()).includes('Field Guide')});await page.keyboard.press('Escape');await page.waitForTimeout(200);
 for(const panel of ['journal','population']){if(!await page.locator(`[data-panel=${panel}]`).isVisible())await page.locator('button:visible').filter({hasText:/^\s*Menu\s*$/}).first().click();await page.waitForTimeout(250);await page.locator(`[data-panel=${panel}]`).click();await page.waitForTimeout(500);await page.screenshot({path:path.join(out,`${panel}-800.png`)});step(panel,{visible:await page.evaluate(p=>[...document.querySelectorAll('[class*='+p+'], #'+p)].some(e=>e.offsetParent!==null),panel)});await page.keyboard.press('Escape');await page.waitForTimeout(200)}
 // Creature sizes: juveniles and adults with inherited size.
 await page.keyboard.press('Escape');await page.waitForTimeout(200);
 const sizes=await page.evaluate(async()=>{const {adultSizeScale}=await import('/src/organisms/body-size.js'),{SPECIES}=await import('/src/organisms/species.js'),{developmentFor}=await import('/src/family/family.js'),s=window.__GENVO8__.sim;return s.animals.filter(a=>a.alive).map(a=>({juvenile:a.age<SPECIES[a.species].maturity,size:a.bodySize?adultSizeScale(a):null,growth:developmentFor(a).growth}))});
 const sc=sizes.filter(a=>a.size).map(a=>a.size).sort((a,b)=>a-b),gr=sizes.filter(a=>a.juvenile).map(a=>a.growth).sort((a,b)=>a-b);step('body sizes',{animals:sizes.length,juveniles:sizes.filter(a=>a.juvenile).length,adultSizeRange:sc.length?[+sc[0].toFixed(3),+sc[sc.length-1].toFixed(3)]:null,juvenileGrowthRange:gr.length?[+gr[0].toFixed(2),+gr[gr.length-1].toFixed(2)]:null});
 // Frame pacing in ordinary play.
 const pacing=await page.evaluate(()=>new Promise(res=>{const d=[];let last=performance.now(),t0=last;const s=window.__GENVO8__.sim,tick0=s.tickCount;function f(now){d.push(now-last);last=now;if(now-t0<8000)requestAnimationFrame(f);else{d.sort((a,b)=>a-b);const q=p=>+d[Math.floor(p*(d.length-1))].toFixed(1);res({frames:d.length,p50:q(.5),p95:q(.95),p99:q(.99),worst:+d[d.length-1].toFixed(1),ticksPerSecond:+((s.tickCount-tick0)/((now-t0)/1000)).toFixed(2)})}}requestAnimationFrame(f)}));
 step('frame pacing, new world',pacing);
 // Day and night: ordinary updates until the night half of the day clock.
 const night=await page.evaluate(async()=>{const {dayPhaseOf}=await import('/src/ecology/diurnal-temperature.js'),{diurnalLightReading}=await import('/src/render/diurnal-light.js'),s=window.__GENVO8__.sim;for(let k=0;k<4000&&!dayPhaseOf(s).night;k++)s.update(null);for(let k=0;k<30;k++)s.update(null);const ph=dayPhaseOf(s);return{tick:s.tickCount,day:s.day,night:ph.night,timeOfDay:+ph.timeOfDay.toFixed(3),lightAlpha:diurnalLightReading(s)?.alpha}});
 await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'night-800.png')});step('night',night);
 // A few weeks of real play: births and offspring in the world.
 await advanceDays(page,20);const later=await state(page);await page.screenshot({path:path.join(out,'day-21-800.png')});step('twenty days later',later);
 // Save, reload and Continue.
 await page.locator('button:visible').filter({hasText:/^\s*Menu\s*$/}).first().click();await page.waitForTimeout(300);if(!await page.getByRole('button',{name:'Save World'}).isVisible()){await page.keyboard.press('KeyP');await page.waitForTimeout(400)}const save=page.getByRole('button',{name:'Save World'});
 if(await save.count()){await save.click();await page.waitForTimeout(2500)}else receipt.gaps.push('Pause menu Save World not found.');
 const saved=await state(page);await page.screenshot({path:path.join(out,'saved-800.png')});
 await page.reload();await page.waitForFunction(()=>window.__GENVO8__?.contextTray);await page.waitForTimeout(500);
 const cont=page.getByRole('button',{name:/^Continue/}).first();await cont.click();await page.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus?.().status==='ready',{timeout:120000});await page.waitForTimeout(800);
 const restored=await state(page);await page.screenshot({path:path.join(out,'continued-800.png')});
 step('save and continue',{saved:{day:saved.day,playerId:saved.playerId,animals:saved.animals},restored:{day:restored.day,playerId:restored.playerId,animals:restored.animals,rules:restored.rules}});
 if(restored.playerId!==saved.playerId||restored.day!==saved.day)receipt.gaps.push('Continue did not restore the saved world.');
 await context.close();
 // Mobile portrait.
 const phone=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});await serve(phone);const mp=await phone.newPage();mp.on('pageerror',e=>receipt.errors.push('mobile: '+String(e.message).slice(0,300)));
 await mp.goto('https://genvo.review/index.html');await mp.waitForFunction(()=>window.__GENVO8__?.contextTray);await mp.waitForTimeout(500);await mp.screenshot({path:path.join(out,'menu-mobile.png')});
 await mp.getByRole('button',{name:/New World/}).first().click();await mp.locator('#newWorldSeed').fill('INTEGRATED-MOBILE');await mp.getByRole('button',{name:'Begin World',exact:true}).click();
 await mp.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus?.().status==='ready',{timeout:120000});await mp.waitForTimeout(800);await mp.screenshot({path:path.join(out,'welcome-mobile.png')});
 if(await mp.locator('#startGame').isVisible())await mp.locator('#startGame').tap();await mp.waitForTimeout(1200);await mp.screenshot({path:path.join(out,'hud-mobile.png')});
 step('mobile portrait',{overflowX:await mp.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)});
 await phone.close();await browser.close();
 fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,1));
 console.log('errors',receipt.errors.length,'gaps',JSON.stringify(receipt.gaps));
})().catch(async e=>{console.error(e);receipt.errors.push('harness: '+String(e.message));fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,1));await activeBrowser?.close();process.exitCode=1});
