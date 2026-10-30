import assert from 'node:assert/strict';
import {developmentalPreview} from '../tools/creature-lab/development-preview.js';
import {developmentFor} from '../src/family/family.js';
import {phenotypeFor,SPECIES,GENE_KEYS} from '../src/organisms/species.js';
import {genvoAnchors} from '../src/render/genvo-draw.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
import {starterPlan,attachPart} from '../tools/creature-lab/assembly-model.js';
import {BODY_SHAPES} from '../src/lineage/part-registry.js';
let checked=0;
for(const root of ['small-torso','soft-torso','long-torso','stout-torso']){
 const animal={id:1,species:'genvo',alive:true,age:60,genes:Object.fromEntries(GENE_KEYS.map(k=>[k,1])),adaptations:[],bodyPlan:attachPart(starterPlan(root),'root','dorsal','fur-mantle')},before=JSON.stringify(animal);
 for(const percent of [0,10,30,70,100]){
  const preview=developmentalPreview(animal,percent),expected=developmentFor({...animal,age:SPECIES.genvo.maturity*percent/100}),base=phenotypeFor(animal);
  assert.deepEqual(preview.development,expected);assert.equal(preview.phenotype.bodyScale,base.bodyScale*expected.growth);assert.equal(preview.phenotype.limbScale,base.limbScale*(.72+.28*expected.growth));assert.equal(preview.pose.life.growth,expected.growth);assert.equal(preview.animal.bodyPlan,animal.bodyPlan);
  for(let dir=0;dir<8;dir++){
   const ph=preview.phenotype,shape=BODY_SHAPES[root],angle=dir*Math.PI/4,ox=Math.abs(Math.sin(angle)),oy=Math.abs(Math.cos(angle)),total=ox+oy,shapeW=(ox*shape.length+oy*shape.width)/total*shape.size,shapeH=(oy*shape.length+ox*shape.width)/total*shape.size;
   const rig=genvoVisualPose({dir,legSlots:assemblyFor(animal).legSlots,bodyScale:ph.bodyScale,bodyWidthScale:(ph.bodyWidthScale||1)*shapeW,bodyHeightScale:(ph.bodyHeightScale||1)*shapeH,limbScale:ph.limbScale,...preview.pose}),guides=genvoAnchors({animal:preview.animal,phenotype:ph,pose:{...preview.pose,dir}});
   assert.equal(guides.body.w,rig.bodyW,'child guides share actual rendered width instead of adult minima');assert.equal(guides.body.h,rig.bodyH);checked++;
  }
 }
 assert.equal(JSON.stringify(animal),before,'age previews never mutate source age, genes or body plans');
 for(const percent of [-1,101,NaN])assert.throws(()=>developmentalPreview(animal,percent),/0–100/);
}
console.log('Lab development PASS: canonical family growth, gameplay body/limb factors, '+checked+' matching child/adult socket rigs, immutable input designs and validated preview ages.');
