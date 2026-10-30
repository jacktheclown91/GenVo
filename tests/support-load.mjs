import assert from 'node:assert/strict';
import {supportPosture} from '../src/render/support-load.js';
import {genvoVisualPose,organicFootfall} from '../src/render/genvo.js';
import {organicFootfall as beforeFootfall} from './fixtures/gait-phase-before-20261028.mjs';
const layouts=[[4,12],[2,6,10,14],[0,2,4,6,8,10,12,14],[1,4,7,10,14]];
let checked=0,shifted=0;
for(const slots of layouts)for(const sturdy of [false,true])for(const dir of [0,1,2,3,4,5,6,7]){
 const legSlots=slots.map(slot=>({slot,reach:1,gait:{step:sturdy?.78:1,stride:sturdy?.65:1,lift:sturdy?.55:1}}));
 let previous;
 for(let frame=0;frame<8;frame+=.025){
  const options={dir,frame,moving:true,action:'move',legSlots};
  const pose=genvoVisualPose(options),before=genvoVisualPose({...options,behavior:{noLoadTransfer:true}});
  assert.deepEqual(pose.legs,before.legs,'body support must not move a planted or swinging foot');
  const change=Math.hypot(pose.bodyOffset.x-before.bodyOffset.x,pose.bodyOffset.y-before.bodyOffset.y);
  assert.ok(change<1.2,'load transfer remains bounded within the body silhouette');
  if(change>.025)shifted++;
  if(previous)assert.ok(Math.hypot(pose.bodyOffset.x-previous.bodyOffset.x,pose.bodyOffset.y-previous.bodyOffset.y)<.13,'no touchdown pop in torso carriage');
  previous=pose;checked++;
 }
}
assert.ok(shifted>checked*.5,'actual supporting-limb arrangements visibly change carriage');
const low=supportPosture({weight:.5,side:.5,fore:.3,limbs:4,sturdy:0});
const heavy=supportPosture({weight:.5,side:.5,fore:.3,limbs:4,sturdy:1});
assert.ok(heavy.sink>low.sink&&heavy.side>low.side,'sturdy support transfers weight more deliberately');
for(let phase=-8;phase<=16;phase+=.05){
 const old=beforeFootfall(phase,4.6,1),current=organicFootfall(phase,4.6,1);
 assert.deepEqual({stride:current.stride,lift:current.lift,planted:current.planted},old,'existing canonical gait geometry remains exact');
 assert.ok(current.supportLoad>=0&&current.supportLoad<=1);if(!current.planted)assert.equal(current.supportLoad,0);
}
console.log('Support load PASS: '+checked+' eight-direction poses, smooth bounded torso sharing, sturdy carriage, exact foot geometry and unchanged stride authority.');

// Check final authored socket insertion, not just pre-paint skeletal coordinates.
const {drawGenvoSprite}=await import('../src/render/genvo-draw.js');
const {phenotypeFor}=await import('../src/organisms/species.js');
const {studyCreatures}=await import('../tools/art-resolution/specimens.mjs');
let finalContacts=0;
for(const animal of studyCreatures())for(const dir of [0,1,2,3,4,5,6,7])for(const frame of [0,.5,1.5,3,4.5,6,7.5]){
 const paint=disabled=>{
  const calls=[],authoredParts={};
  for(const n of animal.bodyPlan.nodes)if(n.socket?.startsWith('limb.'))authoredParts[n.partId]={drawLimb(_c,o){calls.push({foot:o.foot,root:o.root});return true;}};
  const ctx=new Proxy({},{get(target,key){return key in target?target[key]:()=>{};}});
  drawGenvoSprite(ctx,{animal,phenotype:phenotypeFor(animal),scale:2,frame,moving:true,authoredParts,palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'},pose:{dir,action:'move',behavior:disabled?{noLoadTransfer:true}:{}}});
  return calls;
 };
 const old=paint(true),current=paint(false);assert.equal(current.length,old.length);
 for(let i=0;i<old.length;i++){assert.ok(Math.hypot(old[i].foot.x-current[i].foot.x,old[i].foot.y-current[i].foot.y)<1e-9,'final socket insertion cannot drag the foot');finalContacts++;}
}
console.log('Final painted contact PASS: '+finalContacts+' authored limb insertions keep exact world-relative foot coordinates.');
