import {adultBodyMass} from '../organisms/body-mass.js';
import {undergroundContact} from './burrowing.js';
import {swimsByBody,hasGills} from './aquatic.js';

export const DIVING=Object.freeze({policy:'depth-respiration/1',maxDepth:2,clearance:.04,minDepth:.12,
 downSpeed:.28,upSpeed:.5,airSeconds:24,refill:6,minimumAir:8,work:.035,verticalWork:.5,suffocation:5});
export function submerged(a){return(a?.diveDepth||0)>.03}
export function sameDepth(a,b,world=null){return !!a?.underground===!!b?.underground&&(!world||undergroundContact(world,a,b))&&Math.abs((a?.diveDepth||0)-(b?.diveDepth||0))<=.15}
// Fixed-reservoir local maps need bed GEOMETRY, not a second water stock.
// Distance to the real shoreline determines the newly modeled bathymetry.
export function createLocalBathymetry(world){
 const n=world.n,distance=new Int16Array(world.len).fill(-1),queue=new Int32Array(world.len);let head=0,tail=0;
 for(let i=0;i<world.len;i++)if(!world.water[i]){distance[i]=0;queue[tail++]=i}
 while(head<tail){const i=queue[head++],x=i%n,y=i/n|0;for(const j of [x>0?i-1:-1,x<n-1?i+1:-1,y>0?i-n:-1,y<n-1?i+n:-1])if(j>=0&&distance[j]<0){distance[j]=distance[i]+1;queue[tail++]=j}}
 return Float32Array.from(distance,(d,i)=>world.water[i]?Math.min(2,.15+.15*Math.max(1,d)):0);
}
export function initializeDivingWorld(world){if(!world.environment&&!world.divingBathymetry)world.divingBathymetry=createLocalBathymetry(world)}
export function waterColumn(world,x,y){
 if(!world?.isPlayable(x,y))return 0;const i=world.idx(x,y);if(!world.water[i])return 0;
 const e=world.environment;return Math.max(0,e?(e.schema>=3?e.volume[i]:e.depth[i]):world.divingBathymetry?.[i]||0);
}
export function divingAvailability(sim,a=sim.player()){
 const fail=reason=>({enabled:false,reason});
 if(a?.underground||a?.burrowWork||a?.caveTransit)return fail('Return to the surface and finish the current underground movement first.');
 if(!a?.alive)return fail('No living creature.');
 if(sim.divingRules!==DIVING.policy)return fail('This world retains its recorded water rules. Enable diving in a backed-up New World continuation.');
 if(submerged(a)||(a.diveTarget||0)>0)return{enabled:true,reason:'Rise through the real water column to breathe at the surface.',surfacing:true};
 if(a.airborne||a.perched||a.torpor)return fail('Land, descend or wake before diving.');
 if(!swimsByBody(a))return fail('Diving requires two actual swimming legs.');
 if(a.health<35||a.energy<6||a.carryingFood)return fail('Recover energy and health and put down carried food before diving.');
 if(waterColumn(sim.world,a.x,a.y)<DIVING.minDepth+DIVING.clearance)return fail('Enter water with enough depth to submerge.');
 if(!hasGills(a)&&(a.diveAir??DIVING.airSeconds)<DIVING.minimumAir)return fail('Breathe at the surface before diving again.');
 return{enabled:true,reason:hasGills(a)?'Submerge with inherited gills. Movement and respiration consume food energy.':'Submerge to reach underwater food. Held air is finite; rise before it runs out.'};
}
export function setDiveTarget(sim,a=sim.player(),{surface=false,deeper=false}={}){
 if(surface){if(!submerged(a)&&!(a?.diveTarget>0))return{ok:false,type:'dive',message:'Already at the surface.'};a.diveTarget=0;return{ok:true,type:'surface',message:'Ascending. Air refills only after reaching the surface.'}}
 const status=divingAvailability(sim,a);if(!status.enabled)return{ok:false,type:'dive',message:status.reason};
 const maximum=Math.max(0,Math.min(DIVING.maxDepth,waterColumn(sim.world,a.x,a.y))-DIVING.clearance);
 a.diveDepth??=0;a.diveAir??=DIVING.airSeconds;
 a.diveTarget=Math.min(maximum,deeper?(a.diveTarget||a.diveDepth)+.25:Math.max(.15,Math.min(.55,maximum)));a.hidden=false;a.bracing=false;
 return{ok:true,type:'dive',message:status.reason};
}
export function stepDiving(sim,a,dt){
 if(sim.divingRules!==DIVING.policy||!a?.alive||a.underground)return null;
 if(!(dt>0&&dt<=.25))throw Error('Invalid diving step.');
 if(a.diveDepth===undefined&&a.diveAir===undefined)return null;
 const depth=waterColumn(sim.world,a.x,a.y),maximum=Math.max(0,Math.min(DIVING.maxDepth,depth)-DIVING.clearance);
 if(!depth||!swimsByBody(a)){const fallen=submerged(a);a.diveDepth=0;a.diveTarget=0;a.diveAir=Math.min(DIVING.airSeconds,(a.diveAir??DIVING.airSeconds)+DIVING.refill*dt);if(fallen){a.health=Math.max(0,a.health-8);return{ok:false,type:'surface',message:'The water or swimming support is gone. The creature is stranded at the surface.'}}if(a.diveAir===DIVING.airSeconds){delete a.diveDepth;delete a.diveTarget;delete a.diveAir}return null}
 a.diveAir=Math.max(0,Math.min(DIVING.airSeconds,a.diveAir??DIVING.airSeconds));
 if(hasGills(a)&&a.energy>0&&a.health>15)a.diveAir=DIVING.airSeconds;
 else if(submerged(a))a.diveAir=Math.max(0,a.diveAir-dt*(1+(a.movedTick>=sim.tickCount-1?.3:0)));
 else a.diveAir=Math.min(DIVING.airSeconds,a.diveAir+DIVING.refill*dt);
 let incident=null;
 if(a.diveAir<(a.diveDepth||0)/DIVING.upSpeed+2||a.energy<=0){if(a.diveTarget>0)incident={ok:false,type:'surface',message:'Low air or energy. The creature must rise to breathe.'};a.diveTarget=0}
 if(!a.diveAir&&submerged(a))a.health=Math.max(0,a.health-DIVING.suffocation*dt);
 const before=a.diveDepth||0,target=Math.min(maximum,Math.max(0,a.diveTarget||0)),speed=target>before?DIVING.downSpeed:DIVING.upSpeed;
 a.diveTarget=target;a.diveDepth=Math.max(0,Math.min(maximum,before+Math.sign(target-before)*Math.min(Math.abs(target-before),speed*dt)));
 a.energy-=adultBodyMass(a)*(Math.abs(a.diveDepth-before)*DIVING.verticalWork+(submerged(a)?DIVING.work*dt:0));
 if(before>.03&&!submerged(a)&&!target)incident={ok:true,type:'surface',message:'At the surface. Air is replenishing.'};
 return incident;
}
export function aquaticFoodAccessible(sim,a,x,y,food,{planning=false}={}){
 if(sim.divingRules!==DIVING.policy)return true;
 if(food.surface)return !submerged(a);
 const column=waterColumn(sim.world,x,y),required=Math.max(.06,Math.min(.5,column-DIVING.clearance)*.65);
 return column>DIVING.minDepth&&(planning?swimsByBody(a):(submerged(a)&&a.diveDepth>=required));
}
export function validateDivingWorld(world,rule){
 if(rule!==undefined&&rule!==DIVING.policy)throw Error('Unknown saved diving rules.');
 const d=world.divingBathymetry;if(d!==undefined&&(!(d instanceof Float32Array)||d.length!==world.len||d.some((v,i)=>!Number.isFinite(v)||v<0||v>2||(!world.water[i]&&v!==0))))throw Error('Invalid saved diving bathymetry.');
 if(rule===DIVING.policy&&!world.environment&&!d)throw Error('Saved diving bathymetry is missing.');
}
export function validateDiveState(a,rule,world){
 if(a.diveDepth===undefined&&a.diveTarget===undefined&&a.diveAir===undefined)return;
 if(rule!==DIVING.policy||![a.diveDepth,a.diveTarget,a.diveAir].every(Number.isFinite)||a.diveDepth<0||a.diveTarget<0||a.diveAir<0||a.diveAir>DIVING.airSeconds||a.diveDepth>DIVING.maxDepth||a.diveTarget>DIVING.maxDepth||submerged(a)&&(a.airborne||a.perched||!swimsByBody(a)||!world.water[world.idx(a.x,a.y)]))throw Error('Invalid saved diving state.');
}
