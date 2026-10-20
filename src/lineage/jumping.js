import {adultBodyMass} from '../organisms/body-mass.js';
import {SPECIES} from '../organisms/species.js';
import {CFG} from '../sim/config.js';
import {glideGround} from './gliding.js';

// Ballistic travel is shared by controlled and autonomous organisms. The
// existing ground elevation is the same vertical datum used by gliding.
export const JUMP=Object.freeze({policy:'ballistic-jumping/1',gravity:10,lift:4.4,
 speed:4.2,foodPerMass:4,breath:12,minHealth:35,massPerPair:2.6,
 cooldownSeconds:.7,safeImpact:5,impactDamage:4,collisionDamage:12,waterDamage:12,maxSeconds:4});
export function springLegs(a){return(a?.bodyPlan?.nodes||[]).filter(n=>n.partId==='spring-leg').length}
export function hasJumpingAnatomy(a){return springLegs(a)>=2}
export function jumpKinematics(a){
 const load=Math.max(.7,adultBodyMass(a)/(Math.max(2,springLegs(a))/2*1.45)),lift=JUMP.lift/Math.sqrt(load),
  speed=JUMP.speed*Math.max(.5,Math.min(1.6,a.genes?.motion||1))/Math.sqrt(load);
 return{lift,speed,range:speed*2*lift/JUMP.gravity};
}
export function jumpAvailability(sim,a=sim.player(),{pounce=false}={}){
 const fail=reason=>({enabled:false,reason});
 if(a?.underground||a?.burrowWork||a?.caveTransit)return fail('Return to the surface and finish the current underground movement before jumping.');
 if(!a?.alive)return fail('No living creature.');
 if(sim.jumpingRules!==JUMP.policy)return fail('This historical world retains its recorded movement rules. Jumping is available in newly generated worlds.');
 if((a.diveDepth||0)>.03)return fail('Surface before jumping.');
 if(a.airborne||a.perched)return fail('Land or descend before jumping.');
 if(a.torpor)return fail('Wake before jumping.');
 const legs=springLegs(a),mass=adultBodyMass(a);
 if(!hasJumpingAnatomy(a))return fail('Jumping requires at least two actual spring legs with developed tendons.');
 if(mass>JUMP.massPerPair*legs/2)return fail('The spring legs cannot launch this body load.');
 if(a.health<JUMP.minHealth||a.age<(SPECIES[a.species]?.maturity||0)*.5)return fail('The body is too young or injured to jump.');
 if(a.carryingFood||a.bracing)return fail('Put down carried food and release your brace before jumping.');
 if((a.jumpReadyTick||0)>sim.tickCount)return fail('Recover from the landing before jumping again.');
 if(!pounce&&sim.playerCombat?.attackActive(a))return fail('Finish the attack before jumping.');
 if(a.energy<JUMP.foodPerMass*mass+3)return fail('Need more food energy for this body load.');
 if(!pounce&&(a.exertionWinded||(a.exertion??CFG.exertion.max)<JUMP.breath))return fail('Catch your breath before jumping.');
 if(!sim.world.isPlayable(a.x,a.y)||sim.world.water[sim.world.idx(a.x,a.y)])return fail('Push off from firm ground.');
 return{enabled:true,reason:'Spring forward along your facing. The arc is committed; water, hard falls and rising terrain can injure.',mass,food:JUMP.foodPerMass*mass};
}
export function launchJump(sim,a=sim.player(),{dx,dy,range=null,pounce=false}={}){
 const status=jumpAvailability(sim,a,{pounce});if(!status.enabled)return{ok:false,type:'jump',message:status.reason};
 const angle=((a.dir||0)-2)*Math.PI/4;
 if(!Number.isFinite(dx)||!Number.isFinite(dy)){dx=Math.cos(angle);dy=Math.sin(angle)}
 const length=Math.hypot(dx,dy);if(!(length>0))return{ok:false,type:'jump',message:'Choose a launch direction.'};
 const {lift,speed}=jumpKinematics(a),
  horizontal=range===null?speed:Math.min(speed,Math.max(0,range)/(2*lift/JUMP.gravity));
 // Pounce has already paid the existing combat breath cost during windup.
 sim.exertion.ensure(a);if(!pounce)sim.exertion.spend(a,JUMP.breath);a.energy-=status.food;
 sim.history?.noteStep(a);a.airborne=true;a.hidden=false;a.bracing=false;a.aerialMode='jump';a.target=null;
 a.jump={schema:1,altitude:glideGround(sim.world,a.x,a.y)+.03,verticalVelocity:lift,vx:dx/length*horizontal,vy:dy/length*horizontal,elapsed:0,purpose:pounce?'pounce':'travel'};
 a.dir=((Math.round(Math.atan2(dy,dx)/(Math.PI/4))+2)%8+8)%8;
 return{ok:true,type:'jump',message:'Jumping. The spring-powered arc is committed; land before using surface actions.'};
}
export function finishJump(a,world,{tick=0,swimmer=false,collision=false}={}){
 const j=a.jump,impact=Math.abs(j?.verticalVelocity||0),water=!!world.water[world.idx(a.x,a.y)],
  damage=(collision?JUMP.collisionDamage:Math.max(0,impact-JUMP.safeImpact)*JUMP.impactDamage)+(water&&!swimmer?JUMP.waterDamage:0);
 a.airborne=false;delete a.aerialMode;delete a.jump;
 a.health=Math.max(0,a.health-damage);a.jumpReadyTick=tick+Math.ceil(JUMP.cooldownSeconds*CFG.simHz);
 a.jumpLanding={tick,impact,water,damage};
 return{ok:damage===0,type:'jump-land',forced:damage>0,impact,damage,water,
  message:collision?'The jump strikes terrain or the region edge; landing causes injury.':water&&!swimmer?'The jump ends in water; the creature falls in and must reach shore.':damage?'A hard fall causes injury on landing.':'Landed. Recover briefly before the next jump.'};
}
export function stepJump(a,world,dt,{tick=0,swimmer=false}={}){
 if(!a?.alive||a.aerialMode!=='jump')return null;
 if(!Number.isFinite(dt)||dt<=0||dt>.25)throw Error('Invalid jump physics step.');
 const j=a.jump,nx=a.x+j.vx*dt,ny=a.y+j.vy*dt,ground=glideGround(world,nx,ny),
  nextZ=j.altitude+j.verticalVelocity*dt-JUMP.gravity*dt*dt/2,nextV=j.verticalVelocity-JUMP.gravity*dt;
 if(ground===null||j.elapsed+dt>JUMP.maxSeconds||springLegs(a)<2||a.health<JUMP.minHealth)
  return finishJump(a,world,{tick,swimmer,collision:true});
 if(ground>nextZ+.05&&nextV>0)return finishJump(a,world,{tick,swimmer,collision:true});
 let used=dt;
 if(nextZ<=ground&&nextV<=0){
  const discriminant=j.verticalVelocity**2+2*JUMP.gravity*(j.altitude-ground);
  if(discriminant<0)return finishJump(a,world,{tick,swimmer,collision:true});
  used=Math.max(0,Math.min(dt,(j.verticalVelocity+Math.sqrt(discriminant))/JUMP.gravity));
 }
 a.x+=j.vx*used;a.y+=j.vy*used;j.altitude+=j.verticalVelocity*used-JUMP.gravity*used*used/2;
 j.verticalVelocity-=JUMP.gravity*used;j.elapsed+=used;a.anim=((a.anim||0)+used*8)%8;
 if(used<dt||j.altitude<=glideGround(world,a.x,a.y))return finishJump(a,world,{tick,swimmer});
 return{ok:true,type:'jump',moving:true,distance:Math.hypot(j.vx,j.vy)*used};
}
export function restoreJumpingRules(sim,core){
 if(core.jumpingRules===undefined)delete sim.jumpingRules;
 else if(core.jumpingRules!==JUMP.policy)throw Error('Unknown saved jumping rules.');
 for(const session of sim.planetaryTravel?.sessions||[])if(session.snapshot.core.jumpingRules!==core.jumpingRules)throw Error('Inconsistent regional jumping rules.');
}
export function validateJumpState(a,rule){
 if(a.jumpReadyTick!==undefined&&(!Number.isSafeInteger(a.jumpReadyTick)||a.jumpReadyTick<0))throw Error('Invalid saved jump recovery.');
 if(a.aerialMode!=='jump'){if(a.jump!==undefined)throw Error('Unexpected saved jump state.');return}
 const j=a.jump;
 if(rule!==JUMP.policy||!a.airborne||a.perched||springLegs(a)<2||j?.schema!==1||!['travel','pounce'].includes(j.purpose)||
  !['altitude','verticalVelocity','vx','vy','elapsed'].every(k=>Number.isFinite(j[k]))||j.altitude<0||j.altitude>22||j.elapsed<0||j.elapsed>JUMP.maxSeconds||
  Math.hypot(j.vx,j.vy)>9||Math.abs(j.verticalVelocity)>30||a.glideAltitude!==undefined||a.glideHeading!==undefined)throw Error('Invalid saved jump state.');
}
