import assert from 'node:assert/strict';
import {coordinatedGaitOffsets} from '../src/render/gait-coordination.js';
import {genvoVisualPose as beforePose} from './fixtures/gait-phase-before-20261028.mjs';
import {genvoVisualPose,gaitTravelFor} from '../src/render/genvo.js';
const layouts={biped:[4,12],quadruped:[2,6,10,14],hexapod:[1,4,7,9,12,15],eight:[1,3,5,7,9,11,13,15],sixteen:Array.from({length:16},(_,i)=>i),uneven:[1,4,7,10,14],single:[4]};
let contactSamples=0;
for(const [name,slots] of Object.entries(layouts)){
 const legs=slots.map((slot,i)=>({slot,reach:1,gait:{step:i%2?1.3:.78,stride:i%2?1.4:.65,lift:i%2?.75:1.5}}));
 const frozen=JSON.stringify(legs),offsets=coordinatedGaitOffsets(legs);
 assert.equal(offsets.length,legs.length);assert.ok(offsets.every(v=>v>=0&&v<8));
 assert.equal(coordinatedGaitOffsets(legs),offsets,'stable assembly reuses its phase map');
 if(name==='biped')assert.equal(Math.abs(offsets[0]-offsets[1]),4);
 if(name==='quadruped')assert.equal(new Set(offsets).size,2,'two diagonal support pairs');
 if(name==='eight')assert.equal(new Set(offsets).size,4,'four traveling groups, not a doubled quadruped');
 if(name==='hexapod')assert.equal(new Set(offsets).size,6,'six-limb recovery travels along the body');
 if(name==='sixteen')assert.equal(new Set(offsets).size,16,'axial/irregular topology keeps individual recovery');
 const reversed=[...legs].reverse(),reverseOffsets=coordinatedGaitOffsets(reversed);
 for(let i=0;i<legs.length;i++)assert.equal(offsets[i],reverseOffsets[legs.length-1-i],'phase follows anatomical position, not node order');
 for(const dir of [0,1,2,3,4,5,6,7]){
  let previous;
  for(let frame=0;frame<16;frame+=.05){
   const pose=genvoVisualPose({dir,frame,moving:true,legSlots:legs}),distance=gaitTravelFor(1,legs)*frame/8;
   if(name!=='single')assert.ok(pose.legs.some(l=>l.planted),'grounded layouts retain support');
   for(let i=0;i<pose.legs.length;i++){
    const leg=pose.legs[i];assert.ok([leg.root,leg.knee,leg.foot].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
    if(previous&&leg.planted&&previous.pose.legs[i].planted){
     const drift=Math.hypot(leg.foot.x+pose.v.x*distance-previous.pose.legs[i].foot.x-pose.v.x*previous.distance,leg.foot.y+pose.v.y*distance-previous.pose.legs[i].foot.y-pose.v.y*previous.distance);
     assert.ok(drift<1e-8,name+' supported toe drift '+drift);contactSamples++;
    }
   }
   previous={pose,distance};
  }
 }
 assert.equal(JSON.stringify(legs),frozen,'coordination cannot mutate mounted anatomy');
}
console.log('Anatomical gait coordination PASS: 1/2/4/5/6/8/16 mounted limbs, mixed recovery styles, eight directions; '+contactSamples+' exact planted-contact comparisons.');

for(const legs of [null,[2,6,10,14].map(slot=>({slot,reach:1,gait:{step:1,stride:1,lift:1}}))])for(const dir of [0,1,2,3,4,5,6,7])for(const frame of [0,.5,2.75,7.5]){
 for(const action of ['idle','eat','drink','court']){
  const options={legSlots:legs,dir,frame,action,moving:false};
  assert.deepEqual(genvoVisualPose(options),beforePose(options),'static/action poses retain exact historical geometry');
 }
 const display={legSlots:legs,dir,frame,moving:true,behavior:{displayPhase:frame}};
 assert.deepEqual(genvoVisualPose(display),beforePose(display),'explicit display retains exact geometry');
 const swim={legSlots:legs,dir,frame,moving:true,action:'swim'},now=genvoVisualPose(swim),prior=beforePose(swim);
 if(legs===null)assert.deepEqual(now,prior,'legacy swimming stays exact');
 else{
  // Swimming geometry is intentionally replaced by water strokes. Retain the
  // frozen reference for every other field; do not regenerate that fixture.
  assert.deepEqual({...now,legs:prior.legs},prior,'water strokes change only mounted limbs');
  assert.ok(now.legs.every(l=>!l.planted&&Number.isFinite(l.swimFeather)),'water strokes never claim a ground support');
 }
 if(legs===null){const o={dir,frame,moving:true};assert.deepEqual(genvoVisualPose(o),beforePose(o),'historical legacy radial renderer unchanged');}
}
console.log('Frozen-reference parity PASS: static, action, display and legacy poses remain exact; mounted swimming changes only limbs.');
