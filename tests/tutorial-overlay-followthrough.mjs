import assert from 'node:assert/strict';
import {ContextRadial} from '../src/ui/context-radial.js';
import {overlapArea} from '../src/ui/overlay-placement.js';

// An already-open menu must follow changing tutorial/DOM layout, not just bodies.
const prior={document:globalThis.document,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight};
try{
 const guide={left:700,top:64,right:1014,bottom:180};
 globalThis.innerWidth=1024;globalThis.innerHeight=768;
 globalThis.document={querySelector:selector=>selector==='#interactionDock'?{getBoundingClientRect:()=>({top:650})}:null,querySelectorAll:()=>[{getBoundingClientRect:()=>guide}]};
 const menu=Object.create(ContextRadial.prototype);
 Object.assign(menu,{el:{hidden:false,style:{left:'800px',top:'80px'}},renderer:null,footprint:{left:0,top:0,width:160,height:100},targetPoint:{x:850,y:150}});
 assert.ok(overlapArea({left:800,top:80,right:960,bottom:180},guide)>0);
 menu.layout();
 const left=parseFloat(menu.el.style.left),top=parseFloat(menu.el.style.top);
 assert.equal(overlapArea({left,top,right:left+160,bottom:top+100},guide),0,'unchanged open wheel moves away from the newly occupied lesson');

 const actor={id:7},sim={uiTutorialStage:'step-food',player:()=>actor};
 let layouts=0,releases=0;
 Object.assign(menu,{el:{hidden:false},world:sim,actor,tutorialStage:'step-food',getSim:()=>sim,getActions:()=>[],signature:'[]',blocked:()=>false,braceInput:{read:()=>false,release:()=>releases++},layout:()=>layouts++});
 menu.update();assert.equal(menu.el.hidden,false);assert.equal(layouts,1,'same lesson keeps available target choices');
 sim.uiTutorialStage='step-water';menu.update();assert.equal(menu.el.hidden,true);assert.equal(releases,1);assert.equal(sim.uiTutorialStage,'step-water');assert.equal(sim.player(),actor,'dismissal never replaces the controlled actor');
 // Ordinary gameplay without tutorial progression retains its menu.
 Object.assign(menu,{el:{hidden:false},world:sim,tutorialStage:undefined});delete sim.uiTutorialStage;
 menu.update();assert.equal(menu.el.hidden,false);
}finally{for(const [key,value] of Object.entries(prior)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}
console.log('Tutorial overlay follow-through PASS: stale wheel dismissal, same-stage retention and dynamic lesson obstacle clearance.');
