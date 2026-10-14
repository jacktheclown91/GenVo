import {flankInstanceOffset} from './flank-placement.js';
import {pixel,pixelLine,snap,ART_DETAIL} from './pixel-art.js';
import {nativeArtStatus,artForPart} from './runtime-part-art.js';
// Shared GenVo8 body drawing. Presentation-only and reusable by gameplay and lineage portraits.
import {genvoVisualPose,roundedMantleRows,splayAngle} from './genvo.js';
import {assemblyFor,relativeLegIndex} from './creature-assembler.js';
import {partDef} from '../lineage/part-registry.js';
import {drawPart,drawLimb,OWN_EYES} from './part-sprites.js';
import {bodyFrame,socketPoints,limbOfSlot} from './socket-layout.js';
import {headPose,facialMounts,drawHead} from './head.js';
import {anatomicalLimbLayers} from './anatomy-depth.js';

const DIRV=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
// Wave 1: a designed body's shape (length along the facing, width across it) as screen width and height scales.
function shapeScales(shape,dir){if(!shape)return[1,1];const [vx,vy]=DIRV[dir&7],m=Math.hypot(vx,vy),ox=Math.abs(vx/m),oy=Math.abs(vy/m),t=ox+oy;return[(ox*shape.length+oy*shape.width)/t*shape.size,(oy*shape.length+ox*shape.width)/t*shape.size]}
// Art redo (v1.47.0): every creature is drawn to a scratch canvas, then composited with a dark
// one-art-pixel outline round its whole silhouette, so bodies, heads and legs read clearly against
// any ground. Contexts without drawImage (tests, exporters) get the plain drawing.
let scratch=null;
// v1.57.3: ordinary page canvases, as the terrain uses. On some graphics drivers every copy from an
// OffscreenCanvas onto the page is an expensive transfer; creature drawing took 35 ms a frame on the
// creator's machine while terrain (page canvases) took 0.4 ms.
function makeCanvas(n){if(typeof document!=='undefined'){const cv=document.createElement('canvas');cv.width=n;cv.height=n;return cv}if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(n,n);return null}
function scratchFor(n){
  if(scratch&&scratch.n===n)return scratch;const a=makeCanvas(n),b=makeCanvas(n);if(!a||!b)return null;
  // v1.57.3: the scratch canvases are CPU canvases (willReadFrequently). On a GPU backend, drawing a
  // freshly painted GPU canvas forces the card to finish its work first, several stalls per creature.
  const ctx=cv=>{const x=cv.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=false;return x};scratch={n,a:ctx(a),b:ctx(b)};return scratch;
}
// The outline colour: the palette's shade, much darker.
// A blend of two hex colours (t = 0 gives a, 1 gives b).
export function mixHex(a,b,t){const A=/^#([0-9a-f]{6})$/i.exec(a||''),B=/^#([0-9a-f]{6})$/i.exec(b||'');if(!A||!B)return a;const x=parseInt(A[1],16),y=parseInt(B[1],16),ch=k=>Math.round((x>>k&255)*(1-t)+(y>>k&255)*t).toString(16).padStart(2,'0');return'#'+ch(16)+ch(8)+ch(0)}
// Five strictly increasing native skin tones from a creature's already-inherited
// visual palette. Biology, limb anatomy and protected accent details are unchanged.
function hexRgb(hex){const m=/^#([0-9a-f]{6})$/i.exec(hex||'');return m?[16,8,0].map(n=>(parseInt(m[1],16)>>n)&255):null}
function blendRgb(a,b,t){return a.map((v,i)=>Math.max(1,Math.min(255,Math.round(v*(1-t)+b[i]*t))))}
export function inheritedSkinRamp(p){
 const shade=hexRgb(p?.shade),body=hexRgb(p?.body),light=hexRgb(p?.light);
 if(!shade||!body||!light)return null;
 const tones=[blendRgb(shade,[7,12,16],.7),blendRgb(shade,body,.20),body,blendRgb(body,light,.72),blendRgb(light,[255,255,255],.40)];
 const lum=c=>c[0]*.2126+c[1]*.7152+c[2]*.0722;
 // Some custom palettes are deliberately non-monotone; keep authored paint instead
 // of supplying an invalid/collapsing ramp to the canonical indexed-art validator.
 if(tones.some((c,i)=>i>0&&lum(c)<=lum(tones[i-1])))return null;
 return tones;
}
export function outlineColor(p){const m=/^#([0-9a-f]{6})$/i.exec(p?.shade||'');if(!m)return'#141a24';const v=parseInt(m[1],16),f=x=>Math.round(x*.34+6).toString(16).padStart(2,'0');return'#'+f(v>>16&255)+f(v>>8&255)+f(v&255)}
// v1.57.0: finished sprites can be kept by a caller-supplied key (the world renderer), so a pose
// already drawn costs one canvas copy instead of a full redraw and outline pass.
// v1.57.3: each cached sprite becomes an ImageBitmap, an immutable image the browser keeps ready on
// the graphics card, so drawing it never waits on other canvas work. Until the bitmap is ready the
// sprite is drawn from a small CPU canvas. (A shared atlas was tried in v1.57.2: writing new sprites
// into a texture that is drawn from in the same frame stalls GPU backends.)
const spriteCache=new Map(),SPRITE_CACHE_MAX=2400;
function keepSprite(ck,src,n){
  const cv=makeCanvas(n);if(!cv)return;const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(src,0,0,n,n,0,0,n,n);const entry={img:cv};spriteCache.set(ck,entry);
  if(typeof createImageBitmap==='function')createImageBitmap(cv).then(bmp=>{if(spriteCache.get(ck)===entry)entry.img=bmp;else bmp.close?.()}).catch(()=>{});
  if(spriteCache.size>SPRITE_CACHE_MAX){const [oldKey,old]=spriteCache.entries().next().value;spriteCache.delete(oldKey);old.img?.close?.()}
}
export function drawGenvoSprite(c,opts={}){
  const s=opts.scale||1,n=Math.ceil(44*s/2)*2;
  const S=typeof c?.drawImage==='function'?scratchFor(n):null;if(!S)return drawGenvoBody(c,opts);
  const artRevision=nativeArtStatus().revision;const ck=opts.cacheKey&&!opts.authoredParts?opts.cacheKey+'|art'+artRevision+'|'+s+'|look'+(opts.pose?.behavior?.headTurn||0)+'|'+'|'+JSON.stringify(opts.pose?.partExpression||null):null;if(ck){const hit=spriteCache.get(ck);if(hit){c.drawImage(hit.img,-n/2,-n/2);return}}
  const {a,b}=S,size=S.n,h=size/2,o=Math.max(1,Math.round(s/ART_DETAIL));
  for(const x of [a,b]){x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=1;x.clearRect(0,0,size,size)}
  a.translate(h,h);drawGenvoBody(a,opts);a.setTransform(1,0,0,1,0,0);
    for(const [dx,dy] of [[o,0],[-o,0],[0,o],[0,-o]])b.drawImage(a.canvas,dx,dy);b.globalCompositeOperation='source-in';b.fillStyle=outlineColor(opts.palette);b.fillRect(0,0,size,size);b.globalCompositeOperation='source-over';b.drawImage(a.canvas,0,0);
  c.drawImage(b.canvas,0,0,size,size,-h,-h,size,size);
  if(ck)keepSprite(ck,b.canvas,n);
}
// Editor (v1.53.0): where each socket of a creature sits on its drawing, in the same units as
// drawGenvoSprite (multiply by scale for pixels). Empty limb sockets get the point a leg there
// would reach. Keys are "parent|socket" as the body plan uses them.
export function genvoAnchors({animal:a,phenotype:ph,frame=0,pose={}}={}){
  const asm=assemblyFor(a),dir=pose.dir??a.dir??0,[shapeW,shapeH]=shapeScales(asm.shape,dir);
  const profile=genvoVisualPose({id:a.id,dir,frame,moving:false,action:'idle',legSlots:asm.legSlots,bodyScale:ph.bodyScale,bodyWidthScale:(ph.bodyWidthScale||1)*shapeW,bodyHeightScale:(ph.bodyHeightScale||1)*shapeH,limbScale:ph.limbScale,sensoryScale:ph.sensoryScale,eyeScale:ph.eyeScale,feelerScale:ph.feelerScale,temperamentScale:ph.temperamentScale,stage:'adult',life:{},behavior:{}});
  const {v,perp,bodyW,bodyH,bodyOffset,legs}=profile,fx=v.x,fy=v.y,bx=bodyOffset.x,by=bodyOffset.y,vn=Math.hypot(fx,fy)||1,rx=bodyW/2,ry=bodyH/2;
  const edgeAt=(dx,dy)=>1/Math.hypot(dx/rx,dy/ry),referenceHead=headPose(asm,profile,null);
  const forward=referenceHead?(referenceHead.x-bx)*fx+(referenceHead.y-by)*fy:profile.face.eyeForward,faceShift=Math.max(0,forward-profile.face.eyeForward+.15);
  const eyeF=profile.face.eyeForward+faceShift,mouthF=profile.face.mouthForward+faceShift+.35,spread=profile.face.eyeSpread,out=[];
  const plan=a.bodyPlan,root=plan?.nodes.find(n=>!n.parent),torso=partDef(root?.partId);
  // An authored body gives its own places (render/socket-layout.js); the editor shows them there.
  const L=root?socketPoints(root.partId,bodyFrame({fx,fy,perp,bx,by,bodyW,bodyH})):null,hipShift=slot=>{const id=limbOfSlot(slot),hip=L?.[id],leg=legs.find(l=>l.slot===slot);return hip&&leg?{x:hip.x-(leg.root.x+bx),y:hip.y-(leg.root.y+by)}:{x:0,y:0}};
  for(const s of torso?.providedSockets||[]){
    if(asm.head&&(s.type==='mouth'||s.type==='eye'))continue;
    let x,y;
    if(L?.[s.id]){const pt=referenceHead?.implicit&&(s.type==='mouth'||s.type==='eye')?referenceHead.sockets[s.id]||L[s.id]:L[s.id];if(s.type==='limb'){const dx=pt.x-bx,dy=pt.y-by,m=Math.hypot(dx,dy)||1;x=pt.x+dx/m*2.4;y=pt.y+dy/m*2.4}else{x=pt.x;y=pt.y-(s.id==='dorsal'?1:0)}out.push({key:'root|'+s.id,parent:'root',socket:s.id,type:s.type,x,y});continue}
    if(s.type==='limb'){const slot=s.slot,leg=legs.find(l=>l.slot===slot);if(leg){x=leg.foot.x*.6+leg.knee.x*.4;y=leg.foot.y*.6+leg.knee.y*.4}else{const ang=splayAngle(slot*Math.PI/8),dx=fx*Math.cos(ang)+perp.x*Math.sin(ang),dy=fy*Math.cos(ang)+perp.y*Math.sin(ang),r=edgeAt(dx,dy)+2.6;x=bx+dx*r;y=by+dy*r}}
    else if(s.id==='mouth'){x=bx+fx*mouthF;y=by+fy*mouthF}
    else if(s.id==='eye.left'||s.id==='eye.right'){const g=s.id==='eye.left'?-1:1;x=bx+fx*eyeF+perp.x*g*spread;y=by+fy*eyeF+perp.y*g*spread}
    else if(s.id==='eye.left.2'||s.id==='eye.right.2'){const g=s.id==='eye.left.2'?-1:1;x=bx+fx*(eyeF-1.9)+perp.x*g*(spread+1.3);y=by+fy*(eyeF-1.9)+perp.y*g*(spread+1.3)}
    else if(s.id==='dorsal'){x=bx-fx;y=by-Math.max(2,bodyH*.46)-1}
    else if(s.id==='flank.left'||s.id==='flank.right'){const g=s.id==='flank.left'?-1:1;x=bx+perp.x*g*(bodyW*.44);y=by+perp.y*g*(bodyH*.4)}
    else if(s.id==='tail'){x=bx-fx*(bodyW*.46+1.5);y=by-fy*(bodyH*.46+1.5)+1}
    if(x!=null)out.push({key:'root|'+s.id,parent:'root',socket:s.id,type:s.type,x,y});
  }
  const head=headPose(asm,profile,L,{frame});
  if(asm.headNodeId&&head)for(const socket of partDef(asm.head)?.providedSockets||[]){const pt=head.sockets?.[socket.id];if(pt)out.push({key:asm.headNodeId+'|'+socket.id,parent:asm.headNodeId,socket:socket.id,type:socket.type,x:pt.x,y:pt.y})}
  // Spurs sit at the knee of each leg the body has.
  for(const n of plan?.nodes||[]){const m=/^root\/limb\.(\d+)$/.exec(n.id);if(!m)continue;const id=Number(m[1]),slot=id<8?id*2:(id-8)*2+1,leg=legs.find(l=>l.slot===slot);if(leg){const sh=hipShift(slot);out.push({key:n.id+'|spur',parent:n.id,socket:'spur',type:'spur',x:leg.knee.x+bx*.48+sh.x,y:leg.knee.y+by*.48+sh.y})}}
  return{anchors:out,body:{x:bx,y:by,w:bodyW,h:bodyH}};
}
function drawGenvoBody(c,{animal:a,phenotype:ph,scale:s,frame=0,moving=false,palette:p,pose={},authoredParts,authoredTimeMs=0}={}){
  const asm=assemblyFor(a),[shapeW,shapeH]=shapeScales(asm.shape,pose.dir??a.dir??0);
  const frameInt=Math.floor(frame)&7,life=pose.life||{},profile=genvoVisualPose({id:a.id,dir:pose.dir??a.dir,frame,moving,action:pose.action||'idle',legSlots:asm.legSlots,bodyScale:ph.bodyScale,bodyWidthScale:(ph.bodyWidthScale||1)*shapeW,bodyHeightScale:(ph.bodyHeightScale||1)*shapeH,limbScale:ph.limbScale,sensoryScale:ph.sensoryScale,eyeScale:ph.eyeScale,feelerScale:ph.feelerScale,temperamentScale:ph.temperamentScale,dependent:!!pose.dependent,alert:!!pose.alert,stage:pose.stage||'adult',life,behavior:pose.behavior||{}});
  const {v,perp,bodyW,bodyH,bodyOffset,legs,flee,drink,court,hunt}=profile,fx=v.x,fy=v.y,bx=bodyOffset.x,by=bodyOffset.y;
  const L=asm.explicit?socketPoints(asm.torso,bodyFrame({fx,fy,perp,bx,by,bodyW,bodyH})):null;
  const head=headPose(asm,profile,L,{frame,behavior:pose.behavior,life}),faceMounts=facialMounts(asm,head,L);
  const forward=head?(head.x-bx)*fx+(head.y-by)*fy:profile.face.eyeForward;
  const faceShift=Math.max(0,forward-profile.face.eyeForward+.15);
  const face={...profile.face,eyeForward:profile.face.eyeForward+faceShift,mouthForward:profile.face.mouthForward+faceShift+.35};
  if(L){const proj=pt=>({f:(pt.x-bx)*fx+(pt.y-by)*fy,s:(pt.x-bx)*perp.x+(pt.y-by)*perp.y});if(L.mouth)face.mouthForward=proj(L.mouth).f;if(L['eye.right']){const e=proj(L['eye.right']);face.eyeForward=e.f;face.eyeSpread=Math.abs(e.s)}}
  const expressionNode=(socket,index=0)=>asm.faceNodes[socket]||a.bodyPlan?.nodes.filter(n=>n.parent==='root'&&n.socket===socket)[index]?.id;
  const K={s,p,behavior:profile.behavior,originX:bx,originY:by,nativePigment:inheritedSkinRamp(p),fx,fy,perp,bx,by,bodyW,bodyH,face,frameInt,authoredParts,authoredState:pose.action||'idle',authoredFacing:pose.dir??a.dir??0,authoredTimeMs:authoredTimeMs||frameInt*125,explicit:asm.explicit,L,partExpression:pose.partExpression};
  if(asm.tail)drawPart(c,asm.tail,K);

  // Ordinary legs join beneath the dorsal body; genuinely raised strikes can cross it.
  // Each mounted part supplies its tissue, while canonical locomotion owns its contacts.
  const {back:farLegs,front:nearLegs}=anatomicalLimbLayers(legs,by);
  const drawLeg=leg=>{
    let root={x:leg.root.x+bx,y:leg.root.y+by},knee={x:leg.knee.x+bx*.48,y:leg.knee.y+by*.48},foot=leg.foot;
    // v1.54.0: an authored body puts the hip where it says; the leg keeps its own shape and stride.
    {const hip=leg.slot!=null&&L?.[limbOfSlot(leg.slot)];if(hip){const dx=hip.x-root.x,dy=hip.y-root.y;root={x:hip.x,y:hip.y};knee={x:knee.x+dx,y:knee.y+dy};foot={x:foot.x+dx,y:foot.y+dy}}}
    const rel=relativeLegIndex(leg),legPart=leg.slot!=null?asm.slotLegs[leg.slot]:asm.legs[rel],spurPart=leg.slot!=null?asm.slotSpurs[leg.slot]:asm.spurs[rel],LK={...K,leg,root,knee,foot,size:a?.anatomy?.spring};
    const nativeLimb=drawLimb(c,legPart||'walking-leg',LK);
    if(spurPart)drawPart(c,spurPart,LK);
    if(!asm.explicit&&ph.adaptations?.webbedLimbs&&Math.abs(leg.side)>.34){const toeX=snap(foot.x),toeY=snap(foot.y),sign=Math.sign(leg.side)||1;pixel(c,toeX+sign,toeY,2,1,s,p.light)}
    if(!nativeLimb&&legPart&&legPart!=='walking-leg')drawPart(c,legPart,LK);
  };
  for(const leg of farLegs)drawLeg(leg);
  // Flank parts (armor plates, storage sacs, venom glands), beneath the dorsal torso in near-vertical overhead.
  if(!asm.explicit){for(const part of ['armor-plate','storage-sac','venom-gland'])for(const sign of [-1,1])if(asm.flanks[sign].includes(part))drawPart(c,part,{...K,sign})}
  // Every organ shares the flank region, including unlike part types.
  else for(const sign of [-1,1]){const parts=asm.flanks[sign];for(let index=0;index<parts.length;index++){const offset=flankInstanceOffset(index,parts.length,bodyW,bodyH);drawPart(c,parts[index],{...K,sign,bx:bx-fx*offset,by:by-fy*offset})}}


  // Native torso art (nine distinct 32px anatomical silhouettes). Preserve the original
  // procedural mantle for unsupplied parts, contexts without canvas, and tool/test fallbacks.
  // A torso draws beneath near legs, head, and mounted appendages, sharing the existing socket rig.
  const expansion=Math.max(0,Math.min(1,life.breath||0)),surfaceW=bodyW*(1+expansion*.018),surfaceH=bodyH*(1+expansion*(life.strained?.065:.04));
  const torsoArt=authoredParts?.[asm.torso]||artForPart(asm.torso);
  const hasNativeTorso=typeof c.drawImage==='function'&&!!torsoArt?.drawTorso?.(c,{
    x:bx*s,y:by*s,width:surfaceW*s,height:surfaceH*s,facing:K.authoredFacing,
    state:K.authoredState,timeMs:K.authoredTimeMs,pigment:K.nativePigment
  });
  const D=ART_DETAIL,F=1/D;
  if(!hasNativeTorso){
    const rows=roundedMantleRows(surfaceW*D,surfaceH*D,{squash:life.hurt&&!moving?1:0});
    if(rows.length){const top=rows[0],bot=rows.at(-1);pixel(c,bx+top.x*F,by+(top.y-1)*F,top.w*F,F,s,p.shade);pixel(c,bx+bot.x*F,by+(bot.y+1)*F,bot.w*F,F,s,p.shade)}
    for(const row of rows)pixel(c,bx+(row.x-1)*F,by+row.y*F,(row.w+2)*F,F,s,p.shade);
    const mid=mixHex(p.body,p.shade,.45);
    for(const row of rows){const yy=row.y*F,lower=yy>Math.max(0,bodyH*.14),edge=row.edge>.72;pixel(c,bx+row.x*F,by+yy,row.w*F,F,s,lower&&edge?p.shade:yy>bodyH*.2?mid:p.body)}
  }
  // Fixed founder-specific back markings are an older decorative fallback; native artwork uses
  // body configuration rather than the species ID to choose its silhouette.
  // Native and procedural bodies share anatomy-derived material; no lineage-ID markings.
  for(const leg of nearLegs)drawLeg(leg);
  const frontX=bx+fx*(Math.max(2,bodyW*.34)),frontY=by+fy*(Math.max(2,bodyH*.34));

  const hiX=bx-Math.max(1,bodyW*.22),hiY=by-Math.max(2,bodyH*.33);
  if(!hasNativeTorso)pixel(c,snap(hiX),snap(hiY),Math.max(2,snap(bodyW*.30)),1,s,p.light);
  if(!hasNativeTorso&&(frameInt===1||frameInt===5)&&!flee)pixel(c,snap(hiX+1),snap(hiY+1),1,1,s,'rgba(239,247,255,.62)');

  if(ph.lineageForm==='forager'){const mark='rgba(226,238,211,.52)';for(const sign of [-1,1]){const sx=bx+perp.x*sign*(bodyW*.36)-fx*1.2,sy=by+perp.y*sign*(bodyH*.30)-fy*1.2;pixelLine(c,sx,sy,sx-fx*2+perp.x*sign*.5,sy-fy*2+perp.y*sign*.5,s,mark)}}
  if(ph.lineageForm==='colony'){const mark='rgba(233,211,148,.48)';pixel(c,snap(bx-fx*2.2),snap(by-fy*2.2),2,2,s,mark);for(const sign of [-1,1])pixel(c,snap(bx+perp.x*sign*(bodyW*.30)-fx*.5),snap(by+perp.y*sign*(bodyH*.30)-fy*.5),1,2,s,mark)}
  if(ph.protoTrait){
    const ps=Math.max(.18,Math.min(1,ph.protoTraitStrength||.3));
    if(ph.protoTrait==='frugal-frame'){const mark=`rgba(206,220,178,${(.42+ps*.20).toFixed(2)})`;pixelLine(c,bx-perp.x*2-fx*1.2,by-perp.y*2-fy*1.2,bx+perp.x*2-fx*1.2,by+perp.y*2-fy*1.2,s,mark)}
    else if(ph.protoTrait==='range-sense'){const mark=`rgba(236,220,126,${(.45+ps*.22).toFixed(2)})`;for(const sign of [-1,1])pixel(c,snap(bx-fx*3.4+perp.x*sign*2.7),snap(by-fy*3.4+perp.y*sign*2.7),1,2,s,mark)}
    else if(ph.protoTrait==='watch-crest'){const mark=`rgba(242,176,133,${(.48+ps*.22).toFixed(2)})`;for(const sign of [-1,1])pixelLine(c,bx-fx*2.8+perp.x*sign*2.5,by-fy*2.8+perp.y*sign*2.5,bx-fx*4.2+perp.x*sign*3.0,by-fy*4.2+perp.y*sign*3.0,s,mark)}
    else if(ph.protoTrait==='close-brood'){const mark=`rgba(228,199,146,${(.44+ps*.20).toFixed(2)})`;for(const sign of [-1,1])pixel(c,snap(bx+perp.x*sign*(bodyW*.36)),snap(by+perp.y*sign*(bodyH*.18)),2,1,s,mark)}
    else if(ph.protoTrait==='dryland-skin'){const mark=`rgba(217,177,104,${(.45+ps*.22).toFixed(2)})`;for(const sign of [-1,1])pixel(c,snap(bx+perp.x*sign*(bodyW*.42)-fx*1.1),snap(by+perp.y*sign*(bodyH*.38)-fy*1.1),1,2,s,mark)}
    else if(ph.protoTrait==='splayfoot'){const mark=`rgba(132,210,207,${(.46+ps*.22).toFixed(2)})`;for(const leg of legs)if(Math.abs(leg.side)>.5&&leg.lift<2)pixel(c,snap(leg.foot.x+Math.sign(leg.side||1)),snap(leg.foot.y),2,1,s,mark)}
    else if(ph.protoTrait==='heat-shed-mantle'){const mark=`rgba(239,194,143,${(.44+ps*.20).toFixed(2)})`;pixelLine(c,bx-fx*3-perp.x*2,by-fy*3-perp.y*2,bx-fx*3+perp.x*2,by-fy*3+perp.y*2,s,mark)}
    else if(ph.protoTrait==='cold-mantle'){const mark=`rgba(220,239,245,${(.46+ps*.22).toFixed(2)})`;pixel(c,snap(bx-fx*2-perp.x*3),snap(by-fy*2-perp.y*3),2,1,s,mark);pixel(c,snap(bx-fx*2+perp.x*2),snap(by-fy*2+perp.y*2),2,1,s,mark)}
    if(ph.protoMixedTrait&&ph.protoGeneFlow>.08){const mixedColors={'frugal-frame':'206,220,178','range-sense':'236,220,126','watch-crest':'242,176,133','close-brood':'228,199,146','dryland-skin':'217,177,104','splayfoot':'132,210,207','heat-shed-mantle':'239,194,143','cold-mantle':'220,239,245'},rgb=mixedColors[ph.protoMixedTrait]||'226,226,214',a=(.34+Math.min(.28,ph.protoGeneFlow*.72)).toFixed(2);pixel(c,snap(bx+perp.x*(bodyW*.42)+fx*.9),snap(by+perp.y*(bodyH*.42)+fy*.9),1,2,s,`rgba(${rgb},${a})`)}
  }
  if(ph.speciesBranch){const mark='rgba(248,235,176,.76)';for(const sign of [-1,1]){const sx=bx-fx*(bodyW*.30)+perp.x*sign*(bodyW*.46),sy=by-fy*(bodyH*.30)+perp.y*sign*(bodyH*.46);pixel(c,snap(sx),snap(sy),1,2,s,mark);pixel(c,snap(sx-fx*1.6),snap(sy-fy*1.6),1,1,s,'rgba(248,235,176,.52)')}}
  if(ph.speciesLifestyle==='aquatic'){const mark='rgba(116,218,226,.70)';for(const leg of legs)if(Math.abs(leg.side)>.45&&leg.lift<2){const sign=Math.sign(leg.side)||1;pixel(c,snap(leg.foot.x+sign),snap(leg.foot.y),2,1,s,mark)}pixelLine(c,bx-perp.x*2+fx,by-perp.y*2+fy,bx+perp.x*2+fx,by+perp.y*2+fy,s,'rgba(116,218,226,.42)')}
  else if(ph.speciesLifestyle==='nomadic'){const mark='rgba(226,226,176,.66)';for(const sign of [-1,1])pixelLine(c,bx+perp.x*sign*2.5-fx*1.8,by+perp.y*sign*2.5-fy*1.8,bx+perp.x*sign*3.3-fx*3.3,by+perp.y*sign*3.3-fy*3.3,s,mark)}
  else if(ph.speciesLifestyle==='guardian'){const mark='rgba(232,177,108,.70)';for(const sign of [-1,1]){const gx=bx+perp.x*sign*(bodyW*.40)-fx*.8,gy=by+perp.y*sign*(bodyH*.40)-fy*.8;pixel(c,snap(gx),snap(gy),2,2,s,mark)}}
  else if(ph.speciesLifestyle==='burrower'){const mark='rgba(180,139,94,.72)';for(const leg of legs)if(leg.front>.25&&leg.lift<2){const sign=Math.sign(leg.side)||1;pixel(c,snap(leg.foot.x+sign),snap(leg.foot.y),2,1,s,mark);pixel(c,snap(leg.foot.x),snap(leg.foot.y+1),1,1,s,'rgba(137,96,64,.72)')}}
  else if(ph.speciesLifestyle==='hunter'){const mark='rgba(210,108,91,.78)',jawX=bx+fx*(face.mouthForward+.9),jawY=by+fy*(face.mouthForward+.9);for(const sign of [-1,1]){pixel(c,snap(jawX+perp.x*sign*1.6),snap(jawY+perp.y*sign*1.6),2,1,s,mark);const leg=legs.find(x=>Math.sign(x.side||1)===sign&&x.front>.25);if(leg)pixel(c,snap(leg.foot.x),snap(leg.foot.y),1,2,s,'rgba(210,108,91,.62)')}}
  else if(ph.speciesLifestyle==='grazer'){const mark='rgba(155,190,94,.76)';for(const sign of [-1,1]){pixelLine(c,bx-fx*.4+perp.x*sign*(bodyW*.34),by-fy*.4+perp.y*sign*(bodyH*.34),bx-fx*2.5+perp.x*sign*(bodyW*.38),by-fy*2.5+perp.y*sign*(bodyH*.38),s,mark);pixel(c,snap(bx-fx*3.1+perp.x*sign*1.2),snap(by-fy*3.1+perp.y*sign*1.2),1,1,s,'rgba(192,211,119,.68)')}}
  if(pose.stage==='elder'){const ageEdge='rgba(218,226,222,.46)';pixel(c,snap(bx-perp.x*(bodyW*.36)-fx),snap(by-perp.y*(bodyH*.34)-fy),2,1,s,ageEdge);pixel(c,snap(bx+perp.x*(bodyW*.36)-fx),snap(by+perp.y*(bodyH*.34)-fy),2,1,s,ageEdge)}

  const ad=ph.adaptations||{};
  if(!hasNativeTorso&&asm.torso!=='soft-torso')drawPart(c,asm.torso,K);
  if(ad.efficientGut){const gx=bx-fx*(bodyW*.18),gy=by-fy*(bodyH*.18)+2;pixelLine(c,gx-perp.x*2,gy-perp.y*2,gx+perp.x*2,gy+perp.y*2,s,p.shade)}
  if(ad.fastHealing){pixel(c,snap(bx-perp.x*2-fx),snap(by-perp.y*2-fy),1,1,s,'rgba(245,239,211,.88)');pixel(c,snap(bx+perp.x*2),snap(by+perp.y*2),1,1,s,'rgba(245,239,211,.68)')}
  if(ad.bitter){pixel(c,snap(bx+perp.x*(bodyW*.42)),snap(by+perp.y*(bodyH*.42)),1,1,s,'#d9e98f');pixel(c,snap(bx-perp.x*(bodyW*.42)),snap(by-perp.y*(bodyH*.42)),1,1,s,'#d9e98f')}
  if(asm.dorsal)drawPart(c,asm.dorsal,{...K,expressionNodeId:expressionNode('dorsal')});
  if(asm.dorsal2)drawPart(c,asm.dorsal2,{...K,expressionNodeId:expressionNode('dorsal',1),bx:bx-fx*2.2,by:by-fy*2.2});
  // The mounted head owns its art; inherited organs are drawn over it.
  drawHead(c,head,{scale:s,palette:p,pigment:K.nativePigment,frame,timeMs:K.authoredTimeMs,state:K.authoredState,facing:K.authoredFacing,authoredParts});
  if(ad.mobbing){for(const sign of [-1,1]){const cx=bx-fx*(bodyW*.18)+perp.x*sign*2.2,cy=by-fy*(bodyH*.18)+perp.y*sign*2.2;pixel(c,snap(cx),snap(cy-1),1,2,s,p.light)}}
  if(ad.coordinatedDefense){for(const sign of [-1,1]){const cx=bx-fx*(bodyW*.08)+perp.x*sign*3.0,cy=by-fy*(bodyH*.08)+perp.y*sign*3.0;pixelLine(c,cx,cy,cx-fx*2+perp.x*sign*.4,cy-fy*2+perp.y*sign*.4,s,p.light)}}
  if(ad.camouflage){const mott='rgba(82,109,72,.70)';pixel(c,snap(bx-3),snap(by-1),2,1,s,mott);pixel(c,snap(bx+2),snap(by+2),2,1,s,mott);pixel(c,snap(bx),snap(by-3),1,1,s,'rgba(126,136,79,.62)')}
  if(ad.adaptiveChromatophores){const shift=(frameInt%4)-1;pixelLine(c,bx-perp.x*3+fx*shift*.35,by-perp.y*3+fy*shift*.35,bx+perp.x*3+fx*shift*.35,by+perp.y*3+fy*shift*.35,s,'rgba(111,139,87,.72)');pixel(c,snap(bx-fx*2+perp.x*2),snap(by-fy*2+perp.y*2),1,1,s,'rgba(161,154,92,.72)')}
  // The native mouth owns its complete outline and articulation; never stack a generic
  // mouth line on top. When native artwork is absent, preserve the procedural fallback.
  const mouthPart=asm.mouth||(!asm.explicit?'grazing-mouth':null);
  const mouthX=faceMounts.mouth?.x??bx+fx*face.mouthForward,mouthY=faceMounts.mouth?.y??by+fy*face.mouthForward;
  let mouthFrame=face.mouthOpen>0?1:0;
  // A funded meal owns opening/closure even when its action is 'crack', not 'eat'.
  if(Number.isFinite(profile.behavior.feedingMouthOpen)){mouthFrame=profile.behavior.feedingMouthOpen>0?1:0;face.mouthOpen=mouthFrame;}
  if(pose.encounter?.move==='call'&&partDef(mouthPart)?.actionCapabilities.includes('call')){mouthFrame=(profile.behavior.mouthPulse||0)>.45?1:0;face.mouthOpen=mouthFrame;}
  if(Number.isFinite(profile.behavior.attackMouthOpen)){mouthFrame=profile.behavior.attackMouthOpen>0?1:0;face.mouthOpen=mouthFrame;}
  const nativeMouthArt=mouthPart&&(authoredParts?.[mouthPart]||artForPart(mouthPart));
  const useNativeMouth=!!nativeMouthArt&&!nativeMouthArt.rig&&typeof c.drawImage==='function';
  if(mouthPart&&(mouthPart!=='grazing-mouth'||useNativeMouth))drawPart(c,mouthPart,{...K,faceTurn:head?.turn||0,
    mouth:{x:mouthX,y:mouthY},authoredState:'idle',
    authoredFrameIndex:mouthFrame});

  if(ph.stripe){
    const bandCount=Math.max(1,ph.patternBands||1),dark=ph.patternPolarity>=0?'rgba(38,57,79,.46)':'rgba(232,221,174,.38)';
    for(let b=0;b<bandCount;b++)for(const sign of [-1,1]){
      const depth=.5+b*.9,sx=bx+perp.x*sign*(bodyW*(.22+b*.035))-fx*depth,sy=by+perp.y*sign*(bodyH*(.22+b*.035))-fy*depth;
      pixel(c,snap(sx),snap(sy),1,b===0?2:1,s,dark);
    }
  }
  if(ph.spot){
    const spots=Math.max(1,ph.patternSpots||1);
    for(let k=0;k<spots;k++){
      const sign=(k&1)?-1:1,depth=1+Math.floor(k/2),sx=bx+perp.x*sign*(1.5+depth*.45)-fx*(.6+depth*.65),sy=by+perp.y*sign*(1.5+depth*.45)-fy*(.6+depth*.65);
      pixel(c,snap(sx),snap(sy),1,1,s,k===0?'rgba(239,247,255,.76)':'rgba(239,247,255,.50)');
    }
  }

  for(const sign of [-1,1]){
    const rx=bx+fx*(Math.max(2.4,bodyW*.30))+perp.x*sign*(face.eyeSpread+1.0),ry=by+fy*(Math.max(2.4,bodyH*.30))+perp.y*sign*(face.eyeSpread+1.0);
    const behavior=profile.behavior||{},sweep=(Number(behavior.feelerSweep)||0)*Math.sin((frame+sign*1.6)*Math.PI/4),pin=Number(behavior.feelerPin)||0;
    const curl=(sign*(frameInt<4?1:-1))*.45,endX=rx+fx*(face.feelerReach-pin*.8)+perp.x*(sign*.75+curl+sweep*sign),endY=ry+fy*(face.feelerReach-pin*.8)+perp.y*(sign*.75+curl+sweep*sign);
    pixelLine(c,rx,ry,endX,endY,s,p.light,.5);pixel(c,snap(endX),snap(endY),1,1,s,p.body);
  }

  // Each installed eye now supplies its own eyelid and iris. Use authored frame 1
  // during a physiological blink; reserve procedural lines only for missing art.
  const nativeEye=id=>id&&(authoredParts?.[id]||artForPart(id));
  for(const sign of [-1,1]){
    const e2=asm.eyes2[sign];if(!e2)continue;
    const at=faceMounts[sign===-1?'eye.left.2':'eye.right.2'];
    const ex=snap(at?.x??bx+fx*(face.eyeForward-1.9)+perp.x*sign*(face.eyeSpread+1.3));
    const ey=snap(at?.y??by+fy*(face.eyeForward-1.9)+perp.y*sign*(face.eyeSpread+1.3));
    const opts={...K,faceTurn:head?.turn||0,sign,eye:{x:ex,y:ey},second:true,own:true,
      authoredState:'idle',authoredFrameIndex:life.blink||face.squint?1:0,
      expressionNodeId:expressionNode(sign===-1?'eye.left.2':'eye.right.2')};
    if(!drawPart(c,e2,opts)){
      pixel(c,ex,ey,1,1,s,'#eef7ff');pixel(c,ex,ey+1,1,1,s,'#223751');
    }
  }
  for(const sign of [-1,1]){
    const at=faceMounts[sign===-1?'eye.left':'eye.right'];
    const ex=snap(at?.x??bx+fx*face.eyeForward+perp.x*sign*face.eyeSpread);
    const ey=snap(at?.y??by+fy*face.eyeForward+perp.y*sign*face.eyeSpread);
    const eyePart=asm.explicit?asm.eyes[sign]:null;
    if(!eyePart&&asm.explicit)continue;
    const blinking=!!(life.blink||face.squint);
    const opts={...K,faceTurn:head?.turn||0,sign,eye:{x:ex,y:ey},own:true,authoredState:'idle',
      authoredFrameIndex:blinking?1:0,
      expressionNodeId:expressionNode(sign===-1?'eye.left':'eye.right')};
    const effective=eyePart||'simple-eye';
    if(nativeEye(effective)&&typeof c.drawImage==='function'&&drawPart(c,effective,opts))continue;
    if(blinking){pixelLine(c,ex-perp.x,ey-perp.y,ex+perp.x,ey+perp.y,s,p.shade);continue}
    if(eyePart&&OWN_EYES.has(eyePart)){drawPart(c,eyePart,opts);continue}
    drawPart(c,'simple-eye',{...opts,wide:face.wide,alert:!!pose.alert});
    if(eyePart&&eyePart!=='simple-eye')drawPart(c,eyePart,opts);
  }

  const mx=bx+fx*face.mouthForward,my=by+fy*face.mouthForward+(fy>=.5?.6:0),half=face.mouthOpen>=2?2:1;
  // The mouth line belongs to the mouth part: a designed body without a mouth part draws none.
  if(useNativeMouth||asm.explicit&&!asm.mouth){}
  else if(face.mouthOpen){
    pixelLine(c,mx-perp.x*half,my-perp.y*half,mx+perp.x*half,my+perp.y*half,s,'#17233a');
    if(face.mouthOpen>=2)pixel(c,snap(mx),snap(my+1),1,1,s,'#8d6070');
    if(drink&&frameInt%2===0)pixel(c,snap(mx),snap(my+2),1,1,s,'rgba(142,220,224,.82)');
  }else if(life.exhausted&&!moving)pixelLine(c,mx-perp.x,my-perp.y,mx+perp.x,my+perp.y,s,'#30405a');
  else if(life.hurt&&!moving)pixelLine(c,mx-perp.x,my-perp.y+1,mx+perp.x,my+perp.y+1,s,'#3b4052');
  else drawPart(c,'grazing-mouth',{...K,mouth:{x:mx,y:my},rest:frame===3||frame===4?1.25:1}); // v1.60.0: the resting mouth is the grazing mouth's own art

  if(ad.provisioningPouches){for(const sign of [-1,1]){const px=bx-perp.x*sign*(bodyW*.42)-fx*1.1,py=by-perp.y*sign*(bodyH*.36)-fy*1.1+2;pixel(c,snap(px),snap(py),2,2,s,p.shade);pixel(c,snap(px),snap(py),1,1,s,p.light)}}
  if(pose.carry){const cx=bx+fx*(bodyW*.55),cy=by+fy*(bodyH*.55)+2,w=ad.provisioningPouches?3:2;pixel(c,snap(cx),snap(cy),w,2,s,pose.carry.kind==='carrion'?'#8b554d':'#b7a064')}

  if(court){const pulse=frameInt<4?1:-1;pixel(c,snap(bx+perp.x*5+fx*pulse),snap(by+perp.y*5+fy*pulse),1,2,s,'#f0d889');pixel(c,snap(bx-perp.x*5+fx*pulse),snap(by-perp.y*5+fy*pulse),1,2,s,'#f0d889')}
  if(hunt)pixel(c,snap(bx+fx*3),snap(by+fy*3),1,1,s,'#f3d5d5');
  if(ph.energetic)pixel(c,snap(bx-1),snap(by+bodyH*.35),2,1,s,'#f0d889');
  if(pose.sharedAlert)pixel(c,snap(bx+perp.x*5),snap(by+perp.y*5),1,1,s,'#e7b36f');
}

