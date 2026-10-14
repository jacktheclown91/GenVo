import assert from 'node:assert/strict';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
import {drawLimb} from '../src/render/part-sprites.js';
const calls=[];
const context=new Proxy({drawImage(){}},{get:(target,key)=>target[key]??(()=>{})});
const eye={draw(c,args){calls.push(args);return true}};
const base={animal:{id:3,dir:2,species:'genvo',genes:{},adaptations:[],anatomy:{}},phenotype:{bodyScale:1,limbScale:1,sensoryScale:1,eyeScale:1,feelerScale:1,temperamentScale:1},scale:2,palette:{body:'#699a81',shade:'#34554e',light:'#a4c7a5'},authoredParts:{'simple-eye':eye}};
for(const blink of [false,true]){
 calls.length=0;drawGenvoSprite(context,{...base,frame:7,pose:{life:{blink}}});
 assert.equal(calls.length,2);assert.ok(calls.every(c=>c.frameIndex===(blink?1:0)),'physiological eye state must override atlas timer');
}
const limbCalls=[],art={drawLimb(c,args){limbCalls.push(args);return true}};
for(const liftAmount of [0,.33,.34,1])drawLimb(context,'walking-leg',{s:2,root:{x:0,y:0},knee:{x:2,y:2},foot:{x:4,y:4},leg:{liftAmount},authoredParts:{'walking-leg':art}});
assert.deepEqual(limbCalls.map(c=>c.frameIndex),[0,0,1,1]);
console.log('Native open/blink states and independent planted/lifted limb paint PASS');
