import assert from 'node:assert/strict';
import {depthProfileAt,creatureShadowFor} from '../src/render/depth.js';
const n=5,len=n*n,idx=(x,y)=>Math.max(0,Math.min(n-1,y|0))*n+Math.max(0,Math.min(n-1,x|0));
const arr=()=>new Float32Array(len);const world={n,len,seedHash:12345,idx,moisture:arr(),fertility:arr(),water:new Uint8Array(len),plants:{sunmoss:arr(),bramble:arr(),marshroot:arr(),rotcap:arr(),thistlepod:arr()}};
for(let i=0;i<len;i++){world.moisture[i]=.45;world.fertility[i]=.55}
const c=idx(2,2);world.plants.bramble[c]=.92;world.moisture[c]=.7;world.fertility[c]=.85;
const dense=depthProfileAt(world,2,2);const open=depthProfileAt(world,0,0);
assert.ok(dense.canopy>=0&&dense.canopy<=1);assert.ok(dense.shade>=0&&dense.shade<=1);assert.ok(dense.light>=0&&dense.light<=1);assert.ok(dense.structure>.8);
const animal={x:2.5,y:2.5},shadow=creatureShadowFor(world,animal,null,{bodyScale:1.2,moving:true});assert.ok(shadow.width>10);assert.ok(shadow.height>1);assert.ok(shadow.alpha>=.16&&shadow.alpha<=.31);assert.ok(Number.isFinite(open.light));
const before=[...world.moisture];depthProfileAt(world,2,2);assert.deepEqual([...world.moisture],before,'depth interpretation must not mutate world');
console.log('world depth presentation checks: PASS');
