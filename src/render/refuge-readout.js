import {readoutScreenConstraints,reserveReadout} from './readout-layout.js';
import {chooseOverlayPlacement} from '../ui/overlay-placement.js';
export function refugeReadoutText(animal){
 return animal?.intent==='thermal-refuge'?'Seeking milder ground':animal?.intent==='thermal-rest'?'Resting on milder ground':null;
}
export function refugeReadoutPlacement(position,viewport,constraints={}){
 return chooseOverlayPlacement({width:192,height:28,viewport,preferred:{left:position.x-96,top:position.y-62},...constraints,gap:10});
}
export function drawRefugeReadout(renderer){
 const text=refugeReadoutText(renderer.sim.player()),position=renderer.screenPos?.get(renderer.sim.playerId);if(!text||!position)return;
 const box=refugeReadoutPlacement(position,{left:0,top:0,right:renderer.w,bottom:renderer.h},readoutScreenConstraints(renderer)),c=renderer.ctx;
 c.save();c.globalAlpha=1;c.fillStyle='#17291ff2';c.fillRect(box.left,box.top,box.width,box.height);c.strokeStyle='#7d895e';c.strokeRect(box.left+.5,box.top+.5,box.width-1,box.height-1);c.font='bold 11px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#dce9c1';c.fillText(text,box.left+box.width/2,box.top+box.height/2);c.restore();reserveReadout(renderer,box);
}
