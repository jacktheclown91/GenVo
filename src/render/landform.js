// Pure presentation helpers for smoothing a tile-based hydrology grid into an organic pixel contour.
// These functions never alter World state, collision, drinkability, or ecology RNG.

// v1.41.0: 32 samples per tile edge, one per art pixel, for smooth 32-pixel shorelines.
export const LANDFORM_RESOLUTION=32;

export function buildVisualWaterMask(world,tileX,tileY,res=LANDFORM_RESOLUTION){
  // depth: the smoothed water score per sample (0 to 255), for depth bands that follow the shore.
  const mask=new Uint8Array(res*res),depth=new Uint8Array(res*res);
  let wet=0;
  for(let sy=0;sy<res;sy++)for(let sx=0;sx<res;sx++){
    const wx=tileX+(sx+.5)/res,wy=tileY+(sy+.5)/res;
    const score=smoothedWaterScore(world,wx,wy);
    // Low-frequency seeded threshold changes apparent bank width by only a few pixels,
    // enough to hide the grid without implying a different navigable world.
    const macro=smoothSeedNoise(world.seedHash^0x71d9,wx,wy,5.5);
    const local=smoothSeedNoise(world.seedHash^0x2c51,wx,wy,2.75);
    const threshold=.535+(macro-.5)*.050+(local-.5)*.018;
    const on=score>threshold?1:0;
    mask[sy*res+sx]=on;depth[sy*res+sx]=Math.round(Math.max(0,Math.min(1,score))*255);wet+=on;
  }
  mask.depth=depth;mask.wetCount=wet;
  mask.full=wet===res*res;
  mask.empty=wet===0;
  return mask;
}

export function smoothedWaterScore(world,wx,wy){
  // Compact radial reconstruction around cell centres. A radius just over one tile
  // rounds stair steps while keeping the visual edge close to the simulation edge.
  const radius=1.28,r2=radius*radius,n=world.n;
  const minX=Math.max(0,Math.floor(wx-radius-.5)),maxX=Math.min(n-1,Math.floor(wx+radius-.5));
  const minY=Math.max(0,Math.floor(wy-radius-.5)),maxY=Math.min(n-1,Math.floor(wy+radius-.5));
  let sum=0,weights=0;
  for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){
    const dx=wx-(cx+.5),dy=wy-(cy+.5),d2=dx*dx+dy*dy;if(d2>=r2)continue;
    const d=Math.sqrt(d2),w=radius-d,weight=w*w;
    weights+=weight;if(world.water[world.idx(cx,cy)])sum+=weight;
  }
  return weights?sum/weights:0;
}

export function maskWaterAt(mask,sx,sy,res=LANDFORM_RESOLUTION){
  sx=Math.max(0,Math.min(res-1,sx|0));sy=Math.max(0,Math.min(res-1,sy|0));
  return mask[sy*res+sx]===1;
}

function smoothSeedNoise(seed,x,y,cell){
  const gx=Math.floor(x/cell),gy=Math.floor(y/cell),fx=(x-gx*cell)/cell,fy=(y-gy*cell)/cell;
  const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=seedNoise(seed,gx,gy),b=seedNoise(seed,gx+1,gy),c=seedNoise(seed,gx,gy+1),d=seedNoise(seed,gx+1,gy+1);
  return (a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy;
}
function seedNoise(seed,x,y){
  let n=(seed^Math.imul(x+374761393,668265263)^Math.imul(y+1274126177,2246822519))>>>0;
  n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;
}
