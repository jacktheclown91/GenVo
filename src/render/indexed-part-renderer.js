import {recolorIndexedFrame} from './indexed-part-art.js';
const segmentDensity=(section,a,b)=>Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(section.end[0]-section.start[0],section.end[1]-section.start[1]);

// Prepare once per asset/palette. Drawing performs no decoding or pixel allocation.
// Phase 3L: a tinted frame used in the current frame is never recycled within that frame. The batched creature pass
// draws every body before any is read, so recycling (repainting) a frame canvas that an earlier body of the same
// frame still references forced the browser to settle that body first, once per creature: with 200 walking,
// individually pigmented creatures the 256-frame cache was exceeded inside one frame and creature preparation rose
// from 10 to 134 ms. The cache may then grow past MAX_TINTED_FRAMES (up to TINT_HARD_MAX) and shrinks back by
// recycling only frames from earlier frames. Output is identical: a cache only decides reuse.
let tintFrame=0;export function beginTintFrame(){tintFrame++}
const TINT_HARD_MAX=2048;
export function prepareIndexedPartRenderer(asset,{palette={},createCanvas}={}){
 const factory=createCanvas||(()=>{if(typeof document!=='undefined')return document.createElement('canvas');if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(32,32);throw Error('Canvas backend unavailable')});
 function prepared(frame,canvas,rgba){
  const entry={frame,canvas};if(asset.rig?.kind!=='dorsal-display')return entry;
  const r=asset.rig,[px,py]=asset.rootAnchorPx,angle=(frame.facing-2)*Math.PI/4,co=Math.cos(angle),si=Math.sin(angle);
  // Partition actual selected-facing pixels once. No readback, resampling, or
  // destructive source rotation: individual directional/frame edits remain visible.
  const images=[0,1,2].map(()=>{const c=factory();c.width=asset.width;c.height=asset.height;const ctx=c.getContext('2d');return{canvas:c,ctx,data:ctx.createImageData(asset.width,asset.height)}});
  for(let y=0;y<asset.height;y++)for(let x=0;x<asset.width;x++){
   const dx=x+.5-px,dy=y+.5-py,ex=co*dx+si*dy+px,ey=-si*dx+co*dy+py;
   const section=ey<r.rootRect[1]?0:ey>=r.rootRect[1]+r.rootRect[3]?1:2,rect=section===2?r.rootRect:r.panels[section];
   if(ex<rect[0]||ex>=rect[0]+rect[2]||ey<rect[1]||ey>=rect[1]+rect[3])continue;
   const i=(y*asset.width+x)*4;images[section].data.data.set(rgba.subarray(i,i+4),i);
  }
  for(const image of images)image.ctx.putImageData(image.data,0,0);
  entry.dorsalPaint=images.map(i=>i.canvas);return entry;
 }
 const sequences=new Map();
 for(const frame of asset.frames){const canvas=factory();canvas.width=asset.width;canvas.height=asset.height;const ctx=canvas.getContext('2d');const image=ctx.createImageData(asset.width,asset.height);image.data.set(recolorIndexedFrame(asset,frame.key,palette));ctx.putImageData(image,0,0);const key=frame.state+':'+frame.facing;if(!sequences.has(key))sequences.set(key,[]);sequences.get(key).push(prepared(frame,canvas,image.data))}
 for(const entries of sequences.values())entries.sort((a,b)=>a.frame.index-b.frame.index);
 // Inherited skin coloration is derived from the creature's phenotype at draw time.
 // The compiled/source RGB sheets remain untouched. Cache only displayed frames, never
 // 16 frame canvases for every animal or every palette variant.
 const tintCache=new Map(),MAX_TINTED_FRAMES=256;
 function tinted(entry,pigment){
  if(!pigment||!asset.regions.some(r=>r.id==='skin'&&!r.protected))return entry;
  const key=entry.frame.key+'|'+pigment.map(c=>c.join(',')).join(';');
  let hit=tintCache.get(key);if(hit){hit.usedFrame=tintFrame;tintCache.delete(key);tintCache.set(key,hit);return hit}
  // Eviction recycles the oldest frame's canvas and context: many individually pigmented creatures
  // exceed the cache, and allocating a canvas per miss made Blink finalize thousands per second
  // (long embedder GC pauses). putImageData overwrites every pixel, so recycled output is identical.
  let canvas=null,ctx=null;
  if(tintCache.size>=MAX_TINTED_FRAMES){const oldKey=tintCache.keys().next().value,old=tintCache.get(oldKey);
    if(old.usedFrame!==tintFrame||tintCache.size>=TINT_HARD_MAX){tintCache.delete(oldKey);if(!old.dorsalPaint&&old.ctx&&old.usedFrame!==tintFrame){canvas=old.canvas;ctx=old.ctx}}}
  if(!canvas){canvas=factory();canvas.width=asset.width;canvas.height=asset.height;ctx=canvas.getContext('2d')}
  const data=ctx.createImageData(asset.width,asset.height);
  data.data.set(recolorIndexedFrame(asset,entry.frame.key,{skin:pigment}));ctx.putImageData(data,0,0);
  hit=prepared(entry.frame,canvas,data.data);hit.ctx=ctx;hit.usedFrame=tintFrame;tintCache.set(key,hit);
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
 function drawInsertion(ctx,entry,surface,position,angle,width){
  if(!surface||!(width>0))return;
  const {rect:[sx,sy,sw,sh],anchor:[ax,ay]}=surface;
  ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.translate(position.x,position.y);ctx.rotate(angle);ctx.scale(width,width);
   ctx.drawImage(entry.canvas,sx,sy,sw,sh,sx-ax,sy-ay,sw,sh);
  }finally{ctx.restore()}
 }
 function drawSurface(ctx,kind,{x=0,y=0,width=8,height=7,state='idle',facing=0,timeMs=0,pigment=null,rotationRadians=0}={}){
  if(rig?.kind!==kind)return false;
  const chosen=select({state,facing,timeMs})||select({state:'idle',facing,timeMs});if(!chosen)return false;
  const entry=tinted(chosen,pigment),[bw,bh]=rig.bodyBoundsPx;
  ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.translate(x,y);if(rotationRadians)ctx.rotate(rotationRadians);ctx.scale(width/bw,height/bh);ctx.drawImage(entry.canvas,-pivot[0],-pivot[1]);}finally{ctx.restore()}return true;
 }
 return Object.freeze({partId:asset.partId,checksum:asset.checksum,rig,expressionScale:asset.expressionScale||'pulse',frameAt(options){return select(options)?.frame||null},
 drawTorso(ctx,options){return drawSurface(ctx,'torso',options)},
 drawHead(ctx,options){return drawSurface(ctx,'head',options)},
 drawDorsal(ctx,{x=0,y=0,scale=1,headingRadians=0,deployment=0,extent=1,pigment=null,state='idle',facing=2,timeMs=0,frameIndex=null}={}){
  if(rig?.kind!=='dorsal-display')return false;
  if(![x,y,scale,headingRadians,deployment,extent].every(Number.isFinite)||scale<=0)throw Error('Invalid dorsal surface transform');
  // Each selected native frame supplies its own tissue. Only transverse panels
  // fold; the root and world-forward length never grow with an encounter pulse.
  const chosen=select({state,facing,timeMs,frameIndex})||select({state:'idle',facing,timeMs,frameIndex});if(!chosen)return false;
  const entry=tinted(chosen,pigment),fold=(rig.foldedExtent+(1-rig.foldedExtent)*Math.max(0,Math.min(1,deployment)))*Math.max(.25,Math.min(1,extent));
  ctx.save();try{
   ctx.imageSmoothingEnabled=false;ctx.translate(x,y);ctx.rotate(headingRadians);ctx.scale(scale*displayScale,scale*displayScale);
   for(let i=0;i<2;i++){
    const hingeY=i===0?rig.rootRect[1]:rig.rootRect[1]+rig.rootRect[3];
    ctx.save();try{ctx.translate(0,hingeY-pivot[1]);ctx.scale(1,fold);ctx.translate(0,pivot[1]-hingeY);ctx.rotate(-(chosen.frame.facing-2)*Math.PI/4);ctx.drawImage(entry.dorsalPaint[i],-pivot[0],-pivot[1]);}finally{ctx.restore()}
   }
   ctx.rotate(-(chosen.frame.facing-2)*Math.PI/4);ctx.drawImage(entry.dorsalPaint[2],-pivot[0],-pivot[1]);
  }finally{ctx.restore()}return true;
 },
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
  const upperAngle=Math.atan2(knee.y-root.y,knee.x-root.x);
  // An optional native hip insertion keeps its painted volume when the thigh is
  // foreshortened. It belongs to this actual mounted limb and shares its pigment.
  drawInsertion(ctx,entry,rig.hipSurface,root,upperAngle,sharedWidth);
  drawInsertion(ctx,entry,rig.jointSurface,knee,upperAngle,sharedWidth);
  return true;
 },
 draw(ctx,{x=0,y=0,scale=1,pigment=null,mirrorX=false,...options}={}){if(![x,y,scale].every(Number.isFinite)||scale<=0)throw Error('Invalid part transform');const chosen=select(options);if(!chosen)return false;const entry=tinted(chosen,pigment);let angle=entry.frame.jointDegrees??0;if(limits)angle=Math.max(limits.minDegrees,Math.min(limits.maxDegrees,angle));ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.translate(x,y);ctx.scale(scale*displayScale*(mirrorX?-1:1),scale*displayScale);ctx.rotate(angle*Math.PI/180);ctx.drawImage(entry.canvas,-pivot[0],-pivot[1]);}finally{ctx.restore()}return true}});
}
