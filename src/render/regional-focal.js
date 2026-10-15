import {drawHabitatGround} from './habitat-ground.js';
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
 if(!focal||focal.strength<.56)return;
 // Broader rooted floor structure; never fabricated berries, mushrooms or water.
 for(const [dx,dy,turn] of [[-17,-3,0],[14,5,1]])drawHabitatGround(ctx,{kind:focal.kind,px:px+dx*u,py:py+dy*u,u,season,strength:focal.strength,variant:(focal.variant+turn)%4,size:.9});
}
export function drawRegionalFocalForeground(){}

function hash(seed,x,y,salt=0){let n=(seed^Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function clamp01(v){return Math.max(0,Math.min(1,v))}
