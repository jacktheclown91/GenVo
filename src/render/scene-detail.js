// Multi-tile visual staging for habitat scenes interpreted in scene.js. Everything
// here is cosmetic and is drawn beneath/around animals; it does not create objects.
export function drawHabitatSceneBackdrop(ctx,{scene,px,py,u,season='SPRING'}){
  const k=scene.kind,s=scene.score,seed=hash(scene.x,scene.y,1709);ctx.save();ctx.translate(px,py);ctx.globalAlpha=.72+Math.min(.18,s*.16);
  if(k==='watering-margin')drawWatering(ctx,u,seed,scene,season);
  else if(k==='feeding-ground')drawFeeding(ctx,u,seed,scene,season);
  else if(k==='fungal-hollow')drawFungal(ctx,u,seed,scene);
  else if(k==='recovery-patch')drawRecovery(ctx,u,seed,scene,season);
  else if(k==='thicket-pocket')drawThicket(ctx,u,seed,scene,season);
  else if(k==='open-clearing')drawClearing(ctx,u,seed,scene,season);
  else if(k==='game-trail')drawTrailNode(ctx,u,seed,scene);
  ctx.restore();
}

export function drawHabitatSceneForeground(ctx,{scene,px,py,u,season='SPRING'}){
  const k=scene.kind,seed=hash(scene.y,scene.x,1777);if(!['watering-margin','thicket-pocket','feeding-ground'].includes(k))return;ctx.save();ctx.translate(px,py);ctx.globalAlpha=.75;
  if(k==='watering-margin'){
    const reeds=season==='WINTER'?['#aa9f78','#c1b48a','#cdbd91']:season==='AUTUMN'?['#727b50','#8f8c57','#b39a61']:['#718d58','#8aa06a','#b09d69'];
    for(let q=0;q<4;q++){const ox=(-11+q*7+Math.floor(hash(scene.x+q,scene.y,1783)*3))*u,h=(3+Math.floor(hash(scene.y,scene.x+q,1789)*4))*u;ctx.fillStyle=q&1?reeds[0]:reeds[1];ctx.fillRect(ox,7*u,u,h);if(q===1||q===3){ctx.fillStyle=reeds[2];ctx.fillRect(ox-u,6*u,3*u,u)}}
  }else if(k==='thicket-pocket'){
    const dark=season==='AUTUMN'?'#4c4931':'#30462e',mid=season==='AUTUMN'?'#70633f':'#526f43';
    for(let q=0;q<5;q++){const h=hash(scene.x+q*5,scene.y-q*3,1793),ox=(-11+q*5+Math.floor(h*2))*u,oy=(5+(q&1)+Math.floor(h*2))*u,w=(3+Math.floor(h*3))*u,ht=(2+(q%3===0?1:0))*u;ctx.fillStyle=q%2?mid:dark;ctx.fillRect(ox,oy,w,ht);if(q===1||q===4){ctx.fillStyle=season==='AUTUMN'?'#85754b':'#688752';ctx.fillRect(ox+u,oy-u,Math.max(u,w-2*u),u)}}
  }else{
    ctx.fillStyle='rgba(85,104,54,.86)';for(let q=0;q<5;q++){const ox=(-10+q*5)*u,h=(2+(q&1))*u;ctx.fillRect(ox,8*u,u,h)}
  }
  ctx.restore();
}

function drawWatering(c,u,seed,scene,season){
  c.fillStyle='rgba(70,62,43,.34)';c.fillRect(-14*u,1*u,28*u,7*u);c.fillStyle='rgba(112,100,63,.30)';c.fillRect(-10*u,0,19*u,2*u);c.fillStyle='rgba(51,78,58,.25)';c.fillRect(-7*u,6*u,15*u,2*u);
  const reed=season==='WINTER'?['#b9ad83','#9a9270','#d0c19a']:season==='AUTUMN'?['#9a925b','#70794f','#b9a06a']:['#94a568','#718d58','#b5a06b'];
  for(let q=0;q<8;q++){const ox=(-13+q*4+Math.floor(hash(q,seed,1711)*2))*u,h=(4+Math.floor(hash(seed,q,1717)*6))*u;c.fillStyle=q%3===0?reed[0]:reed[1];c.fillRect(ox,-h+4*u,u,h);if(q%3===0){c.fillStyle=reed[2];c.fillRect(ox-u,-h+3*u,3*u,u)}}
  c.fillStyle='rgba(181,160,104,.45)';for(let q=0;q<4;q++){const ox=(-9+Math.floor(hash(seed+q,q,1721)*18))*u,oy=(4+Math.floor(hash(q,seed+q,1723)*3))*u;c.fillRect(ox,oy,(q&1?2:1)*u,u)}
}
function drawFeeding(c,u,seed,scene,season){
  c.fillStyle='rgba(108,84,48,.22)';c.fillRect(-11*u,3*u,22*u,5*u);c.fillStyle='rgba(175,153,85,.22)';c.fillRect(-7*u,3*u,13*u,u);
  const leaf=season==='AUTUMN'?'#766742':'#658249';for(let q=0;q<7;q++){const ox=(-12+q*4+Math.floor(hash(seed,q,1733)*2))*u,oy=(-1+Math.floor(hash(q,seed,1739)*6))*u;c.fillStyle=leaf;c.fillRect(ox,oy,2*u,3*u);if(q%2===0&&scene.bramble>.12){c.fillStyle='#ba6456';c.fillRect(ox+u,oy,u,u)}}
}
function drawFungal(c,u,seed,scene){
  c.fillStyle='rgba(33,46,29,.38)';c.fillRect(-12*u,1*u,24*u,8*u);c.fillStyle='rgba(57,54,39,.28)';c.fillRect(-8*u,0,16*u,2*u);
  for(let q=0;q<8;q++){const ox=(-10+Math.floor(hash(seed,q,1741)*20))*u,oy=(1+Math.floor(hash(q,seed,1747)*6))*u,h=(1+(q%3===0?1:0))*u;c.fillStyle='#76695a';c.fillRect(ox,oy,h,3*u);c.fillStyle=q<2?'#d1c49f':'#aa9875';c.fillRect(ox-u,oy-u,3*u,u)}
}
function drawRecovery(c,u,seed,scene,season='SPRING'){
  c.fillStyle='rgba(113,86,51,.17)';c.fillRect(-12*u,3*u,24*u,5*u);const cols=season==='WINTER'?['#78816b','#65705f','#a3aa8b']:season==='AUTUMN'?['#92965b','#777d4f','#b5a269']:['#9bbc69','#75a457','#b4c977'];for(let q=0;q<11;q++){const ox=(-12+Math.floor(hash(seed,q,1753)*24))*u,oy=(1+Math.floor(hash(q,seed,1759)*7))*u,h=(2+q%3)*u;c.fillStyle=q%3===0?cols[0]:cols[1];c.fillRect(ox,oy-h,u,h);if(q%4===0){c.fillStyle=cols[2];c.fillRect(ox-u,oy-h,2*u,u)}}
}
function drawThicket(c,u,seed,scene,season){
  const dark=season==='AUTUMN'?'#4e4b31':'#3f5837',mid=season==='AUTUMN'?'#6a6240':'#557344',light=season==='AUTUMN'?'#81734b':'#6f8b50';
  c.fillStyle='rgba(10,26,17,.18)';for(let q=0;q<4;q++){const h=hash(seed+q*3,q,1801),ox=(-13+q*7+Math.floor(h*3))*u,oy=(3+Math.floor(hash(q,seed,1807)*4))*u;c.fillRect(ox,oy,(4+Math.floor(h*3))*u,(2+(q&1))*u)}
  for(let q=0;q<7;q++){const h=hash(seed,q,1811),ox=(-12+q*4+Math.floor(h*2))*u,base=(4+Math.floor(hash(q,seed,1817)*4))*u,w=(3+Math.floor(h*3))*u,ht=(3+Math.floor(hash(seed+q,q,1823)*4))*u;c.fillStyle=q%3===0?light:q%2?mid:dark;c.fillRect(ox,base-ht,w,ht);if(q%2===0){c.fillStyle=dark;c.fillRect(ox+Math.floor(w/2),base,u,2*u)}}
  if(scene.bramble>.15){c.fillStyle='#b96053';for(let q=0;q<5;q++){const h=hash(seed+q,q,1829);c.fillRect((-10+q*5+Math.floor(h*2))*u,(-3+(q&1)*4+Math.floor(h*2))*u,u,u)}}
}
function drawClearing(c,u,seed,scene,season='SPRING'){
  c.fillStyle=season==='WINTER'?'rgba(179,196,176,.08)':season==='SUMMER'?'rgba(191,157,83,.12)':'rgba(174,151,91,.10)';c.fillRect(-15*u,1*u,30*u,6*u);c.fillStyle='rgba(91,74,47,.13)';c.fillRect(-10*u,5*u,20*u,u);for(let q=0;q<4;q++){const ox=(-12+Math.floor(hash(seed,q,1763)*24))*u,oy=(1+Math.floor(hash(q,seed,1769)*6))*u;c.fillStyle='rgba(186,163,100,.28)';c.fillRect(ox,oy,(q&1?2:1)*u,u)}
}
function drawTrailNode(c,u,seed,scene){
  c.fillStyle='rgba(104,78,48,.22)';c.fillRect(-14*u,3*u,28*u,3*u);c.fillStyle='rgba(167,137,82,.16)';c.fillRect(-7*u,3*u,10*u,u);
}
function hash(x,y,salt=0){let n=(Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
