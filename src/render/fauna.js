import {pixel,pixelLine,snap} from './pixel-art.js';
import {stalkerProfileFor} from '../organisms/stalker-profile.js';

// Deterministic, renderer-only pose language + pixel construction for non-GenVo8 fauna.
// Simulation direction/intent remain authoritative. Fractional frame phases are accepted so
// the renderer may visually bridge the canonical eight animation beats without changing them.

const DIR8=[{x:0,y:-1},{x:1,y:-1},{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1}];
const WAVE=[0,1,2,1,0,-1,-2,-1];
const HOP=[0,-1,-3,-4,-3,-1,0,0];
const TAU=Math.PI*2;

function gaitSin(phase,offset=0){return Math.sin((wrap8(phase)/8)*TAU+offset)}
function gaitCos(phase,offset=0){return Math.cos((wrap8(phase)/8)*TAU+offset)}
function clamp01(v){return Math.max(0,Math.min(1,v))}

export function faunaVisualPose(kind,{id=0,dir=0,frame=0,moving=false,action='idle',alert=false,dependent=false,bodyScale=1,limbScale=1,sensoryScale=1,life={},behavior={},stalkerProfile=null}={}){
  const phase=wrap8(frame),fi=Math.floor(phase),raw=DIR8[dir]||DIR8[0],mag=Math.hypot(raw.x,raw.y)||1,v={x:raw.x/mag,y:raw.y/mag},perp={x:-v.y,y:v.x};
  const o={id,v,perp,frame:fi,phase,moving,action,alert,dependent,bodyScale,limbScale,sensoryScale,life,behavior:behavior||{},stalkerProfile};
  if(kind==='mosskip')return mosskipPose(o);
  if(kind==='rootling')return rootlingPose(o);
  if(kind==='needlejaw')return needlejawPose(o);
  return {kind,...o};
}

export function drawFaunaSprite(ctx,kind,{animal,phenotype,scale,frame,moving,pose={},palette}){
  const profile=kind==='needlejaw'?stalkerProfileFor(animal):null;
  const q=faunaVisualPose(kind,{id:animal.id,dir:pose.dir??animal.dir,frame,moving,action:pose.action||'idle',alert:!!pose.alert,dependent:!!pose.dependent,bodyScale:phenotype.bodyScale,limbScale:phenotype.limbScale,sensoryScale:phenotype.sensoryScale,life:pose.life,behavior:pose.behavior||{},stalkerProfile:profile});
  if(kind==='mosskip')drawMosskip(ctx,q,scale,palette,pose);
  else if(kind==='rootling')drawRootling(ctx,q,scale,palette,pose);
  else if(kind==='needlejaw')drawNeedlejaw(ctx,q,scale,palette,pose);
}

function mosskipPose(o){
  const flee=o.action==='flee',feed=o.action==='eat'||o.action==='drink',court=o.action==='court';
  const hopRaw=o.moving&&!feed&&!court?cycle(HOP,o.phase):0,leap=hopRaw*(flee?1.32:1);
  const airborne=clamp01((-hopRaw-.75)/2.75),compression=o.moving&&!feed&&!court?clamp01(1-Math.abs(hopRaw))*.95:0;
  const launch=o.moving&&!feed&&!court?clamp01((gaitSin(o.phase-Math.PI/2)+1)*.5-airborne*.35):0;
  const b=o.behavior||{},listen=o.action==='listen'||o.action==='scan',rest=o.action==='rest',earLift=o.alert?3:court?4:listen?5:flee?1:(o.action==='approach'?2:0),earPin=flee?2:rest?1:snap((b.feelerPin||0)*1.5),stride=o.moving&&!feed&&!court?gaitSin(o.phase):0;
  const tuck=airborne*(.72+.28*Math.abs(gaitCos(o.phase))),earTrail=o.moving?airborne*(flee?2.1:1.45)+Math.max(0,stride)*.45:0;
  return {kind:'mosskip',...o,flee,feed,court,leap,airborne,compression,launch,tuck,earTrail,earLift,earPin,stride,
    bodyW:snap(10.5*o.bodyScale),haunch:Math.max(3,snap(4.7*o.bodyScale)),
    footReach:Math.max(5,snap((5.3+(flee?1.7:0))*o.limbScale)),earLength:Math.max(6,snap((6.8+earLift*.35)*o.sensoryScale)),
    noseDip:(feed?2.4:0)+(Number(b.headDrop)||0),eyeWide:o.alert||flee||o.life?.hurt||!!b.eyeWide,eyeNarrow:!!b.eyeNarrow};
}
function rootlingPose(o){
  const b=o.behavior||{},flee=o.action==='flee',feed=o.action==='eat',drink=o.action==='drink',court=o.action==='court',forage=o.action==='forage',dig=o.action==='dig',guard=o.action==='guard',rest=o.action==='rest';
  const travel=o.moving&&!feed&&!drink,undulate=travel?cycle(WAVE,o.phase):0,wave=travel?gaitSin(o.phase):0;
  const brace=o.alert||flee||guard?1:0,strokeAmp=dig?2.55:feed?2.2:forage?1.45:travel?1.15:0,clawStroke=gaitSin(o.phase)*strokeAmp;
  const leftClawStroke=clawStroke,rightClawStroke=-clawStroke,bodyWave=travel?wave*(flee?1.35:1):0,bellyDrive=travel?gaitCos(o.phase):0;
  return {kind:'rootling',...o,flee,feed,drink,court,dig,rest,undulate,brace,clawStroke,leftClawStroke,rightClawStroke,bodyWave,bellyDrive,
    bodyW:Math.max(11,snap((flee?14.5:13.5)*o.bodyScale)),backRise:Math.max(3,snap(3.6*o.bodyScale)),snoutReach:Math.max(5,snap(6.5*o.sensoryScale)),
    clawReach:Math.max(4,snap((4.7+(feed?1.8:0)+(guard ? .8 : 0))*o.limbScale)),tailReach:Math.max(8,snap((9.2+(flee?1.5:0))*o.limbScale)),eyeWide:o.alert||flee||o.life?.hurt||!!b.eyeWide,eyeNarrow:!!b.eyeNarrow,headDrop:Number(b.headDrop)||0};
}
function needlejawPose(o){
  const b=o.behavior||{},hunt=o.action==='hunt'||o.action==='stalk',flee=o.action==='flee',feed=o.action==='eat',drink=o.action==='drink',stalk=o.action==='stalk',ambientProwl=o.action==='prowl',rest=o.action==='rest';
  const gait=o.moving?gaitSin(o.phase):0,jawOpen=(hunt&&(Math.floor(o.phase)%4)<2)||(feed&&gaitSin(o.phase*2)>0);
  const profile=o.stalkerProfile||stalkerProfileFor({genes:{temperament:1}}),pv=profile.visual||{};
  const shoulderRoll=o.moving?gaitSin(o.phase)*.85:0,headCounter=o.moving?-shoulderRoll*.62:0,tailSweep=o.moving?-gaitSin(o.phase)*1.35:0;
  const legPhases=[0,Math.PI,Math.PI,0].map(offset=>gaitSin(o.phase,offset)),footPlants=legPhases.map(v=>clamp01((1-v)*.5));
  return {kind:'needlejaw',...o,hunt,stalk,ambientProwl,rest,flee,feed,drink,prowl:gait,jawOpen,profileId:profile.id,profileVisual:pv,shoulderRoll,headCounter,tailSweep,legPhases,footPlants,
    bodyW:Math.max(11,snap((hunt?14.5:ambientProwl?13.7:13)*o.bodyScale*(pv.bodyLength||1))),bodyH:Math.max(4,snap((stalk?4.4:ambientProwl?4.8:5.3)*o.bodyScale*(pv.bodyHeight||1))),
    tailReach:Math.max(10,snap((12.5+(flee?2:0))*o.limbScale*(pv.tailLength||1))),jawReach:Math.max(8,snap((10.2+(hunt?2:0))*o.sensoryScale*(pv.jawLength||1))),
    legSpread:Math.max(5,snap((5.1+(hunt?1:0)+(Number(b.stanceSpread)||0)*.8)*o.limbScale*(pv.legSpread||1))),ridgeHeight:pv.ridge||1,eyeNarrow:(hunt&&!o.alert)||!!b.eyeNarrow,eyeWide:!!b.eyeWide,headDrop:Number(b.headDrop)||0};
}

function drawMosskip(c,q,s,p,pose){
  const {v,perp}=q,b=q.behavior||{};c.translate(0,snap((q.leap+(Number(b.bodyDrop)||0)-(Number(b.bodyRise)||0))*s));
  const rear=pt(v,-3.5,-1.1),chest=pt(v,1.0,-1.4),head=add(pt(v,5.1,-2.2+q.noseDip),scalePt(perp,.2));
  orientedBlob(c,rear,7+q.haunch*.45,6.4,v,perp,s,p.shade,p.body,p.light);
  orientedBlob(c,chest,7,4.4,v,perp,s,p.shade,p.body,null);
  orientedBlob(c,head,4.4,4.2,v,perp,s,p.shade,p.body,p.light);
  // narrow neck keeps the head connected without a blocky rectangle.
  pixelLine(c,chest.x+v.x*1.6,chest.y+v.y*1.6,head.x-v.x*1.6,head.y-v.y*1.6,s,p.body);
  for(const sign of [-1,1]){
    const root=add(head,scalePt(perp,sign*1.25)),tip=add(add(root,scalePt(perp,sign*(1.0+.25*gaitSin(q.phase,sign)))),scalePt(v,-q.earPin-q.earTrail));tip.y-=q.earLength-q.airborne*.6;
    pixelLine(c,root.x,root.y-1,tip.x,tip.y,s,p.shade);pixelLine(c,root.x+perp.x*sign*.55,root.y-1,tip.x+perp.x*sign*.35,tip.y+1,s,p.body);pixel(c,snap(tip.x),snap(tip.y),1,2,s,p.light);
  }
  // One readable fore pair and hind pair carry the silhouette. Their geometry changes
  // through launch, airborne tuck and landing without multiplying per-pixel draw work.
  const plant=1-q.tuck;
  const hindRoot=add(rear,add(scalePt(v,-1.55),scalePt(perp,q.stride*.9))),hindHock=add(hindRoot,add(scalePt(v,-2.05+q.tuck*1.85),scalePt(perp,q.stride*1.05)));hindHock.y+=3.25*plant+q.compression-q.tuck*1.15;
  const hindFoot=add(hindHock,add(scalePt(v,-1.2*plant+.8*q.tuck),scalePt(perp,q.stride*.42*plant)));hindFoot.y+=1.55*plant-q.tuck*.4;
  pixelLine(c,hindRoot.x,hindRoot.y+1,hindHock.x,hindHock.y,s,p.shade);pixelLine(c,hindHock.x,hindHock.y,hindFoot.x,hindFoot.y,s,p.body);
  if(plant>.18)pixelLine(c,hindFoot.x-perp.x*q.footReach*.42*plant,hindFoot.y-perp.y*q.footReach*.42*plant,hindFoot.x+perp.x*q.footReach*.48*plant,hindFoot.y+perp.y*q.footReach*.48*plant,s,p.body);
  else pixel(c,snap(hindFoot.x),snap(hindFoot.y),2,1,s,p.body);

  const foreRoot=add(chest,add(scalePt(v,1.25),scalePt(perp,-q.stride*.55))),foreKnee=add(foreRoot,add(scalePt(v,.75-q.tuck*.5),scalePt(perp,-q.stride*.62)));foreKnee.y+=3.0*plant-q.tuck*.78;
  const foreFoot=add(foreKnee,add(scalePt(v,1.65*plant-.45*q.tuck),scalePt(perp,-q.stride*.25*plant)));foreFoot.y+=1.0*plant;
  pixelLine(c,foreRoot.x,foreRoot.y+1,foreKnee.x,foreKnee.y,s,p.shade);pixelLine(c,foreKnee.x,foreKnee.y,foreFoot.x,foreFoot.y,s,p.body);
  if(plant>.18)pixelLine(c,foreFoot.x-perp.x*1.05*plant,foreFoot.y-perp.y*1.05*plant,foreFoot.x+perp.x*1.5*plant,foreFoot.y+perp.y*1.5*plant,s,p.body);
  else pixel(c,snap(foreFoot.x),snap(foreFoot.y),2,1,s,p.body);
  const eye=add(head,add(scalePt(v,.9),scalePt(perp,1.25)));
  if(pose.life?.blink||q.eyeNarrow)pixelLine(c,eye.x-perp.x,eye.y-perp.y,eye.x+perp.x,eye.y+perp.y,s,q.eyeNarrow?'#b78f69':p.shade);else{pixel(c,snap(eye.x)-1,snap(eye.y)-1,q.eyeWide?2:1,q.eyeWide?2:1,s,q.eyeWide?'#fff3bd':'#eee5c6');pixel(c,snap(eye.x+v.x),snap(eye.y+v.y),1,1,s,'#463d32')}
  if(q.feed){const mouth=add(head,scalePt(v,2.0));pixel(c,snap(mouth.x)-1,snap(mouth.y+1),2,1,s,'#59432e')}
  if((pose.action||'')==='drink'&&q.frame%2===0)pixel(c,snap(head.x)-1,snap(head.y+3),3,1,s,'rgba(142,220,224,.72)');
  if(q.court){const tail=add(rear,add(scalePt(v,-3.2),scalePt(perp,Math.sin(q.phase*Math.PI/4)*1.5)));orientedBlob(c,tail,2.5,2.5,v,perp,s,p.shade,p.light,null)}
  if(pose.sharedAlert)pixel(c,snap(head.x+perp.x*2),snap(head.y-4),1,1,s,'#e7b36f');
}

function drawRootling(c,q,s,p,pose){
  const {v,perp}=q,b=q.behavior||{},drop=Number(b.bodyDrop)||0,rise=Number(b.bodyRise)||0;
  // Three connected masses travel as a low body wave. Front and rear counter-bend while
  // the middle remains close to the ground, so the animal reads as digging/traction rather than sliding.
  const rear=add(pt(v,-4,-.7+drop*.35),scalePt(perp,-q.bodyWave*.72)),mid=add(pt(v,-.3,-1.7+q.brace+drop*.45-rise*.35),scalePt(perp,q.bodyWave*.22)),front=add(pt(v,4,q.brace+drop*.55-rise*.4),scalePt(perp,q.bodyWave*.78));
  orientedBlob(c,mid,q.bodyW,7+q.backRise*.35,v,perp,s,p.shade,p.body,p.light);
  orientedBlob(c,rear,6.5,6.5,v,perp,s,p.shade,p.body,null);
  // segmented tail curls with the locomotion wave instead of a single rigid line.
  const tailMid=add(rear,add(scalePt(v,-q.tailReach*.52),scalePt(perp,q.undulate*.45))),tailEnd=add(rear,add(scalePt(v,-q.tailReach),scalePt(perp,q.undulate*.72)));
  pixelLine(c,rear.x,rear.y,tailMid.x,tailMid.y,s,p.shade);pixelLine(c,tailMid.x,tailMid.y,tailEnd.x,tailEnd.y,s,p.body);pixel(c,snap(tailEnd.x),snap(tailEnd.y),2,1,s,p.body);
  const snoutBase=add(front,scalePt(v,1.0)),snout=add(snoutBase,scalePt(v,q.snoutReach));snout.y+=(q.feed||q.drink)?2:0;snout.y+=q.headDrop||0;
  pixelLine(c,snoutBase.x,snoutBase.y,snout.x-v.x*1.2,snout.y-v.y*1.2,s,p.body);orientedBlob(c,snout,4.3,3.4,v,perp,s,'#9b684f','#c18b68','#d8aa83');pixel(c,snap(snout.x+v.x*2),snap(snout.y+v.y*2),1,1,s,'#51382f');
  for(const sign of [-1,1]){
    const stroke=sign<0?q.leftClawStroke:q.rightClawStroke;
    const root=add(front,add(scalePt(v,-.8),scalePt(perp,sign*2.6))),elbow=add(root,add(scalePt(v,1.7-stroke*.12),scalePt(perp,sign*(1.0+Math.abs(stroke)*.18)))),end=add(elbow,add(scalePt(v,q.clawReach-1.5+stroke*.35),scalePt(perp,sign*stroke*.36)));end.y+=2.2-Math.max(0,stroke)*.22;
    pixelLine(c,root.x,root.y+1,elbow.x,elbow.y,s,'#9f7157');pixelLine(c,elbow.x,elbow.y,end.x,end.y,s,'#b98967');
    for(let claw=-1;claw<=1;claw++)pixelLine(c,end.x,end.y,end.x+v.x*1.8+perp.x*claw,end.y+v.y*1.8+perp.y*claw,s,'#dfbb91');
  }
  if(q.moving&&!q.feed&&!q.drink){
    const traction=add(mid,add(scalePt(v,-.6+q.bellyDrive*.8),scalePt(perp,-q.bodyWave*.12)));traction.y+=3.2;
    pixelLine(c,traction.x-v.x*2.2,traction.y-v.y*2.2,traction.x+v.x*2.0,traction.y+v.y*2.0,s,'rgba(113,79,58,.72)');
    pixel(c,snap(traction.x+perp.x*1.4),snap(traction.y+perp.y*1.4),2,1,s,'rgba(167,121,83,.55)');
  }
  const eye=add(front,add(scalePt(v,1.3),scalePt(perp,1.9)));eye.y-=2;
  if(pose.life?.blink||q.eyeNarrow)pixelLine(c,eye.x-perp.x,eye.y-perp.y,eye.x+perp.x,eye.y+perp.y,s,q.eyeNarrow?'#9a7357':p.shade);else{pixel(c,snap(eye.x),snap(eye.y),q.eyeWide?2:1,q.eyeWide?2:1,s,q.eyeWide?'#fff0ca':'#ebdbba');pixel(c,snap(eye.x+v.x),snap(eye.y+v.y),1,1,s,'#664737')}
  if(q.feed&&q.frame%2===0){pixel(c,snap(snout.x-perp.x*2),snap(snout.y+2),1,1,s,'#8e704b');pixel(c,snap(snout.x+perp.x*2),snap(snout.y+2),1,1,s,'#8e704b')}
  if(q.drink&&q.frame%2===0)pixel(c,snap(snout.x)-1,snap(snout.y+2),3,1,s,'rgba(142,220,224,.72)');if(q.court)pixel(c,snap(snout.x+perp.x*2),snap(snout.y+perp.y*2-2),1,1,s,'#edc39e');if(pose.sharedAlert)pixel(c,snap(snout.x),snap(snout.y-4),1,1,s,'#e7b36f');
}

function drawNeedlejaw(c,q,s,p,pose){
  const {v,perp}=q,b=q.behavior||{},pv=q.profileVisual||{},accent=pv.accent||'#df776b',drop=Number(b.bodyDrop)||0,rise=Number(b.bodyRise)||0;
  const rear=add(pt(v,-4,-.2+drop*.3),scalePt(perp,-q.shoulderRoll*.30)),mid=add(pt(v,0,(q.stalk?.8:0)+drop*.5-rise*.35),scalePt(perp,q.shoulderRoll*.35)),front=add(pt(v,4.4,(q.stalk?1.0:0)+drop*.7-rise*.45+q.headDrop*.4),scalePt(perp,q.headCounter));
  // Profile-aware masses make inherited predator temperament readable before the UI says anything:
  // rushers are front-heavy/bladed, flankers long-tailed and low, wary hunters broad and sensory.
  orientedBlob(c,rear,6.5,4.8,v,perp,s,p.shade,p.body,null);orientedBlob(c,mid,9.5*(q.profileId==='rusher'?1.05:1),q.bodyH,v,perp,s,p.shade,p.body,p.light);orientedBlob(c,front,(q.profileId==='rusher'?6.2:q.profileId==='wary'?5.0:5.4),4.1,v,perp,s,p.shade,p.body,null);
  const ridgeSide=q.profileId==='ambusher'?(q.id&1?1:-1):1;
  for(const f of [-2.7,0,2.55]){const ridge=add(mid,scalePt(v,f)),height=1.0+q.ridgeHeight*.75;pixelLine(c,ridge.x-perp.x*.9,ridge.y-perp.y*.9,ridge.x+perp.x*ridgeSide*height,ridge.y+perp.y*ridgeSide*height,s,p.shade);pixel(c,snap(ridge.x+perp.x*ridgeSide*(height+.45)),snap(ridge.y+perp.y*ridgeSide*(height+.45)),1,1,s,accent)}
  if(pv.shoulder){for(const sign of [-1,1]){const plate=add(front,add(scalePt(v,-1.6),scalePt(perp,sign*2.0)));pixelLine(c,plate.x,plate.y,plate.x-v.x*1.4+perp.x*sign*1.6,plate.y-v.y*1.4+perp.y*sign*1.6,s,accent)}}
  const tailKnee=add(add(rear,scalePt(v,-q.tailReach*.48)),scalePt(perp,q.tailSweep*.48)),tailEnd=add(add(rear,scalePt(v,-q.tailReach)),scalePt(perp,q.tailSweep));pixelLine(c,rear.x,rear.y,tailKnee.x,tailKnee.y,s,p.shade);pixelLine(c,tailKnee.x,tailKnee.y,tailEnd.x,tailEnd.y,s,p.body);pixel(c,snap(tailEnd.x),snap(tailEnd.y),2,1,s,p.shade);
  if(q.profileId==='ambusher'){const hook=add(tailEnd,scalePt(perp,(q.id&1?1:-1)*2.4));pixelLine(c,tailEnd.x,tailEnd.y,hook.x,hook.y,s,accent)}
  const jawBase=add(front,scalePt(v,2.0)),spread=q.jawOpen?1.8:.65;
  for(const sign of [-1,1]){const root=add(jawBase,scalePt(perp,sign*.9)),end=add(add(jawBase,scalePt(v,q.jawReach)),scalePt(perp,sign*spread));pixelLine(c,root.x,root.y,end.x,end.y,s,sign>0?'#f0dec0':'#d7c09f');pixel(c,snap(end.x),snap(end.y),1,1,s,'#fff1d2')}
  let legIndex=0;
  for(const side of [-1,1])for(const fore of [-1,1]){
    const swing=q.legPhases[legIndex],plant=q.footPlants[legIndex],lift=(1-plant)*(q.hunt?1.35:1.0),root=add(scalePt(v,fore*2.4),scalePt(perp,side*1.8));
    const knee=add(root,add(scalePt(perp,side*(q.legSpread*.52+Math.abs(swing)*.3)),scalePt(v,swing*fore*.82)));knee.y+=lift*.35;
    const foot=add(knee,add(scalePt(perp,side*q.legSpread*.45),scalePt(v,-swing*fore*.55)));foot.y+=1.55-lift*.95;
    pixelLine(c,root.x,root.y+1,knee.x,knee.y,s,p.shade);pixelLine(c,knee.x,knee.y,foot.x,foot.y,s,p.body);
    const toeReach=1.15+plant*.75;pixelLine(c,foot.x,foot.y,foot.x+v.x*toeReach,foot.y+v.y*toeReach,s,plant>.55?p.body:p.shade);
    legIndex++;
  }
  if(pv.cheek){for(const sign of [-1,1])for(let k=0;k<pv.cheek;k++){const root=add(front,add(scalePt(v,.2-k*.55),scalePt(perp,sign*(1.9+k*.35)))),tip=add(root,scalePt(perp,sign*(1.7+k*.5)));pixelLine(c,root.x,root.y,tip.x,tip.y,s,k===0?accent:p.light)}}
  const eye=add(front,add(scalePt(v,.7),scalePt(perp,1.65)));eye.y-=1.4;
  if(pose.life?.blink||q.eyeNarrow)pixelLine(c,eye.x-perp.x,eye.y-perp.y,eye.x+perp.x,eye.y+perp.y,s,q.eyeNarrow?'#f0b092':p.shade);else{pixel(c,snap(eye.x)-1,snap(eye.y)-1,(q.eyeWide||pv.eyeWide)?3:2,(q.eyeWide||pv.eyeWide)?3:2,s,(q.eyeWide||pv.eyeWide)?'#ffd7a3':'#f4ad83');pixel(c,snap(eye.x+v.x),snap(eye.y+v.y),1,1,s,'#541c25')}
  if(q.drink&&q.frame%2===0)pixel(c,snap(jawBase.x)-1,snap(jawBase.y+3),3,1,s,'rgba(142,220,224,.72)');if(q.feed&&q.frame%2===0)pixel(c,snap(jawBase.x+v.x*3)-1,snap(jawBase.y+v.y*3),3,1,s,'#713a37');
}

// Draw a small oriented ellipse in the logical pixel grid, then an inset body and a restrained highlight.
function orientedBlob(c,center,length,width,v,perp,s,shade,body,light){
  const hf=Math.max(1.5,length/2),hs=Math.max(1.5,width/2),rF=Math.ceil(hf),rS=Math.ceil(hs);
  for(let layer=0;layer<2;layer++){
    const f=layer?Math.max(1.2,hf-.85):hf,side=layer?Math.max(1.2,hs-.8):hs,color=layer?body:shade;
    for(let a=-rF;a<=rF;a++)for(let b=-rS;b<=rS;b++){if((a*a)/(f*f)+(b*b)/(side*side)>1)continue;const x=center.x+v.x*a+perp.x*b,y=center.y+v.y*a+perp.y*b;pixel(c,snap(x),snap(y),1,1,s,color)}
  }
  if(light){const h=add(center,add(scalePt(v,-hf*.2),scalePt(perp,-hs*.45)));pixel(c,snap(h.x),snap(h.y),Math.max(1,snap(length*.28)),1,s,light)}
}
function cycle(values,phase){const a=Math.floor(wrap8(phase)),b=(a+1)&7,t=wrap8(phase)-a;return values[a]+(values[b]-values[a])*t}
function wrap8(v){return((Number(v)%8)+8)%8}
function pt(v,f,y=0){return{x:v.x*f,y:v.y*f+y}}
function scalePt(v,k){return{x:v.x*k,y:v.y*k}}
function add(a,b){return{x:a.x+b.x,y:a.y+b.y}}
