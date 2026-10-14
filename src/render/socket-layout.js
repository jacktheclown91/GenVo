import {partDef} from '../lineage/part-registry.js';

// v1.54.0 (creator rule 2026-10-10): "the body owns its attachment locations; each part owns its
// shape, articulation, colors and animations." A torso's sockets may carry an authored `at` place
// on the body: f along the facing (1 = the body's front edge), s across it (1 = its right edge),
// u height above its middle (1 = the top of the back). This module turns those places into drawing
// positions for the current facing, so sockets follow the rotating body. The renderer and the
// editor both use it; sockets are only ever drawn by the editor. Bodies without authored places
// keep the computed positions.

// The body's frame for one facing: forward and side directions and its radius along each.
export function bodyFrame({fx,fy,perp,bx,by,bodyW,bodyH}){
  const vn=Math.hypot(fx,fy)||1,ux=fx/vn,uy=fy/vn,rx=bodyW/2,ry=bodyH/2,edgeAt=(dx,dy)=>1/Math.hypot(dx/rx,dy/ry);
  return{fx:ux,fy:uy,perp,bx,by,rF:edgeAt(ux,uy),rS:edgeAt(perp.x,perp.y),up:bodyH*.5};
}
// Near-vertical overhead: height is depth, not a translation toward screen north.
// Retain authored u in anatomical records; only f/s project into the world plane.
export function socketPoint(at,F){return{x:F.bx+F.fx*at.f*F.rF+F.perp.x*at.s*F.rS,y:F.by+F.fy*at.f*F.rF+F.perp.y*at.s*F.rS}}
const cache=new Map();
// Authored places of a torso's sockets ({socketId: at}), or null when it has none.
export function authoredSockets(torsoId){
  if(cache.has(torsoId))return cache.get(torsoId);const def=partDef(torsoId),list=(def?.providedSockets||[]).filter(s=>s.at),out=list.length?Object.fromEntries(list.map(s=>[s.id,s.at])):null;cache.set(torsoId,out);return out;
}
// Drawing positions of every authored socket for a body frame.
export function socketPoints(torsoId,F){const A=authoredSockets(torsoId);if(!A)return null;const out={};for(const [id,at] of Object.entries(A))out[id]=socketPoint(at,F);return out}
// The socket id of a designed leg slot (sixteenths of a turn).
export const limbOfSlot=slot=>slot%2===0?`limb.${slot/2}`:`limb.${8+(slot-1)/2}`;
