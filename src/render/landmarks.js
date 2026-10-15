// Sparse authored habitat signatures. A landmark is only shown when a real scene already
// scores strongly for that ecology; it never creates resources or collision.
export function landmarkProfileFor(scene){
  if(!scene||!scene.kind)return {kind:'none',strength:0};
  const h=hash(scene.x,scene.y,2303),s=scene.score||0;let kind='none',strength=0;
  if(scene.kind==='watering-margin'&&scene.marshroot>.09){kind='reed-fan';strength=s*.7+scene.marshroot*.8}
  else if(scene.kind==='fungal-hollow'&&scene.rotcap>.035){kind='mushroom-ring';strength=s*.8+scene.rotcap*2.4}
  else if(scene.kind==='thicket-pocket'&&scene.bramble>.08){kind='berry-thicket';strength=s*.76+scene.bramble*.65}
  else if(scene.kind==='feeding-ground'){
    if(scene.bramble>.11){kind='berry-thicket';strength=s*.62+scene.bramble*.62}
    else if(scene.thistlepod>.09){kind='pod-stand';strength=s*.66+scene.thistlepod*.72}
    else{kind='moss-hummock';strength=s*.72+(scene.food||0)*.35}
  }else if(scene.kind==='recovery-patch'){kind='young-growth';strength=s*.82+(scene.recovery||0)*.65}
  else if(scene.kind==='open-clearing'&&h>.42){kind='stone-rest';strength=s*.72}
  else if(scene.kind==='game-trail'&&h>.56){kind='root-crossing';strength=s*.68+(scene.traffic||0)*.35}
  return {kind,strength:clamp01(strength),variant:Math.floor(h*4),seed:h};
}

export function drawSceneLandmarkBackdrop(ctx,{scene,px,py,u,season='SPRING'}){
  const p=landmarkProfileFor(scene);if(p.kind==='none'||p.strength<.46)return;ctx.save();ctx.translate(px,py);ctx.globalAlpha=.76+.16*p.strength;
  // Edible silhouettes belong exclusively to canonical flora. Keep non-food place markers.
  if(p.kind==='stone-rest')stoneRest(ctx,u,p);
  else if(p.kind==='root-crossing')rootCrossing(ctx,u,p);
  ctx.restore();
}

// Compatibility export: no decorative food or floor features above the creature plane.
export function drawSceneLandmarkForeground(){}

function stoneRest(c,u,p){c.fillStyle='rgba(34,43,32,.24)';c.fillRect(-10*u,6*u,20*u,3*u);const stones=[[-8,3,5,4],[-2,1,6,5],[5,4,5,3]];for(let q=0;q<stones.length;q++){const [x,y,w,h]=stones[q];c.fillStyle=q===1?'#777768':'#686b5e';c.fillRect(x*u,y*u,w*u,h*u);c.fillStyle='#92907b';c.fillRect((x+1)*u,y*u,Math.max(1,w-2)*u,u);c.fillStyle='#55594f';c.fillRect(x*u,(y+h-1)*u,w*u,u)}}
function rootCrossing(c,u,p){c.fillStyle='rgba(91,68,43,.28)';c.fillRect(-13*u,5*u,26*u,3*u);c.fillStyle='#60462e';line(c,-13*u,4*u,12*u,7*u,u);line(c,-5*u,5*u,-1*u,1*u,u);line(c,4*u,6*u,9*u,2*u,u);c.fillStyle='#856340';c.fillRect(-8*u,4*u,8*u,u);c.fillRect(2*u,5*u,6*u,u)}
function line(c,x0,y0,x1,y1,u){let x=Math.round(x0/u),y=Math.round(y0/u),tx=Math.round(x1/u),ty=Math.round(y1/u),dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1,err=dx-dy;for(let g=0;g<48;g++){c.fillRect(x*u,y*u,u,u);if(x===tx&&y===ty)break;const e2=2*err;if(e2>-dy){err-=dy;x+=sx}if(e2<dx){err+=dx;y+=sy}}}
function hash(x,y,salt=0){let n=(Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function clamp01(v){return Math.max(0,Math.min(1,v))}
