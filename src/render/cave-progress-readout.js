import {CAVES} from '../world/cave-policy.js';
import {readoutScreenConstraints,reserveReadout} from './readout-layout.js';
import {chooseOverlayPlacement} from '../ui/overlay-placement.js';
export function caveProgressText(animal){const t=animal?.caveTransit;return t?(t.entering?'Descending ':'Surfacing ')+Math.round(t.elapsed/CAVES.transitionSeconds*100)+'%':null;}
export function caveProgressPlacement(position,viewport,constraints={}){
 const preferred={left:position.x-77,top:position.y-62},anchors=[preferred,...(constraints.protectedRects||[]).flatMap(r=>[{left:r.right+10,top:position.y-14},{left:r.left-164,top:position.y-14}])],distance=r=>Math.hypot(r.left-preferred.left,r.top-preferred.top);
 return anchors.map(anchor=>chooseOverlayPlacement({width:154,height:28,viewport,preferred:anchor,...constraints,gap:10})).sort((a,b)=>a.score[0]-b.score[0]||a.score[1]-b.score[1]||distance(a)-distance(b))[0];
}
export function drawCaveProgress(renderer){const text=caveProgressText(renderer.sim.player()),position=renderer.screenPos?.get(renderer.sim.playerId);if(!text||!position)return;const box=caveProgressPlacement(position,{left:0,top:0,right:renderer.w,bottom:renderer.h},readoutScreenConstraints(renderer)),c=renderer.ctx;c.save();c.globalAlpha=1;c.fillStyle='#17291ff2';c.fillRect(box.left,box.top,box.width,box.height);c.strokeStyle='#7d895e';c.strokeRect(box.left+.5,box.top+.5,box.width-1,box.height-1);c.font='bold 11px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#d4ddc6';c.fillText(text,box.left+77,box.top+14);c.restore();reserveReadout(renderer,box);}
