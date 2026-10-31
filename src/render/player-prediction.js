import {SPECIES} from '../organisms/species.js';
import {adaptationEffects} from '../lineage/evolution.js';
import {movementProfile} from '../lineage/lifestyle.js';
import {movementEffect} from '../lineage/effects.js';
import {inertiaEnabled,planMotion} from '../organisms/motion.js';
import {conditionSpeed} from '../ecology/metabolism-policy.js';
import {structuralSpeed} from '../organisms/structural-support.js';
import {frontierStep} from '../world/regional-frontier.js';

// Presentation-only prediction for the locally controlled GenVo8.
// It never mutates simulation state, spends resources, advances animation authority,
// or changes collision. It only projects the already-authoritative movement model
// across the small fraction of a control step that has not run yet.
export function predictPlayerPose(sim,input,aheadSeconds=0){
  const a=sim?.player?.();
  if(!a||a.aerialMode)return null;
  const base={x:a.x,y:a.y,phase:a.anim||0,moving:false,swimming:false};
  if(sim.paused||!input)return base;
  const [dx,dy]=inputVector(input);if(!dx&&!dy)return base;
  const dt=Math.max(0,Math.min(.05,Number.isFinite(aheadSeconds)?aheadSeconds:0));if(dt<=0)return{...base,moving:true};
  const stance=sim.playerCombat?.movementModifiers?.(a,input),stanceScale=stance?stance.scale:1;
  const s=SPECIES[a.species],fx=adaptationEffects(a),sprint=stance?stance.sprint:!!input.sprint,carrySlow=a.carryingFood?fx.carrySprint:1;
  const condSp=conditionSpeed(sim,a);
  const injuryMove=(sim.injury?.movementMultiplier?.(a)??1)*stanceScale*(Number.isFinite(condSp)?condSp:1);
  const landLifestyle=sim.speciesLifestyle?.movementMultiplier?.(a,{swimming:false})||1;
  const landBase=s.speed*a.genes.motion*carrySlow*injuryMove*movementEffect(sim,a,landLifestyle);
  const landSprint=sprint?1.55*fx.sprintSpeed:1,preX=a.x+dx*landBase*landSprint*dt,preY=a.y+dy*landBase*landSprint*dt,travel=movementProfile(a,sim.world,{fromX:a.x,fromY:a.y,toX:preX,toY:preY,sprint});
  if(!travel.allowed)return{...base,moving:true};
  const sprintFactor=travel.swimming?travel.sprint:landSprint;
  const lifestyleSpeed=travel.swimming?(sim.speciesLifestyle?.movementMultiplier?.(a,{swimming:true})||1)/Math.max(.001,landLifestyle):1;
  const support=sim.supportFor?.(a,travel.swimming);
  const structSp=support?structuralSpeed(support,travel.swimming?1:sprintFactor):1;
  const sp=landBase*travel.speed*sprintFactor*lifestyleSpeed*structSp;
  let nx, ny;
  if(inertiaEnabled(sim)&&a.motion){
    const plan=planMotion(a,dx*sp,dy*sp,dt,{...travel,support:support?.acceleration??1});
    nx=a.x+plan.dx;ny=a.y+plan.dy;
  }else{
    nx=a.x+dx*sp*dt;ny=a.y+dy*sp*dt;
  }
  const stepped=frontierStep(sim.world,a.x,a.y,nx,ny);
  nx=stepped.x;ny=stepped.y;
  if(!sim.canOccupy?.(a,nx,ny))return{...base,moving:true,swimming:travel.swimming};
  return{x:nx,y:ny,phase:wrap8((a.anim||0)+dt*8*(travel.swimming?1.35:1)),moving:true,swimming:travel.swimming};
}

function inputVector(i){let dx=(i.right?1:0)-(i.left?1:0),dy=(i.down?1:0)-(i.up?1:0);if(dx&&dy){dx*=.707106;dy*=.707106}return[dx,dy]}
function wrap8(v){return((v%8)+8)%8}
