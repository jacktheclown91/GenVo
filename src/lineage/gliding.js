import {settleIceLoad} from './ice-locomotion.js';
import {adultBodyMass} from '../organisms/body-mass.js';
import {massCostToReserve,structuralScale} from '../organisms/body-size.js';
// Gliding surfaces carry wing loading: mass s^3 over surface s^2, so the same anatomy
// scaled by s loads them as if it weighed mass/s^2. Reference-size bodies are unchanged.
export function glideLoading(a){return a?.bodySize?adultBodyMass(a)/structuralScale(a)**2:adultBodyMass(a)}
import {SPECIES} from '../organisms/species.js';
import {flightWindFactors} from './flight-wind.js';
import {canopySupport,canopyGrips} from '../ecology/canopy-site.js';

export const GLIDING=Object.freeze({policy:'finite-height-gliding/1',speed:2.8,sink:.65,
 terrainHeight:20,canopyHeight:3,launchCost:3,minEnergy:8,maxMass:2.1,minHealth:35,
 minimumDrop:.65,turnRate:1.8,collisionDamage:16,waterDamage:12});
export function hasGlidingSurfaces(a){
 const nodes=a?.bodyPlan?.nodes||[],sides=new Set(nodes.filter(n=>['patagium','gliding-membrane'].includes(n.partId)).map(n=>n.socket));
 return sides.has('flank.left')&&sides.has('flank.right');
}
export function hasClimbingAnatomy(a){return(a?.bodyPlan?.nodes||[]).filter(n=>n.partId==='climber-leg').length>=2}
export function canTreeClimb(sim,a){return sim.glidingRules===GLIDING.policy&&hasClimbingAnatomy(a)}
export function glideGround(world,x,y){
 if(!world?.isPlayable(x,y))return null;
 const i=world.idx(x,y);return world.water[i]?0:Math.max(0,world.terrain?.elevation?.[i]||0)*GLIDING.terrainHeight;
}
export function glidingAvailability(sim,a=sim.player()){
 const fail=reason=>({enabled:false,reason});
 if(!a?.alive)return fail('No living creature.');
 if(sim.glidingRules!==GLIDING.policy)return fail('This historical world retains its recorded movement rules. Gliding is available in newly generated worlds.');
 if(a.aerialMode==='glide'){const height=Math.max(0,a.glideAltitude-glideGround(sim.world,a.x,a.y));return{enabled:true,height,reason:`Height ${height.toFixed(1)}. Folding above the ground causes a fall and injury.`}}
 if(a.underground||a.burrowWork||a.caveTransit)return fail('Return to the surface and finish the current movement before gliding.');
 if(a.climb)return fail('Reach the canopy or ground before gliding.');
 if((a.diveDepth||0)>.03)return fail('Surface before gliding.');
 if(a.airborne)return fail('Land from powered flight before starting a glide.');
 if(!hasGlidingSurfaces(a))return fail('A gliding membrane must be mounted on each flank.');
 if(glideLoading(a)>GLIDING.maxMass)return fail('This body is too heavy for its gliding surfaces.');
 if(a.age<(SPECIES[a.species]?.maturity||0)*.75||a.health<GLIDING.minHealth)return fail('The body is too young or injured to glide.');
 if(a.energy<GLIDING.minEnergy||a.carryingFood)return fail('Recover food energy and put down carried food before gliding.');
 const ground=glideGround(sim.world,a.x,a.y);if(ground===null)return fail('Outside the playable region.');
 if(a.perched){
  const site=canopySupport(sim.world,a.x,a.y);
  if(!site.supported||canopyGrips(a)<2||adultBodyMass(a)>site.maxLoad)return fail('The living canopy no longer supports this launch.');
  return{enabled:true,altitude:ground+GLIDING.canopyHeight,reason:'Launch from the living canopy. Membranes glide downward; they cannot hover or climb.'};
 }
 if(sim.world.water[sim.world.idx(a.x,a.y)])return fail('Reach a real ridge or canopy before launching.');
 const angle=((a.dir||0)-2)*Math.PI/4;
 for(const distance of [1,2,3]){
  const below=glideGround(sim.world,a.x+Math.cos(angle)*distance,a.y+Math.sin(angle)*distance);
  if(below!==null&&ground-below>=GLIDING.minimumDrop)return{enabled:true,altitude:ground+.25,reason:'Launch down the slope ahead. Turn downhill before launching; gliding always loses height.'};
 }
 return fail('No downhill launch ahead. Face a real drop or climb into a living canopy.');
}
export function launchGlide(sim,a=sim.player()){
 const status=glidingAvailability(sim,a);if(!status.enabled||a.aerialMode==='glide')return{ok:false,type:'glide',message:status.reason};
 delete a.iceImmersion;a.energy-=GLIDING.launchCost;a.airborne=true;a.perched=false;a.aerialMode='glide';
 a.glideAltitude=status.altitude;a.glideHeading=((a.dir||0)-2)*Math.PI/4;a.hidden=false;a.target=null;
 return{ok:true,type:'glide',message:'Gliding. Steer toward lower ground; height and food energy are finite.'};
}
export function endGlide(a,world,{collision=false,swimmer=false,fold=false}={}){
 collision||=fold&&a.glideAltitude-glideGround(world,a.x,a.y)>1;
 const water=!settleIceLoad(world,a,collision?2:1);
 a.airborne=false;delete a.aerialMode;delete a.glideAltitude;delete a.glideHeading;
 const damage=collision?GLIDING.collisionDamage:water&&!swimmer?GLIDING.waterDamage:0;
 if(damage)a.health=Math.max(0,a.health-damage);
 return{ok:!damage,type:'glide-land',damage,water,forced:!!damage,message:collision?'The glide strikes rising terrain or loses support; landing causes injury.':water&&!swimmer?'The glide ends over water. The creature falls into the water.':'Glide landed on the surface.'};
}
// One shared physics step for player controls and autonomous locomotion.
// It moves continuously even without steering: gliding cannot become hovering.
export function stepGlide(a,world,dt,{dx=0,dy=0,swimmer=false}={}){
 if(!a?.alive||a.aerialMode!=='glide')return null;
 if(!Number.isFinite(dt)||dt<=0||dt>.25)throw Error('Invalid glide physics step.');
 if(!hasGlidingSurfaces(a)||glideLoading(a)>GLIDING.maxMass||a.energy<=0||a.health<GLIDING.minHealth)
  return endGlide(a,world,{collision:true,swimmer});
 if(dx||dy){const desired=Math.atan2(dy,dx),delta=Math.atan2(Math.sin(desired-a.glideHeading),Math.cos(desired-a.glideHeading));a.glideHeading+=Math.max(-GLIDING.turnRate*dt,Math.min(GLIDING.turnRate*dt,delta));}
 const ux=Math.cos(a.glideHeading),uy=Math.sin(a.glideHeading),wind=flightWindFactors(a,world,{toX:a.x+ux,toY:a.y+uy}),
  speed=GLIDING.speed*(a.genes?.motion||1)*wind.speed,distance=speed*dt,nx=a.x+ux*distance,ny=a.y+uy*distance,
  ground=glideGround(world,nx,ny),mass=adultBodyMass(a);
 a.energy-=massCostToReserve(a,mass*(.10*dt+.04*distance*wind.energy));
 a.glideAltitude-=GLIDING.sink*Math.max(.7,glideLoading(a)/1.4)*(1+wind.cross*.12)*dt;
 if(ground===null)return endGlide(a,world,{collision:true,swimmer});
 if(ground>a.glideAltitude+.3)return endGlide(a,world,{collision:true,swimmer});
 a.x=nx;a.y=ny;a.dir=((Math.round(a.glideHeading/(Math.PI/4))+2)%8+8)%8;a.anim=((a.anim||0)+dt*2)%8;
 if(a.glideAltitude<=ground)return endGlide(a,world,{swimmer});
 return{ok:true,type:'glide',moving:true,distance};
}
export function restoreGlidingRules(sim,core){
 if(core.glidingRules===undefined)delete sim.glidingRules;
 else if(core.glidingRules!==GLIDING.policy)throw Error('Unknown saved gliding rules.');
 for(const session of sim.planetaryTravel?.sessions||[])if(session.snapshot.core.glidingRules!==core.glidingRules)throw Error('Inconsistent regional gliding rules.');
}
export function validateGlideState(a,rule){
 if(a.aerialMode===undefined||a.aerialMode==='jump')return;
 if(a.aerialMode!=='glide'||rule!==GLIDING.policy||!a.airborne||a.perched||!hasGlidingSurfaces(a)||
  !Number.isFinite(a.glideAltitude)||a.glideAltitude<0||!Number.isFinite(a.glideHeading))throw Error('Invalid saved glide state.');
}
