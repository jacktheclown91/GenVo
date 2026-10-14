import {CFG} from '../sim/config.js';
import {compileExpressionRig} from './expression-coordinator.js';
import {coordinatePhysicalExpression} from './expression-signals.js';
import {animationForPart,expressionForNode} from './part-animation-catalog.js';
export class PartExpressionTracker{
 constructor(){this.entries=new WeakMap();}
 reset(){this.entries=new WeakMap();}
 sample(sim,animal,action){
  const nodes=(animal.bodyPlan?.nodes||[]).filter(n=>animationForPart(n.partId)).slice().sort((a,b)=>a.id.localeCompare(b.id));
  if(!nodes.length)return undefined;
  const identity=JSON.stringify(nodes.map(n=>[n.id,n.partId,n.parent,n.socket,animationForPart(n.partId).version]));let e=this.entries.get(animal);
  if(!e||e.identity!==identity||sim.tickCount<e.tick){
   const rig=compileExpressionRig(nodes.map(expressionForNode),1);
   e={identity,rig,tick:sim.tickCount,state:{}};this.entries.set(animal,e);
  }
  const dt=Math.min(.25,Math.max(0,(sim.tickCount-e.tick)/CFG.simHz));
  const result=coordinatePhysicalExpression(sim,animal,{rig:e.rig,action,dt,previous:e.state});e.tick=sim.tickCount;e.state=result.state;return result.pose;
 }
}
