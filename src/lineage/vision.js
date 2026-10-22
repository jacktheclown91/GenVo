import {PARTS} from './part-registry.js';
import {elevationAt} from '../world/topography.js';

// Anatomical vision (anatomical-vision/1, creator direction 2026-10-22).
// Visual range and field of view are separate inherited capabilities of the
// actual eyes: each mounted eye covers its own arc, centred on its socket's
// direction, out to its own world-space range (scaled by the inherited senses
// gene). A long-range eye is narrow; a panoramic eye is wide and short. The
// whole view is the union of the eyes. Ranges are physical tile distances,
// never screen measurements. Worlds without the policy keep the historical
// eye-count cone and 24-tile limit in atmospheric-visibility.js.
export const VISION=Object.freeze({policy:'anatomical-vision/1',maxRange:48,heightScale:8,bodyHeight:.35,eyelessRange:1.55});
// range: tiles at senses 1; arc: full angular width in degrees; height: extra
// eye height above the body in tiles (raised eyes see over low relief).
export const EYE_OPTICS=Object.freeze({
 eyespot:{range:3,arc:160},
 'simple-eye':{range:8,arc:150},
 'display-eye':{range:8,arc:140},
 'tracker-eye':{range:10,arc:140},
 'glow-eye':{range:11,arc:150},
 'stalk-eye':{range:11,arc:170,height:.45},
 'wide-field-eye':{range:9,arc:230},
 'compound-eye':{range:11,arc:250},
 'hunter-eye':{range:13,arc:100},
 // Advanced organs: long-range lines narrow the arc, panoramic lines shorten it.
 'telescopic-eye':{range:24,arc:64},
 'raptor-eye':{range:40,arc:76},
 'panoramic-eye':{range:15,arc:290},
 'sentinel-eye':{range:34,arc:240,height:.2}
});
export const ADVANCED_EYES=Object.freeze(['telescopic-eye','raptor-eye','panoramic-eye','sentinel-eye']);
// Mounting yaw of each eye socket relative to the body's facing (degrees,
// clockwise). The second pair on large torsos sits farther back on the head.
export const EYE_SOCKET_YAW=Object.freeze({'eye.left':-35,'eye.right':35,'eye.left.2':-115,'eye.right.2':115});
export const visionEnabled=sim=>sim?.visionRules===VISION.policy;
const RAD=Math.PI/180,cache=new WeakMap();
// The eyes a body carries, as mounted optical arcs. Cached per body plan.
export function eyeArcs(animal){
 const plan=animal?.bodyPlan;if(!plan?.nodes)return[];
 let arcs=cache.get(plan);
 if(!arcs){
  arcs=plan.nodes.filter(n=>n.socket?.startsWith('eye')&&PARTS[n.partId]).map(n=>{const o=EYE_OPTICS[n.partId]||EYE_OPTICS['simple-eye'];return{socket:n.socket,part:n.partId,yaw:(EYE_SOCKET_YAW[n.socket]??0)*RAD,half:o.arc*RAD/2,range:o.range,height:o.height||0}});
  cache.set(plan,arcs);
 }
 return arcs;
}
const senses=animal=>Math.max(.5,Math.min(1.6,animal?.genes?.senses||1));
// Inherited capabilities: farthest reach and total angular coverage (degrees).
export function visionProfile(animal){
 const arcs=eyeArcs(animal),gene=senses(animal);
 if(!arcs.length)return{eyes:0,range:VISION.eyelessRange,fieldOfView:0,eyeHeight:VISION.bodyHeight};
 const covered=new Uint8Array(360);
 for(const e of arcs)for(let d=0;d<360;d++){const a=((d-e.yaw/RAD+540)%360)-180;if(Math.abs(a)<=e.half/RAD)covered[d]=1}
 return{eyes:arcs.length,range:Math.min(VISION.maxRange,Math.max(...arcs.map(e=>e.range))*gene),fieldOfView:covered.reduce((n,v)=>n+v,0),
  eyeHeight:VISION.bodyHeight+Math.max(...arcs.map(e=>e.height))};
}
// Range of the eyes that cover a bearing (radians, relative to facing); 0 when
// no eye looks that way.
export function rangeToward(animal,relative){
 let best=0;const gene=senses(animal);
 for(const e of eyeArcs(animal)){const a=Math.atan2(Math.sin(relative-e.yaw),Math.cos(relative-e.yaw));if(Math.abs(a)<=e.half)best=Math.max(best,e.range*gene)}
 return Math.min(VISION.maxRange,best);
}
// Physical relief between eye and target. Heights are dimensionless elevation
// × the movement grade scale, in tiles. heightAt(x,y) returns null where no
// terrain is known (that sample cannot occlude).
export function terrainOccludes(heightAt,ox,oy,eyeHeight,tx,ty,targetHeight=VISION.bodyHeight){
 const d=Math.hypot(tx-ox,ty-oy);if(d<1.5)return false;
 const h0=heightAt(ox,oy),h1=heightAt(tx,ty);if(h0===null||h1===null)return false;
 const from=h0+eyeHeight,to=h1+targetHeight,steps=Math.ceil(d);
 for(let k=1;k<steps;k++){const t=k/steps,h=heightAt(ox+(tx-ox)*t,oy+(ty-oy)*t);if(h!==null&&h>from+(to-from)*t+.05)return true}
 return false;
}
// Height sampler over the active world and, optionally, neighbouring terrain
// views (beyond(x,y) -> {world,lx,ly} or null).
export function terrainHeightSampler(world,beyond=null){
 const n=world.n,scale=VISION.heightScale;
 return(x,y)=>{
  if(x>=0&&y>=0&&x<n&&y<n)return world.terrain?elevationAt(world,Math.max(.5,Math.min(n-.5,x)),Math.max(.5,Math.min(n-.5,y)))*scale:0;
  const cell=beyond?.(x,y);if(!cell)return null;const w=cell.view?.world||cell.world;if(!w?.terrain)return 0;
  return elevationAt(w,Math.max(.5,Math.min(w.n-.5,cell.lx)),Math.max(.5,Math.min(w.n-.5,cell.ly)))*scale;
 };
}
