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
const layerScale=4,margin=64;
const nearestDelta=(value,period)=>wrap(value+period/2,period)-period/2;
// Build a compact opacity raster from the authored masks and expand it
// once into an unscaled cached image.
// Black source-over paint can only dim existing light.
function buildLayer(renderer,phase,key,old){
 const width=Math.ceil((renderer.w+margin*2)/layerScale),height=Math.ceil((renderer.h+margin*2)/layerScale),alpha=new Uint8Array(width*height),layout=cloudShadeLayout({...renderer,w:renderer.w+margin*2,h:renderer.h+margin*2},phase);
 for(const p of layout){const frame=art.frames[p.frame],left=p.x/layerScale,top=p.y/layerScale,pw=p.width/layerScale,ph=p.height/layerScale;
  for(let y=Math.max(0,Math.ceil(top-.5));y<Math.min(height,Math.ceil(top+ph-.5));y++){const sy=Math.floor((y+.5-top)/ph*art.height);
   for(let x=Math.max(0,Math.ceil(left-.5));x<Math.min(width,Math.ceil(left+pw-.5));x++){const sx=Math.floor((x+.5-left)/pw*art.width),a=frame[sy*art.width+sx]/art.alphaSteps*p.alpha;if(!a)continue;const i=y*width+x;alpha[i]=Math.round(a*255+alpha[i]*(1-a))}}
 }
 let nonzero=0;for(let i=0;i<alpha.length;i++){alpha[i]=Math.round(alpha[i]/3)*3;if(alpha[i])nonzero++}
 const smallCanvas=old?.smallCanvas||((nonzero&&typeof document!=='undefined')?document.createElement('canvas'):null),canvas=old?.canvas||((nonzero&&typeof document!=='undefined')?document.createElement('canvas'):null);
 if(nonzero&&canvas&&smallCanvas){if(smallCanvas.width!==width)smallCanvas.width=width;if(smallCanvas.height!==height)smallCanvas.height=height;const small=smallCanvas.getContext('2d'),image=small.createImageData(width,height);for(let i=0;i<alpha.length;i++)image.data[i*4+3]=alpha[i];small.putImageData(image,0,0);if(canvas.width!==width*layerScale)canvas.width=width*layerScale;if(canvas.height!==height*layerScale)canvas.height=height*layerScale;const c=canvas.getContext('2d');c.globalAlpha=1;c.globalCompositeOperation='copy';c.imageSmoothingEnabled=false;c.drawImage(smallCanvas,0,0,canvas.width,canvas.height)}
 return{canvas,smallCanvas,world:renderer.sim.world,rainScale:renderer.sim.world.environment?.rainScale,key,count:nonzero?layout.length:0,width,height,nonzero,cameraX:renderer.camera.x,cameraY:renderer.camera.y,phaseX:phase.x,phaseY:phase.y};
}

function cloudLayer(renderer,phase){
 const s=renderer.sim,world=s.world,tile=CFG.tileSize*renderer.zoom,old=renderer.cloudShadeLayer,key=[s.day,s.climate?.rain,renderer.w,renderer.h,renderer.zoom,!!renderer.lowDetail,world.regionOrigin?.x||0,world.regionOrigin?.y||0,world.seedHash].join(':');
 const dx=old?((old.cameraX-renderer.camera.x)+nearestDelta(phase.x-old.phaseX,32))*tile:0,dy=old?((old.cameraY-renderer.camera.y)+nearestDelta(phase.y-old.phaseY,24))*tile:0;
 if(old&&old.world===world&&old.rainScale===world.environment?.rainScale&&old.key===key&&Math.abs(dx)<margin/2&&Math.abs(dy)<margin/2)return{layer:old,dx,dy};
 const layer=renderer.cloudShadeLayer=buildLayer(renderer,phase,key,old);return{layer,dx:0,dy:0};
}
export function drawCloudShadows(renderer,sample){const phase=renderer.cloudShadePhase=advanceCloudShade(renderer.cloudShadePhase,sample,renderer.renderNow,renderer.sim.seed),entry=cloudLayer(renderer,phase);if(!entry.layer.count||!entry.layer.canvas)return 0;const c=renderer.ctx;c.save();c.globalAlpha=1;c.globalCompositeOperation='source-over';c.shadowBlur=0;c.shadowColor='rgba(0,0,0,0)';c.imageSmoothingEnabled=false;c.drawImage(entry.layer.canvas,Math.round(entry.dx-margin),Math.round(entry.dy-margin));c.restore();return entry.layer.count}
