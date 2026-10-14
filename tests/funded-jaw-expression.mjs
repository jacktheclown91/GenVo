import assert from 'node:assert/strict';
import {feedingExpression,applyFeedingExpression} from '../src/render/feeding-expression.js';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {phenotypeFor} from '../src/organisms/species.js';

const a={id:9,species:'genvo',dir:2,genes:{},adaptations:[],anatomy:{},intent:'idle',bodyPlan:makePlan(founderPlan().nodes.map(n=>n.socket==='mouth'?{...n,partId:'crushing-jaw'}:n))};
const receipt={actorId:a.id,tick:5,removed:.1,edible:.08,tissue:'kernel',processingCost:.3};
a.lastPlantMeal=receipt;const sim={tickCount:5},before=JSON.stringify(a),frames=[];
const ctx=new Proxy({drawImage(){}},{get:(t,k)=>t[k]??(()=>{})});
const paint=(behavior,action='crack')=>{
 let frame;drawGenvoSprite(ctx,{animal:a,phenotype:phenotypeFor(a),scale:2,palette:{body:'#699a81',shade:'#34554e',light:'#a4c7a5'},pose:{dir:2,action,behavior},authoredParts:{'crushing-jaw':{expressionScale:'fixed',draw(c,o){frame=o.frameIndex;return true}}}});return frame;
};
for(let elapsed=0;elapsed<1.3;elapsed+=.025){
 const pose=feedingExpression(sim,a,{elapsedSeconds:elapsed});assert.ok(pose);
 const behavior=applyFeedingExpression({},pose),frame=paint(behavior);frames.push(frame);
 assert.equal(frame,pose.stage==='process'&&pose.mouthPulse>.45?1:0);
 if(pose.stage!=='process')assert.equal(frame,0,'Reach and settlement must not keep processing');
}
assert.deepEqual([...new Set(frames)].sort(),[0,1],'A funded grinding meal must visibly cycle both native states');
assert.equal(paint({mouthPulse:2}),0,'An arbitrary pulse without a funded state cannot open a cracking jaw');
assert.equal(paint({feedingMouthOpen:1,attackMouthOpen:0}),0,'Actual bite contact owns closure over meal pose');
assert.equal(paint({feedingMouthOpen:0,attackMouthOpen:1}),1,'Actual bite anticipation owns opening over meal pose');
assert.equal(feedingExpression(sim,{...a,lastPlantMeal:null}),null);
assert.equal(feedingExpression(sim,{...a,attackAction:{phase:'windup'}}),null);
assert.equal(JSON.stringify(a),before,'Presentation cannot mutate meal, anatomy or biology');
console.log('Funded crack processing cycles native opening/closure, stable reach/settle, interruption and attack priority PASS');
