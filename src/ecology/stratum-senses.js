import {caveFlooded} from '../world/cave-water.js';
import {undergroundLineOfSight} from '../world/cave-optics.js';
import {PARTS} from '../lineage/part-registry.js';
import {waterColumn} from '../lineage/diving.js';
import {surfaceIceCovered} from '../world/surface-ice.js';
import {wetSegment} from '../world/water-route.js';
export const STRATUM_SENSES=Object.freeze({policy:'physical-stratum-senses/1',daylightSteps:6,daylightDecay:.62});
export const sensoryMedium=a=>a?.underground?'cave':(a?.diveDepth||0)>.03?'water':'surface';
const sees=a=>!a?.bodyPlan?.nodes||a.bodyPlan.nodes.some(n=>PARTS[n.partId]?.actionCapabilities.includes('see'));
const openPassage=(w,i)=>{const p=w.subsurface?.passages.get(i);return p&&!p.closed&&!caveFlooded(w,i)?p:null};
const neighbors=(w,i)=>{const x=i%w.n,y=i/w.n|0;return[x>0?i-1:-1,x<w.n-1?i+1:-1,y>0?i-w.n:-1,y<w.n-1?i+w.n:-1]};
function caveEdge(w,i,j){const p=openPassage(w,i),q=openPassage(w,j);return !!p&&!!q&&Math.abs(p.floor-q.floor)<=.6}
const lightCaches=new WeakMap();
export function caveDaylight(w,i){
 const s=w.subsurface;if(!s||!openPassage(w,i))return 0;
 let hit=lightCaches.get(w);if(!hit||hit.revision!==s.revision||hit.topology!==w.topology?.revision||hit.waterDay!==w.soilWater?.day){
  const distance=new Uint8Array(w.len).fill(255),queue=new Int32Array(w.len);let head=0,tail=0;
  for(const p of s.passages.values())if(p.entry&&openPassage(w,p.i)){distance[p.i]=0;queue[tail++]=p.i}
  while(head<tail){const j=queue[head++];if(distance[j]>=STRATUM_SENSES.daylightSteps)continue;for(const k of neighbors(w,j))if(k>=0&&distance[k]>distance[j]+1&&caveEdge(w,j,k)){distance[k]=distance[j]+1;queue[tail++]=k}}
  hit={revision:s.revision,topology:w.topology?.revision,waterDay:w.soilWater?.day,distance};lightCaches.set(w,hit);
 }
 return hit.distance[i]===255?0:STRATUM_SENSES.daylightDecay**hit.distance[i];
}
// Derived clarity uses real producer/litter stocks, not an invented sediment inventory.
export function waterExtinction(w,i){return .09+Math.min(1,w.freshwaterFood?.algae?.[i]||0)*.3+Math.min(1,w.organicResources?.litter?.[i]||0)*.18}
export function stratumSight(sim,a,b,range){
 if(sim.stratumSenseRules!==STRATUM_SENSES.policy)return null;
 const am=sensoryMedium(a),bm=sensoryMedium(b);if(am==='surface'&&bm==='surface')return null;
 const w=sim.world,distance=Math.hypot(b.x-a.x,b.y-a.y),fail=(medium,reason)=>({detected:false,distance,opticalDepth:Infinity,transmission:0,effectiveRange:0,medium,occluded:true,reason});
 if(!w.isPlayable(a.x,a.y)||!w.isPlayable(b.x,b.y))return fail(am,'Outside the detailed region.');
 if(!sees(a))return fail(am,'No mounted visual organ.');
 if(am==='cave'||bm==='cave'){
  if(am!==bm||!undergroundLineOfSight(w,a.x,a.y,b.x,b.y))return fail('cave','Solid rock or a separate layer blocks sight.');
  const illumination=(caveDaylight(w,w.idx(a.x,a.y))+caveDaylight(w,w.idx(b.x,b.y)))*.5,effectiveRange=range*Math.sqrt(illumination);
  return{detected:illumination>0&&distance<=effectiveRange,distance,opticalDepth:illumination>0?-Math.log(illumination):Infinity,transmission:illumination,effectiveRange,medium:'cave',illumination,occluded:false};
 }
 const crossing=am!==bm;
 if(crossing&&(surfaceIceCovered(w.environment,w.idx(a.x,a.y))||surfaceIceCovered(w.environment,w.idx(b.x,b.y))))return fail('water','An intact ice sheet blocks the interface.');
 if(!crossing&&!wetSegment(w,a.x,a.y,b.x,b.y,{cellAccessible:(x,y)=>waterColumn(w,x,y)+1e-6>=Math.max(a.diveDepth||0,b.diveDepth||0)+.04}))return fail('water','The liquid ray crosses a bank or insufficient water.');
 let opticalDepth=0;const samples=Math.min(16,Math.max(1,Math.ceil(distance*2)));
 for(let k=0;k<samples;k++){const t=(k+.5)/samples,i=w.idx(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);if(w.water[i])opticalDepth+=waterExtinction(w,i)*distance/samples}
 const depth=Math.max(a.diveDepth||0,b.diveDepth||0),illumination=Math.exp(-depth*.7)*(surfaceIceCovered(w.environment,w.idx(am==='water'?a.x:b.x,am==='water'?a.y:b.y))?.2:1),transmission=Math.exp(-opticalDepth)*Math.sqrt(illumination)*(crossing?.5:1),effectiveRange=range*transmission;
 return{detected:distance<=effectiveRange,distance,opticalDepth,transmission,effectiveRange,medium:'water',illumination,occluded:false};
}
export function stratumHearing(sim,a,b,radius){
 const w=sim.world,am=sensoryMedium(a),bm=sensoryMedium(b),distance=Math.hypot(b.x-a.x,b.y-a.y);
 if(sim.stratumSenseRules!==STRATUM_SENSES.policy||am==='surface'&&bm==='surface')return distance<radius;
 if(am!==bm){const cave=am==='cave'?a:bm==='cave'?b:null;return distance<radius*.5&&(!cave||!!openPassage(w,w.idx(cave.x,cave.y))?.entry)}
 if(distance>=radius)return false;const start=w.idx(a.x,a.y),goal=w.idx(b.x,b.y),queue=[start],cost=new Map([[start,0]]);
 for(let head=0;head<queue.length;head++){const i=queue[head],d=cost.get(i);if(i===goal)return true;if(d+1>=radius)continue;for(const j of neighbors(w,i))if(j>=0&&!cost.has(j)&&(am==='cave'?caveEdge(w,i,j):w.water[i]&&w.water[j])){cost.set(j,d+1);queue.push(j)}}return false;
}
