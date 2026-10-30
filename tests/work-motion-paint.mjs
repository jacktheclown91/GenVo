import assert from 'node:assert/strict';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {anatomicalLimbLayers} from '../src/render/anatomy-depth.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
import {behaviorVisualState} from '../src/render/behavior.js';
import {applyWorkMotion,CLIMB_PIXEL_HEIGHT} from '../src/render/work-motion.js';
import {starterPlan} from '../tools/creature-lab/assembly-model.js';
import {makePlan} from '../src/lineage/body-plan.js';
let contacts=0,braces=0;
for(const root of ['small-torso','long-torso'])for(let dir=0;dir<8;dir++)for(const scale of [1,2,4])for(const kind of ['climb','dig']){
 const initial=starterPlan(root),bodyPlan=makePlan(initial.nodes.map((n,i)=>n.socket?.startsWith('limb.')?{...n,partId:kind==='dig'?(i%2?'walking-leg':'digging-forelimb'):'climber-leg'}:n)),animal={id:71,species:'genvo',bodyPlan,alive:true,age:60,genes:{body:1,motion:1,senses:1,temperament:1},adaptations:[]},saved=JSON.stringify(animal),asm=assemblyFor(animal),ph=phenotypeFor(animal);
 const vx=[0,1,1,1,0,-1,-1,-1][dir],vy=[-1,-1,0,1,1,1,0,-1][dir],m=Math.hypot(vx,vy),ox=Math.abs(vx/m),oy=Math.abs(vy/m),sum=ox+oy,shapeW=(ox*asm.shape.length+oy*asm.shape.width)/sum,shapeH=(oy*asm.shape.length+ox*asm.shape.width)/sum;
 let previous=new Map();
 for(let step=0;step<=200;step++){
  const progress=step*.01,frame=step*.13,moving=kind==='climb',behavior=behaviorVisualState({bodyPlan,action:kind,phase:frame,moving});applyWorkMotion(behavior,kind==='climb'?{kind,height:progress,holding:false,descending:false}:{kind,elapsed:progress});
  const options={dir,frame,moving,action:kind,legSlots:asm.legSlots,bodyScale:ph.bodyScale,bodyWidthScale:(ph.bodyWidthScale||1)*shapeW,bodyHeightScale:(ph.bodyHeightScale||1)*shapeH,limbScale:ph.limbScale,temperamentScale:ph.temperamentScale,behavior};
  const profile=genvoVisualPose(options),ordered=anatomicalLimbLayers(profile.legs).back,paint=[];
  const authoredParts={};for(const node of bodyPlan.nodes)if(node.socket?.startsWith('limb.'))authoredParts[node.partId]={drawLimb(_c,p){paint.push({x:p.foot.x/scale,y:p.foot.y/scale});return true;}};
  drawGenvoSprite(new Proxy({},{get:()=>()=>{}}),{animal,phenotype:ph,scale,frame,moving,authoredParts,palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'},pose:{dir,action:kind,behavior}});
  assert.equal(paint.length,ordered.length);const current=new Map();
  for(let i=0;i<ordered.length;i++){
   const leg=ordered[i],foot=paint[i],prior=previous.get(leg.slot),world={x:foot.x,y:foot.y-(kind==='climb'?progress*CLIMB_PIXEL_HEIGHT:0)};
   if(prior){if(kind==='climb'&&leg.gripping&&prior.gripping){assert.ok(Math.hypot(world.x-prior.world.x,world.y-prior.world.y)<1e-9,'actual painted canopy grip survives body/socket insertion');contacts++;}if(kind==='dig'&&!leg.scooping){assert.ok(Math.hypot(world.x-prior.world.x,world.y-prior.world.y)<1e-9,'non-digging feet brace while torso pulls');braces++;}}
   current.set(leg.slot,{world,gripping:leg.gripping});
  }
  previous=current;
 }
 assert.equal(JSON.stringify(animal),saved);
}
console.log('Final work paint PASS: '+contacts+' held canopy supports and '+braces+' braced feet through actual hip/socket/skin insertion, eight headings, three zooms and small/long legal anatomy.');
