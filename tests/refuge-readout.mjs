import assert from 'node:assert/strict';
import {refugeReadoutText,refugeReadoutPlacement} from '../src/render/refuge-readout.js';
import {overlapArea} from '../src/ui/overlay-placement.js';
assert.equal(refugeReadoutText(null),null);assert.equal(refugeReadoutText({intent:'rest'}),null);assert.equal(refugeReadoutText({intent:'thermal-refuge'}),'Seeking milder ground');assert.equal(refugeReadoutText({intent:'thermal-rest'}),'Resting on milder ground');
for(const [w,h] of [[1920,1080],[1366,768],[1024,768],[800,600],[390,844],[568,320]])for(const [x,y] of [[w/2,h/2],[20,20],[w-20,h-20]]){const body={left:x-80,top:y-80,right:x+80,bottom:y+80},dock={left:0,top:h-110,right:w,bottom:h},constraints={protectedRects:[body],obstacles:[dock]},before=JSON.stringify(constraints),r=refugeReadoutPlacement({x,y},{left:0,top:0,right:w,bottom:h},constraints);assert.equal(overlapArea(r,body),0);assert.equal(overlapArea(r,dock),0);assert.ok(r.left>=10&&r.top>=10&&r.right<=w-10&&r.bottom<=h-10);assert.equal(JSON.stringify(constraints),before)}
console.log('Refuge readout PASS: canonical intent text, body/control clearance and unchanged placement inputs.');
