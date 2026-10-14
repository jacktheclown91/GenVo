import {collectHabitatScenes} from './scene.js';
import {habitatIdentityAt,riverIdentityAt} from './identity.js';

// One presentation-only focal per broad region at most. Focals amplify the strongest
// canonical habitat scene so parts of the map become memorable without creating props,
// resources, shelter, collision, navigation, or new ecology state.
export function collectRegionalFocals(sim,habitatField,{region=24}={}){
  const w=sim.world,size=Math.max(16,region|0),scenes=collectHabitatScenes(sim,habitatField,{startX:0,startY:0,cols:w.n,rows:w.n,block:8}),groups=new Map();
  for(const scene of scenes){
    if(scene.x<10||scene.y<10||scene.x>w.n-11||scene.y>w.n-11)continue;
    const rx=Math.floor(scene.x/size),ry=Math.floor(scene.y/size),key=`${rx},${ry}`,f=focalForScene(sim,scene,habitatField),bias=hash(w.seedHash,rx,ry,4601)*.08;
    if(!f||f.strength<.56)continue;const rank=f.strength+bias;
    const prev=groups.get(key);if(!prev||rank>prev.rank)groups.set(key,{...f,rank,regionX:rx,regionY:ry});
  }
  return [...groups.values()].filter(f=>hash(w.seedHash^0x64af,f.regionX,f.regionY,4613)>.16).sort((a,b)=>a.y-b.y||a.x-b.x);
}

export function focalForScene(sim,scene,habitatField=null){
  if(!scene||scene.kind==='water')return null;const w=sim.world,id=habitatIdentityAt(w,scene.x,scene.y,habitatField),r=riverIdentityAt(w,scene.x,scene.y),h=hash(w.seedHash,scene.x,scene.y,4621);
  let kind='none',strength=0;
  if(scene.kind==='watering-margin'&&scene.marshroot>.075&&r.edge>.02){kind=r.kind==='bend'||r.kind==='pool'?'reed-cove':'reed-shelf';strength=scene.score*.52+scene.marshroot*.58+r.edge*.34}
  else if((scene.kind==='feeding-ground'||scene.kind==='thicket-pocket')&&scene.bramble>.13){kind='berry-grove';strength=scene.score*.56+scene.bramble*.58+(scene.composition?.thicket||0)*.18}
  else if(scene.kind==='fungal-hollow'&&scene.rotcap>.025){kind='mushroom-hollow';strength=scene.score*.62+scene.rotcap*2.25+(scene.nutrient||0)*.25}
  else if(scene.kind==='thicket-pocket'&&(scene.composition?.thicket||0)>.58){kind='old-root';strength=scene.score*.58+(scene.composition?.thicket||0)*.33+(scene.bramble||0)*.16}
  else if(scene.kind==='open-clearing'&&(scene.composition?.dryPocket||0)>.44){kind='stone-rise';strength=scene.score*.58+(scene.composition?.dryPocket||0)*.35+(scene.composition?.openness||0)*.12}
  else if(scene.kind==='recovery-patch'&&(scene.recovery||0)>.07){kind='young-meadow';strength=scene.score*.60+(scene.recovery||0)*.72}
  else if(scene.kind==='game-trail'&&(scene.traffic||0)>.13){kind='trail-gate';strength=scene.score*.58+(scene.traffic||0)*.68}
  if(kind==='none')return null;return {kind,strength:clamp01(strength),x:scene.x,y:scene.y,scene,identity:id,river:r,variant:Math.floor(h*4),seed:h};
}

export function drawRegionalFocalBackdrop(ctx,{focal,px,py,u,season='SPRING'}){
  if(!focal||focal.strength<.56)return;ctx.save();ctx.translate(px,py);ctx.globalAlpha=.72+.14*focal.strength;
  const p=seasonPalette(season,focal.kind);
  if(focal.kind==='reed-cove'||focal.kind==='reed-shelf')drawReedCove(ctx,u,focal,p);
  else if(focal.kind==='berry-grove')drawBerryGrove(ctx,u,focal,p);
  else if(focal.kind==='mushroom-hollow')drawMushroomHollow(ctx,u,focal,p);
  else if(focal.kind==='old-root')drawOldRoot(ctx,u,focal,p);
  else if(focal.kind==='stone-rise')drawStoneRise(ctx,u,focal,p);
  else if(focal.kind==='young-meadow')drawYoungMeadow(ctx,u,focal,p);
  else if(focal.kind==='trail-gate')drawTrailGate(ctx,u,focal,p);
  ctx.restore();
}

export function drawRegionalFocalForeground(ctx,{focal,px,py,u,season='SPRING'}){
  if(!focal||focal.strength<.60)return;ctx.save();ctx.translate(px,py);ctx.globalAlpha=.78;const p=seasonPalette(season,focal.kind);
  if(focal.kind==='reed-cove'||focal.kind==='reed-shelf'){
    for(let q=0;q<6;q++){const h=hash(focal.variant,q,1,4651),x=(-27+q*11+Math.floor(h*3))*u,ht=(7+Math.floor(hash(q,focal.variant,2,4657)*7))*u;ctx.fillStyle=q%3?p.reed:p.reed2;ctx.fillRect(x,10*u-ht,u,ht);if(q===1||q===4){ctx.fillStyle=p.seed;ctx.fillRect(x-u,9*u-ht,3*u,u)}}
  }else if(focal.kind==='berry-grove'){
    for(const x of [-25,21]){ctx.fillStyle=p.dark;ctx.fillRect(x*u,0,8*u,8*u);ctx.fillStyle=p.leaf;ctx.fillRect((x-2)*u,-3*u,11*u,5*u)}
  }else if(focal.kind==='old-root'){
    ctx.fillStyle=p.root;ctx.fillRect(-28*u,4*u,13*u,2*u);ctx.fillRect(15*u,3*u,14*u,2*u);ctx.fillStyle=p.rootHi;ctx.fillRect(-24*u,3*u,6*u,u);ctx.fillRect(19*u,2*u,7*u,u);
  }else if(focal.kind==='trail-gate'){
    ctx.fillStyle=p.dark;ctx.fillRect(-23*u,-2*u,4*u,9*u);ctx.fillRect(19*u,-1*u,4*u,8*u);ctx.fillStyle=p.leaf;ctx.fillRect(-26*u,-4*u,10*u,4*u);ctx.fillRect(16*u,-3*u,10*u,4*u);
  }
  ctx.restore();
}

function drawReedCove(c,u,f,p){
  c.fillStyle=p.mud;c.fillRect(-31*u,4*u,62*u,8*u);c.fillStyle=p.mudHi;c.fillRect(-22*u,2*u,42*u,3*u);if(f.kind==='reed-cove'){c.fillStyle=p.water;c.fillRect(-18*u,8*u,36*u,5*u)}
  for(let q=0;q<12;q++){const h=hash(f.variant,q,3,4663),x=(-30+q*5+Math.floor(h*3))*u,ht=(5+Math.floor(hash(q,f.variant,4,4669)*8))*u;c.fillStyle=q%3?p.reed:p.reed2;c.fillRect(x,4*u-ht,u,ht);if(q%4===0){c.fillStyle=p.seed;c.fillRect(x-u,3*u-ht,3*u,u)}}
}
function drawBerryGrove(c,u,f,p){
  c.fillStyle='rgba(21,35,22,.24)';c.fillRect(-30*u,5*u,60*u,8*u);const xs=[-22,-6,12];for(let n=0;n<xs.length;n++){const x=(xs[n]+(f.variant===n?2:0))*u;c.fillStyle=p.root;c.fillRect(x,0,2*u,9*u);c.fillStyle=p.dark;c.fillRect(x-7*u,-5*u,15*u,9*u);c.fillStyle=p.leaf;c.fillRect(x-5*u,-8*u,12*u,7*u);c.fillStyle=p.leafHi;c.fillRect(x-2*u,-10*u,7*u,4*u);c.fillStyle=p.berry;for(let q=0;q<3;q++)c.fillRect(x+(-4+q*4)*u,(-5+(q&1)*3)*u,u,u)}}
function drawMushroomHollow(c,u,f,p){
  c.fillStyle=p.soil;c.fillRect(-28*u,3*u,56*u,10*u);c.fillStyle=p.soilHi;c.fillRect(-18*u,1*u,36*u,3*u);const xs=[-21,-12,-2,9,20];for(let n=0;n<xs.length;n++){const h=hash(f.variant,n,5,4673),x=(xs[n]+Math.floor(h*3))*u,ht=(3+(n%3))*u;c.fillStyle=p.stem;c.fillRect(x,2*u-ht,u,ht+3*u);c.fillStyle=n%2?p.cap:p.cap2;c.fillRect(x-2*u,-ht*u,5*u,2*u);c.fillRect(x-u,-(ht+1)*u,3*u,u)}}
function drawOldRoot(c,u,f,p){
  c.fillStyle='rgba(19,29,19,.22)';c.fillRect(-31*u,5*u,62*u,8*u);c.fillStyle=p.root;c.fillRect(-4*u,-12*u,8*u,22*u);c.fillRect(-18*u,5*u,36*u,4*u);c.fillRect(-25*u,8*u,14*u,2*u);c.fillRect(11*u,8*u,16*u,2*u);c.fillStyle=p.rootHi;c.fillRect(-2*u,-11*u,2*u,16*u);c.fillRect(-15*u,4*u,12*u,u);c.fillStyle=p.dark;c.fillRect(-10*u,-14*u,20*u,5*u);c.fillStyle=p.leaf;c.fillRect(-15*u,-16*u,12*u,4*u);c.fillRect(4*u,-17*u,11*u,4*u)}
function drawStoneRise(c,u,f,p){
  c.fillStyle=p.dry;c.fillRect(-30*u,5*u,60*u,7*u);c.fillStyle=p.dryHi;c.fillRect(-18*u,3*u,37*u,3*u);const xs=[-15,1,13],ws=[10,13,8];for(let n=0;n<3;n++){const x=xs[n]*u,w=ws[n]*u,h=(5+n%2*2)*u;c.fillStyle=p.stone;c.fillRect(x-w/2,5*u-h,w,h);c.fillStyle=p.stoneHi;c.fillRect(x-w/2+u,4*u-h,Math.max(u,w-3*u),2*u)}}
function drawYoungMeadow(c,u,f,p){
  c.fillStyle=p.ground;c.fillRect(-29*u,6*u,58*u,5*u);for(let q=0;q<17;q++){const h=hash(f.variant,q,6,4681),x=(-28+Math.floor(h*56))*u,ht=(2+Math.floor(hash(q,f.variant,7,4687)*5))*u;c.fillStyle=q%4===0?p.bloom:q%2?p.shoot:p.shoot2;c.fillRect(x,7*u-ht,u,ht);if(q%4===0)c.fillRect(x-u,6*u-ht,3*u,u)}}
function drawTrailGate(c,u,f,p){
  c.fillStyle=p.track;c.fillRect(-31*u,4*u,62*u,5*u);c.fillStyle=p.trackHi;c.fillRect(-20*u,4*u,39*u,u);for(const x of [-22,20]){c.fillStyle=p.root;c.fillRect(x*u,0,5*u,9*u);c.fillStyle=p.dark;c.fillRect((x-3)*u,-4*u,11*u,5*u);c.fillStyle=p.leaf;c.fillRect((x-5)*u,-6*u,14*u,4*u)}}

function seasonPalette(season,kind){
  const winter=season==='WINTER',autumn=season==='AUTUMN',summer=season==='SUMMER';return {
    reed:winter?'#aaa078':autumn?'#777c50':'#6d8e58',reed2:winter?'#c2b58a':autumn?'#96905a':'#91a66a',seed:winter?'#d1c39b':autumn?'#b29b62':'#b6a16a',
    mud:'rgba(78,65,44,.42)',mudHi:'rgba(132,111,70,.30)',water:'rgba(75,137,132,.24)',
    root:winter?'#61533f':'#57432e',rootHi:winter?'#81705a':'#816240',dark:winter?'#4b4c3e':autumn?'#504b31':'#35472d',leaf:winter?'#686b55':autumn?'#75643d':'#557240',leafHi:winter?'#7b7c61':autumn?'#8b7445':'#6f8e4f',berry:autumn?'#c06a57':'#a95550',
    soil:'rgba(43,48,34,.48)',soilHi:'rgba(72,68,49,.34)',stem:'#8d806d',cap:winter?'#a69b84':'#9f8a72',cap2:winter?'#c2b79e':'#c6b28e',
    dry:summer?'rgba(157,126,70,.30)':'rgba(137,117,75,.24)',dryHi:'rgba(188,159,98,.24)',stone:'#777768',stoneHi:'#aaa58c',
    ground:'rgba(86,103,56,.18)',shoot:winter?'#7b866e':'#75a158',shoot2:winter?'#90987d':'#9abc68',bloom:winter?'#b4b6a0':season==='SPRING'?'#d3c983':'#c2ad72',
    track:'rgba(100,76,49,.28)',trackHi:'rgba(167,136,83,.18)'
  };
}
function hash(seed,x,y,salt=0){let n=(seed^Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function clamp01(v){return Math.max(0,Math.min(1,v))}
