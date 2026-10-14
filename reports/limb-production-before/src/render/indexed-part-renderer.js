import {recolorIndexedFrame} from './indexed-part-art.js';
const segmentDensity=(section,a,b)=>Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(section.end[0]-section.start[0],section.end[1]-section.start[1]);

// Prepare once per asset/palette. Drawing performs no decoding or pixel allocation.
export function prepareIndexedPartRenderer(asset,{palette={},createCanvas}={}){
 const factory=createCanvas||(()=>{if(typeof document!=='undefined')return document.createElement('canvas');if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(32,32);throw Error('Canvas backend unavailable')});
 const sequences=new Map();
 for(const frame of asset.frames){const canvas=factory();canvas.width=asset.width;canvas.height=asset.height;const ctx=canvas.getContext('2d');const image=ctx.createImageData(asset.width,asset.height);image.data.set(recolorIndexedFrame(asset,frame.key,palette));ctx.putImageData(image,0,0);const key=frame.state+':'+frame.facing;if(!sequences.has(key))sequences.set(key,[]);sequences.get(key).push({frame,canvas})}
 for(const entries of sequences.values())entries.sort((a,b)=>a.frame.index-b.frame.index);
 // Inherited skin coloration is derived from the creature's phenotype at draw time.
 // The compiled/source RGB sheets remain untouched. Cache only displayed frames, never
 // 16 frame canvases for every animal or every palette variant.
 const tintCache=new Map(),MAX_TINTED_FRAMES=64;
 function tinted(entry,pigment){
  if(!pigment||!asset.regions.some(r=>r.id==='skin'&&!r.protected))return entry;
  const key=entry.frame.key+'|'+pigment.map(c=>c.join(',')).join(';');
  let hit=tintCache.get(key);if(hit){tintCache.delete(key);tintCache.set(key,hit);return hit}
  const canvas=factory();canvas.width=asset.width;canvas.height=asset.height;
  const ctx=canvas.getContext('2d'),data=ctx.createImageData(asset.width,asset.height);
  data.data.set(recolorIndexedFrame(asset,entry.frame.key,{skin:pigment}));ctx.putImageData(data,0,0);
  hit={frame:entry.frame,canvas};tintCache.set(key,hit);
  if(tintCache.size>MAX_TINTED_FRAMES)tintCache.delete(tintCache.keys().next().value);
  return hit;
 }
 const displayScale=asset.displayScale??1;
 const pivot=[...asset.rootAnchorPx],limits=asset.rootJoint?{...asset.rootJoint}:null;
 const rig=asset.rig||null;
 function drawBone(ctx,entry,section,start,end,scale,sharedWidth=null){
  const [x0,y0]=section.start,[x1,y1]=section.end,dx=x1-x0,dy=y1-y0;
  const distance=Math.hypot(end.x-start.x,end.y-start.y);if(distance<.01)return;
  const sourceLength=Math.hypot(dx,dy),originalAngle=Math.atan2(dy,dx);
  // Length follows physically simulated knee/foot. Orthogonal width stays in native pixels.
  // This is intentionally not a second gait system; bone positions are given by the game.
  const pixelsPerArtUnit=distance/sourceLength;
  // A full-width dual-row atlas has substantially more transverse paint than
  // the old 11px scraps. Keep the skin surface in proportion to the live bone
  // so the extra authored pixels add texture instead of giant block limbs.
  const widthScale=sharedWidth??Math.min(scale*displayScale*.20,pixelsPerArtUnit*1.8);
  const [sx,sy,sw,sh]=section.rect;
  ctx.save();try{
   ctx.imageSmoothingEnabled=false;
   ctx.translate(start.x,start.y);ctx.rotate(Math.atan2(end.y-start.y,end.x-start.x)-originalAngle);
   ctx.scale(pixelsPerArtUnit,widthScale);
   ctx.drawImage(entry.canvas,sx,sy,sw,sh,(sx-x0),(sy-y0),sw,sh);
  }finally{ctx.restore()}
 }

 function select({state='idle',facing=0,timeMs=0,frameIndex=null}={}){if(!Number.isFinite(timeMs)||timeMs<0)throw Error('Invalid animation time');const frames=sequences.get(state+':'+facing);if(!frames)return null;if(frameIndex!==null){if(!Number.isInteger(frameIndex)||frameIndex<0)throw Error('Invalid animation frame index');return frames.find(e=>e.frame.index===frameIndex)||null}const total=frames.reduce((sum,e)=>sum+e.frame.durationMs,0);let elapsed=timeMs%total;for(const entry of frames){if(elapsed<entry.frame.durationMs)return entry;elapsed-=entry.frame.durationMs}return frames[frames.length-1]}
 function drawSurface(ctx,kind,{x=0,y=0,width=8,height=7,state='idle',facing=0,timeMs=0,pigment=null,rotationRadians=0}={}){
  if(rig?.kind!==kind)return false;
  const chosen=select({state,facing,timeMs})||select({state:'idle',facing,timeMs});if(!chosen)return false;
  const entry=tinted(chosen,pigment),[bw,bh]=rig.bodyBoundsPx;
  ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.translate(x,y);if(rotationRadians)ctx.rotate(rotationRadians);ctx.scale(width/bw,height/bh);ctx.drawImage(entry.canvas,-pivot[0],-pivot[1]);}finally{ctx.restore()}return true;
 }
 return Object.freeze({partId:asset.partId,checksum:asset.checksum,rig,frameAt(options){return select(options)?.frame||null},
 drawTorso(ctx,options){return drawSurface(ctx,'torso',options)},
 drawHead(ctx,options){return drawSurface(ctx,'head',options)},
 drawLimb(ctx,{root,knee,foot,scale=1,state='idle',facing=0,timeMs=0,pigment=null,frameIndex=null}={}){
  if(rig?.kind!=='two-bone'||!root||!knee||!foot)return false;
  const chosen=select({state,facing,timeMs,frameIndex})||select({state:'idle',facing,timeMs,frameIndex});if(!chosen)return false;const entry=tinted(chosen,pigment);
  // A flexed shin may be much shorter on screen than the thigh. Its tissue
  // keeps the same transverse scale at the joint instead of collapsing to a wire.
  const sharedWidth=Math.min(scale*displayScale*.20,Math.max(segmentDensity(rig.upper,root,knee),segmentDensity(rig.lower,knee,foot))*1.8);
  drawBone(ctx,entry,rig.upper,root,knee,scale,sharedWidth);drawBone(ctx,entry,rig.lower,knee,foot,scale,sharedWidth);
  // One native shaded insertion bridges the two projections at the actual knee.
  // It is sampled from this limb's current frame/pigment, never a generic circle.
  // Isotropic tissue width prevents a folded/foreshortened bone from opening a seam.
  if(rig.jointSurface&&sharedWidth>0){
   const {rect:[sx,sy,sw,sh],anchor:[ax,ay]}=rig.jointSurface;
   ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.translate(knee.x,knee.y);
    ctx.rotate(Math.atan2(knee.y-root.y,knee.x-root.x));ctx.scale(sharedWidth,sharedWidth);
    ctx.drawImage(entry.canvas,sx,sy,sw,sh,sx-ax,sy-ay,sw,sh);
   }finally{ctx.restore()}
  }
  return true;
 },
 draw(ctx,{x=0,y=0,scale=1,pigment=null,mirrorX=false,...options}={}){if(![x,y,scale].every(Number.isFinite)||scale<=0)throw Error('Invalid part transform');const chosen=select(options);if(!chosen)return false;const entry=tinted(chosen,pigment);let angle=entry.frame.jointDegrees??0;if(limits)angle=Math.max(limits.minDegrees,Math.min(limits.maxDegrees,angle));ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.translate(x,y);ctx.scale(scale*displayScale*(mirrorX?-1:1),scale*displayScale);ctx.rotate(angle*Math.PI/180);ctx.drawImage(entry.canvas,-pivot[0],-pivot[1]);}finally{ctx.restore()}return true}});
}
