import assert from 'node:assert/strict';
import {GroundContactTracker} from '../src/render/ground-contacts.js';
const world={},tracker=new GroundContactTracker(),base={id:7,world,anatomy:'four-legs',x:0,y:0,dir:2,now:0,moving:false,action:'move'};
const leg=Object.freeze({slot:2,index:1,side:.7,front:.7,planted:true,liftAmount:0});
const points=Object.freeze({root:Object.freeze({x:2,y:2}),knee:Object.freeze({x:4,y:1}),foot:Object.freeze({x:6,y:3}),restFoot:Object.freeze({x:6,y:3})});
assert.equal(tracker.begin(base),null,'idle characters keep normal sprite caching');
const initial=tracker.begin({...base,moving:true,now:10});assert.equal(initial.needsRestPose,true);
const first=initial.resolve(leg,points),anchor={x:first.foot.x/16,y:first.foot.y/16};
for(let i=1;i<=12;i++){
 const x=i*.02,y=i*.005,frame=tracker.begin({...base,moving:true,x,y,dir:i<5?2:3,now:10+i*16});
 const result=frame.resolve(leg,points);
 assert.ok(Math.hypot(x+result.foot.x/16-anchor.x,y+result.foot.y/16-anchor.y)<1e-12,'stance remains in world space across travel and turning');
 assert.equal(frame.resolve(leg,points),result,'head/body or repeated draw passes are idempotent');
}
const paused=tracker.begin({...base,x:.24,y:.06,moving:true,dir:3,paused:true,now:1000});assert.ok(paused.cacheToken,'frozen contacts retain the existing sprite-cache path');
const frozen=paused.resolve(leg,points);
assert.ok(Math.hypot(.24+frozen.foot.x/16-anchor.x,.06+frozen.foot.y/16-anchor.y)<1e-12,'pause preserves existing contact');
let recovering=tracker.begin({...base,x:.24,y:.06,moving:false,dir:3,now:1016});
const stopped=recovering.resolve(leg,points);assert.ok(Math.hypot(.24+stopped.foot.x/16-anchor.x,.06+stopped.foot.y/16-anchor.y)<1e-12,'stopping does not snap a support foot');
let sawLift=false;
for(let time=1032;time<1350;time+=16){
 const frame=tracker.begin({...base,x:.24,y:.06,moving:false,dir:3,now:time});
 if(frame){const p=frame.resolve(leg,points);if(!p.leg.planted)sawLift=true;}
}
assert.equal(sawLift,true,'stopped feet visibly lift and recover instead of skating');
assert.equal(tracker.begin({...base,x:.24,y:.06,dir:3,now:1360}),null,'recovery returns idle actors to the original cache path');
const turn=tracker.begin({...base,x:.24,y:.06,dir:4,now:1376});assert.ok(turn?.needsRestPose,'standing turns seed the preceding resting pose');
tracker.begin({...base,x:8,y:9,moving:true,now:1400});assert.equal(tracker.stats.resets,1,'teleports reset presentation anchors');
tracker.begin({...base,x:8,y:9,moving:true,anatomy:'new-limbs',now:1416});assert.equal(tracker.stats.resets,2,'changed anatomy cannot retain old feet');
assert.equal(tracker.begin({...base,world:{},moving:false,now:1432}),null,'world changes do not drag old anchors');
assert.equal(tracker.begin({...base,action:'swim',moving:true,now:1450}),null,'specialized movement keeps its own poses');
const start=new GroundContactTracker();
const raised={...leg,planted:false,liftAmount:1},swingPoints={...points,foot:{x:3,y:0}};
const eased=start.begin({...base,moving:true,now:0}).resolve(raised,swingPoints);
assert.deepEqual(eased.foot,points.restFoot,'first unplanted step starts from the neutral pose');
const middle=start.begin({...base,moving:true,now:60}).resolve(raised,swingPoints);
assert.ok(middle.foot.x>3&&middle.foot.x<6,'start recovery ramps toward the observed gait');
const reverse=new GroundContactTracker();reverse.begin({...base,moving:true,now:0}).resolve(leg,points);
const longStep={...points,root:{x:25,y:0},foot:{x:28,y:3}};
const released=reverse.begin({...base,moving:true,dir:6,now:16}).resolve(leg,longStep);
assert.equal(released.leg.planted,false,'overstretched reversal releases the artwork foot');assert.deepEqual(released.foot,points.foot,'released foot begins at its actual previous display position');
const lift=reverse.begin({...base,moving:true,dir:6,now:64}).resolve(leg,longStep);assert.ok(lift.foot.x>6&&lift.foot.x<28,'reversal replants through a visible recovery');
const bounded=new GroundContactTracker({maxStates:3,maxAgeMs:100});for(let id=0;id<10;id++)bounded.begin({...base,id,now:id});assert.equal(bounded.states.size,3);bounded.prune(200);assert.equal(bounded.states.size,0);
assert.deepEqual(points.foot,{x:6,y:3});assert.equal(leg.planted,true,'render contact cannot mutate the provided anatomical pose');
console.log('Ground contacts PASS: world-space stance, moving/standing turns, eased starts/stops/reversal, pause, identity/teleport resets, idempotent draw and bounded idle-cache recovery.');
