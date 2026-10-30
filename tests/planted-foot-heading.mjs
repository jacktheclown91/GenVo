import assert from 'node:assert/strict';
import {GroundContactTracker} from '../src/render/ground-contacts.js';
import {drawLimb,artMount} from '../src/render/part-sprites.js';
let held=0,recovery=0;
for(let dir=0;dir<8;dir++)for(const sizeScale of [.5,1,1.5,2,3]){
  const tracker=new GroundContactTracker(),world={},angle=(dir-2)*Math.PI/4;
  const base={id:1,world,x:0,y:0,dir,now:0,moving:true,action:'move',sizeScale};
  const leg={slot:2,side:1,front:.7,planted:true,liftAmount:0};
  const points={root:{x:0,y:0},knee:{x:2,y:2},foot:{x:4,y:4}};
  const before=JSON.stringify({leg,points});
  const first=tracker.begin(base).resolve(leg,points);
  for(let i=1;i<=5;i++){
    const frame=tracker.begin({...base,dir:(dir+2)%8,now:i*16}),result=frame.resolve(leg,points);
    assert.deepEqual(result.leg.footForward,first.leg.footForward,'Planted toe heading survives body turns');
    assert.deepEqual(result.foot,first.foot,'Toe rotation cannot move the contact');
    assert.equal(frame.resolve(leg,points),result,'Repeated composition is idempotent');held++;
  }
  const frozen=tracker.begin({...base,dir:(dir+2)%8,paused:true,now:1000}).resolve(leg,points);
  assert.deepEqual(frozen.leg.footForward,first.leg.footForward);
  let last;
  for(let i=1;i<=12;i++)last=tracker.begin({...base,dir:(dir+2)%8,now:1000+i*16}).resolve({...leg,planted:false,liftAmount:1},points);
  const target=angle+Math.PI/2;
  assert.ok(last.leg.footForward.x*Math.cos(target)+last.leg.footForward.y*Math.sin(target)>.99,'Airborne recovery turns toward actual new heading');recovery++;
  const landing=tracker.begin({...base,dir:(dir+2)%8,now:1210}).resolve(leg,points);
  assert.ok(Math.abs(landing.leg.footForward.x-Math.cos(target))<1e-12);
  assert.equal(JSON.stringify({leg,points}),before);
}
// An in-place turn must lift/reorient even when its contact position is unchanged.
const standing=new GroundContactTracker(),world={},base={id:9,world,x:0,y:0,dir:2,now:0,moving:false,action:'idle'};
const leg={slot:0,side:0,front:1,planted:true},points={root:{x:0,y:0},knee:{x:2,y:0},foot:{x:4,y:0}};
assert.equal(standing.begin(base),null);
let sawLift=false,lastHeading;
for(let time=16;time<260;time+=16){
  const frame=standing.begin({...base,dir:4,now:time});
  if(frame){const result=frame.resolve(leg,points);sawLift||=!result.leg.planted;lastHeading=result.leg.footForward;}
}
assert.ok(sawLift,'Stationary turn lifts before reorienting its sole');
assert.ok(lastHeading.y>.99,'Standing recovery reaches the new heading');
let received;const forward={x:0,y:-1};
drawLimb({drawImage(){}},'walking-leg',{s:1,fx:1,fy:0,leg:{side:1,footForward:forward},root:{x:0,y:0},knee:{x:2,y:2},foot:{x:4,y:4},authoredParts:{'walking-leg':{drawLimb(c,args){received=args;return true}}}});
assert.equal(received.footForward,forward,'The real indexed painter receives the contact heading');
const mount={s:1,fx:1,fy:0,leg:{side:1,footForward:forward},root:{x:0,y:0},knee:{x:2,y:2},foot:{x:4,y:4}};
assert.equal(artMount('claw',mount).rotation,-Math.PI/2,'Mounted claws follow their held foot');
assert.equal(artMount('hook-spur',mount).rotation,0,'Knee spurs stay with the knee');
console.log('Planted heading PASS: '+held+' held turns, '+recovery+' recoveries across8 directions and0.5-3x, pause/idempotence/exact contacts, indexed handoff and mounted claw/knee distinction.');
