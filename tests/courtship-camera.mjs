import assert from 'node:assert/strict';
import {courtshipCameraModel,courtshipCameraTarget} from '../src/render/courtship-camera.js';
import {ContextRadial} from '../src/ui/context-radial.js';
import {overlapArea} from '../src/ui/overlay-placement.js';
const pose=Object.freeze({x:45,y:60});
for(const [width,height] of [[320,568],[390,844],[600,450]])for(const size of [40,64]){
 const panel={left:width-10-Math.min(180,width*.45)},dock={top:height-123},body={width:size,height:size,anchorX:size/2,anchorY:size/2},obstacles=[{left:10,top:64,right:width-10,bottom:178},{left:10,top:180,right:Math.min(width-20,262),bottom:218},{left:10,top:10,right:240,bottom:50}],args={width,height,panel,dock,body,obstacles,tile:32},target=courtshipCameraModel(pose,args);assert.ok(target);
 const x=width/2+(pose.x-target.x)*32,y=height/2+(pose.y-target.y)*32,r={left:x-size/2,right:x+size/2,top:y-size/2,bottom:y+size/2};
 assert.ok(r.left>=0&&r.right<panel.left&&r.bottom<dock.top);for(const obstacle of obstacles)assert.equal(overlapArea(r,obstacle),0,'actual body fits the exposed scene');assert.deepEqual(courtshipCameraModel(pose,args),target);
}
assert.deepEqual(pose,{x:45,y:60});assert.equal(courtshipCameraTarget({w:1024,h:768},pose),null);assert.equal(courtshipCameraTarget({w:568,h:320},pose),null);
console.log('Courtship camera PASS: read-only deterministic exposed-body framing, multiple portrait sizes and normal/short-view isolation.');

const wheel=Object.create(ContextRadial.prototype),help={hidden:true,style:{},textContent:'',getBoundingClientRect(){return{height:20+this.textContent.length}}};Object.assign(wheel,{help,footprint:{width:200},layout(){throw Error('Hover must not move the controls')}});wheel.reserveExplanation([{label:'Court',reason:'Approach the selected partner.'},{label:'Observe'}]);const reserved=help.style.height;wheel.footprint={width:200};const footprint=wheel.footprint;wheel.explain('Court');assert.equal(help.style.height,reserved);assert.equal(help.style.visibility,'visible');assert.equal(wheel.footprint,footprint);wheel.explain('');assert.equal(help.style.visibility,'hidden');assert.equal(help.style.height,reserved);
