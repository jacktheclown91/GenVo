// Water stroke geometry only. Eligibility, speed and resource costs remain in
// the simulation. Called only after the renderer has selected actual swimming.
import {articulatedKnee} from './limb-articulation.js';
const smooth=t=>t*t*(3-2*t);

export function swimmingLimb({phase=0,moving=false,partId=null,front=0,side=0,
  root,radial,forward,perp,limbScale=1,reachScale=1,steer=0,brake=0}={}){
  const webbed=partId==='webbed-leg';
  // Broad webbed feet row in mirrored pairs. Ordinary feet alternate sides,
  // with smaller strokes; the fore/hind delay follows the actual socket.
  const delay=(1-front)*1.2+(!webbed&&side<0?4:0);
  const cycle=(((phase+delay)%8)+8)%8/8;
  const power=cycle<.44;
  const t=power?cycle/.44:(cycle-.44)/.56;
  const active=moving?1:0;
  // In a real turn the outer bank rows farther and the inner bank less. These
  // are underwater contact-free projections; no physical thrust is generated.
  const rowing=1-Math.max(-1,Math.min(1,steer))*Math.sign(side)*.28;
  const stopping=Math.max(0,Math.min(1,brake));
  const sweep=(power?2.6-5.6*smooth(t):-3+5.6*smooth(t))*active*(webbed?1:.58)*rowing*(1-stopping*.18);
  // Recovery folds in toward the body instead of lifting a walking toe.
  const fan=(webbed?3.5:2.6)+(power?1.15:-1.25)*Math.sin(Math.PI*t)*active+stopping*.5*active;
  const scale=Math.max(.25,limbScale)*reachScale;
  const feather=power?0:Math.sin(Math.PI*t)*active;
  const foot={x:root.x+(radial.x*fan+forward.x*sweep)*scale,
    y:root.y+(radial.y*fan+forward.y*sweep)*scale};
  const liftAmount=feather*.28;
  const knee=articulatedKnee({root,foot,forward,perp,side,liftAmount});
  knee.y-=.3+feather*.2;
  return{foot,knee,lift:liftAmount*2,liftAmount,planted:false,
    swimPower:active&&power?Math.sin(Math.PI*t):0,swimFeather:feather};
}
