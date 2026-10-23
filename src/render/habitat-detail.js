import {riparianColorAt} from './riparian-bank-art.js';
import {smoothedWaterScore} from './landform.js';

// Renderer-only local habitat accents. These functions may read canonical water,
// moisture and biomass, but never write world state or consume simulation RNG.
export function drawRiparianDepth(ctx,{world,isWater,px,py,u,i,x,y,depth=null}){
  const edges={n:isWater(x,y-1),s:isWater(x,y+1),w:isWater(x-1,y),e:isWater(x+1,y)};
  if(!edges.n&&!edges.s&&!edges.w&&!edges.e)return;
  const h=hash2(x,y,1511),m=world.moisture[i];
  ctx.save();
  // v1.41.0: damp bank shading follows the smooth shoreline per art pixel (the same water score that
  // shapes the shore), instead of straight bands along the tile edges, which read as stair steps.
  for(let sy=0;sy<32;sy++)for(let sx=0;sx<32;sx++){
    const sc=depth?depth[sy*32+sx]/255:smoothedWaterScore(world,x+(sx+.5)/32,y+(sy+.5)/32);if(sc<.30||sc>.53)continue;
    ctx.fillStyle=riparianColorAt(sc,sx,sy,x,y);ctx.fillRect(px+sx*u/2,py+sy*u/2,u/2,u/2);
  }
  if(h>.38){ctx.fillStyle='rgba(174,157,103,.42)';for(let k=0;k<2;k++){const q=hash2(x+k*7,y-k*5,1523);if(edges.n||edges.s){const ox=(3+Math.floor(q*10))*u,oy=(edges.n?3:12)*u;ctx.fillRect(px+ox,py+oy,(1+(k&1))*u,u)}else{const ox=(edges.w?3:12)*u,oy=(3+Math.floor(q*10))*u;ctx.fillRect(px+ox,py+oy,u,(1+(k&1))*u)}}}
  if(m>.58&&h>.55){ctx.fillStyle='rgba(92,125,72,.76)';for(let k=0;k<3;k++){const q=hash2(x+k*11,y-k*3,1531);if(edges.n||edges.s){const ox=(2+Math.floor(q*12))*u,base=(edges.n?5:14)*u,dir=edges.n?-1:1;ctx.fillRect(px+ox,py+base+dir*(2+k%2)*u,u,(2+k%2)*u)}else{const baseX=(edges.w?5:14)*u,oy=(2+Math.floor(q*12))*u;ctx.fillRect(px+baseX,py+oy,(2+k%2)*u,u)}}}
  ctx.restore();
}

// Native vegetation already represents these exact stocks, with canonical food
// anchors and sensory clipping. The former per-cell procedural grass combs and
// rectangular shrubs duplicated that display and exposed a planting grid even
// outside biological vision. Retain the public hook for compatibility; paint each
// real plant only through the canonical vegetation layer.
export function drawHabitatClusterAccents(){return false}
function hash2(x,y,salt=0){let n=(x*374761393+y*668265263+salt*1442695041)>>>0;n=(n^(n>>13))*1274126177>>>0;return((n^(n>>16))>>>0)/4294967295}
