import {coordinatedGaitOffsets} from './gait-coordination.js';
import {articulatedKnee} from './limb-articulation.js';
// GenVo8-specific presentation geometry. Read-only: no simulation state is mutated and no RNG is consumed.
const DIR8=[{x:0,y:-1},{x:1,y:-1},{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1}];
const STRIDE=[-1.8,-.8,.4,1.6,1.8,.8,-.4,-1.6];
const LIFT=[0,1,2,1,0,1,2,1];
const IDLE_TWITCH=[0,0,.35,0,0,-.25,0,.18];

// Art redo (v1.48.0): leg angles on designed bodies are pulled towards the sides (front legs reach
// forward-out, rear legs back-out), so legs read as legs rather than spokes. Straight front and
// rear slots keep their angle.
export function splayAngle(a){const t=((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI),side=t<Math.PI?1:-1,u=side>0?t:2*Math.PI-t;if(u<.01||Math.abs(u-Math.PI)<.01)return a;const w=Math.PI/2+(u-Math.PI/2)*.72;return side>0?w:2*Math.PI-w}
export function genvoVisualPose({id=0,dir=0,frame=0,moving=false,action='idle',bodyScale=1,bodyWidthScale=1,bodyHeightScale=1,limbScale=1,sensoryScale=1,eyeScale=1,feelerScale=1,temperamentScale=1,dependent=false,alert=false,stage='adult',life={},behavior={},legSlots=null}={}){
  if(['glide','jump','land'].includes(action)){moving=false;frame=0}
  frame=((Number(frame)%8)+8)%8;const frameInt=Math.floor(frame);dir&=7;
  const v=DIR8[dir],vmag=Math.hypot(v.x,v.y)||1,fx=v.x/vmag,fy=v.y/vmag,perp={x:-fy,y:fx};
  const flee=action==='flee',eat=action==='eat',drink=action==='drink',court=action==='court',hunt=action==='hunt'||action==='stalk';
  const depleted=!!life.exhausted,injured=!!life.hurt,sick=!!life.sick,elder=stage==='elder',b=behavior||{};
  const breath=Number(life.breath)||0;
  const moveSquash=moving?cycle([0,0,1,1,0,0,-1,-1],frame):0;
  const orientX=Math.abs(fx),orientY=Math.abs(fy);
  const actionCompress=Number(b.compress)||0;
  const growth=Math.max(.05,Math.min(1,Number(life.growth)||1));
  const bodyW=Math.max(7*growth,Math.round((8+orientX*.8+(alert?1:0)+(flee?1:0)+(injured&&!moving?1:0)+(elder?.6:0)+Math.max(0,actionCompress))*bodyScale*bodyWidthScale));
  const bodyH=Math.max(6*growth,Math.round((7+orientY*.8-(depleted&&!moving?1:0)-(elder?.45:0)-Math.max(0,actionCompress*.7)-Math.min(0,actionCompress*.5))*bodyScale*bodyHeightScale));
  const forwardDrop=(eat||drink)?1.1:0;
  const idleSway=0; // Resting contacts stay planted; breathing deforms tissue, not the skeleton.
  const forwardLean=(Number(life.lean)||0)+(hunt ? .55 : 0)+(flee ? .65 : 0)+(Number(b.bodyLean)||0)+(temperamentScale-1)*2.1;
  const limpShift=(Number(b.limp)||0)*(Number(b.limpSide)||1)*.42;
  const bodyOffset={
    x:fx*forwardLean+perp.x*(idleSway+(Number(b.bodySway)||0)+(moving?moveSquash*.18:0)+limpShift),
    y:fy*forwardLean+perp.y*(idleSway+(Number(b.bodySway)||0)+(moving?moveSquash*.18:0)+limpShift)+forwardDrop+(Number(b.bodyDrop)||0)-(Number(b.bodyRise)||0)+(depleted&&!moving?.65:0)+(sick&&!moving?.55:0)+(elder?.42:0)+(Number(b.recoil)||0)*.35
  };
  const stretch=flee?1.12:hunt?1.07:(moving&&Math.abs(moveSquash)>0?1.03:1);
  const legs=[];
  // Designed bodies (wave 1) pass their own leg slots: angles in sixteenths of a turn relative to
  // the facing, with a reach factor per leg type. Without them the eight radial legs are unchanged.
  const slotList=Array.isArray(legSlots)?legSlots:null,count=slotList?slotList.length:8,travel=slotList&&moving?gaitTravelFor(limbScale,slotList):null;
  const coordinated=slotList&&moving&&action!=='swim'&&!Number.isFinite(b.displayPhase)?coordinatedGaitOffsets(slotList):null;
  for(let n=0;n<count;n++){
    let k=n,dx,dy,reachScale=1,slot=null,gait=null;
    if(slotList){const L=slotList[n],raw=L.slot*Math.PI/8,ang=splayAngle(raw);slot=L.slot;reachScale=L.reach||1;gait=L.gait||null;k=(L.slot>>1)+(L.slot&1);dx=fx*Math.cos(ang)+perp.x*Math.sin(ang);dy=fy*Math.cos(ang)+perp.y*Math.sin(ang)}
    else{const raw=DIR8[k],mag=Math.hypot(raw.x,raw.y)||1;dx=raw.x/mag;dy=raw.y/mag}
    const front=dx*fx+dy*fy,side=dx*perp.x+dy*perp.y;
    const phase=(Number.isFinite(b.displayPhase)?b.displayPhase:frame)+(coordinated?coordinated[n]:slotList?((Math.round(Math.abs(side)*3)+Math.round(front*2)+(side<0?4:0))%8):((k&1)?4:0)+((k>>1)&1));
    // v1.59.0: each leg type moves its own way: stride scales the swing, lift how high the foot rises.
    const step=organicFootfall(phase,travel,moving?(gait?.stride??1):1);
    const stride=(moving?step.stride:(Number(b.displayStride)||0)?step.stride*b.displayStride:0);
    const settling=!moving&&!b.guardPlanted&&count>1&&n===((life.settleIndex||0)%count)?(life.settle||0)*.8:0;
    const striking=slotList&&b.attackLimbSlots?.includes(slot),attackLift=striking?(Number(b.attackLimbLift)||0):0;
    const digLift=action==='dig'&&front>.2?Math.max(0,Math.sin((frame+(k&1)*4)*Math.PI/4))*2:0;
    const lift=(moving?step.lift*(gait?gait.lift:1):(Number(b.displayLift)||0)*step.lift+(front>.25?(Number(b.forelegLift)||0):0)+settling)+attackLift+digLift,liftAmount=Math.max(0,Math.min(1,lift/2));
    let reach=(6.7+(Math.abs(side)>.45?.75:.35))*limbScale*(dependent?.9:1)*(elder?.91:1);
    if(alert)reach+=.65;if(flee)reach+=front<-.2?1.35:.35;if(court&&front>.4)reach+=.95;if((eat||drink)&&front>.35)reach-=.8;if(depleted)reach-=.3;
    const limpSide=Math.sign(side||1)===(b.limpSide||1)&&Math.abs(side)>.22;
    if(b.limp&&limpSide)reach-=.75*(Number(b.limp)||0);
    reach=Math.max(5.0,reach)*reachScale*(action==='jump'?.76:1);
    const attach=(Math.min(bodyW,bodyH)*.36)+.25;
    const sweep=(moving?stride:.45*stride)*(slotList&&moving?1:(0.55+Math.abs(side)*.5));
    const curl=((k&1)?1:-1)*(moving?.75:1.15)+(court&&front>.2?side*.9:0);
    const root={x:dx*attach+perp.x*side*.18,y:dy*attach+perp.y*side*.18};
    const kneeDist=reach*(.62-liftAmount*.10);
    let knee={x:dx*kneeDist+(-dy)*curl+fx*sweep*.42,y:dy*kneeDist+(dx)*curl+fy*sweep*.42};
    const spread=(Number(b.stanceSpread)||0)*side,footReach=reach*(1-liftAmount*.16);
    const attackReach=striking?(Number(b.attackLimbReach)||0):0;
    const foot={x:fx*attackReach+dx*footReach+fx*sweep+perp.x*spread,y:fy*attackReach+dy*footReach+fy*sweep+perp.y*spread+(depleted?.35:0)+(b.limp&&limpSide?.45:0)};
    // Body-edge offsets and clearance share one radial calculation. Clearance
    // during support uses the neutral footprint, so a toe cannot slide when
    // fore/aft sweep would otherwise push it back outside a wide torso.
    if(slotList){const rx=bodyW/2,ry=bodyH/2,edge=1/Math.sqrt((dx/rx)**2+(dy/ry)**2),extra=Math.max(0,edge-Math.min(rx,ry));if(extra)for(const pt of [root,knee,foot]){pt.x+=dx*extra;pt.y+=dy*extra}const need=edge+3*Math.max(.8,limbScale),along=moving?footReach+extra:foot.x*dx+foot.y*dy;if(along<need&&action!=='jump'){const shift=need-along;foot.x+=dx*shift;foot.y+=dy*shift;knee.x+=dx*shift*.6;knee.y+=dy*shift*.6}}
    if(slotList)knee=articulatedKnee({root,foot,forward:{x:fx,y:fy},perp,side,liftAmount});
    knee.y-=.9+liftAmount*.6;if(liftAmount>0){foot.x+=(knee.x-foot.x)*liftAmount*.4;foot.y+=(knee.y-foot.y)*liftAmount*.4}else foot.y+=.35;
    legs.push(slotList?{index:k,slot,root,knee,foot,lift,liftAmount,...(striking&&attackLift>0?{aboveBody:true}:{}),planted:action==='jump'||action==='climb'?false:moving?step.planted&&(!striking||attackLift===0):(!striking||attackLift===0)&&liftAmount<.34,front,side}:{index:k,root,knee,foot,lift,liftAmount,planted:action==='jump'||action==='climb'?false:liftAmount<.34,front,side});
  }
  const sensory=Math.max(.8,Number(sensoryScale)||1);
  const eyes=Math.max(.78,Number(eyeScale)||1),feelers=Math.max(.78,Number(feelerScale)||1);
  const eyeSpread=(alert||b.eyeWide?2.35:1.85)*sensory*eyes;
  const eyeForward=(alert||b.eyeWide?3.0:2.45)*(.92+eyes*.08);
  const face={
    eyeSpread,eyeForward,
    squint:injured||depleted||sick||!!b.eyeNarrow,
    wide:alert||flee||!!b.eyeWide,
    mouthOpen:eat?(frameInt&1?2:1):drink?1:0,
    mouthForward:(eat||drink)?3.35:2.9,
    feelerReach:(alert?2.8:court?2.35:(moving?1.45:1.75+cycle(IDLE_TWITCH,frame+id+3)))*feelers*(Number(b.feelerForward)||1)*(sick?.82:1)*(elder?.90:1)
  };
  return {v:{x:fx,y:fy},perp,bodyW,bodyH,bodyOffset,stretch,legs,face,flee,eat,drink,court,hunt,behavior:b};
}

export function roundedMantleRows(width,height,{squash=0}={}){
  width=Math.max(5,Math.round(width));height=Math.max(5,Math.round(height));
  const rows=[];
  for(let y=0;y<height;y++){
    const t=height<=1?0:(y/(height-1))*2-1;
    const edge=Math.pow(Math.abs(t),1.7);
    const inset=Math.max(0,Math.round(edge*(width*.24)+(squash?Math.abs(t)*.35:0)));
    const rowW=Math.max(3,width-inset*2);
    rows.push({y:y-Math.floor(height/2),x:-Math.floor(rowW/2),w:rowW,edge:Math.abs(t)});
  }
  return rows;
}

// One recovery swing (3/8 cycle), five support beats. The body moves over the
// planted foot; the toe returns along the travel axis, not around a radial spoke.
// One renderer-only travel contract: over five support beats the body advances
// 5/8 of a cycle, and the planted toe retracts by exactly that same distance.
// World distance per full gait cycle. Each mounted leg type contributes its own step length
// (runner long, sturdy short), so cadence follows anatomy while planted toes stay fixed:
// the renderer's gait phase and the stance sweep both use this one number.
export function strideLengthFor(legSlots){if(!Array.isArray(legSlots)||!legSlots.length)return 1;let t=0;for(const l of legSlots)t+=Number(l?.gait?.step)||1;return t/legSlots.length}
// Review-only stride scale for cadence comparison captures. 1 is the shipped value; any
// change applies equally to pose stance sweep and renderer gait phase, so toes stay planted.
export const GAIT_REVIEW={strideScale:1};
export function gaitTravelFor(limbScale=1,legSlots=null){return Math.max(2.6,4.6*limbScale)*strideLengthFor(legSlots)*GAIT_REVIEW.strideScale}
export function organicFootfall(phase,travel=null,recovery=1){
 const p=((Number(phase)+7)%8+8)%8,span=Number.isFinite(travel)?travel*5/8:2.9;
 if(p<3){const t=p/3,e=t*t*(3-2*t),style=recovery===1?0:(recovery-1)*span*.3*Math.sin(Math.PI*t)*Math.sin(Math.PI*2*t);return{stride:-span/2+span*e+style,lift:2*Math.sin(Math.PI*t),planted:false}}
 return{stride:span/2-span*(p-3)/5,lift:0,planted:true};
}
function cycle(values,phase){phase=((Number(phase)%8)+8)%8;const a=Math.floor(phase),b=(a+1)&7,t=phase-a;return values[a]+(values[b]-values[a])*t}

export {DIR8 as GENVO_DIR8};
