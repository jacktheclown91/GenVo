import {adultBodyMass} from '../organisms/body-mass.js';
import {massCostToReserve,structuralScale} from '../organisms/body-size.js';
import {canopySupport,canopyGrips,roostAvailability} from '../ecology/canopy-site.js';
import {canTreeClimb} from './gliding.js';

export const CLIMBING=Object.freeze({policy:'continuous-canopy-climbing/1',height:3,upSpeed:.65,downSpeed:.9,upWork:1,downWork:.3,fallDamage:5});
export function canopyContact(a,b){
 const height=x=>x?.climb?.height??(x?.perched?CLIMBING.height:0);
 if(a?.climb||b?.climb)return !a?.airborne&&!b?.airborne&&Math.abs(height(a)-height(b))<=.35;
 return (a?.airborne?'air':a?.perched?'canopy':'ground')===(b?.airborne?'air':b?.perched?'canopy':'ground');
}
export function climbingStatus(sim,a=sim.player()){
 if(sim.paused)return{enabled:false,reason:'Resume the world first.'};
 if(a?.player&&sim.playerCombat.attackActive(a))return{enabled:false,reason:'Finish the attack first.'};
 if(a?.climb)return{enabled:true,height:a.climb.height,reason:'Climbing '+a.climb.height.toFixed(1)+'. Reverse toward solid ground.'};
 if(a?.perched)return{enabled:true,reason:'Climb down through the supporting tree.'};
 return roostAvailability(a,sim.world,{climbing:canTreeClimb(sim,a)});
}
export function startClimb(sim,a,{descending=false}={}){
 if(sim.climbingRules!==CLIMBING.policy)return{ok:false,type:'roost',message:'This world retains its recorded canopy movement.'};
 if(!a?.alive)return{ok:false,type:'roost',message:'No living creature.'};
 if(a.climb){a.climb.target=0;return{ok:true,type:'climb',message:'Climbing back down. Height is lost gradually.'}}
 if(descending){if(!a.perched)return{ok:false,type:'roost',message:'Not in the canopy.'}}
 else{const status=roostAvailability(a,sim.world,{climbing:canTreeClimb(sim,a)});if(!status.enabled)return{ok:false,type:'roost',message:status.reason};if(a.airborne)return{ok:false,type:'roost',message:'Aerial perching uses the existing landing controller.'}}
 a.climb={schema:1,height:descending?CLIMBING.height:0,target:descending?0:CLIMBING.height,x:a.x,y:a.y,elapsed:0};
 a.perched=true;a.airborne=false;a.bracing=false;a.hidden=false;a.target=null;a.intent='climb';
 return{ok:true,type:'climb',message:descending?'Climbing down. Grips and food energy support the descent.':'Climbing the living trunk. Height and work accumulate continuously.'};
}
// A fall's damage follows tissue stress (s): the same anatomy, scaled up, lands harder.
function fall(a,reason){const height=a.climb.height,damage=height*CLIMBING.fallDamage*structuralScale(a);delete a.climb;a.perched=false;a.health=Math.max(0,a.health-damage);return{ok:false,type:'climb-fall',height,damage,forced:true,message:reason+' Fell '+height.toFixed(1)+' height.'}}
export function stepClimb(sim,a,dt){
 if(!a?.alive||!a.climb)return null;
 if(sim.climbingRules!==CLIMBING.policy||!(dt>0&&dt<=.25))throw Error('Invalid climbing step.');
 const c=a.climb,site=canopySupport(sim.world,a.x,a.y),mass=adultBodyMass(a);
 if(!site.supported||mass>site.maxLoad||canopyGrips(a)<2||a.health<20||Math.hypot(a.x-c.x,a.y-c.y)>.02)return fall(a,'The trunk or grips cannot support this body.');
 let incident=null;if(a.energy<=1&&c.target>0){c.target=0;incident={ok:false,type:'climb',message:'Low food energy. Climbing back down before the grips fail.'}}
 const up=c.target>c.height,speed=(up?CLIMBING.upSpeed:CLIMBING.downSpeed)/Math.sqrt(Math.max(.5,mass)),distance=Math.min(Math.abs(c.target-c.height),speed*dt);
 c.height+=Math.sign(c.target-c.height)*distance;c.elapsed+=dt;a.energy-=massCostToReserve(a,distance*mass*(up?CLIMBING.upWork:CLIMBING.downWork));a.anim=(a.anim+dt*3)%8;
 if(c.height===c.target){const top=c.target>0;delete a.climb;a.perched=top;a.intent='idle';return{ok:true,type:top?'climb-top':'climb-ground',height:top?CLIMBING.height:0,message:top?'Reached the living canopy. Use supported canopy actions or climb down.':'Reached solid ground.'}}
 return incident;
}
export function validateClimbState(a,rule){
 const c=a.climb;if(c===undefined)return;
 if(rule!==CLIMBING.policy||c?.schema!==1||!a.perched||a.airborne||a.aerialMode!==undefined||(a.diveDepth||0)>.03||canopyGrips(a)<2||
  !['height','target','x','y','elapsed'].every(k=>Number.isFinite(c[k]))||c.height<0||c.height>CLIMBING.height||![0,CLIMBING.height].includes(c.target)||c.elapsed<0||Math.hypot(a.x-c.x,a.y-c.y)>.02)throw Error('Invalid saved climbing state.');
}
