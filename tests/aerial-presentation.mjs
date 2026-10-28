import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AerialPresentation,aerialPose,applyAerialPose} from '../src/render/aerial-presentation.js';
import {drawPart,artMount} from '../src/render/part-sprites.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {compileSourceRgbaPart} from '../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
const sim={world:{}},animal={id:7,alive:true,airborne:false,bodyPlan:{id:'one'}},saved=JSON.stringify(animal),tracker=new AerialPresentation();
assert.equal(tracker.sample(sim,animal,0),null);
animal.airborne=true;const takeoff=tracker.sample(sim,animal,.01);assert.equal(takeoff.flightSpread,0);assert.equal(takeoff.aerialTuck,0);
const lift=tracker.sample(sim,animal,.10);assert.ok(lift.aerialTuck>0&&lift.aerialTuck<1);const flight=tracker.sample(sim,animal,.21);assert.equal(flight.aerialTuck,1);
const frozen=JSON.stringify(tracker.sample(sim,animal,.21));assert.equal(JSON.stringify(tracker.sample(sim,animal,.21)),frozen,'pause-aware clock freezes every aerial field');
animal.aerialMode='glide';const glide=tracker.sample(sim,animal,.3);for(const time of [.31,.4,.6]){const p=tracker.sample(sim,animal,time);const stationary=new AerialPresentation(),traveling=new AerialPresentation();
for(const time of [0,.08,.16,.24])assert.deepEqual(stationary.sample(sim,{...animal,x:1,y:1},time),traveling.sample(sim,{...animal,x:1+time*9,y:3},time),'wing rhythm does not depend on walking distance or hovering');
for(const field of ['flightSpread','wingSweep','wingFrame','aerialTuck'])assert.equal(p[field],glide[field],'passive glide has no power stroke');}
delete animal.aerialMode;animal.airborne=false;const landing=tracker.sample(sim,animal,.61);assert.equal(landing.landing,true);assert.equal(landing.aerialTuck,1);assert.equal(landing.flightSpread,1);assert.equal(landing.glideSpread,1);
const settle=tracker.sample(sim,animal,.74);assert.ok(settle.bodyDrop>.85&&settle.aerialTuck<1&&settle.flightSpread<1);assert.equal(tracker.sample(sim,animal,.88),null);
assert.equal(JSON.stringify(animal),saved,'observer stores no fields on animals');
const other={world:{}};assert.equal(tracker.sample(other,animal,.9),null);assert.equal(tracker.states.size,1,'world change resets presentation history');
animal.aerialMode='jump';animal.airborne=true;assert.equal(tracker.sample(other,animal,1),null,'jump must not become powered flight');delete animal.aerialMode;animal.perched=true;assert.equal(tracker.sample(other,animal,1.1),null,'perched wings do not flap');delete animal.perched;
animal.burrowWork={};assert.equal(tracker.sample(other,animal,1.2),null,'burrowing cannot inherit a stale aerial posture');delete animal.burrowWork;
const first=new AerialPresentation().sample(sim,animal,5);assert.equal(first.aerialTuck,1,'first sight of an existing flier does not invent a launch');
const bounded=new AerialPresentation({maxStates:3});for(let id=0;id<10;id++)bounded.sample(sim,{...animal,id},id/20);assert.equal(bounded.states.size,3);bounded.prune(4);assert.equal(bounded.states.size,0);
for(const field of ['flightSpread','wingSweep','bodyRise'])assert.ok(Math.abs(aerialPose({phase:7.999999})[field]-aerialPose({phase:.000001})[field])<1e-5,'wing cycle closes continuously');
const limbs=[2,6,10,14].map(slot=>({slot,reach:1}));let poses=0;
for(let dir=0;dir<8;dir++)for(let phase=0;phase<8;phase+=.125){
 const behavior={bodyDrop:0,bodyRise:0,bodyLean:0};applyAerialPose(behavior,aerialPose({phase}));
 const p=genvoVisualPose({dir,frame:phase,action:'fly',moving:true,legSlots:limbs,behavior});
 for(const l of p.legs){assert.equal(l.planted,false);assert.ok(Math.hypot(l.foot.x-l.root.x,l.foot.y-l.root.y)<2,'flying legs fold close to their real hip');assert.ok(Number.isFinite(l.knee.x+l.knee.y));}poses++;
}
// Actual indexed wing panels: sweep about paired hinges; fixed root and no allocations.
const source=JSON.parse(fs.readFileSync('assets/art/parts/flight-wing.json')),asset=await compileSourceRgbaPart({...source,frames:source.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});let allocations=0;
const renderer=prepareIndexedPartRenderer(asset,{createCanvas(){allocations++;return{getContext(){return{createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}};}}),prepared=allocations;
for(let facing=0;facing<8;facing++)for(const sweepRadians of [-.22,0,.22]){
 const rotations=[],calls=[];let depth=0;const ctx={save(){depth++},restore(){depth--},translate(){},scale(){},rotate(a){rotations.push(a)},drawImage(...args){calls.push(args)}};
 assert.equal(renderer.drawDorsal(ctx,{facing,headingRadians:(facing-2)*Math.PI/4,deployment:.8,sweepRadians,frameIndex:0}),true);assert.equal(depth,0);assert.equal(calls.length,3);assert.deepEqual(calls[2].slice(1),[-16,-16]);if(sweepRadians){assert.ok(rotations.includes(sweepRadians)&&rotations.includes(-sweepRadians));}
}
assert.equal(allocations,prepared);assert.throws(()=>renderer.drawDorsal({}, {sweepRadians:NaN}),/Invalid/);
for(const partId of ['patagium','gliding-membrane']){
 const base={s:1,fx:1,fy:0,perp:{x:0,y:1},bx:0,by:0,bodyW:8,bodyH:7,sign:1,authoredState:'glide',authoredParts:{[partId]:{draw(_ctx,o){assert.equal(o.frameIndex,0,'passive membrane paint cannot cycle between flap-like frames');return true;}}}};
 let previous=0;for(const glideSpread of [0,.25,.5,.75,1]){const k={...base,behavior:{glideSpread}},at=artMount(partId,k);assert.ok(at.scale>previous,'membrane folding interpolates rather than popping at a boolean threshold');previous=at.scale;drawPart({drawImage(){},save(){},restore(){}},partId,k);}
}
console.log('Aerial presentation PASS: observed takeoff/landing, frozen clock, steady glide, no fabricated jump/perch launch, bounded/reset history, '+poses+' tucked eight-facing poses, mirrored hinge sweeps, fixed roots and reused tissue.');
