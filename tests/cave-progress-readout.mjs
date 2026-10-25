import assert from 'node:assert/strict';
import {CAVES} from '../src/world/cave-policy.js';
import {caveProgressText,caveProgressPlacement} from '../src/render/cave-progress-readout.js';
import {overlapArea} from '../src/ui/overlay-placement.js';
assert.equal(caveProgressText(null),null);assert.equal(caveProgressText({}),null);assert.equal(caveProgressText({caveTransit:{entering:true,elapsed:CAVES.transitionSeconds/2}}),'Descending 50%');assert.equal(caveProgressText({caveTransit:{entering:false,elapsed:CAVES.transitionSeconds/4}}),'Surfacing 25%');
for(const [w,h] of [[1024,768],[568,320],[390,844]]){const p={x:w/2,y:h/2},body={left:p.x-60,top:p.y-60,right:p.x+60,bottom:p.y+60},notices={left:10,top:10,right:270,bottom:180},dock={left:0,top:h-100,right:w,bottom:h},input={protectedRects:[body],obstacles:[notices,dock]},before=JSON.stringify(input),box=caveProgressPlacement(p,{left:0,top:0,right:w,bottom:h},input);assert.equal(overlapArea(box,body),0);assert.equal(overlapArea(box,notices),0);assert.equal(overlapArea(box,dock),0);assert.equal(JSON.stringify(input),before)}
console.log('Cave readout PASS: canonical progress text, no state/input changes and compact actor/notification/control clearance.');
