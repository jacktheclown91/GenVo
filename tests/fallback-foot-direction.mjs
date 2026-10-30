import assert from 'node:assert/strict';
import {LIMB_ART,drawPart} from '../src/render/part-sprites.js';
let cases=0;
for(let dir=0;dir<8;dir++)for(const id of ['sturdy-leg','spring-leg','webbed-leg']){
  const angle=(dir-2)*Math.PI/4,fx=Math.cos(angle),fy=Math.sin(angle),perp={x:-fy,y:fx};
  const calls=[],ctx={fillRect(x,y,w,h){calls.push({x,y,w,h,color:this.fillStyle})}};
  const k={root:{x:0,y:0},knee:{x:2,y:2},foot:{x:8,y:8},s:4,
    fx,fy,perp,leg:{side:0,front:1,liftAmount:0},p:{shade:'shade',body:'body',light:'light'}};
  const before=JSON.stringify(k);
  LIMB_ART[id](ctx,k);
  const fore=p=>(p.x/4-8)*fx+(p.y/4-8)*fy;
  if(id==='webbed-leg'){
    assert.ok(Math.max(...calls.filter(p=>p.color==='#2f6f86').map(fore))>=.7,
      'Webbing toes extend forward in every facing, including west and north');
  }else assert.ok(fore(calls.at(-1))>=.5,'Distal toe ends forward instead of screen-right');
  assert.equal(JSON.stringify(k),before,'Painting preserves contacts and anatomical inputs');
  cases++;
}
console.log('Fallback foot direction PASS: '+cases+' eight-facing sturdy, spring and webbed feet; inputs unchanged.');

// Forelimb tips must retain forward direction on both sides, including
// an independently held planted heading during a body turn.
let forelimbs=0;
for(let dir=0;dir<8;dir++)for(const side of [-1,1])for(const held of [false,true])for(const id of ['grasper','digging-forelimb']){
  const a=(dir-2)*Math.PI/4,fx=Math.cos(a),fy=Math.sin(a);
  const axis=held?{x:-fy,y:fx}:{x:fx,y:fy};
  const calls=[],ctx={fillRect(x,y,w,h){calls.push({x,y,w,h,color:this.fillStyle})}};
  const k={s:8,fx,fy,perp:{x:-fy,y:fx},foot:{x:0,y:0},leg:{side,footForward:axis},p:{light:'light',shade:'shade'}};
  const saved=JSON.stringify(k);drawPart(ctx,id,k);
  const detail=calls.filter(p=>p.color===(id==='grasper'?'shade':'#e2cf9f'));
  assert.ok(detail.length);
  const reach=detail.reduce((sum,p)=>sum+(p.x/8)*axis.x+(p.y/8)*axis.y,0)/detail.length;
  assert.ok(reach>.45,'Both forelimbs extend forward in every facing and held heading');
  assert.equal(JSON.stringify(k),saved);forelimbs++;
}
console.log('Fallback forelimb direction PASS: '+forelimbs+' bilateral facing/held-heading cases.');
