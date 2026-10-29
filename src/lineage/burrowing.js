import {caveFlooded,exposedCaveWater} from '../world/cave-water.js';
import {CAVE_AIR,caveAirAt} from '../world/cave-air.js';
import {CAVES} from '../world/cave-policy.js';
import {startCaveTransit} from './cave-traversal.js';
import {adultBodyMass} from '../organisms/body-mass.js';
import {massCostToReserve,scaleMassCost,SIZE_PHYSICS} from '../organisms/body-size.js';
import {planPartCounts,ROOT_FOODS} from './part-abilities.js';
import {SUBSURFACE,passageAt,excavationSite,excavatePassage} from '../world/subsurface.js';
export const BURROWING=Object.freeze({policy:SUBSURFACE.policy,seconds:2.5,work:2,moveSpeed:.9,moveWork:.15,airSeconds:12});
export function burrowingAnatomy(a){return(planPartCounts(a)['digging-forelimb']||0)>=2}
export function undergroundRoof(w,a){const p=a?.underground?passageAt(w,a.x,a.y):null;return !!p&&!p.closed&&!p.entry}
export function burrowTemperature(w,a,temp){return undergroundRoof(w,a) ? .55+(temp-.55)*.25 : temp}
export function undergroundPosition(w,a,x=a.x,y=a.y){const p=passageAt(w,x,y),from=passageAt(w,a.x,a.y),cx=Math.floor(a.x),cy=Math.floor(a.y),tx=Math.floor(x),ty=Math.floor(y);if(cx!==tx&&cy!==ty){const sideX=passageAt(w,tx+.5,cy+.5),sideY=passageAt(w,cx+.5,ty+.5);if(!sideX||sideX.closed||!sideY||sideY.closed)return false}return !!p&&!p.closed&&!caveFlooded(w,p.i)&&adultBodyMass(a)<=SUBSURFACE.maxLoad&&(!from||Math.abs(p.floor-from.floor)<=.6)}
function passageRoute(w,a,accept){
 const start=w.idx(a.x,a.y),seen=new Map([[start,null]]),queue=[start];let found=null;
 for(let k=0;k<queue.length;k++){const i=queue[k],p=w.subsurface?.passages.get(i);if(p&&!p.closed&&accept(p,i)){found=i;break}const x=i%w.n,y=i/w.n|0;for(const j of [x>0?i-1:-1,x<w.n-1?i+1:-1,y>0?i-w.n:-1,y<w.n-1?i+w.n:-1]){const q=w.subsurface?.passages.get(j);if(q&&!q.closed&&!caveFlooded(w,j)&&!seen.has(j)&&Math.abs(q.floor-(p?.floor??q.floor))<=.6){seen.set(j,i);queue.push(j)}}}
 if(found===null)return null;const route=[];while(found!==start){route.unshift(found);found=seen.get(found)}return route;
}
export function entranceRoute(w,a){return passageRoute(w,a,(p,i)=>p.entry&&!w.water[i])}
export function undergroundReach(w,a,x,y){const i=w.idx(x,y);return adultBodyMass(a)<=SUBSURFACE.maxLoad&&passageRoute(w,a,(p,j)=>j===i)!==null}
export function undergroundContact(w,a,b){
 if(!!a?.underground!==!!b?.underground)return false;if(!a?.underground)return true;
 const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*4));let probe=a;
 for(let k=0;k<=steps;k++){const x=a.x+(b.x-a.x)*k/steps,y=a.y+(b.y-a.y)*k/steps;if(!undergroundPosition(w,probe,x,y))return false;probe={...a,x,y}}return true;
}
export function burrowingStatus(sim,a=sim.player()){
 const fail=reason=>({enabled:false,reason});if(!a?.alive)return fail('No living creature.');if(sim.paused)return fail('Resume the world first.');
 if(sim.burrowingRules!==BURROWING.policy)return fail('This world retains its recorded ground rules. Use an explicit backed-up movement continuation.');
 if(a.caveTransit)return fail('Finish using the entrance first.');
 if(a.burrowWork)return{enabled:true,reason:'Cancel excavation. Already spent work is not refunded.'};
 if(a.underground){const p=passageAt(sim.world,a.x,a.y);return p?.entry&&!p.closed?{enabled:true,reason:'Leave through this actual entrance.'}:fail('Return through connected passages to an entrance.')}
 if(!burrowingAnatomy(a))return fail('Burrowing needs two actual digging forelimbs.');
 if(a.airborne||a.perched||a.climb||(a.diveDepth||0)>.03||a.torpor||a.carryingFood||sim.playerCombat?.attackActive(a))return fail('Land, surface, wake and finish other actions first.');
 if(adultBodyMass(a)>SUBSURFACE.maxLoad)return fail('This body is too large for these shallow passages.');
 if(a.energy<12||a.health<40)return fail('Recover food energy and health before excavation.');
 return excavationSite(sim.world,sim.world.idx(a.x,a.y))?{enabled:true,reason:'Excavate a shallow entrance. Food energy pays for real work; soil moves into a surface mound.'}:fail('Dry, sufficiently deep ground and a safe spoil site are required.');
}
export function toggleBurrow(sim,a=sim.player()){
 const status=burrowingStatus(sim,a);if(!status.enabled)return{ok:false,type:'burrow',message:status.reason};
 if(a.burrowWork){delete a.burrowWork;return{ok:true,type:'burrow',message:'Excavation cancelled. Work already spent is retained.'}}
 if(a.underground&&sim.caveRules===CAVES.policy)return startCaveTransit(sim,a);
 if(a.underground){delete a.underground;delete a.burrowSince;delete a.burrowAir;return{ok:true,type:'burrow-exit',message:'Returned to the surface through the entrance.'}}
 const p=passageAt(sim.world,a.x,a.y);if(p?.entry&&!p.closed){if(sim.caveRules===CAVES.policy)return startCaveTransit(sim,a);a.underground=true;a.burrowSince=sim.tickCount;return{ok:true,type:'burrow-enter',message:'Entered the existing passage.'}}
 startBurrowWork(sim,a,sim.world.idx(a.x,a.y),true);return{ok:true,type:'burrow',message:'Excavating an entrance. The surface remains exposed until the work finishes.'};
}
function startBurrowWork(sim,a,i,entry=false){
 if(!burrowingAnatomy(a)||a.energy<8||a.health<30||adultBodyMass(a)>SUBSURFACE.maxLoad||!excavationSite(sim.world,i))return false;
 a.burrowWork={schema:1,i,entry,elapsed:0,x:a.x,y:a.y};a.hidden=false;a.bracing=false;a.intent='burrow';a.target=null;return true;
}
export function stepBurrowWork(sim,a,dt){
 if(!a?.alive||!a.burrowWork)return null;if(!(dt>0&&dt<=.25)||sim.burrowingRules!==BURROWING.policy)throw Error('Invalid burrowing step.');
 const job=a.burrowWork;if(!burrowingAnatomy(a)||a.energy<=1||a.health<20||a.airborne||a.perched||(a.diveDepth||0)>.03||Math.hypot(a.x-job.x,a.y-job.y)>.02||!excavationSite(sim.world,job.i)){delete a.burrowWork;return{ok:false,type:'burrow',message:'Excavation stopped: body, ground or stored energy no longer supports it.'}}
 const work=Math.min(dt,BURROWING.seconds-job.elapsed);job.elapsed+=work;a.energy-=massCostToReserve(a,work*BURROWING.work*adultBodyMass(a),SIZE_PHYSICS.power);a.anim=(a.anim+work*4)%8;
 if(job.elapsed>=BURROWING.seconds-1e-9){const p=excavatePassage(sim.world,job.i,{entry:job.entry});delete a.burrowWork;if(!p)return{ok:false,type:'burrow',message:'The excavation site is no longer usable.'};if(job.entry){a.underground=true;a.burrowSince=sim.tickCount}return{ok:true,i:p.i,type:job.entry?'burrow-enter':'burrow-dug',message:job.entry?'Entrance finished. Underground passages are a separate physical layer.':'Passage opened. Removed soil is now a surface mound.'}}
 return null;
}
export function moveUnderground(sim,a,dx,dy,dt){
 if(!a?.underground||a.burrowWork||a.caveTransit||!(dt>0&&dt<=.25))return false;
 const w=sim.world,len=Math.hypot(dx,dy);if(!len)return false;dx/=len;dy/=len;const wading=1/(1+exposedCaveWater(w,w.idx(a.x,a.y))*60);const nx=a.x+dx*BURROWING.moveSpeed*wading*dt,ny=a.y+dy*BURROWING.moveSpeed*wading*dt;
 if(undergroundPosition(w,a,nx,ny)){const ox=a.x,oy=a.y;a.x=nx;a.y=ny;a.energy-=massCostToReserve(a,Math.hypot(nx-ox,ny-oy)*adultBodyMass(a)*BURROWING.moveWork,SIZE_PHYSICS.transport);a.dir=((Math.round(Math.atan2(dy,dx)/(Math.PI/4))+2)%8+8)%8;a.anim=(a.anim+dt*4)%8;a.movedTick=sim.tickCount;sim.regionalEcology?.notePageMove(a,ox,oy);return true}
 const cx=Math.floor(a.x),cy=Math.floor(a.y),tx=cx+(Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0),ty=cy+(Math.abs(dx)<Math.abs(dy)?Math.sign(dy):0),i=w.idx(tx+.5,ty+.5),site=excavationSite(w,i),from=passageAt(w,a.x,a.y);
 if(site&&Math.abs(site.floor-(from?.floor??site.floor))<=.6)startBurrowWork(sim,a,i);return false;
}
export function* undergroundRespirators(sim,dt){for(const a of sim.animals)if(a.alive&&a.underground)yield{id:a.id,i:sim.world.idx(a.x,a.y),demand:scaleMassCost(a,adultBodyMass(a)*CAVE_AIR.consumption*dt*(a.burrowWork?1.6:a.intent==='rest'?.65:1),SIZE_PHYSICS.power)}}
export function stepUndergroundCondition(sim,a,dt,supplied=undefined){
 if(!a?.underground)return;const p=passageAt(sim.world,a.x,a.y),flooded=caveFlooded(sim.world,sim.world.idx(a.x,a.y));
 if(!p||p.closed||flooded||(sim.world.subsurface?.air?(supplied===undefined?!caveAirAt(sim.world,p.i).breathable:supplied<.99):!entranceRoute(sim.world,a))){a.burrowAir=Math.max(0,(a.burrowAir??BURROWING.airSeconds)-dt);if(a.burrowAir===0)a.health=Math.max(0,a.health-4*dt)}else delete a.burrowAir;
}
export function undergroundFood(a,i,kind,w){return !a?.underground||ROOT_FOODS.includes(kind)&&i===w.idx(a.x,a.y)}
export function validateBurrowingState(a,rule,w){
 if(a.underground!==undefined&&a.underground!==true)throw Error('Invalid saved underground layer.');
 if(a.underground&&(rule!==BURROWING.policy||!passageAt(w,a.x,a.y)||a.airborne||a.perched||a.climb||(a.diveDepth||0)>.03||!Number.isSafeInteger(a.burrowSince)||a.burrowSince<0))throw Error('Invalid saved underground actor.');
 if(a.burrowAir!==undefined&&(!a.underground||!Number.isFinite(a.burrowAir)||a.burrowAir<0||a.burrowAir>BURROWING.airSeconds))throw Error('Invalid saved underground air.');
 const j=a.burrowWork;if(j!==undefined&&(rule!==BURROWING.policy||j?.schema!==1||!Number.isSafeInteger(j.i)||j.i<0||j.i>=w.len||typeof j.entry!=='boolean'||!['x','y','elapsed'].every(k=>Number.isFinite(j[k]))||j.elapsed<0||j.elapsed>BURROWING.seconds||Math.hypot(a.x-j.x,a.y-j.y)>.02||!burrowingAnatomy(a)||j.entry===!!a.underground))throw Error('Invalid saved excavation work.');
 if(j){const from=w.idx(a.x,a.y),distance=Math.abs(j.i%w.n-from%w.n)+Math.abs((j.i/w.n|0)-(from/w.n|0));if(j.entry?distance!==0:distance!==1)throw Error('Saved excavation cannot reach this remote cell.');}
}
