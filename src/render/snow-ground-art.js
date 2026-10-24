import {snowCover} from '../world/snowpack.js';
const clamp=v=>Math.max(0,Math.min(1,v)),hash=(x,y,seed)=>{let n=(Math.imul(x,374761393)^Math.imul(y,668265263)^seed)>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295};
function field(x,y,seed,pitch){x/=pitch;y/=pitch;const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hash(ix,iy,seed),b=hash(ix+1,iy,seed),c=hash(ix,iy+1,seed),d=hash(ix+1,iy+1,seed);return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v}
// Absolute coordinates make the drift contour independent of tile/cache boundaries.
// This geometry is presentation only. A caller must supply actual stored snow cover.
export function snowGroundPixels({seed=0,x,y,originX=0,originY=0,cover,waterMask}){
 const pixels=new Uint8Array(1024);if(!(cover>0))return pixels;const threshold=1-clamp(cover),ox=(originX+x)*32,oy=(originY+y)*32;
 for(let by=0;by<16;by++)for(let bx=0;bx<16;bx++){const wx=ox+bx*2+1,wy=oy+by*2+1,broad=field(wx,wy,seed^0x5a31,43),fine=field(wx,wy,seed^0x7319,9),level=clamp(.5+(broad-.5)*1.6+(fine-.5)*.8);
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const sx=bx*2+dx,sy=by*2+dy,i=sy*32+sx;if(waterMask?.[i])continue;const n=clamp(level+(hash(ox+sx,oy+sy,seed^0x1523)-.5)*.055);if(n<threshold)continue;pixels[i]=n<threshold+.06?1:n<threshold+.23?2:3}
 }return pixels;
}
const palette=['','#bdced1','#dce9e7','#f1f7f3'],worlds=new WeakMap();
function cached(world,x,y,cover,waterMask){let entries=worlds.get(world);if(!entries){entries=new Map();worlds.set(world,entries)}const key=y*world.n+x;let entry=entries.get(key);if(entry&&entry.cover===cover&&entry.waterMask===waterMask)return entry;
 const pixels=snowGroundPixels({seed:world.seedHash,x,y,originX:world.regionOrigin?.x||0,originY:world.regionOrigin?.y||0,cover,waterMask}),canvas=entry?.canvas||(typeof document!=='undefined'?document.createElement('canvas'):null);if(canvas){canvas.width=canvas.height=32;const ctx=canvas.getContext('2d');if(ctx){const data=ctx.createImageData(32,32),rgb=[[0,0,0],[189,206,209],[220,233,231],[241,247,243]];for(let i=0;i<1024;i++){const p=pixels[i];if(p){const q=i*4;data.data[q]=rgb[p][0];data.data[q+1]=rgb[p][1];data.data[q+2]=rgb[p][2];data.data[q+3]=255}}ctx.putImageData(data,0,0)}}entry={cover,waterMask,pixels,canvas};if(!entries.has(key)&&entries.size>=1024)entries.delete(entries.keys().next().value);entries.set(key,entry);return entry;
}
export function drawSnowGround(ctx,{world,x,y,px,py,tile,waterMask}){
 const i=world.idx(x,y);if(world.water[i]||!(world.soilWater?.snowpack?.[i]>=.012))return false;const cover=snowCover(world,i),entry=cached(world,x,y,cover,waterMask);
 ctx.save();try{ctx.globalAlpha*=Math.min(.91,.22+cover*.72);if(entry.canvas&&typeof ctx.drawImage==='function'){ctx.imageSmoothingEnabled=false;ctx.drawImage(entry.canvas,px,py,tile,tile)}else{for(let y=0;y<32;y++){let x=0;while(x<32){const p=entry.pixels[y*32+x],start=x++;while(x<32&&entry.pixels[y*32+x]===p)x++;if(p){ctx.fillStyle=palette[p];ctx.fillRect(px+start*tile/32,py+y*tile/32,(x-start)*tile/32,tile/32)}}}}}finally{ctx.restore()}return true;
}
