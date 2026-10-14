import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {PART_IDS} from '../src/lineage/part-registry.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {PART_SPRITES,PART_SPRITE_META,LAYER_ORDER,hasComponent} from '../src/render/part-sprites.js';
import {assemblyFor,layoutFromPlan,relativeLegIndex} from '../src/render/creature-assembler.js';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
import {resolvePhenotype} from '../src/lineage/phenotype-resolver.js';

// Evolution Expansion Phase B (GDD v1 section 14; EV-006, EV-007): every starter part has a pixel
// component, bodies assemble from their body plan in all eight facings, nothing detaches, and
// rendering never grants abilities.

// EV-006: component metadata for every part.
for(const id of PART_IDS){assert.ok(PART_SPRITES[id],`${id} has sprite metadata`);assert.ok(LAYER_ORDER.includes(PART_SPRITES[id].layer));assert.ok(hasComponent(id),`${id} draws`)}
assert.equal(PART_SPRITE_META.facings,8);assert.equal(PART_SPRITE_META.frames,8);assert.match(PART_SPRITE_META.provenance,/no external art/);

// Legs are indexed relative to facing.
assert.equal(relativeLegIndex({front:1,side:0}),0);assert.equal(relativeLegIndex({front:-1,side:0}),4);assert.equal(relativeLegIndex({front:.7071,side:.7071}),1);assert.equal(relativeLegIndex({front:-.7071,side:-.7071}),5);

// Layout from expressed adaptations (the legacy adapter) and from an explicit plan.
{
  const l=assemblyFor({adaptations:['spring-tendons','grasping-limbs','barbed-limbs','crushing-jaw','heavy-jaw','hardened-mantle','water-sacs','alarm-pulse']});
  assert.deepEqual([3,4,5].map(i=>l.legs[i]),['spring-leg','spring-leg','spring-leg']);assert.deepEqual([7,0,1].map(i=>l.legs[i]),['grasper','grasper','grasper']);
  assert.deepEqual(l.spurs.map(x=>x||'-'),['-','barb','barb','barb','-','barb','barb','barb']);
  assert.equal(l.mouth,'crushing-jaw');assert.deepEqual(l.flanks['-1'],['armor-plate','storage-sac']);assert.equal(l.dorsal,'signal-crest');assert.equal(l.tail,null);
  assert.equal(assemblyFor({adaptations:[]}).mouth,'grazing-mouth','a founder has the default body');
}
const full=makePlan([{partId:'reinforced-torso',parent:null,socket:null},...[0,1,2,3,4,5,6,7].map(i=>({partId:i===0?'digging-forelimb':[3,4,5].includes(i)?'spring-leg':'walking-leg',parent:'root',socket:`limb.${i}`})),{partId:'claw',parent:'root/limb.2',socket:'spur'},{partId:'barb',parent:'root/limb.6',socket:'spur'},{partId:'tearing-jaw',parent:'root',socket:'mouth'},{partId:'wide-field-eye',parent:'root',socket:'eye.left'},{partId:'simple-eye',parent:'root',socket:'eye.right'},{partId:'venom-gland',parent:'root',socket:'flank.left'},{partId:'signal-crest',parent:'root',socket:'dorsal'},{partId:'paddle-tail',parent:'root',socket:'tail'}]);
{
  const l=assemblyFor({adaptations:[],bodyPlan:full});assert.equal(l.planId,full.id);assert.equal(l.torso,'reinforced-torso');assert.equal(l.legs[0],'digging-forelimb');assert.equal(l.spurs[2],'claw');assert.equal(l.eyes['-1'],'wide-field-eye');assert.equal(l.tail,'paddle-tail');
  const broken={...full,id:'bp0-broken',nodes:[...full.nodes,{id:'root/limb.9',partId:'claw',partVersion:1,parent:'root',socket:'limb.9'}]};
  assert.equal(assemblyFor({adaptations:['heavy-jaw'],bodyPlan:broken}).mouth,'tearing-jaw','an invalid plan falls back to the creature\'s own body');
}

// Drawing: every facing and frame, still and walking, stays attached to the body.
function ops(animal,dir,frame,moving){const out=[];const c={set fillStyle(v){this.f=v},get fillStyle(){return this.f},fillRect(x,y,w,h){out.push({f:this.f,x,y,w,h})}};
  drawGenvoSprite(c,{animal,phenotype:phenotypeFor(animal),scale:4,frame,moving,palette:{body:'#7aa8e8',shade:'#3d5e9a',light:'#cfe3ff'},pose:{dir,action:moving?'walk':'idle',life:{breath:.5}}});return out}
{
  const founder={id:1,genes:{},adaptations:[]},built={id:2,genes:{},adaptations:['spring-tendons'],anatomy:{spring:.9},bodyPlan:full};
  for(let dir=0;dir<8;dir++)for(let frame=0;frame<8;frame++)for(const moving of [false,true]){
    founder.dir=built.dir=dir;const a=ops(founder,dir,frame,moving),b=ops(built,dir,frame,moving);
    assert.ok(b.length>a.length,'the built body draws its extra parts');
    for(const r of b){const far=Math.max(Math.abs(r.x),Math.abs(r.y),Math.abs(r.x+r.w),Math.abs(r.y+r.h));assert.ok(far<=12*4,`facing ${dir} frame ${frame}: a part pixel at ${r.x},${r.y} is detached from the body`)}
    for(const colour of ['#e2cf9f','#f1e8cf','#9fd14f'])assert.ok(b.some(r=>r.f===colour),`facing ${dir}: ${colour} part is drawn`);
  }
  // The spring heel grows with the developed legs.
  const heel=v=>ops({id:3,genes:{},adaptations:['spring-tendons'],anatomy:{spring:v}},4,2,false).length;assert.ok(heel(1)>=heel(.5));
}

// Rendering never grants abilities: a drawn paddle tail does not swim, and Pounce comes from anatomy.
{
  const sim=new Simulation('GENVO8-ASSEMBLY',{player:true}),p=sim.player();p.adaptations=['spring-tendons'];p.anatomy={...(p.anatomy||{}),spring:.95};
  const before=sim.playerCombat.pounceReach(p);p.bodyPlan=full;assert.equal(sim.playerCombat.pounceReach(p),before,'a plan drawn on the creature does not change its abilities');
  assert.equal(sim.canSwim(p),false,'drawing a paddle tail grants no open-water travel');
  assert.equal(resolvePhenotype(full).canSwim,false);
}
console.log('creature assembly ok');
