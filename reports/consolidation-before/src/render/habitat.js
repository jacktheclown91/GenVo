// Pure presentation helpers that reconstruct tile-based habitat values into smooth,
// organic sub-tile contours. They never modify moisture, fertility, plants, pathing,
// ecology RNG, or simulation authority.

// v1.41.0: doubled with the 32-pixel world for softer habitat edges.
export const HABITAT_RESOLUTION=16;
export const HABITAT_ZONE={MEADOW:0,WET:1,DRY:2,RICH:3};

export function buildSmoothedHabitatField(world){
  // The canonical world intentionally stores ecology on a coarse grid and its initial
  // climate noise contains 8/16-tile blocks. For presentation, repeatedly blur those
  // real fields so habitat shapes cross block boundaries organically. This copy is
  // renderer-owned and never feeds back into simulation state.
  let moisture=new Float32Array(world.moisture),fertility=new Float32Array(world.fertility);
  for(let pass=0;pass<3;pass++){
    moisture=boxBlur(world,moisture,3);
    fertility=boxBlur(world,fertility,3);
  }
  return {moisture,fertility};
}

export function visualHabitatAt(world,wx,wy,field=null){
  const source=field||buildSmoothedHabitatField(world),moisture=clamp01(sampleField(world,source.moisture,wx,wy)+warp(world.seedHash^0x5341,wx,wy,12.5,.070)+warp(world.seedHash^0x22d7,wx,wy,5.8,.025));
  const fertility=clamp01(sampleField(world,source.fertility,wx,wy)+warp(world.seedHash^0x7c93,wx,wy,14.0,.060)+warp(world.seedHash^0x159b,wx,wy,6.4,.022));
  return {moisture,fertility,zone:zoneFor(moisture,fertility)};
}

export function buildVisualHabitatMask(world,tileX,tileY,res=HABITAT_RESOLUTION,field=null){
  const source=field||buildSmoothedHabitatField(world),zones=new Uint8Array(res*res),moisture=new Float32Array(res*res),fertility=new Float32Array(res*res),counts=[0,0,0,0];
  let transitions=0;
  for(let sy=0;sy<res;sy++)for(let sx=0;sx<res;sx++){
    const wx=tileX+(sx+.5)/res,wy=tileY+(sy+.5)/res,v=visualHabitatAt(world,wx,wy,source),idx=sy*res+sx;
    zones[idx]=v.zone;moisture[idx]=v.moisture;fertility[idx]=v.fertility;counts[v.zone]++;
    if(sx>0&&zones[idx-1]!==v.zone)transitions++;
    if(sy>0&&zones[idx-res]!==v.zone)transitions++;
  }
  return {zones,moisture,fertility,counts,transitions,res};
}

export function habitatZoneAt(mask,sx,sy){const res=mask.res||HABITAT_RESOLUTION;sx=Math.max(0,Math.min(res-1,sx|0));sy=Math.max(0,Math.min(res-1,sy|0));return mask.zones[sy*res+sx]}
export function zoneFor(m,f){if(m>.62)return HABITAT_ZONE.WET;if(m<.30)return HABITAT_ZONE.DRY;if(f>.72)return HABITAT_ZONE.RICH;return HABITAT_ZONE.MEADOW}

function boxBlur(world,src,radius){
  const n=world.n,len=world.len,tmp=new Float32Array(len),out=new Float32Array(len),width=radius*2+1;
  for(let y=0;y<n;y++){
    let sum=0;for(let k=-radius;k<=radius;k++)sum+=src[y*n+clampIndex(k,n)];
    for(let x=0;x<n;x++){tmp[y*n+x]=sum/width;sum-=src[y*n+clampIndex(x-radius,n)];sum+=src[y*n+clampIndex(x+radius+1,n)]}
  }
  for(let x=0;x<n;x++){
    let sum=0;for(let k=-radius;k<=radius;k++)sum+=tmp[clampIndex(k,n)*n+x];
    for(let y=0;y<n;y++){out[y*n+x]=sum/width;sum-=tmp[clampIndex(y-radius,n)*n+x];sum+=tmp[clampIndex(y+radius+1,n)*n+x]}
  }
  return out;
}
function sampleField(world,field,wx,wy){const fx=wx-.5,fy=wy-.5,x0=Math.floor(fx),y0=Math.floor(fy),tx=smooth(fx-x0),ty=smooth(fy-y0),a=at(world,field,x0,y0),b=at(world,field,x0+1,y0),c=at(world,field,x0,y0+1),d=at(world,field,x0+1,y0+1),top=a+(b-a)*tx,bottom=c+(d-c)*tx;return top+(bottom-top)*ty}
function at(world,field,x,y){x=clampIndex(x,world.n);y=clampIndex(y,world.n);return field[world.idx(x,y)]}
function clampIndex(v,n){return Math.max(0,Math.min(n-1,v|0))}
function warp(seed,x,y,cell,amount){return(smoothSeedNoise(seed,x,y,cell)-.5)*2*amount}
function smooth(v){return v*v*(3-2*v)}
function clamp01(v){return Math.max(0,Math.min(1,v))}
function smoothSeedNoise(seed,x,y,cell){const gx=Math.floor(x/cell),gy=Math.floor(y/cell),fx=(x-gx*cell)/cell,fy=(y-gy*cell)/cell,sx=smooth(fx),sy=smooth(fy),a=seedNoise(seed,gx,gy),b=seedNoise(seed,gx+1,gy),c=seedNoise(seed,gx,gy+1),d=seedNoise(seed,gx+1,gy+1),top=a+(b-a)*sx,bottom=c+(d-c)*sx;return top+(bottom-top)*sy}
function seedNoise(seed,x,y){let n=(seed^Math.imul(x+374761393,668265263)^Math.imul(y+1274126177,2246822519))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
