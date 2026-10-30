// Read-only anatomy-specific desert-expression regression.
// Full authored-art/Chromium validation is required before merge.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARID_PHYSIOLOGY} from '../src/ecology/arid-physiology.js';
import {aridVisualReading,applyAestivationPosture,drawNativeAridAccent} from '../src/render/arid-expression.js';

const animal=(parts=['heat-frill','wax-plates'])=>({
 alive:true,torpor:false,bodyPlan:{nodes:parts.map((partId,i)=>({id:'root/test.'+i,partId}))},
 x:0,y:0,genes:{climate:1}
});
const sim=(temperature=.9,moisture=.2,rule=ARID_PHYSIOLOGY.policy)=>({
 aridPhysiologyRules:rule,
 world:{idx:()=>0,temperature:[temperature],moisture:[moisture],water:[0]}
});
const a=animal(),world=sim();
const beforeAnimal=JSON.stringify(a),beforeWorld=JSON.stringify(world);
const hot=aridVisualReading(world,a);
assert.equal(hot.frillFlushed,true,'heat frill flushes only in real heat');
assert.equal(hot.waxSealed,true,'wax plates seal only when their ground is actually dry');
assert.equal(hot.aestivating,false,'normal active body never looks dormant');
assert.ok(Object.isFrozen(hot),'read-only physiological receipt');
assert.equal(JSON.stringify(a),beforeAnimal,'reading expression does not edit animal');
assert.equal(JSON.stringify(world),beforeWorld,'reading expression does not edit climate');
const wet=aridVisualReading(sim(.4,.8),a);
assert.equal(wet.frillFlushed,false,'cool air does not flush radiator');
assert.equal(wet.waxSealed,false,'wet soil does not trigger wax sheen');
assert.equal(aridVisualReading(sim(.9,.2,null),a),null,'legacy rule is unchanged');
assert.equal(aridVisualReading({aridPhysiologyRules:null},a),null,'recorded old rules have no expression');
assert.equal(aridVisualReading(world,animal([])),null,'unrelated creature avoids extra physiology sampling');
assert.equal(aridVisualReading(world,{...animal(),alive:false}),null,'dead animals are not newly animated');

const drought={...animal([]),torpor:true,torporKind:'aestivation'};
const droughtReading=aridVisualReading(world,drought);
assert.equal(droughtReading.aestivating,true,'existing canonical torpor kind identifies drought dormancy');
const behavior={bodyDrop:.3,headDrop:.2,compress:.1,feelerPin:.4,feelerForward:.6};
assert.equal(applyAestivationPosture(behavior,{dormant:true},droughtReading),true);
assert.ok(behavior.bodyDrop>.3&&behavior.headDrop>.2&&behavior.compress>.1);
assert.ok(behavior.feelerPin>=.92&&behavior.feelerForward<=.48);
assert.equal(behavior.guardPlanted,true);
const unready={bodyDrop:.3};
assert.equal(applyAestivationPosture(unready,{dormant:false},droughtReading),false,'moving or active animals do not freeze');
assert.deepEqual(unready,{bodyDrop:.3});
assert.equal(applyAestivationPosture(unready,{dormant:true},wet),false,'winter/rest does not copy drought posture');

const strokes=[],ctx={fillRect(...args){strokes.push(args)},set fillStyle(c){this.color=c}};
const mount={x:3,y:5},palette={s:2,fx:1,fy:0,perp:{x:0,y:1},arid:hot};
assert.equal(drawNativeAridAccent(ctx,'heat-frill',palette,mount),true);
assert.equal(strokes.length,3,'three pixel radiator accents only on its socket');
strokes.length=0;
assert.equal(drawNativeAridAccent(ctx,'wax-plates',palette,mount),true);
assert.equal(strokes.length,3,'three pixel wax seams only on flank socket');
strokes.length=0;
assert.equal(drawNativeAridAccent(ctx,'signal-crest',palette,mount),false);
assert.equal(drawNativeAridAccent(ctx,'heat-frill',{...palette,arid:wet},mount),false);
assert.equal(drawNativeAridAccent(ctx,'wax-plates',{...palette,arid:wet},mount),false);
assert.equal(drawNativeAridAccent(ctx,'wax-plates',palette,null),false);
assert.equal(strokes.length,0,'no unrelated, cool or unmounted art is painted');

const renderer=readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
const parts=readFileSync(new URL('../src/render/part-sprites.js',import.meta.url),'utf8');
const body=readFileSync(new URL('../src/render/genvo-draw.js',import.meta.url),'utf8');
for(const text of [
 'const arid=aridVisualReading(this.sim,a)',
 'applyAestivationPosture(behavior,life,arid);',
 'combatImpact:impact,arid,partExpression:',
 "pose.arid?.frillFlushed?1:0",
 "pose.arid?.waxSealed?1:0",
 "pose.arid?.aestivating?1:0"
])assert.ok(renderer.includes(text),'world draw consumes/caches actual expression: '+text);
assert.ok(body.includes('partExpression:pose.partExpression,arid:pose.arid||null'));
assert.ok(parts.includes('drawNativeAridAccent(c,partId,k,at)'));
assert.ok(parts.includes('drawNativeAridAccent(c,partId,k,mount)'));
assert.ok(parts.includes('k.arid?.frillFlushed'));
assert.ok(parts.includes('k.arid?.waxSealed'));
console.log('native/procedural heat, wax and aestivation presentation: PASS');
