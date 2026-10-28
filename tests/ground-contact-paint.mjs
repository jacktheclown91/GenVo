import assert from 'node:assert/strict';
import {GroundContactTracker} from '../src/render/ground-contacts.js';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
import {gaitTravelFor} from '../src/render/genvo.js';
import {behaviorVisualState} from '../src/render/behavior.js';
import {studyCreatures} from '../tools/art-resolution/specimens.mjs';
let checked=0,rawMaxSlip=0,rawStraightSlip=0,heldMaxSlip=0;
for(const animal of studyCreatures())for(const scale of [1,2,4])for(let rotation=0;rotation<8;rotation++){
 const tracker=new GroundContactTracker(),world={},saved=JSON.stringify(animal),ph=phenotypeFor(animal);
 const phasePerTile=8*16/gaitTravelFor(ph.limbScale,assemblyFor(animal).legSlots);
 let x=0,y=0,phase=0,previous=new Map();
 for(let step=0;step<200;step++){
  let dx=0,dy=0,dir=2;
  if(step>=10&&step<55)dx=.005;
  else if(step>=55&&step<85){dx=.003;dy=.003;dir=step<59?3:4;}
  else if(step>=85&&step<120)dir=4;
  else if(step>=120&&step<155){dx=-.006;dir=step<124?5:6;}
  else if(step>=155)dir=step<165?6:7;
  const angle=rotation*Math.PI/4,rx=dx*Math.cos(angle)-dy*Math.sin(angle),ry=dx*Math.sin(angle)+dy*Math.cos(angle);dx=rx;dy=ry;dir=(dir+rotation)&7;
  const moving=Math.hypot(dx,dy)>0;x+=dx;y+=dy;phase=(phase+Math.hypot(dx,dy)*phasePerTile)%8;
  const position={x:Math.round(x*16*scale)/(16*scale),y:Math.round(y*16*scale)/(16*scale)};
  const frame=tracker.begin({id:animal.id,world,anatomy:animal.bodyPlan.id,...position,dir,now:step*16,moving,action:moving?'move':'idle'});
  const raw=new Map(),painted=[];
  if(frame){
   const original=Object.getPrototypeOf(frame).resolve;
   frame.resolve=function(leg,points){raw.set(leg.slot??leg.index,{x:position.x+points.foot.x/16,y:position.y+points.foot.y/16,planted:leg.planted});return original.call(this,leg,points);};
  }
  const authoredParts={};for(const node of animal.bodyPlan.nodes)if(node.socket?.startsWith('limb.'))authoredParts[node.partId]={drawLimb(_c,o){painted.push({x:o.foot.x/scale,y:o.foot.y/scale});return true;}};
  const ctx=new Proxy({},{get:(target,key)=>key in target?target[key]:()=>{}});
  const displayPhase=moving?Math.floor(((phase+animal.id*3.125)%8)*4)/4:(step*.1)%8;
  const behavior=behaviorVisualState({bodyPlan:animal.bodyPlan,id:animal.id,phase:displayPhase,moving,action:moving?'move':'idle'});
  drawGenvoSprite(ctx,{animal,phenotype:phenotypeFor(animal),scale,frame:displayPhase,moving,groundContactFrame:frame,authoredParts,palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'},pose:{dir,action:moving?'move':'idle',behavior}});
  const current=new Map();
  if(frame)for(const [key,result] of frame.memo){
   assert.ok(painted.some(p=>Math.hypot(p.x-result.foot.x,p.y-result.foot.y)<1e-9),'actual authored limb receives the final anchored coordinate');
   const foot={x:position.x+result.foot.x/16,y:position.y+result.foot.y/16,planted:result.leg.planted,raw:raw.get(key),mode:frame.mode,dir};
   const prior=previous.get(key);
   if(prior&&frame.mode==='walk'&&prior.mode==='walk'){
    if(foot.raw?.planted&&prior.raw?.planted){const slip=Math.hypot(foot.raw.x-prior.raw.x,foot.raw.y-prior.raw.y);rawMaxSlip=Math.max(rawMaxSlip,slip);if(dir===prior.dir)rawStraightSlip=Math.max(rawStraightSlip,slip);}
    if(foot.planted&&prior.planted){const slip=Math.hypot(foot.x-prior.x,foot.y-prior.y);heldMaxSlip=Math.max(heldMaxSlip,slip);assert.ok(slip<1e-12,'final world-space support survives quantized animation and rounded sprite origins');checked++;}
   }
   current.set(key,foot);
  }
  previous=current;
 }
 assert.equal(JSON.stringify(animal),saved,'render transitions cannot edit body plans or genes');
 assert.ok(tracker.states.size<=1);
}
assert.ok(rawStraightSlip>.005,'comparison includes the preceding visible slip from phase/origin quantization');
assert.ok(checked>1000);
const body=new GroundContactTracker(),base={id:99,world:{},anatomy:'body',x:0,y:0,dir:2,action:'move'};
assert.deepEqual(body.begin({...base,moving:true,now:0}).carriage({x:2,y:1},{x:0,y:0}),{x:0,y:0},'starting posture begins at rest without delaying displacement');
assert.deepEqual(body.begin({...base,moving:true,now:60}).carriage({x:2,y:1}),{x:1,y:.5});
assert.deepEqual(body.begin({...base,moving:true,now:120}).carriage({x:2,y:1}),{x:2,y:1});
assert.deepEqual(body.begin({...base,moving:false,now:136}).carriage({x:0,y:0}),{x:2,y:1},'stopping preserves the displayed torso before recovery');
assert.deepEqual(body.begin({...base,moving:false,now:211}).carriage({x:0,y:0}),{x:1,y:.5});
console.log('Ground-contact paint integration PASS: '+checked+' consecutive support observations over legal bodies, eight directions, 1/2/4x views, rounded origins and quarter-frame gait; raw turn slip '+rawMaxSlip.toFixed(5)+' tiles, straight quantization slip '+rawStraightSlip.toFixed(5)+' tiles, anchored slip '+heldMaxSlip+'. Smooth body starts/stops and exact biological inputs.');
