import assert from 'node:assert/strict';
import {bodyFrame,socketPoint,socketPoints} from '../src/render/socket-layout.js';
import {artMount,drawPart} from '../src/render/part-sprites.js';
import {anatomicalLimbLayers} from '../src/render/anatomy-depth.js';
import {headPose} from '../src/render/head.js';
const directions=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
let cases=0;
for(let dir=0;dir<8;dir++){
 const [dx,dy]=directions[dir],m=Math.hypot(dx,dy),fx=dx/m,fy=dy/m,perp={x:-fy,y:fx};
 const F=bodyFrame({fx,fy,perp,bx:0,by:0,bodyW:8,bodyH:8});
 assert.deepEqual(socketPoint({f:.4,s:-.3,u:1},F),socketPoint({f:.4,s:-.3,u:-1},F),'Height must not become screen-north translation');
 const dorsal=socketPoints('small-torso',F).dorsal;assert.ok(Math.abs(dorsal.x*perp.x+dorsal.y*perp.y)<1e-10);assert.ok(dorsal.x*fx+dorsal.y*fy<0,'Dorsal anchor remains behind body center in every world-plane rotation');
 const k={s:1,fx,fy,perp,bx:0,by:0,bodyW:8,bodyH:8,sign:-1};
 const mount=artMount('sail-fin',k);assert.ok(Math.abs(mount.x*perp.x+mount.y*perp.y)<1e-10);
 // Trace the actual native wrapper matrix, independently of its mirror flag.
 let matrix=[1,0,0,1,0,0],drawn;
 const multiply=n=>{const[a,b,c,d,e,f]=matrix,[A,B,C,D,E,F]=n;matrix=[a*A+c*B,b*A+d*B,a*C+c*D,b*C+d*D,a*E+c*F+e,b*E+d*F+f]};
 const ctx={drawImage(){},save(){},restore(){},translate(x,y){multiply([1,0,0,1,x,y])},rotate(a){multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0])},scale(x,y){multiply([x,0,0,y,0,0])}};
 assert.ok(drawPart(ctx,'gill-slits',{...k,authoredFacing:dir,authoredParts:{'gill-slits':{draw(_ctx,args){drawn={matrix:[...matrix],args};return true}}}}));
 const [a,b,c,d]=drawn.matrix;
 assert.ok(Math.abs(a*fx+c*fy-fx)<1e-10&&Math.abs(b*fx+d*fy-fy)<1e-10,'Paired reflection preserves forward direction');
 assert.ok(Math.abs(a*perp.x+c*perp.y+perp.x)<1e-10&&Math.abs(b*perp.x+d*perp.y+perp.y)<1e-10,'Paired reflection reverses lateral direction, not screen X');
 const h=headPose({implicitHead:true},{v:{x:fx,y:fy},perp,bodyW:8,bodyH:8,bodyOffset:{x:0,y:0}},null,{behavior:{headDrop:2}});
 assert.ok(Math.abs(h.x*perp.x+h.y*perp.y)<1e-10,'Feeding head dip cannot drift sideways with compass direction');cases++;
}
const flat=[{slot:2,liftAmount:0,root:{y:99}},{slot:6,liftAmount:.8,root:{y:-99}}],raised={slot:10,liftAmount:.6,aboveBody:true,root:{y:-999}};
const layers=anatomicalLimbLayers([...flat,raised]);assert.deepEqual(layers.front,[raised]);assert.equal(layers.back.length,2,'Screen y cannot reveal a lower hip through the dorsal body');
console.log(`${cases} world-plane facing/reflection/head/socket cases; height-independent planar mounts and action-owned occlusion PASS`);
