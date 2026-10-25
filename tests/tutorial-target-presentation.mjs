import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Renderer} from '../src/render/renderer.js';
import {overlapArea} from '../src/ui/overlay-placement.js';
const prior=globalThis.document;globalThis.document={querySelector:()=>null,querySelectorAll:()=>[]};
try{
 const actor={id:1,x:10,y:10},world={},sim={world,playerId:1,uiTutorialStage:'step-food',player:()=>actor},body={left:280,right:360,top:200,bottom:280,width:80,height:80};
 for(const label of ['Food','Water','Mate']){
  const operations=[],context=new Proxy({measureText:text=>({width:text.length*8})},{get:(o,k)=>k in o?o[k]:(...args)=>operations.push([k,...args])});
  const renderer={sim,ctx:context,w:640,h:480,camera:{x:10,y:10},canvas:{getBoundingClientRect:()=>({left:0,top:0,width:640,height:480})},screenBoundsWorld:world,screenBounds:new Map([[1,body]]),guideTarget:{x:14,y:10,label},readoutRects:[]};
  const before=JSON.stringify(sim);Renderer.prototype.drawGuide.call(renderer,32);assert.equal(JSON.stringify(sim),before,'coaching paint never changes biology');assert.ok(operations.some(o=>o[0]==='fillText'&&o[1]===label));assert.equal(renderer.readoutRects.length,1);assert.equal(overlapArea(renderer.readoutRects[0],body),0,'caption clears the actual body envelope');
 }
 const source=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');assert.ok(source.indexOf('drawSensoryFog(this')<source.indexOf("beginReadoutFrame(this);if(this.guideTarget"),'mandatory marker is composited after fog and participates in shared readout reservations');
}finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior}
console.log('Tutorial target presentation PASS: Food/Water/Mate labels, body clearance, above-fog ordering and read-only state.');
