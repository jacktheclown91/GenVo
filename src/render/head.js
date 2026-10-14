import {bodyFrame,socketPoints} from './socket-layout.js';
import {artForPart} from './runtime-part-art.js';
import {pixel,ART_DETAIL} from './pixel-art.js';
import {roundedMantleRows} from './genvo.js';
// Head geometry and its facial attachments share one read-only pose in world/editor.
export function headPose(assembly,profile,torsoSockets,{frame=0,behavior={},life=null}={}){
 if(!assembly.head&&!assembly.implicitHead)return null;
 const {v,perp,bodyW,bodyH,bodyOffset:b}=profile,size=Math.max(3.4,Math.min(bodyW,bodyH)*.60);
 const edge=1/Math.hypot(v.x/(bodyW/2),v.y/(bodyH/2)),forward=edge*.72+size*.28;
 const mount=assembly.head?torsoSockets?.head:null,drop=Number(behavior.headDrop)||0,reach=Number(behavior.headReach)||0;
 const x=(mount?.x??b.x+v.x*forward)+v.x*(drop*.1+reach),y=(mount?.y??b.y+v.y*forward)+v.y*(drop*.1+reach);
 const breath=Number.isFinite(life?.breath)?(life.breath-.5)*(life.strained?.035:.018):Math.sin(frame*Math.PI/4)*.012,width=size*(1+breath),height=size*.9*(1-breath);
 const turn=Math.max(-.5,Math.min(.5,Number(behavior.headTurn)||0)),cos=turn?Math.cos(turn):1,sin=turn?Math.sin(turn):0,look=turn?{x:v.x*cos-v.y*sin,y:v.x*sin+v.y*cos}:v,side=turn?{x:-look.y,y:look.x}:perp;
 const partId=assembly.head||'head-base',restSockets=socketPoints(partId,bodyFrame({fx:v.x,fy:v.y,perp,bx:x,by:y,bodyW:width,bodyH:height}));
 const sockets=turn?Object.fromEntries(Object.entries(restSockets).map(([key,p])=>{const dx=p.x-x,dy=p.y-y;return[key,{x:x+dx*cos-dy*sin,y:y+dx*sin+dy*cos}]})):restSockets;
 return {partId,x,y,width,height,sockets,turn,v:look,perp:side,implicit:!assembly.head};
}
export function facialMounts(assembly,head,torsoSockets){
 const out={};for(const [socket,id] of Object.entries(assembly.faceNodes)){
  const nested=assembly.headNodeId&&id.startsWith(assembly.headNodeId+'/');
  const point=(nested||head?.implicit)?head?.sockets?.[socket]:torsoSockets?.[socket];if(point)out[socket]=point;
 }return out;
}
export function drawHead(ctx,head,{scale=1,palette,pigment=null,frame=0,state='idle',facing=0,timeMs=frame*125,authoredParts}={}){
 if(!head)return false;
 const art=authoredParts?.[head.partId]||artForPart(head.partId);
 if(typeof ctx.drawImage==='function'&&art?.drawHead?.(ctx,{x:head.x*scale,y:head.y*scale,width:head.width*scale,height:head.height*scale,rotationRadians:head.turn||0,state,facing,timeMs,pigment}))return true;
 // Canvas-less checks and unavailable artwork use the same modular head fallback.
 const F=1/ART_DETAIL,rows=roundedMantleRows(head.width*ART_DETAIL,head.height*ART_DETAIL);
 for(const row of rows){pixel(ctx,head.x+(row.x-1)*F,head.y+row.y*F,(row.w+2)*F,F,scale,palette.shade);pixel(ctx,head.x+row.x*F,head.y+row.y*F,row.w*F,F,scale,row.y>0?palette.body:palette.light)}
 return true;
}
