// Native artwork only. Real burning-cell membership, clock and intensity stay canonical.
import {wildfireArt} from '../../assets/art/environment/wildfire.js';
const prepared=new Map();
export function fireVisualProfile(cell,tick,index=0){
 const age=Math.max(0,tick-cell.since),strength=Math.max(0,Math.min(1,cell.intensity));
 return{frame:(Math.floor(age/3)+(index%4))&3,scale:.72+strength*.28,opacity:.5+strength*.45};
}
export function fireFrameRgba(frame=0){
 const source=wildfireArt.frames[frame&3],rgba=new Uint8ClampedArray(4096);
 for(let k=0;k<1024;k++){rgba.set(wildfireArt.palette[source.indices[k]],k*4);rgba[k*4+3]=source.alpha[k]}
 return rgba;
}
export function paintNativeFire(c,{x,y,tile,profile}){
 const frame=profile.frame&3;let canvas=prepared.get(frame);
 if(!canvas&&typeof document!=='undefined'&&typeof c.drawImage==='function'){
  const candidate=document.createElement('canvas');candidate.width=candidate.height=32;const ctx=candidate.getContext('2d');
  if(ctx){const image=ctx.createImageData(32,32);image.data.set(fireFrameRgba(frame));ctx.putImageData(image,0,0);prepared.set(frame,candidate);canvas=candidate}
 }
 const size=tile*profile.scale,px=x-size/2,py=y-size/2;c.save();try{
  c.globalAlpha*=profile.opacity;
  if(canvas&&typeof c.drawImage==='function'){c.imageSmoothingEnabled=false;c.drawImage(canvas,px,py,size,size)}
  else{const rgba=fireFrameRgba(frame),q=size/32;for(let k=0;k<1024;k++)if(rgba[k*4+3]){const i=k*4;c.fillStyle='rgba('+rgba.slice(i,i+3).join(',')+','+(rgba[i+3]/255)+')';c.fillRect(px+(k%32)*q,py+(k/32|0)*q,q,q)}}
 }finally{c.restore()}
}
