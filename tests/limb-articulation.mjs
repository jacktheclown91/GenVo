import assert from 'node:assert/strict';
import {articulatedKnee} from '../src/render/limb-articulation.js';
import {genvoVisualPose} from '../src/render/genvo.js';
for(let liftAmount=0;liftAmount<=1;liftAmount+=.125){
 const right={root:{x:2,y:1},foot:{x:7,y:3},forward:{x:0,y:-1},perp:{x:1,y:0},side:1,liftAmount},left={...right,root:{x:-2,y:1},foot:{x:-7,y:3},side:-1};
 const before=JSON.stringify(right),a=articulatedKnee(right),b=articulatedKnee(left);assert.equal(JSON.stringify(right),before);assert.equal(a.x,-b.x);assert.equal(a.y,b.y);
 const rotate=p=>({x:-p.y,y:p.x}),rotated=articulatedKnee({...right,root:rotate(right.root),foot:rotate(right.foot),forward:rotate(right.forward),perp:rotate(right.perp)});assert.deepEqual(rotated,rotate(a),'articulation rotates with the creature instead of screen axes');
}
const legSlots=[2,6,10,14].map(slot=>({slot,reach:1,gait:{stride:1,lift:1}}));
for(let dir=0;dir<8;dir++)for(let frame=0;frame<8;frame+=.0625){const p=genvoVisualPose({dir,frame,moving:true,legSlots});assert.equal(p.legs.length,4);for(const l of p.legs)for(const point of [l.root,l.knee,l.foot])assert.ok(Number.isFinite(point.x+point.y));assert.ok(p.legs.some(l=>l.planted),'walking cycle retains at least one support contact');}
console.log('Mirrored and facing-relative knees, immutable contacts, and finite/supporting 1024 walking poses PASS');
