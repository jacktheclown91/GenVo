import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildVisualWaterMask,LANDFORM_RESOLUTION,smoothedWaterScore} from '../src/render/landform.js';

const sim=new Simulation('GENVO8-LANDFORM',{player:false}),w=sim.world,res=LANDFORM_RESOLUTION;
let shore=null,deep=null,dry=null;
for(let y=2;y<w.n-2;y++)for(let x=2;x<w.n-2;x++){
  const i=w.idx(x,y),water=!!w.water[i],mask=buildVisualWaterMask(w,x,y);let neighborWater=0,neighborLand=0;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){if(w.water[w.idx(x+dx,y+dy)])neighborWater++;else neighborLand++}
  if(!shore&&mask.wetCount>0&&mask.wetCount<res*res)shore={x,y};
  if(!deep&&water&&neighborLand===0)deep={x,y};
  if(!dry&&!water&&neighborWater===0&&w.seepage[i]===0)dry={x,y};
  if(shore&&deep&&dry)break;
}
assert.ok(shore&&deep&&dry,'test world should expose shore, deep water and dry land');
const a=buildVisualWaterMask(w,shore.x,shore.y),b=buildVisualWaterMask(w,shore.x,shore.y);
assert.deepEqual([...a],[...b],'visual hydrology must be deterministic');
assert.ok(a.wetCount>0&&a.wetCount<res*res,'shore tile should contain a mixed organic water contour');
const deepMask=buildVisualWaterMask(w,deep.x,deep.y),dryMask=buildVisualWaterMask(w,dry.x,dry.y);
assert.ok(deepMask.wetCount>res*res*.75,'deep water remains predominantly water');
assert.ok(dryMask.wetCount<res*res*.12,'dry inland tile remains predominantly land');
const score=smoothedWaterScore(w,shore.x+.5,shore.y+.5);assert.ok(score>=0&&score<=1,'smoothed score stays normalized');
console.log('landform checks: PASS');
