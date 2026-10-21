import assert from 'node:assert/strict';
import {chooseOverlayPlacement,overlapArea} from '../src/ui/overlay-placement.js';
for(const [width,height] of [[1920,1080],[1366,768],[1024,768],[800,600]]){
 const viewport={left:0,top:0,right:width,bottom:height-120};
 for(const [x,y] of [[width/2,height/2],[65,70],[width-65,70],[65,height-200],[width-65,height-200]]){
  const player={left:x-58,right:x+58,top:y-58,bottom:y+58},target={left:width/2-30,right:width/2+30,top:80,bottom:140};
  for(const [w,h] of [[260,155],[216,260]]){const placed=chooseOverlayPlacement({width:w,height:h,viewport,preferred:{left:x-w/2,top:y-h/2},protectedRects:[player,target],obstacles:[{left:width-100,right:width,top:0,bottom:55}]});
   assert.equal(overlapArea(placed,player),0,'normal viewport has a clear alternative to covering the player');assert.equal(overlapArea(placed,target),0);assert.ok(placed.left>=10&&placed.top>=10&&placed.right<=width-10&&placed.bottom<=height-130,'whole overlay stays in gameplay viewport');
  }
 }
}
console.log('Overlay placement PASS: player/target avoidance and complete bounds at desktop, laptop and 800x600 edge/centre cases.');
