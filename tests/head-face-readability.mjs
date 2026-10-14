import assert from 'node:assert/strict';
import {headPose,facialMounts} from '../src/render/head.js';
import {genvoVisualPose} from '../src/render/genvo.js';
for(let dir=0;dir<8;dir++){
 const profile=genvoVisualPose({dir,legSlots:[]});
 const asm={implicitHead:true,faceNodes:{mouth:'root/mouth','eye.left':'root/eye.left','eye.right':'root/eye.right'}};
 const torso={mouth:{x:0,y:0},'eye.left':{x:0,y:0},'eye.right':{x:0,y:0}};
 const head=headPose(asm,profile,torso),before=JSON.stringify(asm),mounts=facialMounts(asm,head,torso);
 for(const socket of Object.keys(asm.faceNodes))assert.deepEqual(mounts[socket],head.sockets[socket],'legacy facial organs follow the visible compatibility head');
 assert.equal(JSON.stringify(asm),before);assert.ok(head.width>=3.4);
 const headless={...asm,implicitHead:false};assert.equal(headPose(headless,profile,torso),null);assert.deepEqual(facialMounts(headless,null,torso),torso,'deliberately headless anatomy retains torso organs');
}
console.log('Eight-direction implicit head face attachment and deliberate headless rendering passed');
