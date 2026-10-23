import {visualCompositionAt} from './composition.js';
import {smoothedWaterScore} from './landform.js';

// Renderer-only local habitat accents. These functions may read canonical water,
// moisture and biomass, but never write world state or consume simulation RNG.
export function drawRiparianDepth(ctx,{world,isWater,px,py,u,i,x,y,depth=null}){
  const edges={n:isWater(x,y-1),s:isWater(x,y+1),w:isWater(x-1,y),e:isWater(x+1,y)};
  if(!edges.n&&!edges.s&&!edges.w&&!edges.e)return;
  const h=hash2(x,y,1511),m=world.moisture[i],dark='rgba(35,49,34,.31)',mud='rgba(87,78,51,.32)',wet='rgba(105,139,91,.22)';
  ctx.save();
  // v1.41.0: damp bank shading follows the smooth shoreline per art pixel (the same water score that
  // shapes the shore), instead of straight bands along the tile edges, which read as stair steps.
  for(let sy=0;sy<32;sy++)for(let sx=0;sx<32;sx++){
    const sc=depth?depth[sy*32+sx]/255:smoothedWaterScore(world,x+(sx+.5)/32,y+(sy+.5)/32);if(sc<.30||sc>.53)continue;
    ctx.fillStyle=sc>.45?dark:sc>.38?mud:wet;ctx.fillRect(px+sx*u/2,py+sy*u/2,u/2,u/2);
  }
  if(h>.38){ctx.fillStyle='rgba(174,157,103,.42)';for(let k=0;k<2;k++){const q=hash2(x+k*7,y-k*5,1523);if(edges.n||edges.s){const ox=(3+Math.floor(q*10))*u,oy=(edges.n?3:12)*u;ctx.fillRect(px+ox,py+oy,(1+(k&1))*u,u)}else{const ox=(edges.w?3:12)*u,oy=(3+Math.floor(q*10))*u;ctx.fillRect(px+ox,py+oy,u,(1+(k&1))*u)}}}
  if(m>.58&&h>.55){ctx.fillStyle='rgba(92,125,72,.76)';for(let k=0;k<3;k++){const q=hash2(x+k*11,y-k*3,1531);if(edges.n||edges.s){const ox=(2+Math.floor(q*12))*u,base=(edges.n?5:14)*u,dir=edges.n?-1:1;ctx.fillRect(px+ox,py+base+dir*(2+k%2)*u,u,(2+k%2)*u)}else{const baseX=(edges.w?5:14)*u,oy=(2+Math.floor(q*12))*u;ctx.fillRect(px+baseX,py+oy,(2+k%2)*u,u)}}}
  ctx.restore();
}

export function drawHabitatClusterAccents(ctx,{world,habitatField,px,py,u,i,x,y}){
  const comp=visualCompositionAt(world,x+.5,y+.5,habitatField),h=hash2(x,y,1543);if(comp.openness>.62)return;
  const moss=world.plants.sunmoss?.[i]||0,bramble=world.plants.bramble?.[i]||0,marsh=world.plants.marshroot?.[i]||0,rot=world.plants.rotcap?.[i]||0,thistle=world.plants.thistlepod?.[i]||0,density=Math.max(moss*.65,bramble,marsh,rot*1.4,thistle);if(density<.34||comp.thicket<.38)return;
  ctx.save();ctx.globalAlpha=.58+.18*Math.min(1,comp.thicket);const cx=4+Math.floor(hash2(x,y,1549)*8),cy=7+Math.floor(hash2(y,x,1553)*5),count=2+Math.floor(Math.min(1,density+comp.thicket*.35)*3);
  if(marsh>=Math.max(bramble,rot,thistle)&&world.moisture[i]>.5){for(let k=0;k<count;k++){const ox=cx-3+k*2+Math.floor(hash2(x+k,y,1559)*2),ht=2+Math.floor(hash2(y,x+k,1567)*4);ctx.fillStyle=k%2?'#78915d':'#90a16a';ctx.fillRect(px+ox*u,py+(cy-ht)*u,u,ht*u)}}
  else if(bramble>=Math.max(marsh,rot,thistle)){ctx.fillStyle='#465934';ctx.fillRect(px+(cx-4)*u,py+(cy-2)*u,8*u,3*u);ctx.fillStyle='#6f864b';ctx.fillRect(px+(cx-2)*u,py+(cy-4)*u,5*u,3*u);if(bramble>.58){ctx.fillStyle='#bc6256';ctx.fillRect(px+(cx-2)*u,py+(cy-3)*u,u,u);ctx.fillRect(px+(cx+2)*u,py+(cy-1)*u,u,u)}}
  else if(rot>=Math.max(bramble,marsh,thistle)){for(let k=0;k<count;k++){const ox=cx-3+k*2,oy=cy+(k%2);ctx.fillStyle='#756859';ctx.fillRect(px+ox*u,py+(oy-1)*u,u,2*u);ctx.fillStyle=k===0?'#d0c19d':'#aa946d';ctx.fillRect(px+(ox-1)*u,py+(oy-2)*u,3*u,u)}}
  else if(thistle>=Math.max(bramble,marsh,rot)){for(let k=0;k<count;k++){const ox=cx-3+k*2,ht=3+(k%2);ctx.fillStyle='#777b47';ctx.fillRect(px+ox*u,py+(cy-ht)*u,u,ht*u);ctx.fillStyle='#c4aa67';ctx.fillRect(px+(ox-1)*u,py+(cy-ht-1)*u,3*u,2*u)}}
  else if(moss>.58){ctx.fillStyle='#789752';for(let k=0;k<count+1;k++){const ox=cx-4+k*2,ht=1+(k%2);ctx.fillRect(px+ox*u,py+(cy-ht)*u,u,ht*u)}}
  ctx.restore();
}
function hash2(x,y,salt=0){let n=(x*374761393+y*668265263+salt*1442695041)>>>0;n=(n^(n>>13))*1274126177>>>0;return((n^(n>>16))>>>0)/4294967295}
