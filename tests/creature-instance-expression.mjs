import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
const sim=new Simulation('CREATURE-INSTANCE-EXPRESSION',{player:true}),a=structuredClone(sim.player());
a.bodyPlan=makePlan(a.bodyPlan.nodes.map(n=>({...n,partId:n.socket?.startsWith('eye.')?'stalk-eye':n.partId})));assert.ok(validatePlan(a.bodyPlan).ok);
const ph=phenotypeFor(a),palette={body:'#667744',shade:'#334422',light:'#99aa77'};
function draw(partExpression){const rows=[],c={fillStyle:'',fillRect(...args){rows.push([...args,this.fillStyle])}};drawGenvoSprite(c,{animal:a,phenotype:ph,scale:2,frame:0,palette,pose:{dir:0,action:'idle',partExpression}});return rows;}
const neutral=draw();assert.deepEqual(draw({'root/eye.left':{extent:1},'root/eye.right':{extent:1}}),neutral);
const left=draw({'root/eye.left':{extent:.25},'root/eye.right':{extent:1}}),right=draw({'root/eye.left':{extent:1},'root/eye.right':{extent:.25}});
assert.notDeepEqual(left,neutral);assert.notDeepEqual(right,neutral);assert.notDeepEqual(left,right,'full creature assembly routes duplicate eyes to separate node channels');
assert.deepEqual([...new Set(left.map(r=>r[4]))],[...new Set(neutral.map(r=>r[4]))],'instance articulation preserves pigments');
console.log('full creature instance expression routing and neutral identity PASS');
