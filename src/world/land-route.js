import {SURFACE_ICE} from './surface-ice.js';
import {bodyMass} from '../organisms/body-mass.js';
const iceRouteState=(w,a)=>w.environment?.icePolicy===SURFACE_ICE.policy?{iceRevision:w.environment.iceRevision,iceLoad:bodyMass(a)}:{};
const iceRouteChanged=(w,a,r)=>w.environment?.icePolicy===SURFACE_ICE.policy&&(r.iceRevision!==w.environment.iceRevision||r.iceLoad!==bodyMass(a));
// Deterministic detours for an autonomous land target. Routes are ordinary
// animal state, so a checkpoint retains the same next waypoint. No RNG draws.
import {terrainTravel} from './topography.js';
export function landRouteTarget(sim,a,target){
  const r=a.navigationRoute;
  if(!r)return target;
  if(iceRouteChanged(sim.world,a,r)){delete a.navigationRoute;return target;}
  if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y)||
     sim.canSwim(a)||r.goal!==sim.world.idx(target.x,target.y)){
    delete a.navigationRoute;return target;
  }
  if(r.failed)return target;
  while(r.next<r.points.length&&Math.hypot(a.x-r.points[r.next].x,a.y-r.points[r.next].y)<.16)r.next++;
  if(r.next>=r.points.length){delete a.navigationRoute;return target}
  return r.points[r.next];
}

export function planLandDetour(sim,a,target){
  const w=sim.world;
  if(sim.canSwim(a)||!target||!sim.canOccupy(a,target.x,target.y)||!sim.canReach(a,target.x,target.y))return null;
  const start=w.idx(a.x,a.y),goal=w.idx(target.x,target.y);
  if(a.navigationRoute&&iceRouteChanged(w,a,a.navigationRoute))delete a.navigationRoute;
  if(a.navigationRoute?.failed&&a.navigationRoute.goal===goal&&a.navigationRoute.start===start)return null;
  const cost=new Float64Array(w.len);cost.fill(Infinity);
  const parent=new Int32Array(w.len);parent.fill(-1);
  const closed=new Uint8Array(w.len),heap=[];
  const gx=goal%w.n,gy=goal/w.n|0;
  const heuristic=i=>Math.abs(i%w.n-gx)+Math.abs((i/w.n|0)-gy);
  const less=(a,b)=>a.f<b.f||(a.f===b.f&&a.i<b.i);
  function push(item){let k=heap.length;heap.push(item);while(k){const p=(k-1)>>1;if(!less(item,heap[p]))break;heap[k]=heap[p];k=p}heap[k]=item}
  function pop(){const first=heap[0],last=heap.pop();if(heap.length){let k=0;while(k*2+1<heap.length){let c=k*2+1;if(c+1<heap.length&&less(heap[c+1],heap[c]))c++;if(!less(heap[c],last))break;heap[k]=heap[c];k=c}heap[k]=last}return first}
  cost[start]=0;push({i:start,f:heuristic(start)});
  while(heap.length){
    const {i}=pop();if(closed[i])continue;closed[i]=1;
    if(i===goal){
      const points=[];for(let j=goal;j!==-1;j=parent[j])points.push({x:j%w.n+.5,y:(j/w.n|0)+.5});points.reverse();
      a.navigationRoute={goal,start,points,next:0,...iceRouteState(w,a)};
      return landRouteTarget(sim,a,target);
    }
    const x=i%w.n,y=i/w.n|0;
    // Cardinal cell centres avoid cutting across submerged corners.
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
      const nx=x+dx,ny=y+dy;
      if(!sim.canOccupy(a,nx+.5,ny+.5))continue;
      const j=ny*w.n+nx,next=cost[i]+terrainTravel(w,x+.5,y+.5,nx+.5,ny+.5).routeCost;
      if(closed[j]||next>=cost[j])continue;
      cost[j]=next;parent[j]=i;push({i:j,f:next+heuristic(j)});
    }
  }
  a.navigationRoute={goal,start,failed:true,...iceRouteState(w,a)};return null;
}
