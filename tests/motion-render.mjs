import assert from 'node:assert/strict';
import {VisualMotionTracker,lerpWrapped,smoothStep01} from '../src/render/motion.js';
import {faunaVisualPose} from '../src/render/fauna.js';
import {genvoVisualPose} from '../src/render/genvo.js';

assert.equal(smoothStep01(-1),0);
assert.equal(smoothStep01(2),1);
assert.ok(Math.abs(lerpWrapped(7,0,.5)-7.5)<1e-9,'wrapped animation phase takes the short path across frame 7→0');

const animal={id:9,x:10,y:20,anim:7};
const tracker=new VisualMotionTracker({simHz:8});
const first=tracker.sample(animal,1,1000);
assert.deepEqual({x:first.x,y:first.y,phase:first.phase},{x:10,y:20,phase:7});
animal.x=12;animal.y=22;animal.anim=0;
const start=tracker.sample(animal,2,1125),mid=tracker.sample(animal,2,1187.5),end=tracker.sample(animal,2,1250);
assert.ok(start.x<mid.x&&mid.x<end.x&&end.x===12,'authoritative position is visually bridged between ticks');
assert.ok(mid.phase>7&&mid.phase<8,'frame 7→0 visually interpolates instead of snapping backward');
assert.equal(animal.x,12,'presentation tracker never mutates simulation state');
assert.equal(animal.anim,0,'presentation tracker never mutates canonical animation frame');



// Live-control targets can advance inside one ecology tick and use the shorter control cadence.
const live={id:10,x:5,y:5,anim:0};const liveTracker=new VisualMotionTracker({simHz:8});liveTracker.sample(live,4,2000,{hz:32});live.x=5.25;live.anim=.25;
const liveStart=liveTracker.sample(live,4,2010,{hz:32}),liveMid=liveTracker.sample(live,4,2025.625,{hz:32}),liveEnd=liveTracker.sample(live,4,2041.25,{hz:32});
assert.ok(liveStart.x<liveMid.x&&liveMid.x<liveEnd.x&&Math.abs(liveEnd.x-5.25)<1e-9,'player motion bridge accepts same-tick control targets at 32 Hz');


const responsive={id:11,x:2,y:2,anim:0};const responsiveTracker=new VisualMotionTracker({simHz:8});responsiveTracker.sample(responsive,8,3000,{hz:32,response:'linear'});responsive.x=3;responsive.anim=1;responsiveTracker.sample(responsive,8,3001,{hz:32,response:'linear'});const quarter=responsiveTracker.sample(responsive,8,3001+31.25*.25,{hz:32,response:'linear'});
assert.ok(quarter.x>2.23&&quarter.x<2.27,'live player bridge uses linear response instead of easing back from fresh input');


// Autonomous travel uses a constant presentation rate between ecology beats so
// visible creatures do not ease to a stop and restart on every 8 Hz simulation step.
const auto={id:12,x:4,y:4,anim:0};const autoTracker=new VisualMotionTracker({simHz:8});autoTracker.sample(auto,2,4000,{response:'linear'});auto.x=5;auto.anim=1;
autoTracker.sample(auto,3,4125,{response:'linear'});const autoQuarter=autoTracker.sample(auto,3,4156.25,{response:'linear'}),autoEnd=autoTracker.sample(auto,3,4250,{response:'linear'});
assert.ok(autoQuarter.x>4.24&&autoQuarter.x<4.26,'autonomous presentation moves linearly between ecology beats');
assert.equal(autoQuarter.moving,true,'visual displacement keeps autonomous gait active while crossing the segment');
assert.equal(autoEnd.moving,false,'autonomous gait settles when the visual segment reaches its authoritative endpoint');

const mossA=faunaVisualPose('mosskip',{dir:2,frame:2,moving:true}),mossMid=faunaVisualPose('mosskip',{dir:2,frame:2.5,moving:true}),mossB=faunaVisualPose('mosskip',{dir:2,frame:3,moving:true});
assert.ok(mossMid.leap<mossA.leap&&mossMid.leap>mossB.leap,'Hopper supports fractional hop poses between canonical beats');
const genA=genvoVisualPose({dir:2,frame:1,moving:true}),genMid=genvoVisualPose({dir:2,frame:1.5,moving:true});
assert.notDeepEqual(genA.legs.map(l=>[l.knee.x,l.knee.y]),genMid.legs.map(l=>[l.knee.x,l.knee.y]),'GenVo8 limb geometry has fractional in-between poses');

// Autonomous gait is presentation-distance driven rather than waiting on coarse authoritative
// animation beats. This keeps feet cycling continuously while the visual body crosses a segment.
const gaitAnimal={id:13,x:8,y:8,anim:0};const gaitTracker=new VisualMotionTracker({simHz:8});gaitTracker.sample(gaitAnimal,1,5000,{response:'linear',gaitPerTile:4});gaitAnimal.x=9;gaitAnimal.anim=0;gaitTracker.sample(gaitAnimal,2,5125,{response:'linear',gaitPerTile:4});const gaitA=gaitTracker.sample(gaitAnimal,2,5156.25,{response:'linear',gaitPerTile:4}),gaitB=gaitTracker.sample(gaitAnimal,2,5218.75,{response:'linear',gaitPerTile:4});
assert.ok(gaitB.gaitPhase>gaitA.gaitPhase,'autonomous presentation advances gait from rendered travel even when canonical anim did not change');
assert.ok(gaitB.recentlyMoving,'recent visual travel bridges the tiny seam between ecology updates');
assert.ok(gaitB.headingX>.99&&Math.abs(gaitB.headingY)<.01,'presentation exposes actual travel heading for body orientation');

const planted=genvoVisualPose({dir:2,frame:0,moving:true}),lifted=genvoVisualPose({dir:2,frame:2,moving:true});
const plantedLeg=planted.legs.find(l=>l.index===0),liftedLeg=lifted.legs.find(l=>l.index===0);
assert.ok(liftedLeg.liftAmount>plantedLeg.liftAmount,'GenVo gait exposes a continuous lift amount');
assert.ok(Math.hypot(liftedLeg.foot.x,liftedLeg.foot.y)<Math.hypot(plantedLeg.foot.x,plantedLeg.foot.y),'raised GenVo foot folds inward instead of disappearing');

console.log('render motion bridge checks: PASS');

// Frame-only refreshes during a real step cannot restart the position bridge.
for(const hz of [8,32,64]){
 const duration=1000/hz,walker={id:70,x:0,y:0,anim:0};
 const motion=new VisualMotionTracker();motion.sample(walker,0,0,{hz,response:'linear'});
 walker.x=1;walker.anim=1;motion.sample(walker,1,duration,{hz,response:'linear'});
 walker.anim=2;
 const half=motion.sample(walker,2,duration*1.5,{hz,response:'linear'});
 const end=motion.sample(walker,3,duration*2,{hz,response:'linear'});
 assert.equal(half.x,.5,'action articulation must not interrupt grounded travel');
 assert.equal(end.x,1,'tick-only refresh must reach the real endpoint on time');
 assert.equal(end.moving,false,'stationary endpoint does not keep walking');
 assert.equal(end.headingX,1,'heading remains tied to actual displacement');
 assert.equal(end.gaitPhase,4,'grounded gait advances exactly with distance');
 assert.deepEqual(walker,{id:70,x:1,y:0,anim:2},'canonical movement and frame remain unchanged');
 walker.y=1;motion.sample(walker,4,duration*3,{hz,response:'linear'});
 const turn=motion.sample(walker,4,duration*4,{hz,response:'linear'});
 assert.equal(turn.headingX,0);assert.equal(turn.headingY,1,'turn follows the next real travel segment');
}
console.log('Independent position/articulation clocks: 8/32/64 Hz travel, stop and turn PASS');
