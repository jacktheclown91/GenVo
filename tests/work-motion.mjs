import assert from 'node:assert/strict';
import {WorkMotionPresentation,applyWorkMotion,CLIMB_PIXEL_HEIGHT} from '../src/render/work-motion.js';
import {climbingLimb,diggingLimb} from '../src/render/work-limbs.js';
import {drawLimb} from '../src/render/part-sprites.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {starterPlan} from '../tools/creature-lab/assembly-model.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
const sim={world:{}},a={id:1,alive:true,bodyPlan:{id:'body'},climb:{height:0,target:3}},tracker=new WorkMotionPresentation();
assert.equal(tracker.sample(sim,a,0).height,0);a.climb.height=.2;assert.equal(tracker.sample(sim,a,.125).height,0);assert.ok(Math.abs(tracker.sample(sim,a,.165).height-.1)<1e-9);assert.equal(tracker.sample(sim,a,.3).height,.2,'no unobserved height extrapolation');
const frozen=tracker.sample(sim,a,.3);assert.deepEqual(tracker.sample(sim,a,.3),frozen,'pause-aware time freezes work');a.climb.height=.1;a.climb.target=0;assert.ok(tracker.sample(sim,a,.4).descending);assert.ok(Math.abs(tracker.sample(sim,a,.44).height-.15)<1e-9,'descending height interpolates within observations');
delete a.climb;a.perched=true;const perch=tracker.sample(sim,a,.5);assert.equal(perch.kind,'perch');assert.equal(perch.height,3);a.perched=false;assert.equal(tracker.sample(sim,a,.6),null);
a.burrowWork={i:42,entry:true,elapsed:.2};tracker.sample(sim,a,.7);a.burrowWork.elapsed=.5;tracker.sample(sim,a,.8);assert.ok(tracker.sample(sim,a,.84).elapsed<.5);a.burrowWork.elapsed=0;assert.equal(tracker.sample(sim,a,.85).elapsed,0,'restart cannot inherit work');delete a.burrowWork;assert.equal(tracker.sample(sim,a,.9),null,'completion/cancellation stops animation');
const bounded=new WorkMotionPresentation({maxStates:3});for(let id=0;id<10;id++)bounded.sample(sim,{...a,id,perched:true},id/10);assert.equal(bounded.states.size,3);bounded.prune(4);assert.equal(bounded.states.size,0);
const base={root:{x:1,y:2},radial:{x:.6,y:.8},forward:{x:1,y:0},perp:{x:0,y:1},front:.6,side:.8};let held=0;
for(const sign of [1,-1]){
 let previous;
 for(let i=0;i<=3000;i++){
  const height=sign>0?i/1000:3-i/1000,pose=climbingLimb({...base,height});
  if(previous&&pose.gripping&&previous.pose.gripping){const gripY=pose.foot.y-height*CLIMB_PIXEL_HEIGHT,priorY=previous.pose.foot.y-previous.height*CLIMB_PIXEL_HEIGHT;if(Math.abs(height-previous.height)<.01){assert.ok(Math.abs(gripY-priorY)<1e-10,'gripping foot stays on the same projected canopy point through ascent/descent');held++;}}
  if(previous)assert.ok(Math.hypot(pose.foot.x-previous.pose.foot.x,pose.foot.y-previous.pose.foot.y)<.1,'grip/reach transition stays continuous');previous={height,pose};
 }
}
for(const height of [0,1,3])assert.ok(climbingLimb({...base,height,holding:true}).planted,'perched feet remain gripped');
const neutralFoot={x:5,y:4};for(const elapsed of [0,.1,.4,.8,1.2,2.4]){
 const brace=diggingLimb({...base,neutralFoot,elapsed,partId:'walking-leg'});assert.deepEqual(brace.foot,neutralFoot);assert.equal(brace.planted,true);
}
for(const boundary of [0,.22,.68,1]){const at=t=>diggingLimb({...base,neutralFoot,partId:'digging-forelimb',elapsed:t/1.6});assert.ok(Math.hypot(at(boundary-1e-6).foot.x-at(boundary+1e-6).foot.x,at(boundary-1e-6).foot.y-at(boundary+1e-6).foot.y)<1e-3);}
const plan=starterPlan('small-torso'),bodyPlan=makePlan(plan.nodes.map((n,i)=>n.socket?.startsWith('limb.')?{...n,partId:i%2?'walking-leg':'digging-forelimb'}:n)),legSlots=assemblyFor({bodyPlan}).legSlots,saved=JSON.stringify(bodyPlan);
let poses=0;for(let dir=0;dir<8;dir++)for(const elapsed of [0,.16,.48,.9,1.4,2.3]){
 const behavior={bodyDrop:0,bodyLean:0,headDrop:0};applyWorkMotion(behavior,{kind:'dig',elapsed});
 const p=genvoVisualPose({dir,frame:0,moving:false,action:'dig',legSlots,behavior}),other=genvoVisualPose({dir,frame:6,moving:true,action:'dig',legSlots,behavior});assert.deepEqual(other,p,'unrelated walk/idle phase cannot invent work movement');assert.ok(p.legs.some(l=>l.scooping)&&p.legs.some(l=>!l.scooping&&l.planted));for(const l of p.legs)assert.ok(Number.isFinite(l.knee.x+l.foot.y));poses++;
}
assert.equal(JSON.stringify(bodyPlan),saved);
// Functional grips must not all let go, including an asymmetric one-sided pair.
for(const sockets of [[0,1],[2,3],[1,7],[1,2,3]]){
 const slots=Array.from({length:8},(_,slot)=>({slot:slot*2,partId:sockets.includes(slot)?'climber-leg':'walking-leg',reach:1}));
 for(let height=0;height<3;height+=.005){const p=genvoVisualPose({dir:2,action:'climb',moving:true,legSlots:slots,behavior:{climbHeight:height}});assert.ok(p.legs.some(l=>sockets.includes(l.slot/2)&&l.gripping),'at least one actual gripping organ supports the climb');}
}
let holdingFoot;
drawLimb({drawImage(){}},'climber-leg',{s:1,fx:1,fy:0,authoredState:'idle',behavior:{climbHeight:3},leg:{side:1},root:{x:1,y:1},knee:{x:2,y:2},foot:{x:3,y:3},authoredParts:{'climber-leg':{drawLimb(_c,options){holdingFoot=options.footForward;return true;}}}});
assert.equal(holdingFoot,null,'perched holding retains its specialized grip orientation');
console.log('Work motion PASS: '+held+' fixed canopy grips ascending/descending, smooth reaches/scoops, braced ordinary limbs, '+poses+' eight-facing mixed work poses, no clock-invented progress, pause/restart/cancel and bounded state.');
