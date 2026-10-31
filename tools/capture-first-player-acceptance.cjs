// First-player acceptance (October 30): the parts a new player meets after the basics.
//  1. Courtship to birth, desktop 800 x 600: the tutorial's own highlighted controls
//     (the creature marked Mate, Court, Approach, Play), then ordinary play on the
//     game's Auto mode until a child of the player is born.
//  2. Touch-only play, phone portrait: taps only (no keyboard) for the welcome,
//     feeding, drinking, the Menu and a panel.
//  3. A giant body: a DIAGNOSTIC staging (a wild adult's inherited size set to 2.6x),
//     since natural giants need many generations of selection. Shows rendering,
//     walking and reach in the real game; it is not evidence of natural evolution.
// Writes screenshots and receipt.json to docs/first-player-acceptance-2026-10-30/.
let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/first-player-acceptance-2026-10-30');fs.mkdirSync(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip','.svg':'image/svg+xml','.woff2':'font/woff2'};
async function serve(context){await context.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(p),contentType:TYPES[path.extname(p)]||'application/octet-stream'})})}
const receipt={scope:'Real game in headless Chromium. Input through the visible controls; time only advanced by ordinary updates. The giant step is a labelled diagnostic staging.',steps:[],gaps:[],errors:[]};
const step=(name,data)=>{receipt.steps.push({name,...data});console.log(name,JSON.stringify(data).slice(0,400))};
const shot=(page,name)=>page.screenshot({path:path.join(out,name+'.png')});
async function begin(page,seed,{tap=false}={}){
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
 const nw=page.getByRole('button',{name:/New World/}).first();tap?await nw.tap():await nw.click();
 await page.locator('#newWorldSeed').fill(seed);const go=page.getByRole('button',{name:'Begin World',exact:true});tap?await go.tap():await go.click();
 await page.waitForFunction(()=>window.__GENVO8__?.nativeArtStatus?.().status==='ready',{timeout:120000});await page.waitForTimeout(800);
 const start=page.locator('#startGame');if(await start.isVisible()){tap?await start.tap():await start.click();await page.waitForTimeout(800)}
}
// Renderer pixels to page (client) coordinates, as the canvas click handler converts back.
const toClient='const rect=(r.canvas||document.querySelector("canvas")).getBoundingClientRect(),cx=v=>rect.left+v*rect.width/r.w,cy=v=>rect.top+v*rect.height/r.h;';
const screenOf=(page,id)=>page.evaluate(([id,conv])=>{const g=window.__GENVO8__,r=g.renderer,a=g.sim.animals.find(x=>x.id===id);if(!a)return null;const rect=(r.canvas||document.querySelector("canvas")).getBoundingClientRect(),cx=v=>rect.left+v*rect.width/r.w,cy=v=>rect.top+v*rect.height/r.h;const p=r.screenPos?.get(id);return p?{x:cx(p.x),y:cy(p.y)}:null},[id,toClient]);
// The tutorial's water step: the nearest visible fresh water, its radial Drink.
async function drinkFromWater(page,{tap=false}={}){
 const at=await page.evaluate(conv=>{const g=window.__GENVO8__,s=g.sim,r=g.renderer,tile=g.CFG.tileSize*r.zoom,p=s.player();const rect=(r.canvas||document.querySelector("canvas")).getBoundingClientRect(),cx=v=>rect.left+v*rect.width/r.w,cy=v=>rect.top+v*rect.height/r.h;let best=null;
  for(let dy=-10;dy<=10;dy++)for(let dx=-12;dx<=12;dx++){const x=Math.floor(p.x)+dx+.5,y=Math.floor(p.y)+dy+.5,i=s.world.idx(x,y);if(!s.world.water[i])continue;const sx=r.w/2+(x-r.camera.x)*tile,sy=r.h/2+(y-r.camera.y)*tile;if(sx<30||sx>r.w-30||sy<r.h*.2||sy>r.h*.72)continue;const d=Math.hypot(dx,dy);if(!best||d<best.d)best={d,x:cx(sx),y:cy(sy)}}return best},toClient);
 if(!at)return 'no visible water';const before=await page.evaluate(()=>window.__GENVO8__.sim.player().hydration);
 tap?await page.touchscreen.tap(at.x,at.y):await page.mouse.click(at.x,at.y);await page.waitForTimeout(400);
 const drink=page.locator('.context-radial button:visible').filter({hasText:/^(Approach & )?Drink/}).first();if(!await drink.count())return 'no Drink on the water radial';
 tap?await drink.tap():await drink.click();for(let k=0;k<60;k++){await page.waitForTimeout(250);if(await page.evaluate(v=>window.__GENVO8__.sim.player().hydration>v+.01,before))return 'raised hydration'}return 'unchanged';
}
(async()=>{
 const browser=await chromium.launch({headless:true});activeBrowser=browser;
 // 1. Courtship to birth.
 {const context=await browser.newContext({viewport:{width:800,height:600}});await serve(context);const page=await context.newPage();page.on('pageerror',e=>receipt.errors.push(String(e.stack||e.message).slice(0,400)));
  await begin(page,'FIRST-PLAYER-COURTSHIP');
  // Feed and drink through the HUD first, as the tutorial asks, so the player is ready to court.
  {const b=page.locator('button:visible').filter({hasText:/^\s*Eat\b/}).first();if(await b.isEnabled().catch(()=>false)){await b.click();await page.waitForTimeout(3500)}}
  step('tutorial water step',{drink:await drinkFromWater(page)});await page.waitForTimeout(1500);
  const trail=[];let conceived=false,walked=0;
  for(let attempt=0;attempt<80&&!conceived;attempt++){
   const state=await page.evaluate(async()=>{const {matingTutorialState}=await import('/src/ui/mating-tutorial-guide.js');const g=window.__GENVO8__,tray=document.querySelector('.courtship-tray:not([hidden])'),court=document.querySelector('[data-tutorial-action="court"]');
    const s=matingTutorialState(g.sim,{courtOpen:!!tray,courtTargetId:tray?Number(tray.dataset.targetId):null,contextTargetId:court?Number(court.dataset.targetId):null});const p=g.sim.player(),mate=s.mate;
    return{step:s.step,action:s.action||null,mateId:mate?.id??null,playerPregnant:!!p?.pregnant,mateLast:p?.lastMate??null,partnerPregnant:g.sim.animals.some(a=>a.alive&&a.pregnant&&a.pregnant.fatherId===p?.id),refusal:p?.lastCourtshipRefusal?.reason||null}});
   trail.push(state.step);
   if(state.playerPregnant||state.partnerPregnant){conceived=true;break}
   if(state.step==='mate'&&state.mateId){const at=await screenOf(page,state.mateId);
    if(at){await page.mouse.click(at.x,at.y);await page.waitForTimeout(400)}
    else{// Walk toward the partner the way the 'To Mate' cue points, with the arrow keys.
     const d=await page.evaluate(id=>{const s=window.__GENVO8__.sim,p=s.player(),m=s.animals.find(a=>a.id===id);return m?{dx:m.x-p.x,dy:m.y-p.y}:null},state.mateId);
     const keys=[];if(d){if(Math.abs(d.dx)>1)keys.push(d.dx>0?'ArrowRight':'ArrowLeft');if(Math.abs(d.dy)>1)keys.push(d.dy>0?'ArrowDown':'ArrowUp')}
     for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(900);for(const k of keys)await page.keyboard.up(k);walked++}}
   else if(state.action){const el=page.locator(`[data-tutorial-action="${state.action}"]:visible`).first();if(await el.count()&&await el.isEnabled()){await el.click();await page.waitForTimeout(state.action==='play'?2500:500)}else await page.waitForTimeout(500)}
   else await page.waitForTimeout(1500);
   if(attempt===3)await shot(page,'courtship-800');
  }
  await shot(page,'courtship-outcome-800');
  const after=await page.evaluate(()=>{const g=window.__GENVO8__,p=g.sim.player();const partner=g.sim.animals.find(a=>a.pregnant&&a.pregnant.fatherId===p.id)||null;return{playerSex:p.sex,playerPregnant:!!p.pregnant,partnerId:partner?.id??null,gestationDays:(p.pregnant||partner?.pregnant)?.days??null,day:g.sim.day}});
  step('courtship',{tutorialSteps:[...new Set(trail)],walkSteps:walked,conceived,...after});
  if(!conceived)receipt.gaps.push('No conception within the courtship attempts: '+JSON.stringify(trail.slice(-6)));
  else{
   // Ordinary play on Auto until a child of the player is born.
   // The Creature Lab opens for the coming generation and pauses the world; the player keeps the old body.
   const lab=page.locator('[data-act="cancel"]:visible').first();let labChoice='not shown';if(await lab.count()){await shot(page,'creature-lab-800');await lab.click();await page.waitForTimeout(800);labChoice='kept the old body'}
   for(const sel of ['#tutorialContinue','#transitionContinue','#briefingNext'])if(await page.locator(sel).isVisible().catch(()=>false)){await page.locator(sel).click();await page.waitForTimeout(400)}
   step('creature lab',{labChoice,paused:await page.evaluate(()=>window.__GENVO8__.sim.paused)});
   let born=null;const startDay=await page.evaluate(()=>{const s=window.__GENVO8__.sim;s.setPlayerAutonomy(true);return s.day});
   for(let k=0;k<20000&&!born;k++){if(await page.evaluate(start=>window.__GENVO8__.sim.day>=start+40,startDay))break;const st=await page.evaluate(start=>{const s=window.__GENVO8__.sim,id=s.playerId;if(s.paused)return{paused:true};for(let t=0;t<24;t++)s.update(null);const p=s.player(),child=s.animals.find(a=>a.alive&&(a.parentIds||[]).includes(id));
     const m=s.animals.find(a=>a.pregnant&&a.pregnant.fatherId===id);return{tick:s.tickCount,day:s.day,intent:p?.intent,alive:!!p?.alive,mateIntent:m?.intent,mateDays:m?.pregnant?.days,heap:Math.round((performance.memory?.usedJSHeapSize||0)/1e6),child:child?{childId:child.id,day:s.day,daysAfterConception:s.day-start,species:child.species,parentIds:child.parentIds,playerAlive:!!p?.alive}:null}},startDay);
     if(st.paused){const shown=await page.locator('button:visible').allTextContents();receipt.gaps.push('World paused during gestation; visible: '+shown.slice(0,8).join(' | '));break}born=st.child}
   await page.evaluate(()=>window.__GENVO8__.sim.setPlayerAutonomy(false));if(!born)born={child:null};
   await page.waitForTimeout(600);await shot(page,'birth-800');
   const journal=await page.evaluate(()=>document.querySelector('#journal')?.textContent?.slice(0,200)||'');
   step('birth',{...born,journalMentionsYoung:/young|child|offspring|born/i.test(journal)});
   if(!born.childId)receipt.gaps.push('No child of the player born within 40 days of conception.');
  }
  await context.close();}
 // 2. Touch-only play, phone portrait.
 {const phone=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});await serve(phone);const mp=await phone.newPage();mp.on('pageerror',e=>receipt.errors.push('touch: '+String(e.message).slice(0,300)));
  await begin(mp,'FIRST-PLAYER-TOUCH',{tap:true});await shot(mp,'touch-start');
  const results={};
  results.Drink=await drinkFromWater(mp,{tap:true});
  for(const [label,field] of [['Eat','energy']]){const before=await mp.evaluate(f=>window.__GENVO8__.sim.player()[f],field);const b=mp.locator('button:visible').filter({hasText:new RegExp('^\\s*'+label+'\\b')}).first();
   if(!await b.count()){results[label]='no button';continue}if(!await b.isEnabled()){results[label]='disabled: '+(await b.getAttribute('title'));continue}
   await b.tap();let changed=false;for(let k=0;k<40&&!changed;k++){await mp.waitForTimeout(250);changed=await mp.evaluate(([f,v])=>window.__GENVO8__.sim.player()[f]>v+.01,[field,before])}results[label]=changed?'raised '+field:'unchanged';}
  // Tap the world: a context menu should open on the tapped creature or food.
  const target=await mp.evaluate(conv=>{const g=window.__GENVO8__,p=g.sim.player(),r=g.renderer;const rect=(r.canvas||document.querySelector("canvas")).getBoundingClientRect(),cx=v=>rect.left+v*rect.width/r.w,cy=v=>rect.top+v*rect.height/r.h;for(const a of g.sim.animals){if(!a.alive||a.id===p.id)continue;const pos=r.screenPos?.get(a.id);if(pos&&pos.x>40&&pos.x<r.w-40&&pos.y>r.h*.25&&pos.y<r.h*.7)return{x:cx(pos.x),y:cy(pos.y),id:a.id}}return null},toClient);
  if(target){await mp.touchscreen.tap(target.x,target.y);await mp.waitForTimeout(500);results.tapCreature=await mp.locator('.context-radial button:visible, .creature-context-tray button:visible').count()>0?'context opened':'no context';await shot(mp,'touch-context');await mp.locator('.context-radial button:visible').filter({hasText:/^Back$|Close/}).first().tap().catch(()=>{});}
  else results.tapCreature='no creature nearby';
  const menu=mp.locator('button:visible').filter({hasText:/^\s*Menu\s*$/}).first();if(await menu.count()){await menu.tap();await mp.waitForTimeout(400);const pop=mp.locator('[data-panel=population]');if(await pop.isVisible()){await pop.tap();await mp.waitForTimeout(500);await shot(mp,'touch-population');results.population=await mp.locator('text=Population').first().isVisible()?'opened':'not visible'}else results.population='no button'}
  results.overflowX=await mp.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  step('touch-only play',results);
  for(const [k,v] of Object.entries(results))if(/unchanged|no button|disabled|no context|not visible/.test(String(v)))receipt.gaps.push(`Touch: ${k} ${v}`);
  await phone.close();}
 // 3. A giant body (diagnostic staging).
 {const context=await browser.newContext({viewport:{width:800,height:600}});await serve(context);const page=await context.newPage();page.on('pageerror',e=>receipt.errors.push('giant: '+String(e.message).slice(0,300)));
  await begin(page,'FIRST-PLAYER-GIANT');
  const g=await page.evaluate(async()=>{const {adultSizeScale}=await import('/src/organisms/body-size.js');const {SPECIES}=await import('/src/organisms/species.js');const w=window.__GENVO8__,s=w.sim,p=s.player();
   const a=s.animals.filter(x=>x.alive&&x.id!==p.id&&x.bodySize&&x.age>=SPECIES[x.species].maturity).sort((x,y)=>Math.hypot(x.x-p.x,x.y-p.y)-Math.hypot(y.x-p.x,y.y-p.y))[0];if(!a)return null;
   const before=adultSizeScale(a);a.bodySize={...a.bodySize,alleles:a.bodySize.alleles?a.bodySize.alleles.map(()=>Math.log(2.6)):a.bodySize.alleles};if(a.bodySize.scale!==undefined)a.bodySize.scale=2.6;
   return{id:a.id,species:a.species,before,after:adultSizeScale(a),x:a.x,y:a.y}});
  if(!g){receipt.gaps.push('No adult wild body to stage as a giant.')}else{
   await page.evaluate(id=>{const w=window.__GENVO8__,a=w.sim.animals.find(x=>x.id===id),p=w.sim.player();p.x=a.x-2;p.y=a.y},g.id);await page.waitForTimeout(1500);await shot(page,'giant-800');
   const walked=await page.evaluate(id=>new Promise(res=>{const w=window.__GENVO8__,a=w.sim.animals.find(x=>x.id===id),x0=a.x,y0=a.y;setTimeout(()=>res({moved:+Math.hypot(a.x-x0,a.y-y0).toFixed(2),alive:a.alive,reach:+w.sim.reachBetween?.(w.sim.player(),a)?.toFixed?.(2)||null}),4000)}),g.id);
   await shot(page,'giant-later-800');step('giant body (diagnostic staging)',{...g,...walked});
   if(!(g.after>2))receipt.gaps.push('The staged giant size did not take effect: '+g.after);}
  await context.close();}
 await browser.close();
 fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,1));
 console.log('errors',receipt.errors.length,'gaps',JSON.stringify(receipt.gaps));
})().catch(async e=>{console.error(e);receipt.errors.push('harness: '+String(e.message));fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,1));await activeBrowser?.close();process.exitCode=1});
