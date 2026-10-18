// Render pixel parity (Phase 3H Milestone F, diagnostic). Loads two copies of the client (e.g. a frozen
// pre-optimisation copy and the working tree) on the same seed, advances the same number of days with
// ordinary updates, pauses, freezes the clock, renders the same frame sequence while panning the camera
// across the population (by moving the paused player, which the camera follows), and compares every frame's canvas pixels exactly.
// Usage: node tools/render-parity.cjs <rootA> <rootB> [WxH=1440x900] [days=80] [frames=24] [seed]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const {showFastForward}=require('./fast-forward-overlay.cjs');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const here=path.resolve(__dirname,'..'),[rootA,rootB]=[process.argv[2]||here,process.argv[3]||here].map(p=>path.resolve(p));
const [vw,vh]=(process.argv[4]||'1440x900').split('x').map(Number),days=Number(process.argv[5]||80),frames=Number(process.argv[6]||24),seed=process.argv[7]||'PHASE4-ORDINARY';
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
async function capture(browser,root,query=''){
  const page=await browser.newPage({viewport:{width:vw,height:vh}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://genvo.review/**',async r=>{const rel=decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html';let p=path.resolve(root,rel);if(!fs.existsSync(p))p=path.resolve(here,rel);if(!p.startsWith(root+path.sep)&&!p.startsWith(here+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(p),contentType:TYPES[path.extname(p)]||'application/octet-stream'})});
  await page.goto('https://genvo.review/index.html'+query);await page.waitForFunction(()=>window.__GENVO8__?.contextTray);await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill(seed);await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:30000});
  // Deterministic: stop the game loop, build a fresh world from the seed in-page (same module instances
  // the renderer uses), advance it, and render the whole frame sequence in one synchronous pass.
  await showFastForward(page,days);
  const hashes=await page.evaluate(async({d,seed,frames})=>{window.requestAnimationFrame=()=>0;await new Promise(r=>setTimeout(r,200));
    const {Simulation}=await import('/src/sim/simulation.js');const G=window.__GENVO8__,R=G.renderer;const s=new Simulation(seed,{player:true});s.endOpeningGrace?.('parity');s.setPlayerAutonomy?.(true);
    const d0=s.day;let g=0;while(s.day<d0+d&&g++<d*400)s.update(null);s.paused=true;R.sim=s;document.getElementById('__fastForwardOverlay')?.remove();
    const real=performance.now,out=[];
    try{for(let f=0;f<frames+4;f++){const T=1e6+f*16.667;performance.now=()=>T;const alive=s.animals.filter(a=>a.alive).sort((a,b)=>a.id-b.id);const target=alive[(f*7)%alive.length];
      const pl=s.player();if(f%3===0&&target){if(pl){pl.x=target.x+.6;pl.y=target.y;R.cameraReady=false;R.motion?.clear?.()}else{R.camera.x=target.x;R.camera.y=target.y}}
      R.render();if(f<4)continue;const c=document.querySelector('#game'),d2=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h1=2166136261>>>0,h2=0;for(let i=0;i<d2.length;i++){h1=Math.imul(h1^d2[i],16777619)>>>0;h2=(h2+d2[i]*(i%251+1))>>>0}
      out.push({sig:s.rng.state+":"+s.animals.reduce((n,a)=>n+a.x*3+a.y,0).toFixed(6)+":"+R.camera.x.toFixed(3),hash:h1.toString(16)+':'+h2.toString(16),visible:R.visibleAnimals?.length||0,w:c.width,h:c.height})}}finally{performance.now=real}
    return out},{d:days,seed,frames});
  const png=await page.locator('#game').screenshot();await page.close();return{hashes,errors,png};
}
(async()=>{const browser=await chromium.launch({headless:true});const A=await capture(browser,rootA,process.env.QUERY_A||''),B=await capture(browser,rootB,process.env.QUERY_B||'');await browser.close();
  const diff=A.hashes.map((a,i)=>a.hash===B.hashes[i]?.hash?null:i).filter(i=>i!==null);
  const res={viewport:`${vw}x${vh}`,days,frames,seed,identicalFrames:frames-diff.length,differingFrames:diff,visible:A.hashes.map(h=>h.visible),canvas:A.hashes[0]&&`${A.hashes[0].w}x${A.hashes[0].h}`,errorsA:A.errors,errorsB:B.errors};
  console.log(JSON.stringify(res));if(diff.length){fs.writeFileSync(path.join(process.env.TEMP||'.','parity-A.png'),A.png);fs.writeFileSync(path.join(process.env.TEMP||'.','parity-B.png'),B.png)}process.exit(diff.length?1:0)})().catch(e=>{console.error(e);process.exit(2)});
