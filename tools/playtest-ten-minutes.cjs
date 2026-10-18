// Phase 4 ordinary-play session in real Chromium (no staging). An "ordinary player" policy drives the
// real keyboard (WASD, E, Shift+E, C). It uses only what a player can see (bars, nearby creatures,
// prompts) and never edits the world. Logs a 5 s timeline, on-screen messages, encounters, frame
// times and per-minute screenshots.
// Usage: node tools/playtest-ten-minutes.cjs <WxH> <minutes> <outDir> [seed]
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const [vw,vh]=(process.argv[2]||'1440x900').split('x').map(Number),minutes=Number(process.argv[3]||10),outDir=process.argv[4],seed=process.argv[5]||'PHASE4-ORDINARY';
const root=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'};

async function main(){
  fs.mkdirSync(outDir,{recursive:true});
  const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:vw,height:vh}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  await page.route('https://genvo.review/**',async r=>{
    const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');
    if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});
    await r.fulfill({body:fs.readFileSync(p),contentType:TYPES[path.extname(p)]||'application/octet-stream'});
  });
  await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);
  await page.screenshot({path:path.join(outDir,`title-${vw}x${vh}.png`)});
  await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill(seed);
  await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:30000});
  await page.evaluate(()=>{
    window.__ft=[];let last=performance.now();const loop=t=>{window.__ft.push(t-last);last=t;requestAnimationFrame(loop)};requestAnimationFrame(loop);
    window.__seen=new Set();window.__msgs=[];
    const grab=()=>{
      window.__last??={};for(const id of ['tutorial','context','toast','guide','transition']){const el=document.getElementById(id);if(!el||el.hidden){window.__last[id]='';continue}const t=el.innerText.replace(/\s+/g,' ').trim();if(t&&window.__last[id]!==t){window.__last[id]=t;window.__msgs.push({t:performance.now(),id,text:t.slice(0,220)})}}
      for(const el of document.querySelectorAll('#notificationStack *')){const t=(el.innerText||'').replace(/\s+/g,' ').trim();if(t&&t.length<220&&!window.__seen.has('n'+t)){window.__seen.add('n'+t);window.__msgs.push({t:performance.now(),id:'notice',text:t})}}
    };setInterval(grab,500);
  });
  const spec=await page.evaluate(async()=>{const m=await import('./src/organisms/species.js');return{maxE:m.SPECIES.genvo.maxEnergy,maxH:m.SPECIES.genvo.maxHydration}});
  const state=()=>page.evaluate(()=>{
    const g=window.__GENVO8__,s=g.sim,p=s.player();if(!p||!p.alive)return{dead:true};
    const near=s.animals.filter(a=>a.alive&&a!==p&&Math.hypot(a.x-p.x,a.y-p.y)<12);
    const threat=near.filter(a=>s.isPredatorTo?.(a,p)).map(a=>({species:a.species,d:+Math.hypot(a.x-p.x,a.y-p.y).toFixed(1),dx:a.x-p.x,dy:a.y-p.y})).sort((a,b)=>a.d-b.d);
    const w=s.world,avoid=window.__avoidWater||[];let water=null,wd=Infinity;for(const spot of w.drinkSpots||[]){if(!w.sameLand(p.x,p.y,spot.x,spot.y)||avoid.some(a=>Math.hypot(a.x-spot.x,a.y-spot.y)<1))continue;const d=Math.hypot(spot.x-p.x,spot.y-p.y);if(d<wd){wd=d;water={x:spot.x,y:spot.y}}}
    const f=s.bestFood?.(p),food=f?{x:f.x,y:f.y,kind:f.kind}:null;
    const counts={};for(const a of near)counts[a.species]=(counts[a.species]||0)+1;
    const pill=(document.getElementById('tutorial')?.innerText||'').replace(/\s+/g,' ');const mates=s.animals.filter(a=>a.alive&&a!==p&&a.species===p.species&&a.sex!==p.sex&&a.age>=20&&Math.hypot(a.x-p.x,a.y-p.y)<14).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));const mate=mates[0]?{x:mates[0].x,y:mates[0].y}:null;
    return{pill,mate,day:s.day,x:p.x,y:p.y,health:Math.round(p.health),energy:p.energy,hydration:p.hydration,intent:p.intent,near:counts,threat,water,food,hint:s.interactionHint?.()||'',courtOpen:!!g.courtshipTray?.isOpen,family:s.animals.filter(a=>a.alive&&a.lineage&&a!==p).length,generation:s.lineage?.highestGeneration};
  });
  const hold=async(dx,dy,ms)=>{const keys=[];if(dx>.3)keys.push('KeyD');if(dx<-.3)keys.push('KeyA');if(dy>.3)keys.push('KeyS');if(dy<-.3)keys.push('KeyW');for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(ms);for(const k of keys)await page.keyboard.up(k)};
  const timeline=[],actions={};const t0=Date.now();let heading=Math.random()*6.28,headingAt=0,lastLog=-5000,shot=0,step=0,drinkMisses=0;
  while(Date.now()-t0<minutes*60000){
    const el=Date.now()-t0,st=await state();if(st.dead){timeline.push({t:Math.round(el/1000),dead:true});break}
    const e=st.energy/spec.maxE,h=st.hydration/spec.maxH;let act='explore';
    if(st.threat.length&&st.threat[0].d<7){const th=st.threat[0];await hold(-Math.sign(th.dx),-Math.sign(th.dy),900);act='flee:'+th.species}
    else if(st.courtOpen){await page.keyboard.press('KeyC');act='court'}
    else if(st.intent==='mate'){await page.waitForTimeout(700);act='courting-wait'}
    else if(/Find a mate/.test(st.pill)&&st.mate&&e>.7&&h>.6){const dx=st.mate.x-st.x,dy=st.mate.y-st.y,d=Math.hypot(dx,dy);if(d<2){await page.keyboard.press('KeyC');act='court-C'}else{await hold(dx/d,dy/d,Math.min(700,d*240));act='approach-mate'}}
    else if(h<.55&&st.water){const dx=st.water.x-st.x,dy=st.water.y-st.y,d=Math.hypot(dx,dy);
      if(/drink/i.test(st.hint)||d<1.0){await page.keyboard.down('Shift');await page.keyboard.press('KeyE');await page.keyboard.up('Shift');act='drink';
        const after=await state();if(!after.dead&&after.hydration<=st.hydration+.01){drinkMisses++;if(drinkMisses>=4){await page.evaluate(w=>{(window.__avoidWater??=[]).push(w)},st.water);drinkMisses=0;act='drink-failed-retarget'}}else drinkMisses=0}
      else{await hold(dx/d,dy/d,Math.min(700,Math.max(120,d*260)));act='seek-water'}}
    else if(e<.65&&st.food){const dx=st.food.x-st.x,dy=st.food.y-st.y,d=Math.hypot(dx,dy);if(d<1.3){await page.keyboard.press('KeyE');await page.waitForTimeout(250);await page.keyboard.press('KeyE');act='eat:'+st.food.kind}else{await hold(dx/d,dy/d,700);act='seek-food'}}
    else{if(el-headingAt>8000){heading=Math.random()*6.28;headingAt=el}if(++step%9===0){await page.keyboard.press('KeyE');act='press-E-curious'}await hold(Math.cos(heading),Math.sin(heading),900)}
    actions[act]=(actions[act]||0)+1;
    if(el-lastLog>=5000){lastLog=el;
      const ft=await page.evaluate(()=>{const f=window.__ft.splice(0).sort((a,b)=>a-b);return f.length?{frames:f.length,median:+f[f.length>>1].toFixed(1),p95:+f[Math.floor(f.length*.95)].toFixed(1),worst:+f.at(-1).toFixed(1)}:null});
      timeline.push({t:Math.round(el/1000),day:st.day,health:st.health,energy:+e.toFixed(2),hydration:+h.toFixed(2),intent:st.intent,act,near:st.near,threat:st.threat.map(t=>t.species+'@'+t.d),hint:st.hint,family:st.family,generation:st.generation,frames:ft});
    }
    if(el>=shot*60000){await page.screenshot({path:path.join(outDir,`min${String(shot).padStart(2,'0')}-${vw}x${vh}.png`)});shot++}
  }
  const messages=await page.evaluate(()=>window.__msgs.map(m=>({...m,t:Math.round(m.t/1000)})));
  const summary={viewport:`${vw}x${vh}`,seed,minutes,actions,errors};
  fs.writeFileSync(path.join(outDir,`playtest-${vw}x${vh}.json`),JSON.stringify({summary,timeline,messages},null,1));
  console.log(JSON.stringify(summary));await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
