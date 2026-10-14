import assert from 'node:assert/strict';
import {drawFloraPlant,drawFloraSeedling} from '../src/render/flora.js';
import {landmarkProfileFor,drawSceneLandmarkBackdrop,drawSceneLandmarkForeground} from '../src/render/landmarks.js';

function recorder(){const ops=[];const ctx={ops,fillStyle:'',globalAlpha:1,save(){ops.push(['save'])},restore(){ops.push(['restore'])},translate(x,y){ops.push(['translate',x,y])},fillRect(x,y,w,h){ops.push(['rect',this.fillStyle,x,y,w,h])}};return ctx}
const common={px:0,py:0,u:3,x:7,y:9,season:'SPRING',isWater:(x,y)=>x===6};
for(const spec of [
  ['tuft','#668447','sunmoss'],['shrub','#486b38','bramble'],['reed','#75915b','marshroot'],['fungus','#c6b48a','rotcap'],['pod','#9a9b54','thistlepod']
]){
  const [shape,color,kind]=spec,a=recorder(),b=recorder();drawFloraPlant(a,{...common,shape,color,kind,amount:.76});drawFloraPlant(b,{...common,shape,color,kind,amount:.76});
  assert.deepEqual(a.ops,b.ops,`${kind} art must be deterministic`);assert.ok(a.ops.filter(o=>o[0]==='rect').length>=6,`${kind} should have an authored multi-part silhouette`);
}
const seedA=recorder(),seedB=recorder(),p={color:'#486b38'};drawFloraSeedling(seedA,{p,amount:.03,bank:.2,px:0,py:0,u:3,x:2,y:4,kind:'bramble'});drawFloraSeedling(seedB,{p,amount:.03,bank:.2,px:0,py:0,u:3,x:2,y:4,kind:'bramble'});assert.deepEqual(seedA.ops,seedB.ops);

const cases=[
  [{kind:'watering-margin',score:.8,x:2,y:3,marshroot:.3},'reed-fan'],
  [{kind:'fungal-hollow',score:.8,x:2,y:3,rotcap:.2},'mushroom-ring'],
  [{kind:'thicket-pocket',score:.8,x:2,y:3,bramble:.3},'berry-thicket'],
  [{kind:'feeding-ground',score:.8,x:2,y:3,bramble:.0,thistlepod:.3,food:.4},'pod-stand'],
  [{kind:'recovery-patch',score:.8,x:2,y:3,recovery:.4},'young-growth']
];
for(const [scene,expected] of cases){const p=landmarkProfileFor(scene);assert.equal(p.kind,expected);assert.ok(p.strength>=0&&p.strength<=1);const a=recorder(),b=recorder();drawSceneLandmarkBackdrop(a,{scene,px:10,py:10,u:3});drawSceneLandmarkBackdrop(b,{scene,px:10,py:10,u:3});assert.deepEqual(a.ops,b.ops,`${expected} must draw deterministically`);assert.ok(a.ops.some(o=>o[0]==='rect'),`${expected} should visibly draw`)}
assert.equal(landmarkProfileFor({kind:'watering-margin',score:.8,x:1,y:1,marshroot:0}).kind,'none','landmark must not invent reeds where canonical biomass is absent');
const fg=recorder();drawSceneLandmarkForeground(fg,{scene:cases[2][0],px:0,py:0,u:3});assert.ok(fg.ops.some(o=>o[0]==='rect'));
console.log('flora + authored landmark checks: PASS');
