import assert from 'node:assert/strict';
import {flankInstanceOffset} from '../src/render/flank-placement.js';
for(const count of [1,2,3,8])for(const size of [6,8,14]){const positions=Array.from({length:count},(_,i)=>flankInstanceOffset(i,count,size,size));assert.equal(new Set(positions).size,count);assert.ok(positions.every(x=>Math.abs(x)<=size*.35));assert.ok(Math.abs(positions.reduce((s,x)=>s+x,0))<1e-10);for(let i=0;i<count;i++)assert.ok(Math.abs(positions[i]+positions[count-1-i])<1e-10);}
console.log('Distinct, mirrored and body-bounded multi-organ flank placement PASS');

const {Simulation}=await import('../src/sim/simulation.js'),{phenotypeFor}=await import('../src/organisms/species.js'),{drawGenvoSprite}=await import('../src/render/genvo-draw.js');
const sim=new Simulation('FLANK-RENDER-PROOF'),a=sim.player();a.bodyPlan=structuredClone(a.bodyPlan);a.bodyPlan.id='flank-render-proof';a.bodyPlan.nodes.find(n=>!n.parent).partId='soft-torso';a.bodyPlan.nodes=a.bodyPlan.nodes.filter(n=>!n.socket?.startsWith('flank'));
for(const [index,partId] of ['armor-plate','storage-sac'].entries())a.bodyPlan.nodes.push({id:'root/flank.left.'+index,parent:'root',socket:'flank.left',partId});
const {makePlan,validatePlan}=await import('../src/lineage/body-plan.js');a.bodyPlan=makePlan(a.bodyPlan.nodes);assert.ok(validatePlan(a.bodyPlan).ok);
const captured=[],authoredParts=Object.fromEntries(['armor-plate','storage-sac'].map(partId=>[partId,{draw(c,args){captured.push({partId,x:args.x,y:args.y});return true}}]));
const c=new Proxy({drawImage(){}},{get:(t,k)=>t[k]??(()=>{})});drawGenvoSprite(c,{animal:a,phenotype:phenotypeFor(a),scale:2,palette:{body:'#699a81',shade:'#34554e',light:'#a4c7a5'},pose:{dir:2},authoredParts});assert.equal(captured.length,2);assert.notDeepEqual(captured[0].x,captured[1].x,'different real organ types receive separate runtime pivots');console.log('Shared creature renderer places unlike flank organ instances separately PASS');
