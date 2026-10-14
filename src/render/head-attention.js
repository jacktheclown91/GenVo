// Read-only presentation of already selected/perceived targets. No sensing scans,
// hidden mating preferences, simulation writes or random calls.
const valid=p=>p&&p.alive!==false&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function attentionTarget(animal,{social,encounter,feeding,committedAim,attackTarget,action}={}){
 if(social?.alarm&&Number.isFinite(social.threatX)&&Number.isFinite(social.threatY))return{x:social.threatX,y:social.threatY,source:'threat'};
 if(committedAim)return{x:committedAim.aimX,y:committedAim.aimY,source:'committed-attack'};
 if(valid(attackTarget))return{x:attackTarget.x,y:attackTarget.y,source:'attack-target'};
 if(valid(encounter?.attention))return{...encounter.attention,source:'partner'};
 if(valid(feeding?.attention))return{...feeding.attention,source:'meal'};
 if(valid(animal?.target)&&['eat','drink','court','hunt','stalk','flee','forage'].includes(action))return{x:animal.target.x,y:animal.target.y,source:action};
 if(social?.size>=2&&Number.isFinite(social.caregiverX)&&Number.isFinite(social.caregiverY))return{x:social.caregiverX,y:social.caregiverY,source:'caregiver'};
 return null;
}
export function attentionAngle(animal,target,dir=0){
 if(!valid(animal)||!valid(target))return 0;
 const dx=target.x-animal.x,dy=target.y-animal.y;if(Math.hypot(dx,dy)<.001)return 0;
 const angle=(dir&7)*Math.PI/4-Math.PI/2,fx=Math.cos(angle),fy=Math.sin(angle);
 return Math.max(-.5,Math.min(.5,Math.atan2(fx*dy-fy*dx,fx*dx+fy*dy)));
}
export class HeadAttentionPresentation{
 constructor(){this.reset()}
 reset(){this.entries=new WeakMap();this.world=null}
 sample(sim,animal,target,dir,time){
  if(this.world!==sim){this.reset();this.world=sim}
  let e=this.entries.get(animal);if(!e||time<e.time){e={angle:0,time};this.entries.set(animal,e)}
  const dt=Math.max(0,Math.min(.1,time-e.time));e.time=time;
  const desired=animal.bodyPlan?.headMode==='torso'?0:attentionAngle(animal,target,dir);
  if(!sim.paused&&e.angle!==desired){if(Math.abs(desired-e.angle)<.002)e.angle=desired;else e.angle+=(desired-e.angle)*(1-Math.exp(-dt*9));}
  if(Math.abs(e.angle)<.002)e.angle=0;
  // NPC caching and geometry share the same bounded five-step pose per side.
  return animal.player?e.angle:Math.round(e.angle*10)/10;
 }
}
