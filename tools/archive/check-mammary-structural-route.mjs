import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {founderPlan,mutatePlan} from '../../src/lineage/body-inheritance.js';
import {PARTS} from '../../src/lineage/part-registry.js';
import {serializePlan,validatePlan} from '../../src/lineage/body-plan.js';
const out=process.argv[2];assert.ok(out&&!fs.existsSync(out));
const desired=['soft-torso','stout-torso','filament-tuft','fur-mantle','live-womb','endothermic-core','mammary-gland'];
let plan=founderPlan();const founder=plan,steps=[];
for(const target of desired){
 let chosen=null;
 for(const asymmetric of [false,true]){
  let maximum=null;mutatePlan({chance:()=>asymmetric,int:(min,max)=>{maximum=max;return 0}},plan);
  for(let index=0;index<=maximum;index++){
   let event;const next=mutatePlan({chance:()=>asymmetric,int:(min,max)=>{assert.equal(max,maximum);return index}},plan,{onMutation:e=>event=e});
   if(!event?.accepted||!next.nodes.some(n=>n.partId===target))continue;
   const organs=steps.map(s=>s.target).filter(id=>!PARTS[id].tags.includes('root')&&id!=='filament-tuft');
   if(organs.some(id=>!next.nodes.some(n=>n.partId===id)))continue;
   chosen={target,asymmetric,index,options:maximum+1,event,body:next};break;
  }if(chosen)break;
 }
 assert.ok(chosen,'actual mutatePlan must produce next declared anatomical step: '+target);steps.push(chosen);plan=chosen.body;assert.ok(validatePlan(plan).ok);
}
for(const id of ['fur-mantle','live-womb','endothermic-core','mammary-gland'])assert.ok(plan.nodes.some(n=>n.partId===id));
let replay=founder;for(const step of steps){replay=mutatePlan({chance:()=>step.asymmetric,int:(min,max)=>{assert.equal(max+1,step.options);return step.index}},replay);assert.equal(serializePlan(replay),serializePlan(step.body))}
const files=['src/lineage/body-inheritance.js','src/lineage/body-plan.js','src/lineage/evolution-draft.js','src/lineage/part-registry.js'];
const report={scope:'Declared targeted operator-index witness, all actual mutatePlan transitions. No runtime policy changed. Not actual births, frequencies, funded growth, intermediate reproductive survival or physiological acceptance.',sequence:desired,steps,founder,final:plan,exactReplay:true,sourceHashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({sequence:desired,steps:steps.length,exactReplay:true,parts:plan.nodes.map(n=>n.partId)},null,2));
