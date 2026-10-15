import {habitatGroundArt} from '../../assets/art/environment/overhead-habitats.js';

// Habitat interpretation selects substrate, never additional edible organisms.
export function habitatGroundFrame(kind){
 if(['watering-margin','reed-cove','reed-shelf'].includes(kind))return 0;
 if(['thicket-pocket','berry-grove','old-root'].includes(kind))return 1;
 if(['fungal-hollow','mushroom-hollow'].includes(kind))return 2;
 if(['feeding-ground','recovery-patch','open-clearing','game-trail','young-meadow','stone-rise','trail-gate'].includes(kind))return 3;
 return null;
}
const prepared=new Map();
function paint(frame,season){
 const key=frame+'|'+season;if(prepared.has(key))return prepared.get(key);
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d');if(!ctx)return null;
 const image=ctx.createImageData(32,32),cold=season==='WINTER';
 for(let i=0;i<1024;i++){const p=habitatGroundArt.frames[frame][i];if(!p)continue;const rgb=habitatGroundArt.palette[p];image.data.set(cold?[Math.round(rgb[0]*.87),Math.round(rgb[1]*.94),Math.min(255,Math.round(rgb[2]*1.1)),255]:[...rgb,255],i*4)}
 ctx.putImageData(image,0,0);prepared.set(key,canvas);return canvas;
}
export function drawHabitatGround(ctx,{kind,px,py,u,season='SPRING',strength=1,variant=0,size=1}){
 const frame=habitatGroundFrame(kind);if(frame===null||!(strength>0))return false;
 const source=typeof ctx.drawImage==='function'?paint(frame,season):null;
 ctx.save();try{
  ctx.translate(px,py);ctx.globalAlpha*=.48+.18*Math.min(1,strength);
  if(source){if(variant&&typeof ctx.rotate==='function')ctx.rotate((variant%4)*Math.PI/2);ctx.imageSmoothingEnabled=false;ctx.drawImage(source,-16*u*size,-16*u*size,32*u*size,32*u*size)}
  else{ // Non-browser recorder: project the same indexed source, never substitute scenery.
   const indices=habitatGroundArt.frames[frame];for(let i=0;i<indices.length;i++){const p=indices[i];if(!p)continue;ctx.fillStyle='rgb('+habitatGroundArt.palette[p].join(',')+')';ctx.fillRect(((i%32)-16)*u*size,((i/32|0)-16)*u*size,u*size,u*size)}
  }
 }finally{ctx.restore()}return true;
}
