// Moving-frame pixel parity (Phase 3L). The paused-world comparison (render-parity.cjs) never exercised walking
// poses. Here two clients (A and B, e.g. ?spriteBatch=0 and the default) build the same world from the seed
// in-page, run the SAME simulation ticks with the SAME inputs, and render after every tick with a frozen,
// identical clock, in a HEADED GPU window (the path players use). Every rendered frame's canvas pixels are hashed;
// differing frames are counted pixel by pixel (count, largest channel difference, bounding box) and the first
// differing pair is saved as PNGs. Bitmap caches resolve between frames (an await per frame), so cached-sprite
// draws are exercised too.
// Scenes (each a deterministic staging applied identically in both clients):
//   natural  - day-120 world, player on AUTO (walking, turning, sprinting, feeding, courtship nearby), camera follows
//   crowd    - 60 mosskip placed around the player, all walking
//   water    - camera on an animal swimming
//   bound    - 8 animals near the player given spring legs (two-beat bounding)
//   combat   - a Stalker engaged on the player at 4 tiles; the player flees with sprint (bites, reactions)
//   weather  - heavy rain and the night half of the day while the player walks
// Usage: node tools/moving-frame-parity.cjs [scene=all] [frames=120] [queryA=?spriteBatch=0] [queryB=] [days=120]
const fs=require('node:fs'),path=require('node:path');const {showFastForward}=require('./fast-forward-overlay.cjs');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const ROOT_A=path.resolve(__dirname,'..'),ROOT_B=process.env.ROOT_B?path.resolve(process.env.ROOT_B):ROOT_A/* ROOT_B: serve client B from another tree (renderer-version comparisons) */,root=ROOT_A,[sceneArg='all',framesArg='120',qa='?spriteBatch=0',qb='',daysArg='120']=process.argv.slice(2),frames=Number(framesArg),days=Number(daysArg);
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'};
const SCENES=sceneArg==='all'?['natural','crowd','water','bound','combat','weather']:sceneArg.split(',');
async function run(browser,query,scene,prep=false,root=ROOT_A){
  const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!fs.existsSync(p))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(p),contentType:TYPES[path.extname(p)]||'application/octet-stream'})});
  await page.goto('https://genvo.review/index.html'+query);await page.waitForFunction(()=>window.__GENVO8__?.contextTray);await page.getByRole('button',{name:/New World/}).click();await page.locator('#newWorldSeed').fill('PHASE4-ORDINARY');await page.getByRole('button',{name:'Begin World',exact:true}).click();await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:60000});
  await showFastForward(page,days);
  const out=await page.evaluate(async({days,frames,scene,MAG,PREP})=>{window.requestAnimationFrame=()=>0;await new Promise(r=>setTimeout(r,300));
    const {Simulation}=await import('/src/sim/simulation.js');const {SPECIES}=await import('/src/organisms/species.js');const {Renderer}=await import('/src/render/renderer.js');const G=window.__GENVO8__,ST=(await import('/src/render/genvo-draw.js')).SPRITE_STATS;const realDate=Date.now;
    const s=new Simulation('PHASE4-ORDINARY',{player:true});s.endOpeningGrace?.('parity');s.setPlayerAutonomy?.(true);const d0=s.day;let g=0;while(s.day<d0+days&&g++<days*400)s.update(null);document.getElementById('__fastForwardOverlay')?.remove();
    // A fresh renderer: the live game's renderer keeps per-animal presentation state (keyed by id) from a run of
    // variable real length, which made identical clients differ.
    const R=new Renderer(document.querySelector('#game'),s);R.cameraReady=false;const p=s.player();
    // PREPARE=1 (applied to client B only): prepare the first scene through Renderer.prepareScene before rendering, as a world start does.
    let prepPending=!!(PREP&&R.prepareScene);/* prepared at the first frame's tick and frozen clock, just before that frame */let input=null,camTarget=null;
    // Deterministic placement helper (no Math.random): a ring of points around the player.
    const ring=(k,n,rx,ry)=>({x:p.x+Math.cos(k/n*Math.PI*2)*rx,y:p.y+Math.sin(k/n*Math.PI*2)*ry});
    if(scene==='crowd'){const ids=new Set();for(let k=0;k<80&&ids.size<60;k++){const q=ring(k,80,6+(k%5)*1.6,3.5+(k%4));if(!s.canOccupy({species:'mosskip'},q.x,q.y))continue;const a=s.spawnAnimal('mosskip',q.x,q.y);if(a){a.age=Math.max(a.age,20);ids.add(a.id)}}
      const dec=s.phaseDecision.bind(s);s.phaseDecision=(...r)=>{const v=dec(...r);for(const a of s.animals)if(ids.has(a.id)&&a.alive){a.__dx??=(a.id%2?1:-1);if(!a.target||Math.abs(a.target.x-a.x)<.6)a.__dx*=-1;a.intent='explore';a.target={x:a.x+a.__dx*5,y:a.y+((a.id%3)-1)*2}}return v};s.rebuildSpatial()}
    // water: follow an animal that is in water (a swimmer); if none is, place the nearest swimming-capable one on the nearest water cell.
    if(scene==='water'){const inWater=a=>s.world.water[s.world.idx(a.x,a.y)];let sw=s.animals.filter(a=>a.alive&&!a.player&&inWater(a)).sort((a,b)=>a.id-b.id)[0];
      if(!sw){const cand=s.animals.filter(a=>a.alive&&!a.player&&s.canSwim?.(a)).sort((a,b)=>a.id-b.id)[0];let best=null;for(let i=0;i<s.world.water.length;i++)if(s.world.water[i]){const x=i%s.world.n+.5,y=Math.floor(i/s.world.n)+.5,d=Math.hypot(x-p.x,y-p.y);if(!best||d<best.d)best={x,y,d}}if(cand&&best){cand.x=best.x;cand.y=best.y;s.rebuildSpatial();sw=cand}}camTarget=sw||null;window.__waterId=sw?.id??null}
    if(scene==='bound'){const near=s.animals.filter(a=>a.alive&&a.bodyPlan&&!a.player&&Math.hypot(a.x-p.x,a.y-p.y)<14).sort((a,b)=>a.id-b.id).slice(0,8);for(const a of near){const plan=structuredClone(a.bodyPlan);for(const n of plan.nodes)if(/^root\/limb\.\d+$/.test(n.id))n.partId='spring-leg';plan.id=(plan.id||'p')+'-spring';a.bodyPlan=plan}}
    if(scene==='combat'){s.setPlayerAutonomy?.(false);const h=s.animals.filter(a=>a.alive&&a.species==='needlejaw'&&a.age>=SPECIES.needlejaw.maturity).sort((a,b)=>a.id-b.id)[0];if(h){h.x=p.x-4;h.y=p.y;h.energy=60;h.health=100;s.rebuildSpatial();s.predator.beginStalk(h,p,4);h.intent='stalk-player'}input={right:true,sprint:true}}
    if(scene==='weather'){const w0=s.tickCount%48;for(let k=0;k<(24-w0+48)%48;k++)s.update(null)}
    const hashes=[];const real=performance.now;
    try{for(let f=0;f<frames+3;f++){
      if(scene==='combat')input=f%40<30?{right:true,sprint:true}:{up:true};
      if(input){for(let k=0;k<8;k++)s.playerControlStep(input,64);s.update(input,{externalPlayerControl:true})}else s.update(null);
      if(scene==='weather')s.climate.rain=.95;
      if(camTarget?.alive){R.camera.x=camTarget.x;R.camera.y=camTarget.y}
      const T=2e6+f*125;performance.now=()=>T;Date.now=()=>1.7e12+T;try{if(prepPending){let k=0;while(!R.prepareScene(1e9)&&k++<10000){}prepPending=false}R.render()}finally{performance.now=real;Date.now=realDate}
      // Wait until every sprite bitmap requested this frame has resolved, so cache hits are the same in A and B.
      for(let w=0;w<200&&ST.pendingBitmaps>0;w++)await new Promise(r=>setTimeout(r,1));if(f<3)continue;
      const c=document.querySelector('#game'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h1=2166136261>>>0;for(let i=0;i<d.length;i++)h1=Math.imul(h1^d[i],16777619)>>>0;
      // 48x48-pixel block hashes, to locate any difference.
      const W=c.width,H=c.height,BW=Math.ceil(W/48),blocks=new Array(BW*Math.ceil(H/48)).fill(0);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,b=Math.floor(y/48)*BW+Math.floor(x/48);blocks[b]=(Math.imul(blocks[b]^(d[i]|d[i+1]<<8|d[i+2]<<16),16777619)+d[i+3])>>>0}
      const pos=[];for(const a of (R.visibleAnimals||[])){const q=R.screenPos?.get?.(a.id);if(q)pos.push([a.id,Math.round(q.x),Math.round(q.y),a.intent,s.tickCount-(a.movedTick??-1e9)<4?1:0])}
      const vis=R.visibleAnimals||[];let mv=0;for(const a of vis)if(s.tickCount-(a.movedTick??-1e9)<4)mv++;
      const springs=vis.filter(a=>a.bodyPlan?.nodes?.some(n=>n.partId==='spring-leg')).length,swimmers=vis.filter(a=>s.world.water[s.world.idx(a.x,a.y)]).length;
      hashes.push({blocks,pos,hash:h1.toString(16),visible:vis.length,moving:mv,springs,swimmers,tick:s.tickCount,stats:{...(R.frameStats||{})}});window.__last=d;if(MAG)(window.__frames||=[])[hashes.length-1]=new Uint8ClampedArray(d)}}finally{performance.now=real}
    return hashes},{days,frames,scene,MAG:process.env.MAGNITUDE==='1',PREP:prep});
  return{page,out,errors};
}
async function pixels(page){return page.evaluate(()=>{const c=document.querySelector('#game');return Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data)})}
(async()=>{const browser=await chromium.launch(process.env.SOFTWARE==='1'?{headless:true}:{headless:false,args:['--ignore-gpu-blocklist','--window-size=1456,1020']});/* SOFTWARE=1: headless software rendering, to tell renderer from GPU nondeterminism */const results={};
  for(const scene of SCENES){const A=await run(browser,qa,scene),B=await run(browser,qb,scene,process.env.PREPARE==='1',ROOT_B);
    const diff=A.out.map((a,i)=>a.hash===B.out[i]?.hash?null:i).filter(i=>i!==null);let detail=null;
    // MAGNITUDE=1: for every differing frame, compare the differing 48-px blocks pixel by pixel (both clients kept their frames).
    let magnitude=null;if(process.env.MAGNITUDE==='1'){const per=[],big=[];const bw=Math.ceil(1440/48);const grab=(pg,f,k)=>pg.evaluate(({f,k,bw})=>{const d=window.__frames[f],W=1440,x0=(k%bw)*48,y0=Math.floor(k/bw)*48,o=[];for(let y=y0;y<Math.min(900,y0+48);y++)for(let x=x0;x<Math.min(W,x0+48);x++){const i=(y*W+x)*4;o.push(d[i],d[i+1],d[i+2],d[i+3])}return o},{f,k,bw});
      for(const f of diff){const ab=A.out[f].blocks,bb=B.out[f].blocks;let px=0,max=0;const hist={};for(let k=0;k<ab.length;k++){if(ab[k]===bb[k])continue;const a=await grab(A.page,f,k),b=await grab(B.page,f,k);for(let i=0;i<a.length;i+=4){let dm=0;for(let c=0;c<4;c++)dm=Math.max(dm,Math.abs(a[i+c]-b[i+c]));if(dm){px++;max=Math.max(max,dm);if(dm>8&&big.length<40){const W=1440,x=(k%bw)*48+(i/4)%48,y=Math.floor(k/bw)*48+Math.floor(i/4/48);const near=A.out[f].pos.map(q=>[Math.hypot(q[1]-x,q[2]-y),q]).sort((a,b)=>a[0]-b[0])[0];big.push({frame:f,x,y,delta:dm,nearest:near?{d:+near[0].toFixed(0),id:near[1][0],intent:near[1][3],moving:near[1][4]}:null})}const bin=dm<=2?'<=2':dm<=8?'<=8':dm<=32?'<=32':'>32';hist[bin]=(hist[bin]||0)+1}}}per.push({frame:f,pixels:px,max,hist})}
      const tot={};for(const p of per)for(const [k,v] of Object.entries(p.hist))tot[k]=(tot[k]||0)+v;magnitude={framesCompared:A.out.length,differingFrames:per.length,meanDifferingPixelsPerFrame:+(per.reduce((t,p)=>t+p.pixels,0)/A.out.length).toFixed(2),maxPixelsInAFrame:Math.max(0,...per.map(p=>p.pixels)),maxChannelDelta:Math.max(0,...per.map(p=>p.max)),deltaHistogram:tot,largeDifferences:big};
      // Crops (64x64 around the first large difference) from both clients, for inspection.
      if(big.length){const b0=big[0],crop=pg=>pg.evaluate(({f,x,y})=>{const d=window.__frames[f],W=1440,o=[];for(let yy=y-32;yy<y+32;yy++)for(let xx=x-32;xx<x+32;xx++){const i=(Math.max(0,Math.min(899,yy))*W+Math.max(0,Math.min(1439,xx)))*4;o.push(d[i],d[i+1],d[i+2],d[i+3])}return o},{f:b0.frame,x:b0.x,y:b0.y});magnitude.crop={at:b0,A:await crop(A.page),B:await crop(B.page)}}}
    if(diff.length){// re-render is not possible after the loop, so compare the LAST frame's pixels and report the first differing index.
      const pa=await pixels(A.page),pb=await pixels(B.page);let n=0,max=0,x0=1e9,y0=1e9,x1=-1,y1=-1;const W=1440;for(let i=0;i<pa.length;i+=4){let dm=0;for(let k=0;k<4;k++)dm=Math.max(dm,Math.abs(pa[i+k]-pb[i+k]));if(dm>0){n++;max=Math.max(max,dm);const px=(i/4)%W,py=Math.floor(i/4/W);x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py)}}
      detail={lastFrameDifferingPixels:n,maxChannelDelta:max,bbox:n?[x0,y0,x1,y1]:null};fs.writeFileSync(path.join(root,'docs','render-batching',`parity-${scene}-A.png`),await A.page.locator('#game').screenshot());fs.writeFileSync(path.join(root,'docs','render-batching',`parity-${scene}-B.png`),await B.page.locator('#game').screenshot())}
    // Where the differences are: differing blocks per differing frame, with the creatures drawn there (A's positions).
    const where=diff.slice(0,6).map(i=>{const a=A.out[i],b=B.out[i],bw=Math.ceil(1440/48),bl=a.blocks.map((v,k)=>v===b.blocks[k]?null:k).filter(k=>k!==null);return{frame:i,blocks:bl.length,cells:bl.slice(0,12).map(k=>[(k%bw)*48,Math.floor(k/bw)*48]),creaturesThere:a.pos.filter(([id,x,y])=>bl.some(k=>Math.abs(x-((k%bw)*48+24))<60&&Math.abs(y-(Math.floor(k/bw)*48+24))<60)).slice(0,8)}});
    for(const h of [...A.out,...B.out]){delete h.blocks;delete h.pos}
    const vis=A.out.map(h=>h.visible),mv=A.out.map(h=>h.moving);
    results[scene]={frames:A.out.length,identical:A.out.length-diff.length,differing:diff.length,firstDiffering:diff.slice(0,8),visibleRange:[Math.min(...vis),Math.max(...vis)],movingRange:[Math.min(...mv),Math.max(...mv)],springLegVisibleMax:Math.max(...A.out.map(h=>h.springs)),inWaterVisibleMax:Math.max(...A.out.map(h=>h.swimmers)),staged:B.out.reduce((t,h)=>t+(h.stats.creatures||0),0),errorsA:A.errors,errorsB:B.errors,detail,where,magnitude};
    console.error(scene,JSON.stringify(results[scene]));await A.page.close();await B.page.close()}
  await browser.close();console.log(JSON.stringify({queryA:qa,queryB:qb,days,results}));
})().catch(e=>{console.error(e);process.exit(2)});
