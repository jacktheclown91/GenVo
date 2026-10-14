import assert from 'node:assert/strict';
import {environmentContactFor,displacementForTile} from '../src/render/physicality.js';
const n=4,len=n*n,idx=(x,y)=>Math.max(0,Math.min(n-1,y|0))*n+Math.max(0,Math.min(n-1,x|0));
const world={n,idx,moisture:new Float32Array(len),water:new Uint8Array(len),drinkable:new Uint8Array(len),plants:{sunmoss:new Float32Array(len),bramble:new Float32Array(len),marshroot:new Float32Array(len),thistlepod:new Float32Array(len)}};
const i=idx(1,1);world.moisture[i]=.82;world.drinkable[i]=1;world.plants.marshroot[i]=.76;world.water[idx(2,1)]=1;
const animal={id:1,alive:true,x:1.5,y:1.5};const snap=environmentContactFor(world,animal,{action:'drink',phase:4.5,moving:true});
assert.equal(snap.soil,'mud');assert.equal(snap.atBank,true);assert.deepEqual(snap.waterDir,{x:1,y:0});assert.ok(snap.cover>.7);assert.equal(snap.phase,4.5);
const before=[...world.moisture],disp=displacementForTile([animal],1,1);assert.ok(disp&&disp.strength>.5);assert.deepEqual([...world.moisture],before,'presentation read must not mutate world');
console.log('environment physicality checks: PASS');
