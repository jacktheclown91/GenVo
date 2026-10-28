import {articulatedKnee} from './limb-articulation.js';
import {CLIMB_PIXEL_HEIGHT} from './work-motion.js';
const smooth=t=>t*t*(3-2*t);
const gripPhases=new WeakMap();
// Stagger the actual gripping organs, even when both are on one side. Socket
// quadrants alone can otherwise release every functional grip together.
export function climbingGripOffsets(legs){
  let hit=gripPhases.get(legs);if(hit)return hit;
  const grips=legs.filter(l=>['climber-leg','grasper'].includes(l.partId)).sort((a,b)=>a.slot-b.slot);
  if(grips.length<2)return null;
  const phases=new Map(grips.map((leg,i)=>[leg.slot,i/grips.length]));
  hit=legs.map(l=>phases.get(l.slot));gripPhases.set(legs,hit);return hit;
}
// Grip phases are locked to actual displayed height, not a free-running gait.
// While gripping, local y gains exactly the height translation the torso loses.
export function climbingLimb({height,holding=false,phaseOffset=null,root,radial,forward,perp,front,side,limbScale=1,reachScale=1}={}){
  const span=.9*CLIMB_PIXEL_HEIGHT,offset=Number.isFinite(phaseOffset)?phaseOffset:((side>0?1:0)+(front<0?1:0))%2*.5;
  const q=(((height/.9+offset)%1)+1)%1,gripping=holding||q<.68;
  const t=(q-.68)/.32;
  const slide=holding?0:gripping?(q-.34)*span:(.34-.68*smooth(t))*span;
  const liftAmount=gripping?0:Math.sin(Math.PI*t)*.65;
  const reach=limbScale*reachScale;
  const foot={x:root.x+radial.x*2.2*reach,y:root.y+radial.y*2.2*reach+slide-liftAmount*.7};
  const knee=articulatedKnee({root,foot,forward,perp,side,liftAmount});
  return{foot,knee,lift:liftAmount*2,liftAmount,planted:gripping,gripping};
}
// Only the actual mounted excavating organ scoops; other limbs brace.
export function diggingLimb({elapsed,partId,root,neutralFoot,radial,forward,perp,side,limbScale=1,reachScale=1}={}){
  if(partId!=='digging-forelimb')return{foot:{...neutralFoot},knee:articulatedKnee({root,foot:neutralFoot,forward,perp,side,liftAmount:0}),lift:0,liftAmount:0,planted:true};
  const q=(((elapsed*1.6+(side<0?.5:0))%1)+1)%1;
  let sweep,liftAmount;
  if(q<.22){const t=q/.22;sweep=-1.6+4.4*smooth(t);liftAmount=Math.sin(Math.PI*t)*.75;}
  else if(q<.68){const t=(q-.22)/.46;sweep=2.8-4.4*smooth(t);liftAmount=0;}
  else{const t=(q-.68)/.32;sweep=-1.6;liftAmount=Math.sin(Math.PI*t)*.6;}
  const scale=limbScale*reachScale;
  const foot={x:root.x+(radial.x*3+forward.x*sweep)*scale,y:root.y+(radial.y*3+forward.y*sweep)*scale-liftAmount*.65};
  return{foot,knee:articulatedKnee({root,foot,forward,perp,side,liftAmount}),lift:liftAmount*2,liftAmount,planted:q>=.22&&q<.68,scooping:true};
}
