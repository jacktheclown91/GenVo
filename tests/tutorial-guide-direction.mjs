import assert from 'node:assert/strict';
import {tutorialGuideMode,drawTutorialGuide} from '../src/render/tutorial-guide-art.js';
import {overlapArea} from '../src/ui/overlay-placement.js';
const player={x:320,y:240},base={player,tile:32,width:640,height:480};
assert.equal(tutorialGuideMode({...base,target:{x:448,y:240}}).direction,null,'clear on-screen target keeps its location label');
const obstacle={left:410,top:205,right:490,bottom:275};
assert.equal(tutorialGuideMode({...base,target:{x:448,y:240},obstacles:[obstacle]}).direction,0,'a UI-covered real target needs a rightward cue');
assert.equal(tutorialGuideMode({...base,target:player,obstacles:[{left:0,top:0,right:640,bottom:480}]}).direction,null,'a coincident target must not invent a direction');
for(let direction=0;direction<8;direction++){
 const angle=direction*Math.PI/4,target={x:320+Math.cos(angle)*800,y:240+Math.sin(angle)*800};
 assert.equal(tutorialGuideMode({...base,target}).direction,direction,'offscreen target preserves its exact eight-way direction');
}
const prior=globalThis.document;
try{
 globalThis.document={querySelector:()=>null,querySelectorAll:()=>[{getClientRects:()=>[obstacle],getBoundingClientRect:()=>obstacle}]};
 const actor={id:1,x:10,y:10},world={},sim={world,playerId:1,player:()=>actor},body={left:295,top:215,right:345,bottom:265,width:50,height:50};
 for(const label of ['Food','Water','Mate']){
  const operations=[],context=new Proxy({measureText:text=>({width:text.length*8})},{get:(o,k)=>k in o?o[k]:(...args)=>operations.push([k,...args])});
  const renderer={sim,ctx:context,w:640,h:480,canvas:{getBoundingClientRect:()=>({left:0,top:0,width:640,height:480})},screenBoundsWorld:world,screenBounds:new Map([[1,body]]),readoutRects:[]};
  const before=JSON.stringify(sim),input={tile:32,player,target:{x:448,y:240},label},mode=drawTutorialGuide(renderer,input);
  assert.equal(mode.direction,0);assert.ok(operations.some(o=>o[0]==='fillText'&&o[1]==='To '+label));
  assert.equal(overlapArea(renderer.readoutRects[0],obstacle),0,'direction caption clears the panel hiding its target');
  assert.equal(overlapArea(renderer.readoutRects[0],body),0,'caption clears the actual player');
  assert.equal(overlapArea(renderer.readoutRects[0],renderer.readoutRects[1]),0);
  assert.deepEqual(renderer.readoutRects[1],mode.marker,'reservation stays at the real target, never at the cue');
  const rect=operations.find(o=>o[0]==='strokeRect');assert.deepEqual(rect.slice(1),[429,221,38,38],'the outline stays on the true target');
  assert.ok(operations.filter(o=>o[0]==='fillRect'&&o[3]===2&&o[4]===2).length>=10,'native arrow strokes are present');
  const saved=JSON.stringify(renderer.readoutRects);mode.marker.left=-999;assert.equal(JSON.stringify(renderer.readoutRects),saved,'reservation owns its copied bounds');
  assert.equal(JSON.stringify(sim),before,'direction artwork cannot alter biological state');
 }
 // Reproduced 568x320 menu collision: clear space exists below the real body.
 const blockers=[{left:10,top:10,right:482,bottom:101},{left:492,top:10,right:558,bottom:54},{left:10,top:227,right:558,bottom:310},{left:354,top:102,right:558,bottom:223}];
 globalThis.document={querySelector:()=>null,querySelectorAll:()=>blockers.map(box=>({getClientRects:()=>[box],getBoundingClientRect:()=>box}))};
 const realBody={left:265,top:142,right:304,bottom:180,width:39,height:38},smallWorld={},smallSim={world:smallWorld,playerId:1};
 const ctx=new Proxy({measureText:text=>({width:text.length*8})},{get:(o,k)=>k in o?o[k]:()=>{}}),small={sim:smallSim,ctx,w:568,h:320,canvas:{getBoundingClientRect:()=>({left:0,top:0,width:568,height:320})},screenBoundsWorld:smallWorld,screenBounds:new Map([[1,realBody]]),readoutRects:[]};
 assert.equal(drawTutorialGuide(small,{tile:32,player:{x:284,y:160},target:{x:284,y:40},label:'Mate'}).direction,6);
 for(const box of [...blockers,realBody])assert.equal(overlapArea(small.readoutRects[0],box),0,'short-screen directional label must clear Menu, lesson, dock, encounter and body');
}finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior}
console.log('Tutorial direction PASS: real-target UI occlusion, eight offscreen directions, native arrow paint, body/panel clearance and readonly copied bounds.');
