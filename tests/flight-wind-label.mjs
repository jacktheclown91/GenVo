import assert from 'node:assert/strict';
import {flightWindLabelPlacement} from '../src/render/flight-wind.js';
import {overlapArea} from '../src/ui/overlay-placement.js';
for(const [width,height] of [[1000,750],[800,600],[480,360]])for(const p of [{x:width/2,y:height/2},{x:20,y:20},{x:width-20,y:20},{x:20,y:height-20},{x:width-20,y:height-20}]){
 const before=JSON.stringify(p),r=flightWindLabelPlacement(p,{left:0,top:0,right:width,bottom:height}),body={left:p.x-56,top:p.y-80,right:p.x+56,bottom:p.y+40};assert.equal(overlapArea(r,body),0,'wind cue must not cover raised wings or the selected body');assert.ok(r.left>=10&&r.top>=10&&r.right<=width-10&&r.bottom<=height-10,'cue remains inside the viewport');assert.equal(JSON.stringify(p),before)
}
console.log('Flight wind cue PASS: unchanged anchor input, raised-wing/body clearance and bounded label at normal/small viewports and centre/corners.');
