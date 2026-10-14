// Larger-scale renderer-only terrain motifs. These summarize real hydrology, plant density,
// environmental history and habitat composition into memorable forms. They never create
// collision, resources, shelters, drinkable water, pathing, or simulation state.

export function terrainMotifFor(sim,scene){
  if(!scene||!scene.kind)return {kind:'none',strength:0};
  const w=sim.world,water=waterProfile(w,scene.x,scene.y,4),traffic=trafficProfile(sim,scene.x,scene.y,4),h=hash(scene.x,scene.y,3109),dry=scene.composition?.dryPocket||0,open=scene.composition?.openness||0,thicket=scene.composition?.thicket||0;
  let kind='none',strength=0,angle=water.angle;
  if(scene.kind==='watering-margin'&&water.near>.10&&(h>.52||(water.turn>.72&&h>.28))){
    kind=water.turn>.34?'bend-shelf':'bank-shelf';strength=scene.score*.58+water.near*.58+water.turn*.26+(scene.marshroot||0)*.30;
  }else if(scene.kind==='game-trail'&&traffic.weight>.16){
    kind=water.near>.055?'worn-water-approach':'worn-lane';strength=scene.score*.56+traffic.weight*.72;angle=traffic.angle;
  }else if(scene.kind==='thicket-pocket'&&thicket>.48&&(scene.bramble||0)>.055&&h>.67){
    kind='root-pocket';strength=scene.score*.54+thicket*.36+(scene.bramble||0)*.38;angle=seedAngle(h);
  }else if(scene.kind==='open-clearing'&&dry>.42&&h>.32){
    kind='dry-rise';strength=scene.score*.58+dry*.52+open*.18;angle=seedAngle(h);
  }else if(scene.kind==='fungal-hollow'&&(scene.nutrient||0)>.05&&h>.28){
    kind='drainage-hollow';strength=scene.score*.60+(scene.nutrient||0)*.48+(scene.moisture||0)*.14;angle=water.near>.03?water.angle:seedAngle(h);
  }else if(scene.kind==='recovery-patch'&&(scene.recovery||0)>.08&&h>.56){
    kind='soft-hollow';strength=scene.score*.62+(scene.recovery||0)*.66;angle=seedAngle(h);
  }
  return {kind,strength:clamp01(strength),angle,variant:Math.floor(h*4),water,traffic,seed:h};
}

export function drawTerrainMotifBackdrop(ctx,{sim,scene,px,py,u}){
  const p=terrainMotifFor(sim,scene);if(p.kind==='none'||p.strength<.47)return;ctx.save();ctx.translate(px,py);ctx.rotate(p.angle||0);ctx.globalAlpha=.62+.20*p.strength;
  if(p.kind==='bank-shelf'||p.kind==='bend-shelf')drawBankShelf(ctx,u,p);
  else if(p.kind==='worn-water-approach'||p.kind==='worn-lane')drawWornLane(ctx,u,p);
  else if(p.kind==='root-pocket')drawRootPocket(ctx,u,p);
  else if(p.kind==='dry-rise')drawDryRise(ctx,u,p);
  else if(p.kind==='drainage-hollow')drawDrainageHollow(ctx,u,p);
  else if(p.kind==='soft-hollow')drawSoftHollow(ctx,u,p);
  ctx.restore();
}

export function drawTerrainMotifForeground(ctx,{sim,scene,px,py,u}){
  const p=terrainMotifFor(sim,scene);if(p.strength<.55)return;ctx.save();ctx.translate(px,py);ctx.rotate(p.angle||0);ctx.globalAlpha=.70;
  if(p.kind==='root-pocket'){
    ctx.fillStyle='rgba(55,39,26,.82)';pixelLine(ctx,-15*u,8*u,-8*u,1*u,u);pixelLine(ctx,15*u,7*u,8*u,0,u,u);ctx.fillStyle='rgba(92,72,43,.72)';ctx.fillRect(-13*u,6*u,4*u,u);ctx.fillRect(9*u,5*u,4*u,u);
  }else if(p.kind==='bank-shelf'||p.kind==='bend-shelf'){
    ctx.fillStyle='rgba(105,125,72,.72)';for(let q=0;q<4;q++){const x=(-12+q*8+(q&1))*u,h=(3+(q%3))*u;ctx.fillRect(x,5*u-h,u,h)}
  }else if(p.kind==='dry-rise'){
    ctx.fillStyle='rgba(177,150,95,.45)';ctx.fillRect(-10*u,-6*u,5*u,u);ctx.fillRect(5*u,-5*u,4*u,u);
  }
  ctx.restore();
}

function drawBankShelf(c,u,p){
  // Water-facing side is +Y after rotation. Keep the shelf as separated soil shelves rather
  // than one translucent slab so it reads as terrain detail, not a UI/selection overlay.
  c.fillStyle='rgba(59,61,42,.24)';for(const [x,y,w,h] of [[-21,6,11,4],[-7,7,12,4],[9,7,12,4]])c.fillRect(x*u,y*u,w*u,h*u);
  c.fillStyle='rgba(111,94,57,.34)';c.fillRect(-18*u,3*u,11*u,2*u);c.fillRect(-3*u,4*u,13*u,2*u);c.fillRect(13*u,6*u,6*u,2*u);
  c.fillStyle='rgba(181,158,96,.20)';c.fillRect(-12*u,2*u,6*u,u);c.fillRect(2*u,3*u,7*u,u);
  c.fillStyle='rgba(34,58,43,.19)';c.fillRect(-18*u,12*u,9*u,u);c.fillRect(4*u,12*u,11*u,u);
  if(p.kind==='bend-shelf'){c.strokeStyle='rgba(80,70,46,.24)';c.lineWidth=Math.max(1,u);c.beginPath();c.arc(2*u,6*u,17*u,.10*Math.PI,.86*Math.PI);c.stroke()}
}
function drawWornLane(c,u,p){
  c.fillStyle='rgba(104,78,48,.24)';for(let q=-2;q<=2;q++){const x=(q*8+(q&1?1:-1))*u,w=(q===0?13:8)*u;c.fillRect(x-w/2,-2*u,w,3*u)}
  c.fillStyle='rgba(170,138,83,.16)';c.fillRect(-19*u,-2*u,9*u,u);c.fillRect(-5*u,-1*u,13*u,u);c.fillRect(11*u,-2*u,8*u,u);
  if(p.kind==='worn-water-approach'){c.fillStyle='rgba(65,72,49,.20)';c.fillRect(13*u,2*u,9*u,3*u)}
}
function drawRootPocket(c,u,p){
  c.fillStyle='rgba(18,35,24,.14)';c.fillRect(-19*u,5*u,11*u,4*u);c.fillRect(-4*u,5*u,9*u,4*u);c.fillRect(10*u,5*u,9*u,4*u);
  c.fillStyle='rgba(58,39,24,.82)';pixelLine(c,-20*u,10*u,-12*u,-2*u,u);pixelLine(c,-12*u,-2*u,-3*u,5*u,u);pixelLine(c,20*u,9*u,12*u,-3*u,u);pixelLine(c,12*u,-3*u,3*u,5*u,u);pixelLine(c,-8*u,9*u,-1*u,6*u,u);pixelLine(c,8*u,9*u,1*u,6*u,u);
  c.fillStyle='rgba(143,100,52,.65)';pixelLine(c,-19*u,8*u,-12*u,-3*u,u);pixelLine(c,19*u,7*u,12*u,-4*u,u);c.fillRect(-17*u,6*u,7*u,u);c.fillRect(10*u,5*u,7*u,u);
}
function drawDryRise(c,u,p){
  c.fillStyle='rgba(126,99,61,.14)';c.fillRect(-19*u,4*u,10*u,4*u);c.fillRect(-5*u,3*u,11*u,5*u);c.fillRect(11*u,4*u,8*u,4*u);c.fillStyle='rgba(95,78,57,.58)';c.fillRect(-14*u,-2*u,9*u,5*u);c.fillRect(-3*u,-5*u,12*u,8*u);c.fillRect(10*u,-1*u,7*u,4*u);c.fillStyle='rgba(174,151,96,.42)';c.fillRect(-12*u,-3*u,6*u,u);c.fillRect(-1*u,-6*u,8*u,u);c.fillRect(11*u,-2*u,4*u,u);c.fillStyle='rgba(53,47,38,.31)';c.fillRect(-13*u,3*u,8*u,2*u);c.fillRect(-2*u,3*u,10*u,2*u);c.fillRect(11*u,3*u,6*u,2*u);
}
function drawDrainageHollow(c,u,p){
  c.fillStyle='rgba(34,48,34,.18)';c.fillRect(-18*u,5*u,10*u,4*u);c.fillRect(-4*u,4*u,9*u,5*u);c.fillRect(10*u,5*u,8*u,4*u);c.strokeStyle='rgba(61,74,50,.38)';c.lineWidth=Math.max(1,u);c.beginPath();c.ellipse(0,4*u,17*u,6*u,0,0,Math.PI*2);c.stroke();c.fillStyle='rgba(99,88,61,.18)';c.fillRect(-11*u,8*u,8*u,u);c.fillRect(4*u,8*u,7*u,u);
}
function drawSoftHollow(c,u,p){
  c.fillStyle='rgba(86,75,47,.10)';c.fillRect(-17*u,4*u,9*u,4*u);c.fillRect(-4*u,3*u,8*u,5*u);c.fillRect(9*u,4*u,8*u,4*u);c.fillStyle='rgba(103,132,72,.20)';for(let q=0;q<5;q++){const x=(-14+q*7+(q&1))*u;c.fillRect(x,(1+(q%2))*u,5*u,2*u)}
}

function waterProfile(world,x,y,r=4){let weight=0,vx=0,vy=0,q=[0,0,0,0],count=0;for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){if(!ox&&!oy)continue;const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=world.n||ny>=world.n)continue;const d=Math.hypot(ox,oy);if(d>r||!world.water[world.idx(nx,ny)])continue;const w=1/(.65+d);weight+=w;vx+=ox*w;vy+=oy*w;count++;const qi=(ox>=0?1:0)+(oy>=0?2:0);q[qi]+=w}const total=Math.max(.001,weight),sorted=[...q].sort((a,b)=>b-a),turn=sorted[1]/Math.max(.001,sorted[0]+sorted[1]),angle=Math.atan2(vy,vx)-Math.PI/2;return {near:clamp01(weight/4.2),turn:clamp01(turn*1.9),angle,count}}
function trafficProfile(sim,x,y,r=4){const hist=sim.history,w=sim.world;if(!hist?.traffic)return {weight:0,angle:0};let total=0,vx=0,vy=0;for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){if(!ox&&!oy)continue;const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=w.n||ny>=w.n)continue;const t=hist.traffic[w.idx(nx,ny)]||0;if(t<=.01)continue;const d=Math.hypot(ox,oy),wt=t/(.7+d);total+=wt;vx+=ox*wt;vy+=oy*wt}return {weight:clamp01(total/1.25),angle:total>.001?Math.atan2(vy,vx):0}}
function seedAngle(h){return (Math.floor(h*8)%8)*(Math.PI/4)}
function hash(x,y,salt=0){let n=(Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function pixelLine(c,x0,y0,x1,y1,u){let x=Math.round(x0/u),y=Math.round(y0/u),tx=Math.round(x1/u),ty=Math.round(y1/u),dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1,err=dx-dy;for(let guard=0;guard<80;guard++){c.fillRect(x*u,y*u,u,u);if(x===tx&&y===ty)break;const e2=2*err;if(e2>-dy){err-=dy;x+=sx}if(e2<dx){err+=dx;y+=sy}}}
function clamp01(v){return Math.max(0,Math.min(1,v))}
