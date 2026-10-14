import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {PartExpressionTracker} from '../src/render/part-expression.js';
import {drawPart} from '../src/render/part-sprites.js';
const sim=new Simulation('INSTANCE-EXPRESSION',{player:true}),a=sim.player(),t=new PartExpressionTracker();
for(const node of a.bodyPlan.nodes.filter(n=>n.socket==='eye.left'||n.socket==='eye.right'))node.partId='stalk-eye';
const neutral=t.sample(sim,a,'idle');assert.equal(neutral['root/eye.left'].extent,1);assert.equal(neutral['root/eye.right'].extent,1);assert.equal(neutral['stalk-eye'],undefined);
const entry=t.entries.get(a);entry.state['root/eye.left'].extent=.4;entry.state['root/eye.right'].extent=.9;
sim.tickCount++;const pose=t.sample(sim,a,'idle');assert.ok(pose['root/eye.left'].extent<pose['root/eye.right'].extent,'independent previous joint states remain distinct under shared signals');
function pixels(id){const rows=[],c={fillStyle:'',fillRect(...args){rows.push([...args,this.fillStyle])}};drawPart(c,'stalk-eye',{s:2,p:{shade:'#123456'},eye:{x:0,y:0},fx:1,fy:0,perp:{x:0,y:1},expressionNodeId:id,partExpression:{'root/eye.left':{extent:.25},'root/eye.right':{extent:1},'stalk-eye':{extent:.5}}});return rows;}
assert.notDeepEqual(pixels('root/eye.left'),pixels('root/eye.right'),'each instance draws its own extent before legacy type fallback');
a.bodyPlan.nodes.find(n=>n.socket==='eye.left').id='replacement-eye';assert.equal(t.sample(sim,a,'idle')['replacement-eye'].extent,1,'changed anatomical identity starts a neutral rig');
console.log('independent duplicate-part channels, geometry and anatomy reset PASS');
