import {pixel,pixelLine,snap} from './pixel-art.js';
import {drawAuthoredShrub,drawAuthoredMoss} from './authored-flora.js';
// Authored pixel silhouettes for the five canonical plant families. This module is
// presentation-only: callers pass canonical biomass/season/shore information and it
// draws from deterministic coordinates without touching simulation RNG or world state.

export function floraAnchor(shape,x,y){
  const jit=(shape==='tuft'?3:shape==='reed'?1.5:2.5),pull=shape==='reed'?.2:.4,ccx=(x>>1)*2+1+(hash2(x>>1,y>>1,9011)-.5)*.9,ccy=(y>>1)*2+1+(hash2(x>>1,y>>1,9013)-.5)*.9;
  const jx=snap((hash2(x,y,9001)-.5)*2*jit+(ccx-(x+.5))*16*pull),jy=snap((hash2(x,y,9007)-.5)*2*jit+(ccy-(y+.5))*16*pull);
  return{jx,jy};
}

export function drawFloraPlant(ctx,{shape,color,amount,px,py,u,x,y,kind,seedAllocation=.2,coatAllocation=.25,reproduction=null,season='SPRING',isWater=()=>false}){
  if(!(amount>0))return;
  const seed=hash2(x,y,kind.length*17),cluster=hash2(x>>1,y>>1,kind.length*31),density=Math.max(1,Math.min(5,Math.ceil(amount*5)));
  // v1.41.0: each tile's plant sits a little off-centre (fixed per tile), so plants no longer line up in a grid.
  // v1.50.0: plants also lean towards a shared clump centre (one per 2x2 tiles), so they gather in clumps with gaps between instead of a grid.
  const {jx,jy}=floraAnchor(shape,x,y);
  ctx.save();ctx.translate(px+jx*u,py+jy*u);
  const seasonal=seasonalBase(color,season,kind),body=tintHex(seasonal,(seed-.5)*10,(cluster-.5)*8),light=tintHex(seasonal,(cluster-.5)*8,10),shade=tintHex(seasonal,0,-14),deep=tintHex(seasonal,0,-22);
  if(shape==='tuft')drawMoss(ctx,{x,y,u,density,body,light,shade,seed,amount,season});
  else if(shape==='shrub')drawBerryShrub(ctx,{x,y,u,density,body,light,shade,deep,seed,cluster,amount,season,seedAllocation});
  else if(shape==='reed')drawReedFan(ctx,{x,y,u,density,body,light,shade,seed,isWater,season});
  else if(shape==='fungus')drawMushrooms(ctx,{x,y,u,density,body,light,shade,seed,amount,season});
  else if(shape==='pod')drawSeedPods(ctx,{x,y,u,density,body,light,shade,seed,amount,season,coatAllocation});
  else pixel(ctx,7,7,2,2,u,body);
  if(reproduction?.receptive){pixel(ctx,6,4,3,1,u,'#e4d1b0');pixel(ctx,7,3,1,3,u,'#e4d1b0');pixel(ctx,7,4,1,1,u,'#e6bd63')}if(reproduction?.pollen){pixel(ctx,10,4,1,1,u,'#dfba5b');pixel(ctx,11,6,1,1,u,'#e9d37d')}if(reproduction?.developing){pixel(ctx,6,6,3,2,u,'#bd9c58');pixel(ctx,7,6,1,1,u,'#dfc47d')}
  ctx.restore();
}

export function floraTraceAnchor(kind,x,y){return{ox:3+Math.floor(hash2(x,y,kind.length*337)*10),oy:11+Math.floor(hash2(y,x,341)*3)}}
export function drawFloraTrace(ctx,{shape,color,px,py,u,x,y,kind}){
  const h=hash2(x,y,kind.length*337),{ox,oy}=floraTraceAnchor(kind,x,y),body=tintHex(color,0,-2),light=tintHex(color,0,9);ctx.save();ctx.translate(px,py);
  if(shape==='tuft'){pixel(ctx,ox,oy-1,1,2,u,body);if(h>.55)pixel(ctx,ox+1,oy-2,1,2,u,light)}
  else if(shape==='shrub'){pixel(ctx,ox,oy-2,1,3,u,'#5b452c');pixel(ctx,ox-1,oy-3,3,2,u,body)}
  else if(shape==='reed'){pixel(ctx,ox,oy-3,1,4,u,body);if(h>.6)pixel(ctx,ox+2,oy-4,1,5,u,light)}
  else if(shape==='fungus'){pixel(ctx,ox,oy-1,1,2,u,'#77675a');pixel(ctx,ox-1,oy-2,3,1,u,body)}
  else if(shape==='pod'){pixel(ctx,ox,oy-3,1,4,u,body);pixel(ctx,ox-1,oy-4,3,1,u,light)}
  ctx.restore();
}

export function floraSeedlingAnchor(kind,x,y){return{ox:3+snap(hash2(x,y,kind.length*251)*10),base:7+snap(hash2(y,x,257)*7)}}
export function drawFloraSeedling(ctx,{p,amount,bank,px,py,u,x,y,kind}){
  const {ox,base}=floraSeedlingAnchor(kind,x,y),stem=tintHex(p.color,0,-15),leaf=tintHex(p.color,0,13),leaf2=tintHex(p.color,0,4);
  ctx.save();ctx.translate(px,py);if(amount<=.002){for(const [dx,dy] of [[-1,0],[1,1],[2,-1]])pixel(ctx,ox+dx,base+dy,1,1,u,'#b9a264');ctx.restore();return}pixel(ctx,ox,base-3,.5,4,u,stem);
  // Two offset leaves make seedlings read as actual plants rather than a generic T shape.
  pixel(ctx,ox-2,base-4,2,1,u,leaf);pixel(ctx,ox-1,base-5,1,1,u,leaf);
  if(amount>.02||bank>.12){pixel(ctx,ox+1,base-5,2,1,u,leaf2);pixel(ctx,ox+2,base-6,1,1,u,leaf2)}
  ctx.restore();
}

function drawMoss(c,{x,y,u,density,body,light,shade,seed,amount,season}){
  if(drawAuthoredMoss(c,{u,density,body,light,shade,amount,season}))return;
  const patches=2+Math.min(3,density);
  for(let k=0;k<patches;k++){
    const q=hash2(x+k*7,y-k*5,107),cx=3+Math.floor(hash2(x+k,y-k,109)*10),base=11+Math.floor(hash2(y+k,x-k,113)*3),reach=1+(q>.55?1:0);
    pixel(c,cx-1,base,3,1,u,shade);pixel(c,cx,base-1,1,1,u,body);
    pixel(c,cx-reach,base-2,1+reach,1,u,k%3===0?light:body);pixel(c,cx+1,base-3,1+(q>.72?1:0),1,u,body);
    if(q>.68)pixel(c,cx-2,base-1,1,1,u,light);
  }
  if(amount>.72&&seed>.42){const cx=6+Math.floor(seed*4);pixel(c,cx,7,1,4,u,shade);pixel(c,cx-1,7,3,1,u,light)}
  if(season==='SPRING'&&amount>.45&&seed>.58){const cx=4+Math.floor(seed*7);pixel(c,cx,8,1,1,u,'#c9d89a')}
  if(season==='WINTER'&&seed>.62){const cx=3+Math.floor(seed*8);pixel(c,cx,11,3,1,u,'rgba(190,211,198,.24)')}
}

function drawBerryShrub(c,{x,y,u,density,body,light,shade,deep,seed,cluster,amount,season,seedAllocation=.2}){
  if(drawAuthoredShrub(c,{u,density,body,light,shade,deep,amount,season,seedAllocation}))return;
  const v=Math.floor(seed*4),cx=6+Math.floor(cluster*3),base=13;
  // Visible branching skeleton makes the resource feel like a shrub rather than stacked rectangles.
  pixelLine(c,cx,base,cx,6,u,'#5c472d');pixelLine(c,cx,9,cx-4,5+(v&1),u,'#684e2d');pixelLine(c,cx,8,cx+4,4+((v>>1)&1),u,'#684e2d');
  if(v===3)pixelLine(c,cx-1,10,cx-5,8,u,'#5a432b');
  const crowns=[[-4,-7,4,3],[-1,-9,5,4],[3,-7,4,3],[-2,-5,4,3],[2,-5,4,3]];
  for(let q=0;q<crowns.length;q++){
    const [dx,dy,w,h]=crowns[q],j=hash2(x+q*11,y-q*7,127);if(q===4&&density<3)continue;
    const ox=cx+dx+(j>.72?1:0),oy=base+dy+(j<.25?1:0);pixel(c,ox,oy,w,h,u,q%3===0?deep:q%2?body:shade);
    if(q===1||q===2)pixel(c,ox+1,oy,Math.max(1,w-2),1,u,light);
  }
  if(season==='SPRING'&&amount>.34){for(const [bx,by] of [[cx-4,5],[cx+3,4],[cx,3]])pixel(c,bx,by,1,1,u,'#d9d5ad')}
  if(season==='WINTER'){pixel(c,cx-5,base-4,2,1,u,'#6b5c42');pixel(c,cx+4,base-5,2,1,u,'#6b5c42')}
  // Berries appear as small attached fruit rather than free-floating red pixels.
  if(season==='AUTUMN'||amount>.58){const fruit=Math.min(5,2+density);for(let k=0;k<fruit;k++){const q=hash2(x+k*13,y-k*3,131),bx=cx-4+Math.floor(q*9),by=4+Math.floor(hash2(y-k,x+k,137)*6);const flesh=seedAllocation<.2?2:1;pixel(c,bx,by,flesh,1,u,seedAllocation>.2?'#bd9c58':k&1?'#d36c58':'#b9544f');if(k===0)pixel(c,bx,by-1,1,1,u,'#71834d')}}
}

function drawReedFan(c,{x,y,u,density,body,light,shade,seed,isWater,season}){
  const nearN=isWater(x,y-1),nearS=isWater(x,y+1),nearW=isWater(x-1,y),nearE=isWater(x+1,y),cx=nearW?4:nearE?10:7,base=nearN?8:nearS?14:13;
  const stems=Math.min(6,density+2);
  for(let k=0;k<stems;k++){
    const q=hash2(x+k*5,y-k*7,149),rootX=cx-3+k,ht=4+Math.floor(q*5),lean=(k%3)-1,tipX=rootX+lean;
    pixelLine(c,rootX,base,tipX,base-ht,u,k%2?body:shade);
    if(k<3||q>.74){const head=season==='WINTER'?'#b8a77e':season==='AUTUMN'?'#b59a5f':'#aa9761',cap=season==='WINTER'?'#d0c29d':'#c0ad73';pixel(c,tipX-(lean<0?1:0),base-ht-1,2,1,u,head);pixel(c,tipX,base-ht-2,1,1,u,cap)}
    if(k===1||k===4)pixelLine(c,rootX,base-2,rootX+(k===1?-2:2),base-4,u,light);
  }
  pixel(c,cx-3,base,7,1,u,'rgba(54,76,44,.55)');
}

function drawMushrooms(c,{x,y,u,density,body,light,shade,seed,amount,season}){
  const count=Math.min(5,density+1),centers=[];
  for(let k=0;k<count;k++){
    const q=hash2(x+k*4,y-k,151),ox=3+Math.floor(q*10),ground=12-Math.floor(hash2(y+k,x-k,157)*2),h=2+Math.floor(hash2(x,y+k,163)*3),wide=(k===0&&amount>.42)||q>.72;
    centers.push([ox,ground]);pixel(c,ox,ground-h,1,h,u,k&1?'#77675a':'#6a5d50');
    const cap=wide?5:3;pixel(c,ox-Math.floor(cap/2),ground-h-1,cap,1,u,k===0?light:body);pixel(c,ox-(wide?1:0),ground-h-2,wide?3:1,1,u,k===0?(season==='AUTUMN'?'#d7b98d':'#d7c8a1'):body);
    if(wide)pixel(c,ox-2,ground-h,1,1,u,shade);
  }
  if(count>=3&&seed>.5){const [a,b]=centers[0], [d,e]=centers[count-1];pixel(c,snap((a+d)/2),snap((b+e)/2),1,1,u,'rgba(194,176,133,.50)')}
}

function drawSeedPods(c,{x,y,u,density,body,light,shade,seed,amount,season,coatAllocation=.25}){
  const stems=amount<.18?1:Math.min(5,density+1),base=13,cx=4+Math.floor(seed*5);
  for(let k=0;k<stems;k++){
    const q=hash2(x+k*7,y-k*3,167),root=cx+k*2-2,ht=4+Math.floor(q*4),lean=k%2?1:-1;
    pixelLine(c,root,base,root+lean,base-ht,u,k%2?'#737b46':shade);
    const tx=root+lean,ty=base-ht,pod=season==='SUMMER'||season==='AUTUMN'?(k===1?'#c8af62':'#a99052'):(k===1?light:body);const shell=coatAllocation>.25?'#75633d':coatAllocation<.25?'#ceb77c':pod;if(coatAllocation>.25){pixel(c,tx-2,ty-2,5,3,u,shell);pixel(c,tx-1,ty-1,3,1,u,pod)}else pixel(c,tx-1,ty-1,coatAllocation<.25?2:3,2,u,shell);
    pixel(c,tx+(lean>0?2:-2),ty,1,1,u,'#cbb16a');
    if(amount>.58&&k<2){pixel(c,tx-1,ty-2,1,1,u,'#dfc47d');pixel(c,tx+1,ty-2,1,1,u,'#a88d50')}
  }
}

function hash2(x,y,salt=0){let n=(x*374761393+y*668265263+salt*1442695041)>>>0;n=(n^(n>>13))*1274126177>>>0;return((n^(n>>16))>>>0)/4294967295}
function seasonalBase(hex,season,kind){const shifts=season==='SPRING'?[5,4,5]:season==='SUMMER'?[-5,1,0]:season==='AUTUMN'?[-20,-5,1]:[7,-14,4];let [h,s,l]=rgbToHsl(...hexRgb(hex));if(kind==='marshroot'&&season==='WINTER'){h=48;s=24;l=46}else if(kind==='bramble'&&season==='AUTUMN'){h-=8;s-=3;l+=1}else if(kind==='thistlepod'&&(season==='SUMMER'||season==='AUTUMN')){h=58;s=35;l=45}return `hsl(${(h+shifts[0]+360)%360} ${Math.max(14,Math.min(84,s+shifts[1]))}% ${Math.max(22,Math.min(76,l+shifts[2]))}%)`}
function hexRgb(hex){const n=parseInt(hex.replace('#',''),16);return[((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255]}
function tintHex(color,hueShift=0,lightShift=0){let h,s,l;if(color.startsWith('hsl(')){const m=color.match(/hsl\(([-.\d]+)\s+([-.\d]+)%\s+([-.\d]+)%\)/);if(m){h=+m[1];s=+m[2];l=+m[3]}}if(h==null){[h,s,l]=rgbToHsl(...hexRgb(color))}return `hsl(${(h+hueShift+360)%360} ${Math.max(18,Math.min(86,s))}% ${Math.max(24,Math.min(78,l+lightShift))}%)`}
function rgbToHsl(r,g,b){const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4)}if(h<0)h+=360;return[h,s*100,l*100]}
