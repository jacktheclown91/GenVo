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
  if(p.kind==='reed-fan')reedFan(ctx,u,p,season);
  else if(p.kind==='mushroom-ring')mushroomRing(ctx,u,p);
  else if(p.kind==='berry-thicket')berryThicket(ctx,u,p,season);
  else if(p.kind==='pod-stand')podStand(ctx,u,p,season);
  else if(p.kind==='moss-hummock')mossHummock(ctx,u,p,season);
  else if(p.kind==='young-growth')youngGrowth(ctx,u,p,season);
  else if(p.kind==='stone-rest')stoneRest(ctx,u,p);
  else if(p.kind==='root-crossing')rootCrossing(ctx,u,p);
  ctx.restore();
}

export function drawSceneLandmarkForeground(ctx,{scene,px,py,u,season='SPRING'}){
  const p=landmarkProfileFor(scene);if(p.strength<.54)return;ctx.save();ctx.translate(px,py);ctx.globalAlpha=.78;
  if(p.kind==='reed-fan'){
    const r=season==='WINTER'?['#8f8768','#b8aa7d']:season==='AUTUMN'?['#626d47','#898553']:['#526d45','#78905c'];ctx.fillStyle=r[0];for(let q=0;q<3;q++){const x=(-10+q*9)*u,h=(5+(q&1)*3)*u;ctx.fillRect(x,5*u,u,h);ctx.fillStyle=r[1];ctx.fillRect(x+(q-1)*u,3*u,u,4*u);ctx.fillStyle=r[0]}
  }else if(p.kind==='berry-thicket'){
    const leaf=season==='AUTUMN'?'#62583b':'#405b36';ctx.fillStyle=leaf;ctx.fillRect(-12*u,5*u,5*u,4*u);ctx.fillRect(7*u,4*u,6*u,5*u);ctx.fillStyle=season==='AUTUMN'?'#806a42':'#627b48';ctx.fillRect(-10*u,4*u,3*u,u);ctx.fillRect(8*u,3*u,4*u,u);
  }else if(p.kind==='pod-stand'){
    ctx.fillStyle='#6c7244';ctx.fillRect(-11*u,4*u,u,7*u);ctx.fillRect(10*u,3*u,u,8*u);ctx.fillStyle='#bba35f';ctx.fillRect(-12*u,3*u,3*u,2*u);ctx.fillRect(9*u,2*u,3*u,2*u);
  }
  ctx.restore();
}

function reedFan(c,u,p,season='SPRING'){const r=season==='WINTER'?['#9a9070','#b4aa80','#c7b88e']:season==='AUTUMN'?['#69744b','#8a8655','#b19a63']:['#536f48','#70895a','#aa9762'];c.fillStyle='rgba(41,61,40,.30)';c.fillRect(-13*u,6*u,27*u,4*u);for(let q=0;q<9;q++){const x=(-11+q*3+(q%3===0?1:0))*u,h=(5+(q%4)*2)*u,lean=(q%3)-1;c.fillStyle=q%2?r[1]:r[0];line(c,x,7*u,x+lean*u,7*u-h,u);if(q<5){c.fillStyle=r[2];c.fillRect(x+lean*u-u,6*u-h,3*u,u)}}}
function mushroomRing(c,u,p){c.fillStyle='rgba(35,43,29,.30)';c.fillRect(-11*u,4*u,22*u,5*u);const pts=[[-9,5],[-5,1],[0,-1],[6,1],[10,5],[4,7],[-4,7]];for(let q=0;q<pts.length;q++){const [x,y]=pts[q],big=q===2||q===4;c.fillStyle='#6d5e50';c.fillRect(x*u,y*u,u,(big?4:3)*u);c.fillStyle=q===2?'#d3c399':'#aa9670';c.fillRect((x-(big?2:1))*u,(y-1)*u,(big?5:3)*u,u);if(big){c.fillStyle='#c3ae83';c.fillRect((x-1)*u,(y-2)*u,3*u,u)}}}
function berryThicket(c,u,p,season){const dark=season==='WINTER'?'#3f4538':season==='AUTUMN'?'#4d4932':'#30492f',mid=season==='WINTER'?'#555a45':season==='AUTUMN'?'#665b3a':'#4e6e42',light=season==='WINTER'?'#70725b':season==='AUTUMN'?'#806d43':'#6b8950';c.fillStyle='#4e3826';line(c,-8*u,8*u,-2*u,-4*u,u);line(c,8*u,8*u,2*u,-5*u,u);line(c,-2*u,-1*u,5*u,2*u,u);c.fillStyle=dark;c.fillRect(-11*u,-2*u,8*u,6*u);c.fillRect(3*u,-3*u,9*u,7*u);c.fillStyle=mid;c.fillRect(-6*u,-6*u,9*u,6*u);c.fillRect(0,-5*u,7*u,5*u);c.fillStyle=light;c.fillRect(-4*u,-7*u,5*u,2*u);c.fillRect(5*u,-4*u,4*u,2*u);c.fillStyle='#bd5b51';for(const [x,y] of [[-8,0],[-3,-4],[1,-2],[7,-1],[9,2]])c.fillRect(x*u,y*u,u,u)}
function podStand(c,u,p,season='SPRING'){const stem=season==='WINTER'?'#766f58':season==='AUTUMN'?'#756f44':'#6d7445',pod=season==='SUMMER'||season==='AUTUMN'?['#c9b06a','#a99055','#dfc47b']:season==='WINTER'?['#a99169','#897759','#baa17a']:['#c9b06a','#a99a57','#d8bd75'];for(let q=0;q<7;q++){const x=(-9+q*3)*u,h=(5+(q%3)*2)*u,lean=q%2?1:-1;c.fillStyle=stem;line(c,x,7*u,x+lean*u,7*u-h,u);c.fillStyle=q===3?pod[0]:pod[1];c.fillRect(x+lean*u-u,5*u-h,3*u,2*u);if(q<3){c.fillStyle=pod[2];c.fillRect(x+lean*u,4*u-h,u,u)}}}
function mossHummock(c,u,p,season='SPRING'){c.fillStyle='rgba(39,58,34,.34)';c.fillRect(-12*u,5*u,24*u,5*u);const shades=season==='WINTER'?['#52645a','#66776a','#7d8b79']:season==='AUTUMN'?['#677143','#7c824b','#94955a']:['#587a42','#6d914e','#81a65a'];for(let q=0;q<11;q++){const x=(-10+q*2)*u,y=(4-(q%3===0?2:q%2))*u;c.fillStyle=shades[q%3];c.fillRect(x,y,u,(3+(q&1))*u);if(q%4===0)c.fillRect(x-u,y+u,2*u,u)}}
function youngGrowth(c,u,p,season='SPRING'){c.fillStyle='rgba(102,79,46,.20)';c.fillRect(-11*u,6*u,22*u,3*u);const cols=season==='WINTER'?['#8a9278','#6c7866']:season==='AUTUMN'?['#a3a15f','#81864d']:['#a4bf68','#78a554'];for(let q=0;q<9;q++){const x=(-10+q*2.5)*u,h=(3+(q%3))*u;c.fillStyle=q%3===0?cols[0]:cols[1];c.fillRect(x,6*u-h,u,h);if(q%2===0)c.fillRect(x-u,6*u-h,2*u,u)}}
function stoneRest(c,u,p){c.fillStyle='rgba(34,43,32,.24)';c.fillRect(-10*u,6*u,20*u,3*u);const stones=[[-8,3,5,4],[-2,1,6,5],[5,4,5,3]];for(let q=0;q<stones.length;q++){const [x,y,w,h]=stones[q];c.fillStyle=q===1?'#777768':'#686b5e';c.fillRect(x*u,y*u,w*u,h*u);c.fillStyle='#92907b';c.fillRect((x+1)*u,y*u,Math.max(1,w-2)*u,u);c.fillStyle='#55594f';c.fillRect(x*u,(y+h-1)*u,w*u,u)}}
function rootCrossing(c,u,p){c.fillStyle='rgba(91,68,43,.28)';c.fillRect(-13*u,5*u,26*u,3*u);c.fillStyle='#60462e';line(c,-13*u,4*u,12*u,7*u,u);line(c,-5*u,5*u,-1*u,1*u,u);line(c,4*u,6*u,9*u,2*u,u);c.fillStyle='#856340';c.fillRect(-8*u,4*u,8*u,u);c.fillRect(2*u,5*u,6*u,u)}
function line(c,x0,y0,x1,y1,u){let x=Math.round(x0/u),y=Math.round(y0/u),tx=Math.round(x1/u),ty=Math.round(y1/u),dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1,err=dx-dy;for(let g=0;g<48;g++){c.fillRect(x*u,y*u,u,u);if(x===tx&&y===ty)break;const e2=2*err;if(e2>-dy){err-=dy;x+=sx}if(e2<dx){err+=dx;y+=sy}}}
function hash(x,y,salt=0){let n=(Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function clamp01(v){return Math.max(0,Math.min(1,v))}
