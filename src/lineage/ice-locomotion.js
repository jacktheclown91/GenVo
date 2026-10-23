import {bodyMass} from '../organisms/body-mass.js';
import {SURFACE_ICE,iceCapacity,surfaceIceCovered,fractureSurfaceIce} from '../world/surface-ice.js';
import {hasGills} from './aquatic.js';
// Physical support does not change the water mask or invent swimming anatomy.
export function iceSupports(world,a,x=a.x,y=a.y){
 if(world.environment?.icePolicy!==SURFACE_ICE.policy||!world.isPlayable(x,y))return false;
 const i=world.idx(x,y);return !!world.water[i]&&surfaceIceCovered(world.environment,i)&&bodyMass(a)<=iceCapacity(world.environment,i);
}
export function liquidContact(world,a){return !!world.water[world.idx(a.x,a.y)]&&!a.airborne&&!a.perched&&!a.underground&&((a.diveDepth||0)>.03||!iceSupports(world,a))}
export function settleIceLoad(world,a,factor=1){
 if(!world.water[world.idx(a.x,a.y)])return true;
 if(world.environment?.icePolicy!==SURFACE_ICE.policy)return false;
 fractureSurfaceIce(world,world.idx(a.x,a.y),bodyMass(a)*factor);return iceSupports(world,a);
}
const reachCaches=new WeakMap();
export function iceSurfaceReach(world,a,x,y){
 if(world.sameLand(a.x,a.y,x,y))return true;
 const e=world.environment;if(e?.icePolicy!==SURFACE_ICE.policy)return false;
 const load=bodyMass(a),revision=e.iceRevision,topology=world.topology?.revision;
 let cache=reachCaches.get(world);if(!cache||cache.revision!==revision||cache.topology!==topology){cache={revision,topology,loads:new Map(),capacities:null};reachCaches.set(world,cache)}
 // Loads between two neighbouring ice capacities allow exactly the same cells
 // (capacity >= load), so they share one component map: key by the smallest
 // covered-ice capacity at or above the load. Same answers, far fewer floods.
 if(!cache.capacities){const c=[];for(let i=0;i<world.len;i++)if(world.water[i]&&surfaceIceCovered(e,i))c.push(iceCapacity(e,i));cache.capacities=Float64Array.from(new Set(c)).sort()}
 const caps=cache.capacities;let lo=0,hi=caps.length;while(lo<hi){const mid=(lo+hi)>>1;if(caps[mid]>=load)hi=mid;else lo=mid+1}
 const key=lo<caps.length?caps[lo]:Infinity;
 let groups=cache.loads.get(key);
 if(!groups){
  groups=new Uint32Array(world.len);let group=0;const queue=new Int32Array(world.len),allowed=i=>world.isPlayable(i%world.n+.5,(i/world.n|0)+.5)&&(!world.water[i]||surfaceIceCovered(e,i)&&iceCapacity(e,i)>=load);
  for(let start=0;start<world.len;start++)if(!groups[start]&&allowed(start)){
   group++;let head=0,tail=0;groups[start]=group;queue[tail++]=start;
   while(head<tail){const i=queue[head++],cx=i%world.n,cy=i/world.n|0;for(const j of [cx>0?i-1:-1,cx<world.n-1?i+1:-1,cy>0?i-world.n:-1,cy<world.n-1?i+world.n:-1])if(j>=0&&!groups[j]&&allowed(j)){groups[j]=group;queue[tail++]=j}}
  }
  cache.loads.set(key,groups);if(cache.loads.size>32)cache.loads.delete(cache.loads.keys().next().value);
 }
 const from=groups[world.idx(a.x,a.y)];return from!==0&&from===groups[world.idx(x,y)];
}
export function iceEscapeTarget(world,a){
 const cx=Math.floor(a.x),cy=Math.floor(a.y);let best=null,distance=Infinity;
 for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const x=cx+dx+.5,y=cy+dy+.5;if(!world.isPlayable(x,y)||world.water[world.idx(x,y)]&&!iceSupports(world,a,x,y))continue;const d=Math.hypot(x-a.x,y-a.y);if(d<distance){distance=d;best={x,y}}}return best;
}
export function iceEscapeStep(world,a,x,y){
 if(!a?.iceImmersion)return false;const from=world.idx(a.x,a.y),to=world.idx(x,y);
 if(from===to)return true;
 const dx=Math.abs(Math.floor(x)-Math.floor(a.x)),dy=Math.abs(Math.floor(y)-Math.floor(a.y));
 return dx+dy===1&&world.isPlayable(x,y)&&(!world.water[to]||iceSupports(world,a,x,y));
}
export function advanceIceSupport(sim,dt){
 const w=sim.world,e=w.environment;if(e?.icePolicy!==SURFACE_ICE.policy)return;
 const loads=new Map();
 for(const a of sim.animals)if(a.alive&&!a.airborne&&!a.perched&&!a.underground&&!(a.diveDepth>.03)&&w.water[w.idx(a.x,a.y)]){const i=w.idx(a.x,a.y);loads.set(i,(loads.get(i)||0)+bodyMass(a))}
 const broken=new Set();for(const [i,load] of loads)if(fractureSurfaceIce(w,i,load))broken.add(i);
 for(const a of sim.animals){
  if(!a.alive)continue;
  const i=w.idx(a.x,a.y),immersed=!a.airborne&&!a.perched&&!a.underground&&!(a.diveDepth>.03)&&w.water[i]&&!iceSupports(w,a)&&!sim.canSwim(a);
  if(!immersed){if(a.iceImmersion){delete a.iceImmersion;a.lastIceIncident={tick:sim.tickCount,type:'ice-escape',ok:true,message:'Reached supporting ground.'}}continue}
  if(!a.iceImmersion){a.iceImmersion={air:24,seconds:0};a.hidden=false;a.bracing=false;a.torpor=false;delete a.navigationRoute;a.lastIceIncident={tick:sim.tickCount,type:'ice-break',ok:false,message:broken.has(i)?'The ice gives way. Scramble toward the nearest bank or supporting sheet.':'Stranded in water without swimming anatomy. Reach the adjacent bank.'};if(a.player)sim.playerCombat.queue(a.lastIceIncident)}
  const state=a.iceImmersion;state.seconds+=dt;a.energy-=bodyMass(a)*.12*dt;
  if(hasGills(a)&&a.energy>0&&a.health>15)state.air=24;else state.air=Math.max(0,state.air-dt*(a.energy<=0?2:1));
  if(!state.air)a.health=Math.max(0,a.health-5*dt);
  if(a.health<=0){sim.kill(a,'drowning');continue}
  if(!a.player||sim.playerAutonomy){a.intent='escape';a.target=iceEscapeTarget(w,a)}
 }
}
export function validateIceImmersion(a,rule){
 const v=a.iceImmersion;if(v===undefined)return;
 if(rule!==SURFACE_ICE.policy||!Number.isFinite(v.air)||v.air<0||v.air>24||!Number.isFinite(v.seconds)||v.seconds<0||a.airborne||a.perched||a.underground)throw Error('Invalid saved ice immersion.');
}
