import {SPECIES} from '../organisms/species.js';
import {toReserve,toAbsolute,mouthScale} from '../organisms/body-size.js';
import {exposedCaveWater} from '../world/cave-water.js';
import {boundedFloat32Debit} from '../core/float32-transfer.js';
import {syncCaveAir} from '../world/cave-air.js';
import {visuallyObservable} from './atmospheric-visibility.js';
// Explicit conversion between existing hydration points and normalized water.
export const CAVE_DRINK=Object.freeze({waterPerHydration:.0001});
export function caveDrinkAvailability(sim,a=sim.player(),target=null){
 const fail=reason=>({enabled:false,state:'unavailable',reason});
 if(!a?.alive)return fail('No living creature.');if(sim.paused)return fail('Resume the world first.');
 if(!a.underground||a.burrowWork||a.caveTransit||a.airborne||a.perched)return fail('Finish entering the cave and stand beside exposed water first.');
 const w=sim.world,here=w.idx(a.x,a.y),i=target?.i??here;
 if(target&&(target.kind!=='cave-water'||target.underground!==true||!Number.isSafeInteger(i)||!Number.isFinite(target.x)||!Number.isFinite(target.y)||!w.isPlayable(target.x,target.y)||w.idx(target.x,target.y)!==i))return fail('That is not a valid underground water source.');
 if(target&&sim.sensoryFogEnabled===true&&!visuallyObservable(sim,a,target))return fail('Beyond this creature\'s present senses.');
 if(!(exposedCaveWater(w,i)>1e-8))return fail('No exposed groundwater remains at this source.');
 if(a.hydration>=SPECIES[a.species].maxHydration-.05)return fail('Already hydrated.');
 if(i!==here)return sim.canReach(a,target.x,target.y)?{enabled:false,state:'approachable',reason:'Move into the shallow cave water first.',i}:fail('No dry or shallow route reaches this water.');
 return{enabled:true,state:'available',reason:'Drink from this finite groundwater seep.',i};
}
export function drinkCaveWater(sim,a=sim.player(),{target=null,gain=Math.max(18,SPECIES[a.species].maxHydration*.22)}={}){
 const status=caveDrinkAvailability(sim,a,target);if(!status.enabled)return{ok:false,type:'drink',message:status.reason};
 const w=sim.world,s=w.soilWater,i=status.i,missing=SPECIES[a.species].maxHydration-a.hydration;
 if(!Number.isFinite(gain)||gain<0)throw Error('Invalid cave hydration request.');
 const prior=s.totals.caveDrinking??0,pending=s.pendingCaveDrinking??0;if(!Number.isFinite(prior)||prior<0||!Number.isFinite(pending)||pending<0||pending>prior)throw Error('Invalid cave drinking receipt.');
 const debit=boundedFloat32Debit(s.groundwater[i],Math.min(exposedCaveWater(w,i),Math.min(gain*mouthScale(a),toAbsolute(a,missing))*CAVE_DRINK.waterPerHydration));
 if(!(debit.amount>0))return{ok:false,type:'drink',message:'Only a trace of water remains.'};
 s.groundwater[i]=debit.remaining;s.totals.caveDrinking=prior+debit.amount;
 s.pendingCaveDrinking=pending+debit.amount;
 const hydrationGain=toReserve(a,debit.amount/CAVE_DRINK.waterPerHydration);a.hydration+=hydrationGain;syncCaveAir(w);
 a.lastCaveDrink={i,water:debit.amount,hydrationGain,day:sim.day,tick:sim.tickCount};if(a.hidden)a.hidden=false;
 sim.cognition?.onDrink(a);sim.family?.notePracticeInteraction(a,'water',{x:a.x,y:a.y,amount:hydrationGain});
 if(a.player)sim.lastPlayerAction={type:'drink',actorId:a.id,source:'cave-groundwater',...a.lastCaveDrink};
 return{ok:true,type:'drink',message:'Drank from the groundwater seep.',water:debit.amount,hydrationGain};
}
