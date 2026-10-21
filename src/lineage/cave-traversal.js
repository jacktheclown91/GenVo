import {exposedCaveWater} from '../world/cave-water.js';
import {adultBodyMass} from '../organisms/body-mass.js';
import {passageAt,SUBSURFACE} from '../world/subsurface.js';
import {CAVES} from '../world/cave-policy.js';
export function caveEntranceStatus(sim,a=sim.player(),index=sim.world.idx(a?.x??0,a?.y??0)){
 const fail=reason=>({enabled:false,state:'unavailable',reason});if(!a?.alive)return fail('No living creature.');if(sim.caveRules!==CAVES.policy)return fail('This world retains its recorded entrance rules.');
 const p=sim.world.subsurface?.passages.get(index);if(!p?.entry||p.closed)return fail('No open entrance here.');
 if(adultBodyMass(a)>SUBSURFACE.maxLoad)return fail('This body cannot fit through the opening.');
 if(sim.paused)return fail('Resume the world first.');if(a.caveTransit||a.burrowWork||a.airborne||a.perched||a.climb||(a.diveDepth||0)>.03||a.torpor||a.carryingFood||sim.playerCombat.attackActive(a))return fail('Finish the current movement or action and put down carried food first.');
 if(exposedCaveWater(sim.world,index)>=Math.min(.025,p.void*.75))return fail('This entrance is flooded. Wait for drainage or find a dry opening.');
 const x=index%sim.world.n+.5,y=(index/sim.world.n|0)+.5;if(sim.world.idx(a.x,a.y)!==index)return{enabled:false,state:'approachable',reason:'Approach the actual entrance first.'};
 if(!a.underground&&a.energy<2)return fail('Recover food energy before descending.');
 return{enabled:true,state:'available',reason:a.underground?'Climb through this entrance to the surface.':'Enter the connected cave. No digging organs are required to use an existing opening.'};
}
export function startCaveTransit(sim,a=sim.player(),index=sim.world.idx(a?.x??0,a?.y??0)){
 const status=caveEntranceStatus(sim,a,index);if(!status.enabled)return{ok:false,type:'cave',message:status.reason};
 a.caveTransit={schema:1,i:index,x:a.x,y:a.y,elapsed:0,entering:!a.underground};a.hidden=false;a.bracing=false;a.target=null;
 return{ok:true,type:'cave',message:a.underground?'Climbing toward the opening.':'Descending through the existing entrance.'};
}
export function stepCaveTransit(sim,a,dt){
 if(!a?.alive||!a.caveTransit)return null;if(sim.caveRules!==CAVES.policy||!(dt>0&&dt<=.25))throw Error('Invalid cave transition step.');
 const t=a.caveTransit,p=passageAt(sim.world,a.x,a.y);
 if(!p?.entry||p.closed||sim.world.idx(a.x,a.y)!==t.i||Math.hypot(a.x-t.x,a.y-t.y)>.02||adultBodyMass(a)>SUBSURFACE.maxLoad){delete a.caveTransit;return{ok:false,type:'cave',message:'The body or entrance no longer supports this movement.'}}
 if(a.energy<=0||a.health<=0){delete a.caveTransit;return{ok:false,type:'cave',message:'Not enough strength to finish using the entrance.'}}
 const step=Math.min(dt,CAVES.transitionSeconds-t.elapsed);t.elapsed+=step;a.energy-=step*adultBodyMass(a)*.12;a.anim=(a.anim+step*3)%8;
 if(t.elapsed>=CAVES.transitionSeconds-1e-9){delete a.caveTransit;if(t.entering){a.underground=true;a.burrowSince=sim.tickCount}else{delete a.underground;delete a.burrowSince;delete a.burrowAir}return{ok:true,type:t.entering?'cave-enter':'cave-exit',message:t.entering?'Inside the connected cave. Follow the passages and return to an opening.':'Back on the surface.'}}
 return null;
}
export function validateCaveTransit(a,rule,w){const t=a.caveTransit;if(t===undefined)return;const p=w.subsurface?.passages.get(t?.i);if(rule!==CAVES.policy||t?.schema!==1||!Number.isSafeInteger(t.i)||!p?.entry||p.closed||!['x','y','elapsed'].every(k=>Number.isFinite(t[k]))||t.elapsed<0||t.elapsed>CAVES.transitionSeconds||typeof t.entering!=='boolean'||t.entering===!!a.underground||w.idx(a.x,a.y)!==t.i||Math.hypot(a.x-t.x,a.y-t.y)>.02||a.airborne||a.perched||a.climb||a.torpor||a.burrowWork||a.carryingFood||(a.diveDepth||0)>.03)throw Error('Invalid saved cave transition.');}
