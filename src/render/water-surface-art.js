import {drawWaterColumn} from './water-column-art.js';
import {exposedSurfaceKind} from './wet-surface-art.js';
// Sparse native-32 water glints. Geometry crosses tile ownership; never a flow/biology authority.
import {surfaceIceCovered} from '../world/surface-ice.js';
import {riverIdentityAt} from './identity.js';
const PIXELS=32,SPACING=47,MAX_TILES=1024,cacheByWorld=new WeakMap();
function hash(seed,x,y,salt){let n=(seed^Math.imul(x,374761393)^Math.imul(y,668265263)^salt)>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
export function waterRippleTile(world,x,y,mask){
 let cache=cacheByWorld.get(world);if(!cache){cache=new Map();cacheByWorld.set(world,cache)}const key=x+','+y,hit=cache.get(key);if(hit?.mask===mask)return hit.marks;
 const ox=(x+(world.regionOrigin?.x||0))*PIXELS,oy=(y+(world.regionOrigin?.y||0))*PIXELS,res=Math.round(Math.sqrt(mask.length)),marks=[],seed=world.seedHash||0;
 if(!mask.empty)for(let gy=Math.floor((oy-4)/SPACING);gy<=Math.floor((oy+PIXELS+4)/SPACING);gy++)for(let gx=Math.floor((ox-32)/SPACING);gx<=Math.floor((ox+PIXELS)/SPACING);gx++){
  const h=hash(seed,gx,gy,0x3a719);if(h<.25)continue;const ax=gx*SPACING+Math.floor(hash(seed,gx,gy,0x44b9)*35),ay=gy*SPACING+Math.floor(hash(seed,gx,gy,0x79a3)*35),length=10+Math.floor(h*18),split=Math.floor(length*.32),end=Math.floor(length*.76),bend=h>.62?1:-1,rects=[];
  for(const [a,b,dy]of [[0,split,0],[split,end,bend],[end,length,0]]){const yy=ay+dy-oy;if(yy<0||yy>=PIXELS)continue;const lo=Math.max(0,ax+a-ox),hi=Math.min(PIXELS,ax+b-ox);let run=-1;
   for(let xx=lo;xx<=hi;xx++){const on=xx<hi&&(mask.full||mask[Math.floor((yy+.5)*res/PIXELS)*res+Math.floor((xx+.5)*res/PIXELS)]===1);if(run>=0&&!on){rects.push(Object.freeze([run/2,yy/2,(xx-run)/2,.5]));run=-1}if(on&&run<0)run=xx}
  }
  if(rects.length)marks.push(Object.freeze({id:gx+','+gy,phase:hash(seed,gx,gy,0xb37d)*Math.PI*2,rects:Object.freeze(rects)}));
 }
 const result=Object.freeze(marks);if(cache.size>=MAX_TILES)cache.delete(cache.keys().next().value);cache.set(key,{mask,marks:result});return result;
}
export function drawWaterSurfaceMarks(ctx,{world,x,y,mask,px,py,u,seconds=0,column=true}){
 if(mask.empty||surfaceIceCovered(world.environment,world.idx(x,y)))return;if(column)drawWaterColumn(ctx,{world,x,y,mask,px,py,u});const i=world.idx(x,y);if(world.water&&world.water[i]&&exposedSurfaceKind(world,i)!=='water')return;const marks=waterRippleTile(world,x,y,mask);if(!marks.length)return;const alpha=ctx.globalAlpha;ctx.save();ctx.fillStyle='#71b3b8';
 const reach=world.water?riverIdentityAt(world,x,y):null;
 let speed=1.35,eddy=0,axis=reach?.axis||'horizontal';
 if(reach){
  if(reach.kind==='narrows')speed=1.85;
  else if(reach.kind==='run')speed=1.45;
  else if(reach.kind==='bend'){speed=1.05;eddy=reach.turn*0.65*Math.sin(seconds*0.85+x*0.5+y*0.3)}
  else if(reach.kind==='pool'){speed=0.92;eddy=0.35*Math.cos(seconds*0.65+x*0.4+y*0.4)}
 }
 const flowOffset=reach?(
  axis==='vertical'?(y+(world.regionOrigin?.y||0))*1.4:
  axis==='diag-down'?((x+y+(world.regionOrigin?.x||0)+(world.regionOrigin?.y||0))*0.95):
  axis==='diag-up'?((x-y+(world.regionOrigin?.x||0)-(world.regionOrigin?.y||0))*0.95):
  (x+(world.regionOrigin?.x||0))*1.4
 ):0;
 for(const mark of marks){const beat=.5+.5*Math.sin(seconds*speed+mark.phase+flowOffset+eddy);ctx.globalAlpha=alpha*(.09+.16*beat*beat);for(const [rx,ry,w,h]of mark.rects)ctx.fillRect(px+rx*u,py+ry*u,w*u,h*u)}ctx.restore();
}
