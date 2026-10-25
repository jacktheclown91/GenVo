import {chooseOverlayPlacement} from '../ui/overlay-placement.js';
import {readoutScreenConstraints} from './readout-layout.js';
import {CFG} from '../sim/config.js';
// Read-only framing of an explicitly opened encounter; never an actor move.
export function courtshipCameraModel(pose,{width,height,panel,dock,body={width:48,height:48,anchorX:24,anchorY:24},obstacles=[],tile}){
 const right=Math.min(width,panel.left-8),bottom=Math.min(height,dock.top-8);
 if(right<body.width+40||bottom<body.height+40)return null;
 const placed=chooseOverlayPlacement({width:body.width+20,height:body.height+20,viewport:{left:0,top:0,right,bottom},preferred:{left:(right-body.width-20)/2,top:height/2-body.anchorY-10},obstacles});
 const x=placed.left+10+body.anchorX,y=placed.top+10+body.anchorY;
 return{x:pose.x+(width/2-x)/tile,y:pose.y+(height/2-y)/tile};
}
export function courtshipCameraTarget(renderer,pose){
 if(renderer.w>600||renderer.h<=420||typeof document==='undefined')return null;
 const panel=document.querySelector('.courtship-tray:not([hidden])'),dock=document.querySelector('#interactionDock:not([hidden])');if(!panel||!dock||!panel.getClientRects().length)return null;
 const bounds=renderer.canvas.getBoundingClientRect(),sx=renderer.w/bounds.width,sy=renderer.h/bounds.height,toCanvas=r=>({left:(r.left-bounds.left)*sx,top:(r.top-bounds.top)*sy});
 const p=renderer.screenPos?.get(renderer.sim.playerId),b=renderer.screenBoundsWorld===renderer.sim.world?renderer.screenBounds?.get(renderer.sim.playerId):null,body=p&&b?{width:b.width,height:b.height,anchorX:p.x-b.left,anchorY:p.y-b.top}:undefined;
 return courtshipCameraModel(pose,{width:renderer.w,height:renderer.h,panel:toCanvas(panel.getBoundingClientRect()),dock:toCanvas(dock.getBoundingClientRect()),body,obstacles:readoutScreenConstraints(renderer).obstacles,tile:CFG.tileSize*renderer.zoom});
}
