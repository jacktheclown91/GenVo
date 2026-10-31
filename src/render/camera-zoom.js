// Player camera zoom (Living Creature Pass, creator direction 2026-10-23: actions and
// individual behaviour must be readable). Presentation only: the simulation, perception,
// interaction reach and saves are unchanged; only how large the world is drawn.
export const ZOOM_LEVELS=Object.freeze([2,3,4]);
export const DEFAULT_ZOOM=3;
const KEY='genvo.cameraZoom';
let current=null;

export function defaultZoomForViewport(width=globalThis.innerWidth||1280,height=globalThis.innerHeight||720){
  return (width>=960&&height>=640)?3:2;
}

export function cameraZoom(){
 if(current)return current;
 try{
   const stored=Number(globalThis.localStorage?.getItem(KEY));
   if(ZOOM_LEVELS.includes(stored)){current=stored;return current}
 }catch{}
 current=defaultZoomForViewport();
 return current;
}
export function setCameraZoom(z){
 if(!ZOOM_LEVELS.includes(z))throw Error('Unknown camera zoom: '+z);
 current=z;try{globalThis.localStorage?.setItem(KEY,String(z))}catch{}
 return z;
}
// One step closer (+1) or farther (-1), clamped to the available levels.
export function stepCameraZoom(dir){
 const i=ZOOM_LEVELS.indexOf(cameraZoom()),next=ZOOM_LEVELS[Math.max(0,Math.min(ZOOM_LEVELS.length-1,i+Math.sign(dir)))];
 return setCameraZoom(next);
}
