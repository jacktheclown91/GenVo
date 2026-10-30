import {motionStateOf,REFERENCE_ACCELERATION} from '../organisms/motion.js';
import {structuralViability} from '../organisms/structural-support.js';

// Presentation-only physical body language. The authoritative motion and
// support models are read, never altered. No clock, RNG or second biology.
const FACING=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
const STILL=Object.freeze({lean:0,sway:0,drop:0,stance:0,compress:0,skid:0,vx:0,vy:0});

export function physicalMotionExpression(sim,animal,{dir=0,moving=false,grounded=true,growth=1}={}){
 if(!animal||!grounded||animal.torpor)return STILL;
 const inertia=sim?.inertiaRules==='inertia/1'&&animal.motion?motionStateOf(animal):null;
 const support=sim?.structuralSupportRules==='structural-support/1'?
  structuralViability(sim,animal,{growth}):null;
 if(!inertia&&!support)return STILL;
 const stress=support?.stress??0;
 const strain=support?clamp((stress-support.comfort)/(support.yield-support.comfort)):0;
 // A still overloaded adult must look burdened, too; resting animals never
 // invent motion or dust. The index already includes the animal's growth.
 const overloaded=support?.state==='overloaded';
 let lean=0,sway=0,stance=strain*.55+(overloaded?.12:0),drop=strain*.46+(overloaded?.15:0),compress=strain*.12,skid=0;
 if(inertia&&moving&&inertia.speed>.2&&inertia.acceleration>.1){
  const f=FACING[dir&7],mag=Math.hypot(f[0],f[1]),fx=f[0]/mag,fy=f[1]/mag;
  const forward=(inertia.ax*fx+inertia.ay*fy)/REFERENCE_ACCELERATION;
  const side=(inertia.ax*(-fy)+inertia.ay*fx)/REFERENCE_ACCELERATION;
  const effort=clamp(inertia.acceleration/REFERENCE_ACCELERATION);
  // Pitch back while starting, forward when stopping; lean into real lateral
  // acceleration rather than a hypothetical intention or animation phase.
  lean=clamp(-forward*.92,-.78,.98);
  sway=clamp(side*.82,-.82,.82);
  if(inertia.braking&&inertia.speed>.7&&effort>.12){
   stance+=.21*effort;compress+=.14*effort;
   skid=clamp(effort*(inertia.speed/2.15),0,.9);
  }
 }
 return Object.freeze({lean,sway,stance:clamp(stance,0,.98),drop:clamp(drop,0,.7),
  compress:clamp(compress,0,.32),skid,vx:inertia?.vx||0,vy:inertia?.vy||0});
}

export function applyPhysicalMotionExpression(behavior,reading){
 if(!behavior||!reading||reading===STILL)return behavior;
 behavior.bodyLean=(behavior.bodyLean||0)+reading.lean;
 behavior.bodySway=(behavior.bodySway||0)+reading.sway;
 behavior.bodyDrop=(behavior.bodyDrop||0)+reading.drop;
 behavior.stanceSpread=(behavior.stanceSpread||0)+reading.stance;
 behavior.compress=(behavior.compress||0)+reading.compress;
 return behavior;
}

// At a real braking step, two short traces on actual dry/muddy soil convey
// slipping toes. This stays within the existing ground-contact drawing layer,
// disappears immediately, and never marks the real terrain or the save.
export function drawBrakeScuff(ctx,reading,{contact,scale=1}={}){
 if(!reading||reading.skid<.25||!contact||contact.inWater||
   (contact.soil!=='dry'&&contact.soil!=='mud'))return;
 const speed=Math.hypot(reading.vx,reading.vy);
 if(!(speed>.7))return;
 const dx=reading.vx/speed,dy=reading.vy/speed,px=-dy,py=dx,s=scale;
 const width=Math.max(1,Math.round(s)),length=2+Math.round(reading.skid*2);
 ctx.save();
 ctx.fillStyle=contact.soil==='mud'?'rgba(91,75,55,.38)':'rgba(181,150,101,.34)';
 for(const side of [-1,1]){
  const bx=(-dx*7+px*side*4)*s,by=(-dy*7+py*side*4+5)*s;
  for(let i=0;i<length;i++)ctx.fillRect(
   Math.round(bx-dx*i*s),Math.round(by-dy*i*s),width,width);
 }
 ctx.restore();
}
