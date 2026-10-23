// Rainfall-front lighting only. No cloud inventory or weather/vision writes.
import {CFG} from '../sim/config.js';
import {atmosphereAt} from '../ecology/atmospheric-visibility.js';
import {cloudShadeArt as art} from '../../assets/art/environment/cloud-shade.js';
const wrap=(v,n)=>((v%n)+n)%n;
export function advanceCloudShade(previous,sample,now,seed){
 if(!previous||previous.seed!==seed)return{seed,last:now,x:0,y:0};
 const dt=Math.max(0,Math.min(.1,(now-previous.last)/1000));
 return{seed,last:now,x:wrap(previous.x+(sample.wind?.east||0)*dt*.18,32),y:wrap(previous.y+(sample.wind?.south||0)*dt*.18,24)};
}
export function cloudShadeLayout(renderer,phase,readSample=(x,y)=>atmosphereAt(renderer.sim,x,y)){
 const w=renderer.sim.world,tile=CFG.tileSize*renderer.zoom,ox=w.regionOrigin?.x||0,oy=w.regionOrigin?.y||0,cx=renderer.camera.x+ox,cy=renderer.camera.y+oy,result=[];
 const left=Math.floor((cx-renderer.w/2/tile-phase.x-10)/16),right=Math.ceil((cx+renderer.w/2/tile-phase.x+10)/16),top=Math.floor((cy-renderer.h/2/tile-phase.y-5)/12),bottom=Math.ceil((cy+renderer.h/2/tile-phase.y+5)/12);
 for(let gy=top;gy<=bottom;gy++)for(let gx=left;gx<=right;gx++){
  if(renderer.lowDetail&&((gx+gy)&1))continue;
  const x=gx*16+8+phase.x-ox,y=gy*12+6+phase.y-oy,px=(x-renderer.camera.x)*tile+renderer.w/2-10*tile,py=(y-renderer.camera.y)*tile+renderer.h/2-5*tile;
  if(px>=renderer.w||py>=renderer.h||px+20*tile<=0||py+10*tile<=0)continue;
  // Edge fragments sample the nearest owned cell; geometry remains absolute.
  const sample=readSample(Math.max(.5,Math.min(w.n-.5,x)),Math.max(.5,Math.min(w.n-.5,y))),coverage=Math.max(0,Math.min(1,(sample.rain-.42)/.85));if(coverage<=.01)continue;
  result.push({x:Math.round(px),y:Math.round(py),width:20*tile,height:10*tile,frame:((gx+(w.seedHash&1))&1)|(((gy+((w.seedHash>>>1)&1))&1)<<1),alpha:coverage*.24});
 }
 return result;
}
let sprites=null;
function masks(){if(sprites)return sprites;if(typeof document==='undefined')return null;sprites=art.frames.map(frame=>{const canvas=document.createElement('canvas');canvas.width=art.width;canvas.height=art.height;const c=canvas.getContext('2d'),image=c.createImageData(art.width,art.height);for(let i=0;i<frame.length;i++){const v=frame[i],rgb=art.palette[v>>3],k=i*4;image.data[k]=rgb[0];image.data[k+1]=rgb[1];image.data[k+2]=rgb[2];image.data[k+3]=Math.round((v&7)/art.alphaSteps*255)}c.putImageData(image,0,0);return canvas});return sprites}
const layerScale=4,margin=64;
const nearestDelta=(value,period)=>wrap(value+period/2,period)-period/2;
function cloudLayer(renderer,phase){
 const s=renderer.sim,world=s.world,tile=CFG.tileSize*renderer.zoom,old=renderer.cloudShadeLayer,key=[s.day,s.climate?.rain,renderer.w,renderer.h,renderer.zoom,!!renderer.lowDetail,world.regionOrigin?.x||0,world.regionOrigin?.y||0,world.seedHash].join(':');
 const dx=old?((old.cameraX-renderer.camera.x)+nearestDelta(phase.x-old.phaseX,32))*tile:0,dy=old?((old.cameraY-renderer.camera.y)+nearestDelta(phase.y-old.phaseY,24))*tile:0;
 if(old&&old.world===world&&old.rainScale===world.environment?.rainScale&&old.key===key&&Math.abs(dx)<margin/2&&Math.abs(dy)<margin/2)return{layer:old,dx,dy};
 const native=masks();if(!native)return null;
 const canvas=old?.canvas||document.createElement('canvas');canvas.width=Math.ceil((renderer.w+margin*2)/layerScale);canvas.height=Math.ceil((renderer.h+margin*2)/layerScale);const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
 const layout=cloudShadeLayout({...renderer,w:renderer.w+margin*2,h:renderer.h+margin*2},phase);
 for(const p of layout){c.globalAlpha=p.alpha;c.drawImage(native[p.frame],p.x/layerScale,p.y/layerScale,p.width/layerScale,p.height/layerScale)}
 const layer=renderer.cloudShadeLayer={world,rainScale:world.environment?.rainScale,key,canvas,count:layout.length,cameraX:renderer.camera.x,cameraY:renderer.camera.y,phaseX:phase.x,phaseY:phase.y};return{layer,dx:0,dy:0};
}
export function drawCloudShadows(renderer,sample){const phase=renderer.cloudShadePhase=advanceCloudShade(renderer.cloudShadePhase,sample,renderer.renderNow,renderer.sim.seed),entry=cloudLayer(renderer,phase);if(!entry||!entry.layer.count)return 0;const c=renderer.ctx;c.save();c.imageSmoothingEnabled=false;c.globalAlpha=1;c.drawImage(entry.layer.canvas,Math.round(entry.dx-margin),Math.round(entry.dy-margin),entry.layer.canvas.width*layerScale,entry.layer.canvas.height*layerScale);c.restore();return entry.layer.count}
