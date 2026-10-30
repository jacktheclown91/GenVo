import assert from 'node:assert/strict';
import {behaviorVisualState} from '../src/render/behavior.js';
import {artMount} from '../src/render/part-sprites.js';
import {swimmingLimb} from '../src/render/swimming-limbs.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
import {starterPlan} from '../tools/creature-lab/assembly-model.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
import {phenotypeFor} from '../src/organisms/species.js';
const props={root:{x:2,y:1},radial:{x:0,y:1},forward:{x:1,y:0},perp:{x:0,y:1},side:1,front:0,moving:true};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let samples=0;
for(const partId of ['webbed-leg','walking-leg','sturdy-leg'])for(const limbScale of [.45,1,1.8]){
 const at=phase=>swimmingLimb({...props,partId,limbScale,phase});
 const first=at(0),last=at(8);assert.deepEqual(last,first,'cycle closes exactly');
 for(const boundary of [0,8*.44,8])assert.ok(distance(at(boundary-1e-5).foot,at(boundary+1e-5).foot)<1e-3,'power/recovery joints are continuous');
 let previous=first;
 for(let phase=0;phase<8;phase+=.01){const stroke=at(phase);assert.equal(stroke.planted,false);assert.ok(distance(previous.foot,stroke.foot)<.09);assert.ok(stroke.swimFeather>=0&&stroke.swimFeather<=1);previous=stroke;samples++;}
 const rest=swimmingLimb({...props,partId,limbScale,moving:false});
 assert.deepEqual(swimmingLimb({...props,partId,limbScale,moving:false,phase:3}),rest,'stopped swimmer does not manufacture active propulsion');
}
const web=swimmingLimb({...props,partId:'webbed-leg',phase:1}),plain=swimmingLimb({...props,partId:'walking-leg',phase:1});assert.ok(Math.abs(web.foot.x-props.root.x)>Math.abs(plain.foot.x-props.root.x));
const left=swimmingLimb({...props,partId:'webbed-leg',phase:2,side:-1,radial:{x:0,y:-1},root:{x:2,y:-1}}),right=swimmingLimb({...props,partId:'webbed-leg',phase:2});assert.ok(Math.abs(left.foot.x-right.foot.x)<1e-10&&Math.abs(left.foot.y+right.foot.y)<1e-10,'webbed paired power stroke is mirrored');
// Actual legal assemblies, skin painting, all eight facings, mixed propulsion.
for(const root of ['small-torso','long-torso']){
 const initial=starterPlan(root),bodyPlan=makePlan(initial.nodes.map((n,i)=>n.socket?.startsWith('limb.')?{...n,partId:i%2?'walking-leg':'webbed-leg'}:n));
 const animal={id:901,species:'genvo',bodyPlan,genes:{body:1,motion:1,senses:1,temperament:1},adaptations:[],genVersion:0},saved=JSON.stringify(animal),slots=assemblyFor(animal).legSlots;
 assert.ok(slots.every(l=>l.partId),'assembly carries actual mounted limb identity');
 for(let dir=0;dir<8;dir++)for(let phase=0;phase<8;phase+=.25){
  const pose=genvoVisualPose({dir,frame:phase,action:'swim',moving:true,legSlots:slots});assert.ok(pose.legs.every(l=>!l.planted));
  let received=0;const authoredParts={};for(const id of ['webbed-leg','walking-leg'])authoredParts[id]={drawLimb(_c,o){assert.ok([o.root,o.knee,o.foot].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.ok(o.frameIndex===0||o.frameIndex===1);received++;return true;}};
  const c=new Proxy({},{get:(_,key)=>key==='drawImage'?()=>{}:()=>{}});
  drawGenvoSprite(c,{animal,phenotype:phenotypeFor(animal),palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'},authoredParts,scale:2,frame:phase,moving:true,pose:{dir,action:'swim'}});assert.equal(received,slots.length);
 }
 assert.equal(JSON.stringify(animal),saved);
}
const tailAt=phase=>artMount('paddle-tail',{fx:1,fy:0,perp:{x:0,y:1},bodyW:8,bodyH:7,behavior:behaviorVisualState({action:'swim',phase,moving:true})}).rotation;
assert.ok(Math.abs(tailAt(7.99999)-tailAt(.00001))<.00001,'native paddle tail closes continuously');
assert.equal(behaviorVisualState({action:'swim',phase:2,moving:false}).tailSweep,0,'stopped swimming does not drive tail propulsion');
console.log('Swimming limbs PASS: '+samples+' continuous strokes, paired webbing, smaller alternating ordinary paddles, neutral stops, eight-facing legal mixed assemblies and actual native skin insertion; biology untouched.');
