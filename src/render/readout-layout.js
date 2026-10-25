import {gameplayProtectedRects} from '../ui/overlay-placement.js';
// Shared read-only actor/UI constraints in logical canvas coordinates.
export function readoutScreenConstraints(renderer){
 const bounds=renderer.canvas.getBoundingClientRect(),sx=renderer.w/bounds.width,sy=renderer.h/bounds.height,convert=r=>({left:(r.left-bounds.left)*sx,top:(r.top-bounds.top)*sy,right:(r.right-bounds.left)*sx,bottom:(r.bottom-bounds.top)*sy});
 const protectedRects=gameplayProtectedRects(renderer).map(convert),obstacles=[...document.querySelectorAll('#hud,#tutorial:not([hidden]),#interactionDock:not([hidden]),.courtship-tray:not([hidden]),#interactionDock:has(.courtship-tray:not([hidden])) .dock-header,#notificationStack:not([hidden]),#stageUtilities:not([hidden]),#stageUtilities #quickMenu:not([hidden]),.knowledge-panel:not([hidden]),.journal-page,.context-radial:not([hidden])>*:not([hidden])')].filter(e=>e.getClientRects().length).map(e=>convert(e.getBoundingClientRect()));
 return{protectedRects,obstacles:[...obstacles,...(renderer.readoutRects||[])]};
}

// Render-only reservations are discarded before each screen-readout pass.
export function beginReadoutFrame(renderer){renderer.readoutRects=[];}
export function reserveReadout(renderer,box){(renderer.readoutRects||(renderer.readoutRects=[])).push({left:box.left,top:box.top,right:box.right,bottom:box.bottom});}
