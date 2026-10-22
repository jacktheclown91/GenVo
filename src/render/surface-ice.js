import {surfaceIceArt} from '../../assets/art/environment/surface-ice.js';
import {SURFACE_ICE,iceAmount} from '../world/surface-ice.js';
// Derived native 32-grid art. No weather, phase or fracture state is authored here.
export function drawSurfaceIce(renderer,{tile,startX,startY,cols,rows}){
 const w=renderer.sim.world,e=w.environment;if(e?.icePolicy!==SURFACE_ICE.policy)return 0;
 const c=renderer.ctx,q=tile/32;let drawn=0;c.save();
 for(let y=Math.max(0,startY);y<Math.min(w.n,startY+rows);y++)for(let x=Math.max(0,startX);x<Math.min(w.n,startX+cols);x++){
  const i=y*w.n+x,amount=iceAmount(e,i);if(!w.water[i]||amount<=.003)continue;
  const px=Math.round((x-renderer.camera.x)*tile+renderer.w/2),py=Math.round((y-renderer.camera.y)*tile+renderer.h/2),broken=e.iceBroken[i],strong=amount>.08;
  c.globalAlpha=strong?.9:Math.min(.78,.25+amount*4);c.fillStyle=strong?'#c9e2e7':'#9ebfc9';
  paintNativeIce(c,{px,py,tile,strong,broken,variant:((y&1)*2)+(x&1)});
  c.globalAlpha=.65;
  // Pale fracture branches remain visible around the exposed dark-water hole.
  if(broken||!strong){c.fillStyle='#507f91';for(const [bx,by,bw,bh] of [[6,8,7,1],[12,9,1,6],[13,14,6,1],[19,15,1,8]]){if(broken&&bx>7&&bx<26&&by>7&&by<26)continue;c.fillRect(px+bx*q,py+by*q,bw*q,bh*q)}}
  drawn++;
 }
 c.restore();return drawn;
}

// Paint is native32; the exact original broken-sheet hole stays transparent.
const ICE_PALETTES={strong:[[180,207,217],[191,218,228],[201,226,231],[215,235,238]],thin:[[129,169,184],[143,182,195],[158,191,201],[175,207,216]]};
const preparedIce=new Map();
export function surfaceIceTileData({variant=0,broken=false,strong=true}={}){
 const frame=surfaceIceArt.frames[variant&3],palette=ICE_PALETTES[strong?'strong':'thin'],data=new Uint8ClampedArray(4096);
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  if(broken&&x>=5&&x<27&&y>=5&&y<27)continue;
  const k=y*32+x;data.set(palette[frame[k]],k*4);data[k*4+3]=255;
 }
 return data;
}
function paintNativeIce(c,{px,py,tile,strong,broken,variant}){
 const key=(variant&3)+'|'+!!strong+'|'+!!broken;let art=preparedIce.get(key);
 if(!art&&typeof document!=='undefined'&&typeof c.drawImage==='function'){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d');
  if(ctx){const image=ctx.createImageData(32,32);image.data.set(surfaceIceTileData({strong,broken,variant}));ctx.putImageData(image,0,0);preparedIce.set(key,canvas);art=canvas}
 }
 if(art){c.imageSmoothingEnabled=false;c.drawImage(art,px,py,tile,tile);return}
 // Headless recorders project the same native source instead of substitute geometry.
 const pixels=surfaceIceTileData({strong,broken,variant}),q=tile/32;
 for(let i=0;i<1024;i++)if(pixels[i*4+3]){c.fillStyle='rgb('+pixels.slice(i*4,i*4+3).join(',')+')';c.fillRect(px+(i%32)*q,py+(i/32|0)*q,q,q)}
}
